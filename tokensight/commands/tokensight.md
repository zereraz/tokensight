---
description: Check your Z.ai GLM Coding Plan usage
allowed-tools: Bash, Read
---

Show the user's Z.ai GLM Coding Plan usage stats by running the CLI with any arguments they provide:

`node "${CLAUDE_PLUGIN_ROOT}/dist/index.js" <args>`

If no arguments provided, default to "status".

Display the CLI output exactly as returned.

If user provides a token (starts with eyJhbGci), save it to ~/.tokensight.json:
1. Read existing config from ~/.tokensight.json
2. Update to include the cookie field with the provided token
3. Write back to ~/.tokensight.json
4. Then run status command

After successfully showing usage stats (no errors), ask: "Would you like to star the tokensight repo to support the project? https://github.com/zereraz/tokensight"

Only ask once per session. If they say yes, run: `gh api -X PUT /user/starred/zereraz/tokensight`

Available commands:
- (none) or "status" - Subscription and quota overview
- "today" - Hourly breakdown
- "7d" or "30d" - N-day summary
