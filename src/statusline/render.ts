import type { QuotaLimit } from "../api.js";
import { formatTokens, formatTimeRemaining } from "../display.js";
import { coloredBar, cyan, dim, red, getQuotaColor, RESET } from "./colors.js";

export interface StatusLineContext {
  tokenLimit?: QuotaLimit;
  monthlyLimit?: QuotaLimit;
  error?: string;
}

export function renderTokenQuotaLine(ctx: StatusLineContext): string | null {
  if (ctx.error) {
    return `${dim("tokensight")}: ${red(ctx.error)}`;
  }

  if (!ctx.tokenLimit) {
    return null;
  }

  const quota = ctx.tokenLimit;
  const percent = quota.percentage;
  const bar = coloredBar(percent);
  const resetIn = quota.nextResetTime
    ? formatTimeRemaining(quota.nextResetTime - Date.now())
    : "";

  const parts: string[] = [
    cyan("[Z.ai]"),
    `${bar} ${getQuotaColor(percent)}${percent}%${RESET}`,
    dim(`${formatTokens(quota.remaining)} left`),
  ];

  if (resetIn) {
    parts.push(dim(`↺ ${resetIn}`));
  }

  return parts.join(" ");
}

export function renderMonthlyQuotaLine(ctx: StatusLineContext): string | null {
  if (!ctx.monthlyLimit) {
    return null;
  }

  const quota = ctx.monthlyLimit;
  const percent = quota.percentage;

  const parts: string[] = [
    dim("Monthly"),
    `${getQuotaColor(percent)}${quota.currentValue}/${quota.usage}${RESET}`,
    dim(`${quota.remaining} left`),
  ];

  return parts.join(" ");
}

export function renderStatusLine(ctx: StatusLineContext): void {
  const lines: string[] = [];

  const tokenLine = renderTokenQuotaLine(ctx);
  if (tokenLine) {
    lines.push(tokenLine);
  }

  const monthlyLine = renderMonthlyQuotaLine(ctx);
  if (monthlyLine) {
    lines.push(monthlyLine);
  }

  // Output each line with non-breaking spaces (like claude-hud)
  for (const line of lines) {
    const outputLine = `${RESET}${line.replace(/ /g, "\u00A0")}`;
    console.log(outputLine);
  }
}
