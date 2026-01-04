#!/usr/bin/env -S bun

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { getQuotaLimit } from "../api.js";
import { renderStatusLine, type StatusLineContext } from "./render.js";

const CONFIG_PATH = join(homedir(), ".tokensight.json");
const CACHE_PATH = join(homedir(), ".tokensight-cache.json");
const CACHE_TTL_MS = 30000; // Cache for 30 seconds

interface Config {
  cookie?: string;
}

interface CacheData {
  timestamp: number;
  tokenLimit?: any;
  monthlyLimit?: any;
}

function getConfig(): Config {
  if (!existsSync(CONFIG_PATH)) {
    return {};
  }
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function getCache(): CacheData | null {
  if (!existsSync(CACHE_PATH)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf-8"));
  } catch {
    return null;
  }
}

function setCache(data: CacheData): void {
  try {
    writeFileSync(CACHE_PATH, JSON.stringify(data), "utf-8");
  } catch {
    // Ignore cache write errors
  }
}

async function getQuotaWithCache(cookie: string): Promise<{
  tokenLimit?: any;
  monthlyLimit?: any;
}> {
  const now = Date.now();
  const cache = getCache();

  // Return cached data if still valid
  if (cache && (now - cache.timestamp) < CACHE_TTL_MS) {
    return {
      tokenLimit: cache.tokenLimit,
      monthlyLimit: cache.monthlyLimit,
    };
  }

  // Fetch fresh data
  const quotaLimits = await getQuotaLimit(cookie);
  const tokenLimit = quotaLimits.find((q) => q.type === "TOKENS_LIMIT");
  const monthlyLimit = quotaLimits.find((q) => q.type === "TIME_LIMIT");

  // Update cache
  setCache({
    timestamp: now,
    tokenLimit,
    monthlyLimit,
  });

  return { tokenLimit, monthlyLimit };
}

async function main(): Promise<void> {
  const config = getConfig();
  const ctx: StatusLineContext = {};

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
    // On error, try to use stale cache if available
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
