#!/usr/bin/env -S bun

import { getConfig, saveConfig, type TokensightConfig } from "./config.js";
import {
  getSubscription,
  getQuotaLimit,
  getModelUsage,
} from "./api.js";
import {
  showHeader,
  showSubscription,
  showTokenQuota,
  showMonthlyQuota,
  showTodayUsage,
} from "./display.js";

async function getToken(): Promise<string> {
  const config = getConfig();
  if (config.cookie) {
    return config.cookie;
  }

  // Check if running in TTY (interactive terminal)
  const isTTY = process.stdin.isTTY && typeof process.stdin.setRawMode === 'function';

  if (!isTTY) {
    // Non-interactive mode - show instructions and exit
    console.log(`\n🔐 Authentication needed\n`);
    console.log(`Extract your API token from the browser:\n`);
    console.log(`  1. Open https://z.ai/manage-apikey/subscription`);
    console.log(`  2. Open DevTools (F12) → Application → Local Storage`);
    console.log(`  3. Click https://z.ai`);
    console.log(`  4. Find: z-ai-open-platform-token-production`);
    console.log(`  5. Copy the token value\n`);
    console.log(`Paste your token in the chat: /tokensight auth <your_token>\n`);
    throw new Error("No token found in config.");
  }

  // Interactive mode - prompt user
  console.log(`\n🔐 Authentication needed\n`);
  console.log(`Extract your API token from the browser:\n`);
  console.log(`  1. Open https://z.ai/manage-apikey/subscription`);
  console.log(`  2. Open DevTools (F12) → Application → Local Storage`);
  console.log(`  3. Click https://z.ai`);
  console.log(`  4. Find: z-ai-open-platform-token-production`);
  console.log(`  5. Copy the token value\n`);
  console.log(`The token should start with: eyJhbGciOiJIUzUxMiJ9...\n`);

  // Read token line (masks input with asterisks)
  const token = await new Promise<string>((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    let input = "";
    process.stdout.write(`Paste Bearer token: `);

    const handler = (chunk: Buffer) => {
      const data = chunk.toString();

      for (const char of data) {
        if (char === "\n" || char === "\r") {
          process.stdout.write("\n");
          process.stdin.setRawMode(false);
          process.stdin.off("data", handler);
          resolve(input.trim());
          return;
        } else if (char === "\x03") {
          process.exit(0);
        } else if (char === "\x7f" || char === "\x08") {
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

  // Save token
  config.cookie = token;
  saveConfig(config);

  console.log(`\n✅ Token saved!\n`);
  return config.cookie;
}

async function cmdAuth(token: string): Promise<void> {
  if (!token) {
    throw new Error("Usage: zai auth <token>");
  }
  const config = getConfig();
  config.cookie = token.trim();
  saveConfig(config);
  console.log(`✅ Token saved!\n`);
}

async function cmdReset(): Promise<void> {
  const config = getConfig();
  delete config.cookie;
  saveConfig(config);
  console.log(`✅ Token cleared. Run 'zai' to authenticate.\n`);
}

function parseDateRange(arg: string): { start: Date; end: Date; label: string } {
  const now = new Date();
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

  // Match patterns: "today", "7d", "30d", "7days", etc.
  const match = arg?.match(/^(\d+)(d|days)?$/) || [null, "1", "d"];
  const days = parseInt(match[1], 10);
  const start = new Date(now);
  start.setDate(start.getDate() - days + 1);
  start.setHours(0, 0, 0, 0);

  const label = days === 1 ? "Today" : `Last ${days} days`;

  return {
    start,
    end: endOfDay(now),
    label,
  };
}

async function showStatus(cookie: string): Promise<void> {
  const [subscriptions, quotaLimits] = await Promise.all([
    getSubscription(cookie),
    getQuotaLimit(cookie),
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

async function showUsage(cookie: string, daysArg: string = "1"): Promise<void> {
  const { start, end, label } = parseDateRange(daysArg);

  const startStr = start.toISOString().replace("T", " ").split(".")[0];
  const endStr = end.toISOString().replace("T", " ").split(".")[0];

  const data = await getModelUsage(cookie, startStr, endStr);

  // For multi-day, show summary only
  if (parseInt(daysArg, 10) > 1 || daysArg.includes("days")) {
    const today = new Date().toLocaleDateString();
    console.log(`\n📅 Usage (${label}): ${today}\n`);
    if (data.totalUsage) {
      console.log(`   Model Calls: ${data.totalUsage.totalModelCallCount || 0}`);
      console.log(`   Tokens Used: ${data.totalUsage.totalTokensUsage || 0}\n`);
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
      console.log(`Unknown command: ${command}\n`);
      console.log(`Run 'zai help' for usage.\n`);
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `\nError: ${error instanceof Error ? error.message : error}\n`
    );
    process.exit(1);
  }
}

main();
