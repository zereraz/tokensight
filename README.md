# tokensight

CLI tool to track your GLM Coding Plan usage by querying Z.ai's official APIs.

## Features

- Real-time usage data from Z.ai APIs
- Subscription info (renewal date, billing cycle)
- 5-hour rolling quota (token usage)
- Monthly quota (web search/reader/zread)
- Today's usage with hourly breakdown
- N-day historical summaries

## Installation

```bash
# Clone or navigate to the project
cd ~/Code/Zereraz/zai-tracker

# Build the CLI
bun run build

# Add to PATH (optional)
echo 'export PATH="$PATH:$HOME/Code/Zereraz/zai-tracker/dist"' >> ~/.zshrc
source ~/.zshrc
```

## Quick Start

```bash
# 1. Set up authentication
zai auth "your_token"

# 2. Check your usage
zai              # Show subscription and quota
zai today        # Show today's hourly breakdown
zai 7d           # Show last 7 days
```

## Commands

| Command | Description |
|---------|-------------|
| `zai` | Show usage status (default) |
| `zai status` | Show subscription and current quota |
| `zai today` | Show today's usage with hourly breakdown |
| `zai 7d` / `zai 30d` | Show N-day summary |
| `zai auth <token>` | Save API token |
| `zai reset` | Clear saved token |
| `zai help` | Show help |

## Authentication

The API token is stored in `~/.tokensight.json`.

### Getting your token:

1. Go to https://z.ai/manage-apikey/subscription
2. Open DevTools (F12) → Application → Local Storage
3. Click https://z.ai
4. Find `z-ai-open-platform-token-production`
5. Copy the token value
6. Run: `zai auth "paste_token_here"`

The token should start with: `eyJhbGciOiJIUzUxMiJ9...`

## Output Example

```
╔════════════════════════════════════════════════════════════╗
║           Z.ai GLM Coding Plan Usage Tracker               ║
╚════════════════════════════════════════════════════════════╝

📦 Subscription: GLM Coding Pro
   Status: VALID
   Renews in: 83 days (2026-03-28)
   Billing: quarterly @ $36.45

📊 5-Hour Quota (Model Calls):
   40.7M / 200.0M tokens
   159.3M tokens remaining (20%)
   Resets in: 40m

   🟢 [██████░░░░░░░░░░░░░░░░░░░░░░░░] 20%

📊 Monthly Quota (Web Search/Reader/Zread):
   11 / 1000 times (1%)
   989 times remaining (Resets on 1st of month)

   🟢 [░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 1%

   Tool breakdown:
   - search-prime: 4 calls
   - web-reader: 7 calls
   - zread: 0 calls
```

## Project Structure

```
src/
├── index.ts      # CLI entry point
├── config.ts     # Configuration management
├── api.ts        # Z.ai API client
└── display.ts    # Output formatting
```

## API Endpoints Used

- `/api/biz/subscription/list` - Subscription info
- `/api/monitor/usage/quota/limit` - Current quota limits
- `/api/monitor/usage/model-usage` - Hourly usage data

## Data Storage

- Config: `~/.tokensight.json`

## License

MIT
