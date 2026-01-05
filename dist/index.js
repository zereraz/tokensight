#!/usr/bin/env -S bun

// src/config.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
var CONFIG_PATH = join(homedir(), ".tokensight.json");
function getConfig() {
  if (!existsSync(CONFIG_PATH)) {
    const defaultConfig = {};
    writeFileSync(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2), "utf-8");
    return defaultConfig;
  }
  return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
}
function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

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
async function getSubscription(cookie) {
  const data = await apiRequest("/api/biz/subscription/list", cookie);
  return data.data;
}
async function getQuotaLimit(cookie) {
  const data = await apiRequest("/api/monitor/usage/quota/limit", cookie);
  return data.data.limits;
}
async function getModelUsage(cookie, startTime, endTime) {
  const params = new URLSearchParams({
    startTime,
    endTime
  });
  const data = await apiRequest(`/api/monitor/usage/model-usage?${params}`, cookie);
  return data.data;
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
function getDaysUntilRenewal(nextRenewTime) {
  const renewDate = new Date(nextRenewTime);
  const now = new Date;
  const diff = renewDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
function getBar(percentage, length = 30) {
  const filled = Math.round(percentage / 100 * length);
  const empty = length - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}
function getEmoji(percentage) {
  if (percentage >= 100)
    return "\uD83D\uDD34";
  if (percentage > 90)
    return "\uD83D\uDFE0";
  if (percentage > 80)
    return "\uD83D\uDFE1";
  return "\uD83D\uDFE2";
}
function showHeader() {
  console.log(`
╔════════════════════════════════════════════════════════════╗`);
  console.log("║           Z.ai GLM Coding Plan Usage Tracker               ║");
  console.log(`╚════════════════════════════════════════════════════════════╝
`);
}
function showSubscription(sub) {
  const daysUntilRenewal = getDaysUntilRenewal(sub.nextRenewTime);
  console.log(`\uD83D\uDCE6 Subscription: ${sub.productName}`);
  console.log(`   Status: ${sub.status}`);
  console.log(`   Renews in: ${daysUntilRenewal} days (${sub.nextRenewTime.split(" ")[0]})`);
  console.log(`   Billing: ${sub.billingCycle} @ $${sub.actualPrice}
`);
}
function showTokenQuota(quota) {
  const resetIn = quota.nextResetTime ? formatTimeRemaining(quota.nextResetTime - Date.now()) : "unknown";
  console.log(`\uD83D\uDCCA 5-Hour Quota (Model Calls):`);
  console.log(`   ${formatTokens(quota.currentValue)} / ${formatTokens(quota.usage)} tokens`);
  console.log(`   ${formatTokens(quota.remaining)} tokens remaining (${quota.percentage}%)`);
  console.log(`   Resets in: ${resetIn}
`);
  console.log(`   ${getEmoji(quota.percentage)} ${getBar(quota.percentage)} ${quota.percentage}%
`);
}
function showMonthlyQuota(quota) {
  console.log(`\uD83D\uDCCA Web Tools Quota (Search/Reader/Zread):`);
  console.log(`   ${quota.currentValue} / ${quota.usage} times (${quota.percentage}%)`);
  console.log(`   ${quota.remaining} times remaining
`);
  console.log(`   ${getEmoji(quota.percentage)} ${getBar(quota.percentage)} ${quota.percentage}%
`);
  if (quota.usageDetails && quota.usageDetails.length > 0) {
    console.log(`   Tool breakdown:`);
    for (const detail of quota.usageDetails) {
      console.log(`   - ${detail.modelCode}: ${detail.usage} calls`);
    }
    console.log("");
  }
}
function showTodayUsage(data) {
  const today = new Date().toLocaleDateString();
  console.log(`
\uD83D\uDCC5 Today's Usage (${today}):
`);
  if (data.totalUsage) {
    console.log(`   Model Calls: ${data.totalUsage.totalModelCallCount || 0}`);
    console.log(`   Tokens Used: ${formatTokens(data.totalUsage.totalTokensUsage || 0)}`);
  }
  const currentHour = new Date().getHours();
  console.log(`
   Hourly breakdown:`);
  for (let i = 0;i <= currentHour; i++) {
    const idx = data.x_time?.findIndex((t) => t.endsWith(` ${i.toString().padStart(2, "0")}:00`));
    if (idx >= 0) {
      const calls = data.modelCallCount?.[idx] || 0;
      const tokens = data.tokensUsage?.[idx] || 0;
      if (calls || tokens) {
        console.log(`   ${i.toString().padStart(2, "0")}:00 - ${calls} calls, ${formatTokens(tokens)} tokens`);
      }
    }
  }
  console.log("");
}

// src/index.ts
async function getToken() {
  const config = getConfig();
  if (config.cookie) {
    return config.cookie;
  }
  const isTTY = process.stdin.isTTY && typeof process.stdin.setRawMode === "function";
  if (!isTTY) {
    console.log(`
\uD83D\uDD10 Authentication needed
`);
    console.log(`Extract your API token from the browser:
`);
    console.log(`  1. Open https://z.ai/manage-apikey/subscription`);
    console.log(`  2. Open DevTools (F12) → Application → Local Storage`);
    console.log(`  3. Click https://z.ai`);
    console.log(`  4. Find: z-ai-open-platform-token-production`);
    console.log(`  5. Copy the token value
`);
    console.log(`Paste your token in the chat: /tokensight auth <your_token>
`);
    throw new Error("No token found in config.");
  }
  console.log(`
\uD83D\uDD10 Authentication needed
`);
  console.log(`Extract your API token from the browser:
`);
  console.log(`  1. Open https://z.ai/manage-apikey/subscription`);
  console.log(`  2. Open DevTools (F12) → Application → Local Storage`);
  console.log(`  3. Click https://z.ai`);
  console.log(`  4. Find: z-ai-open-platform-token-production`);
  console.log(`  5. Copy the token value
`);
  console.log(`The token should start with: eyJhbGciOiJIUzUxMiJ9...
`);
  const token = await new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let input = "";
    process.stdout.write(`Paste Bearer token: `);
    const handler = (chunk) => {
      const data = chunk.toString();
      for (const char of data) {
        if (char === `
` || char === "\r") {
          process.stdout.write(`
`);
          process.stdin.setRawMode(false);
          process.stdin.off("data", handler);
          resolve(input.trim());
          return;
        } else if (char === "\x03") {
          process.exit(0);
        } else if (char === "" || char === "\b") {
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (char >= " " && char <= "~") {
          input += char;
          process.stdout.write("*");
        }
      }
    };
    process.stdin.on("data", handler);
  });
  if (!token) {
    throw new Error("No token provided");
  }
  config.cookie = token;
  saveConfig(config);
  console.log(`
✅ Token saved!
`);
  return config.cookie;
}
async function cmdAuth(token) {
  if (!token) {
    throw new Error("Usage: zai auth <token>");
  }
  const config = getConfig();
  config.cookie = token.trim();
  saveConfig(config);
  console.log(`✅ Token saved!
`);
}
async function cmdReset() {
  const config = getConfig();
  delete config.cookie;
  saveConfig(config);
  console.log(`✅ Token cleared. Run 'zai' to authenticate.
`);
}
function parseDateRange(arg) {
  const now = new Date;
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  const match = arg?.match(/^(\d+)(d|days)?$/) || [null, "1", "d"];
  const days = parseInt(match[1], 10);
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);
  const label = days === 1 ? "Today" : `Last ${days} days`;
  return {
    start,
    end: endOfDay(now),
    label
  };
}
async function showStatus(cookie) {
  const [subscriptions, quotaLimits] = await Promise.all([
    getSubscription(cookie),
    getQuotaLimit(cookie)
  ]);
  const sub = subscriptions[0];
  if (!sub) {
    console.log("No active subscription found.");
    return;
  }
  showHeader();
  showSubscription(sub);
  const tokenLimit = quotaLimits.find((q) => q.type === "TOKENS_LIMIT");
  const timeLimit = quotaLimits.find((q) => q.type === "TIME_LIMIT");
  if (tokenLimit) {
    showTokenQuota(tokenLimit);
  }
  if (timeLimit) {
    showMonthlyQuota(timeLimit);
  }
}
async function showUsage(cookie, daysArg = "1") {
  const { start, end, label } = parseDateRange(daysArg);
  const startStr = start.toISOString().replace("T", " ").split(".")[0];
  const endStr = end.toISOString().replace("T", " ").split(".")[0];
  const data = await getModelUsage(cookie, startStr, endStr);
  if (parseInt(daysArg, 10) > 1 || daysArg.includes("days")) {
    const today = new Date().toLocaleDateString();
    console.log(`
\uD83D\uDCC5 Usage (${label}): ${today}
`);
    if (data.totalUsage) {
      console.log(`   Model Calls: ${data.totalUsage.totalModelCallCount || 0}`);
      console.log(`   Tokens Used: ${data.totalUsage.totalTokensUsage || 0}
`);
    }
  } else {
    showTodayUsage(data);
  }
}
async function main() {
  const args = process.argv.slice(2);
  const [command, ...rest] = args;
  try {
    if (!command || command === "status") {
      const cookie = await getToken();
      await showStatus(cookie);
    } else if (command === "today" || /^\d+d(ays)?$/.test(command)) {
      const cookie = await getToken();
      await showUsage(cookie, command === "today" ? "1" : command);
    } else if (command === "auth") {
      await cmdAuth(rest[0]);
    } else if (command === "reset") {
      await cmdReset();
    } else if (command === "-h" || command === "--help" || command === "help") {
      console.log(`
Z.ai Usage Tracker - Track your GLM Coding Plan usage

Commands:
  zai              Show subscription and quota (default)
  zai today        Show today's hourly breakdown
  zai 7d           Show last 7 days usage
  zai 30d          Show last 30 days usage
  zai auth <token> Save API token
  zai reset        Clear saved token
  zai help         Show this help

First run? Run: zai auth <your_token>
Get token from browser: z-ai-open-platform-token-production (localStorage)
Token stored in: ~/.tokensight.json
      `);
    } else {
      console.log(`Unknown command: ${command}
`);
      console.log(`Run 'zai help' for usage.
`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`
Error: ${error instanceof Error ? error.message : error}
`);
    process.exit(1);
  }
}
main();
