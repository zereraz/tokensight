import type { Subscription, QuotaLimit, UsageData } from "./api.js";

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) {
    return `${(tokens / 1_000_000_000).toFixed(1)}B`;
  }
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function formatTimeRemaining(ms: number): string {
  if (ms < 0) return "now";
  const hours = Math.floor(ms / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getDaysUntilRenewal(nextRenewTime: string): number {
  const renewDate = new Date(nextRenewTime);
  const now = new Date();
  const diff = renewDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getBar(percentage: number, length: number = 30): string {
  const filled = Math.round((percentage / 100) * length);
  const empty = length - filled;
  return `[${"█".repeat(filled)}${"░".repeat(empty)}]`;
}

function getEmoji(percentage: number): string {
  if (percentage >= 100) return "🔴";
  if (percentage > 90) return "🟠";
  if (percentage > 80) return "🟡";
  return "🟢";
}

export function showHeader(): void {
  console.log(
    "\n╔════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║           Z.ai GLM Coding Plan Usage Tracker               ║"
  );
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n"
  );
}

export function showSubscription(sub: Subscription): void {
  const daysUntilRenewal = getDaysUntilRenewal(sub.nextRenewTime);

  console.log(`📦 Subscription: ${sub.productName}`);
  console.log(`   Status: ${sub.status}`);
  console.log(
    `   Renews in: ${daysUntilRenewal} days (${sub.nextRenewTime.split(" ")[0]})`
  );
  console.log(`   Billing: ${sub.billingCycle} @ $${sub.actualPrice}\n`);
}

export function showTokenQuota(quota: QuotaLimit): void {
  const resetIn = quota.nextResetTime
    ? formatTimeRemaining(quota.nextResetTime - Date.now())
    : "unknown";

  console.log(`📊 5-Hour Quota (Model Calls):`);
  console.log(
    `   ${formatTokens(quota.currentValue)} / ${formatTokens(quota.usage)} tokens`
  );
  console.log(
    `   ${formatTokens(quota.remaining)} tokens remaining (${quota.percentage}%)`
  );
  console.log(`   Resets in: ${resetIn}\n`);

  console.log(
    `   ${getEmoji(quota.percentage)} ${getBar(quota.percentage)} ${quota.percentage}%\n`
  );
}

export function showMonthlyQuota(quota: QuotaLimit): void {
  console.log(`📊 Monthly Quota (Web Search/Reader/Zread):`);
  console.log(
    `   ${quota.currentValue} / ${quota.usage} times (${quota.percentage}%)`
  );
  console.log(
    `   ${quota.remaining} times remaining (Resets on 1st of month)\n`
  );

  console.log(
    `   ${getEmoji(quota.percentage)} ${getBar(quota.percentage)} ${quota.percentage}%\n`
  );

  if (quota.usageDetails && quota.usageDetails.length > 0) {
    console.log(`   Tool breakdown:`);
    for (const detail of quota.usageDetails) {
      console.log(`   - ${detail.modelCode}: ${detail.usage} calls`);
    }
    console.log("");
  }
}

export function showTodayUsage(data: UsageData): void {
  const today = new Date().toLocaleDateString();

  console.log(`\n📅 Today's Usage (${today}):\n`);

  if (data.totalUsage) {
    console.log(
      `   Model Calls: ${data.totalUsage.totalModelCallCount || 0}`
    );
    console.log(
      `   Tokens Used: ${formatTokens(data.totalUsage.totalTokensUsage || 0)}`
    );
  }

  // Show hourly breakdown
  const currentHour = new Date().getHours();

  console.log(`\n   Hourly breakdown:`);
  for (let i = 0; i <= currentHour; i++) {
    const idx = data.x_time?.findIndex((t: string) =>
      t.endsWith(` ${i.toString().padStart(2, "0")}:00`)
    );
    if (idx >= 0) {
      const calls = data.modelCallCount?.[idx] || 0;
      const tokens = data.tokensUsage?.[idx] || 0;
      if (calls || tokens) {
        console.log(
          `   ${i.toString().padStart(2, "0")}:00 - ${calls} calls, ${formatTokens(tokens)} tokens`
        );
      }
    }
  }

  console.log("");
}

export function showSetupInstructions(configPath: string): void {
  console.log(`\n📁 Config file: ${configPath}\n`);
  console.log(`To add authentication:\n`);
  console.log(`  Run: zai auth "paste_your_cookie_here"\n`);
  console.log(`  Or edit the config file:\n`);
  console.log(`  {\n    "cookie": "paste_your_cookie_here"\n  }\n`);
  console.log(`\nHow to get your cookie:\n`);
  console.log(`  1. Go to https://z.ai/manage-apikey/subscription`);
  console.log(`  2. Open DevTools (F12) → Network tab`);
  console.log(`  3. Refresh the page`);
  console.log(`  4. Click any 'api.z.ai' request`);
  console.log(`  5. Copy the 'cookie' header value\n`);
}
