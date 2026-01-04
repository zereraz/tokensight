# tokensight

Track your Z.ai GLM Coding Plan usage directly in Claude Code.

## Installation

Inside a Claude Code instance, run the following commands:

**Step 1: Add the marketplace**
```
/plugin marketplace add zereraz/tokensight
```

**Step 2: Install the plugin**
```
/plugin install tokensight
```

**Step 3: Set up authentication**
```
/tokensight auth <your_token>
```

Done! You can now check your usage anytime.

---

## What is tokensight?

tokensight gives you visibility into your Z.ai GLM Coding Plan usage.

| What You See | Why It Matters |
|--------------|----------------|
| Subscription status | Know when your plan renews and billing cycle |
| 5-hour token quota | Track your rolling token usage with reset countdown |
| Monthly quota | Monitor web search/reader/zread tool usage |
| Hourly breakdown | See usage patterns throughout the day |

## Commands

| Command | Description |
|---------|-------------|
| `/tokensight` | Show subscription and quota overview |
| `/tokensight today` | Hourly breakdown for today |
| `/tokensight 7d` | 7-day summary |
| `/tokensight 30d` | 30-day summary |
| `/tokensight auth <token>` | Save authentication token |
| `/tokensight:statusline` | Enable always-visible statusLine (shows token quota) |

## StatusLine Mode

For always-visible token quota, enable the statusLine:

```
/tokensight:statusline
```

This displays a compact HUD that updates every few seconds:

```
[Z.ai] ███████░░ 45% 110M left  ↺ 1h 30m
Monthly 14/1000 986 left
```

### Integration with claude-hud

If you already have claude-hud installed, running `/tokensight:statusline` will automatically detect it and create a combined statusLine that shows both:
- **claude-hud**: context, tools, agents, todos (lines 1-4)
- **tokensight**: token quota, monthly quota (lines 5-6)

Both renderers use the same ANSI color scheme for consistency.

## Authentication

Get your token from Z.ai:

1. Open https://z.ai/manage-apikey/subscription
2. Open DevTools (F12) → Application → Local Storage
3. Find `z-ai-open-platform-token-production`
4. Copy the token value (starts with `eyJhbGci`)
5. Run: `/tokensight auth <paste_token>`

Token is stored locally in `~/.tokensight.json`.

## Example Output

```
╔════════════════════════════════════════════════════════════╗
║           Z.ai GLM Coding Plan Usage Tracker               ║
╚════════════════════════════════════════════════════════════╝

Subscription: GLM Coding Pro
   Status: VALID
   Renews in: 83 days (2026-03-28)

5-Hour Quota:
   25.6M / 200M tokens (12%)
   174.4M remaining
   Resets in: 1h 49m

Monthly Quota:
   8 / 1000 calls (1%)
   992 remaining
```

## How It Works

1. Plugin calls bundled CLI via Node.js
2. CLI reads token from `~/.tokensight.json`
3. Makes authenticated requests to Z.ai APIs
4. Displays formatted results in Claude Code

## Privacy

- All data stays local
- API calls only to your own Z.ai account
- No telemetry or data collection

## License

MIT

---

This project was 100% built with Z.ai GLM 4.7. Inspired by [claude-hud](https://github.com/jarrodwatts/claude-hud).
