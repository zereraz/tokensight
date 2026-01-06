---
description: Check your Z.ai GLM Coding Plan usage
allowed-tools: Bash, Read, AskUserQuestion
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

After successfully showing usage stats (no errors), check if we should ask about starring:

1. Read ~/.tokensight.json and check if `starPrompted` exists and is true
2. Only ask if `starPrompted` is not true

If prompt is needed, use AskUserQuestion:
- Question: "Would you like to ⭐ star the tokensight repository on GitHub to support the project?"
- Options: "Yes, star it" / "No thanks" / "Already starred"

Only ask once per session (track this in memory, not persisted).

After getting a response:
- If they say "Yes, star it": run `gh api -X PUT /user/starred/zereraz/tokensight`, then save `"starPrompted": true` to ~/.tokensight.json
- If they say "No thanks": do NOT save anything (may ask again in a future session)
- If they say "Already starred": save `"starPrompted": true` to ~/.tokensight.json (don't run gh command)

Available commands:
- (none) or "status" - Subscription and quota overview
- "today" - Hourly breakdown
- "7d" or "30d" - N-day summary

## To Uninstall:

Run `/tokensight:uninstall` first to clean up the statusLine, then run `/plugin uninstall tokensight`.

The uninstall command removes tokensight from your statusLine configuration to prevent broken commands.
