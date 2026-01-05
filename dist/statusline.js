#!/usr/bin/env -S bun

// src/statusline/index.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// src/api.ts
var API_BASE = "https://api.z.ai";

class ZaiApiError extends Error {
  code;
  response;
  constructor(message, code, response) {
    super(message);
    this.code = code;
    this.response = response;
    this.name = "ZaiApiError";
  }
}
async function apiRequest(endpoint, token) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    accept: "application/json, text/plain, */*",
    "accept-language": "en",
    authorization: `Bearer ${token.trim()}`,
    origin: "https://z.ai",
    referer: "https://z.ai/manage-apikey/subscription",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  };
  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new ZaiApiError(`API error: ${response.status} ${response.statusText}`, response.status);
  }
  const data = await response.json();
  if (data.code !== 200) {
    throw new ZaiApiError(data.msg || "API request failed", data.code, data);
  }
  return data;
}
async function getQuotaLimit(cookie) {
  const data = await apiRequest("/api/monitor/usage/quota/limit", cookie);
  return data.data.limits;
}

// src/display.ts
function formatTokens(tokens) {
  if (tokens >= 1e9) {
    return `${(tokens / 1e9).toFixed(1)}B`;
  }
  if (tokens >= 1e6) {
    return `${(tokens / 1e6).toFixed(1)}M`;
  }
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}
function formatTimeRemaining(ms) {
  if (ms < 0)
    return "now";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor(ms % (60 * 60 * 1000) / (60 * 1000));
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// src/statusline/colors.ts
var RESET = "\x1B[0m";
var DIM = "\x1B[2m";
var RED = "\x1B[31m";
var GREEN = "\x1B[32m";
var YELLOW = "\x1B[33m";
var CYAN = "\x1B[36m";
function red(text) {
  return `${RED}${text}${RESET}`;
}
function cyan(text) {
  return `${CYAN}${text}${RESET}`;
}
function dim(text) {
  return `${DIM}${text}${RESET}`;
}
function getQuotaColor(percent) {
  if (percent >= 90)
    return RED;
  if (percent >= 70)
    return YELLOW;
  return GREEN;
}
function coloredBar(percent, width = 8) {
  const filled = Math.round(percent / 100 * width);
  const empty = width - filled;
  const color = getQuotaColor(percent);
  return `${color}${"█".repeat(filled)}${DIM}${"░".repeat(empty)}${RESET}`;
}

// src/statusline/render.ts
function renderTokenQuotaLine(ctx) {
  if (ctx.error) {
    return `${dim("tokensight")}: ${red(ctx.error)}`;
  }
  if (!ctx.tokenLimit) {
    return null;
  }
  const quota = ctx.tokenLimit;
  const percent = quota.percentage;
  const bar = coloredBar(percent);
  const resetIn = quota.nextResetTime ? formatTimeRemaining(quota.nextResetTime - Date.now()) : "";
  const parts = [
    cyan("[Z.ai]"),
    `${bar} ${getQuotaColor(percent)}${percent}%${RESET}`,
    dim(`${formatTokens(quota.remaining)} left`)
  ];
  if (resetIn) {
    parts.push(dim(`↺ ${resetIn}`));
  }
  return parts.join(" ");
}
function renderMonthlyQuotaLine(ctx) {
  if (!ctx.monthlyLimit) {
    return null;
  }
  const quota = ctx.monthlyLimit;
  const percent = quota.percentage;
  const parts = [
    dim("Monthly"),
    `${getQuotaColor(percent)}${quota.currentValue}/${quota.usage}${RESET}`,
    dim(`${quota.remaining} left`)
  ];
  return parts.join(" ");
}
function renderStatusLine(ctx) {
  const lines = [];
  const tokenLine = renderTokenQuotaLine(ctx);
  if (tokenLine) {
    lines.push(tokenLine);
  }
  const monthlyLine = renderMonthlyQuotaLine(ctx);
  if (monthlyLine) {
    lines.push(monthlyLine);
  }
  if (lines.length > 0) {
    const outputLine = `${RESET}${lines.join(" | ").replace(/ /g, " ")}`;
    console.log(outputLine);
  }
}

// src/statusline/index.ts
var CONFIG_PATH = join(homedir(), ".tokensight.json");
var CACHE_PATH = join(homedir(), ".tokensight-cache.json");
var CACHE_TTL_MS = 30000;
function getConfig() {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}
function getCache() {
  if (!existsSync(CACHE_PATH)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return null;
  }
}
function setCache(data) {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(data), "utf-8");
  } catch {}
}
async function getQuotaWithCache(cookie) {
  const now = Date.now();
  const cache = getCache();
  if (cache && now - cache.timestamp < CACHE_TTL_MS) {
    return {
      tokenLimit: cache.tokenLimit,
      monthlyLimit: cache.monthlyLimit
    };
  }
  const quotaLimits = await getQuotaLimit(cookie);
  const tokenLimit = quotaLimits.find((q) => q.type === "TOKENS_LIMIT");
  const monthlyLimit = quotaLimits.find((q) => q.type === "TIME_LIMIT");
  setCache({
    timestamp: now,
    tokenLimit,
    monthlyLimit
  });
  return { tokenLimit, monthlyLimit };
}
async function main() {
  const config = getConfig();
  const ctx = {};
  if (!config.cookie) {
    ctx.error = "run /tokensight auth <token>";
    renderStatusLine(ctx);
    return;
  }
  try {
    const { tokenLimit, monthlyLimit } = await getQuotaWithCache(config.cookie);
    ctx.tokenLimit = tokenLimit;
    ctx.monthlyLimit = monthlyLimit;
  } catch (error) {
    const cache = getCache();
    if (cache && cache.tokenLimit) {
      ctx.tokenLimit = cache.tokenLimit;
      ctx.monthlyLimit = cache.monthlyLimit;
    } else {
      ctx.error = error instanceof Error ? error.message : "API error";
    }
  }
  renderStatusLine(ctx);
}
main().catch((error) => {
  console.error(`${error}`);
  process.exit(1);
});
