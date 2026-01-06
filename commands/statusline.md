---
description: Enable tokensight statusLine for real-time token quota display
allowed-tools: Bash, Read, Edit, AskUserQuestion
---

Enable the tokensight statusLine by detecting and integrating with any existing statusLine setup.

## Step 1: Check current statusLine configuration

First, read `~/.claude/settings.json` to see if a statusLine is already configured:

```bash
cat ~/.claude/settings.json | grep -A3 "statusLine"
```

## Step 2: Determine the setup

### If claude-hud is already installed (statusLine contains "claude-hud"):

Create a **combined command** that runs both renderers:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node \"$(ls -td ~/.claude/plugins/cache/claude-hud/claude-hud/*/dist/index.js 2>/dev/null | head -1)\"; TOKENSIGHT=\"$(ls -td ~/.claude/plugins/cache/tokensight/tokensight/*/dist/statusline.js 2>/dev/null | head -1)\"; [ -n \"$TOKENSIGHT\" ] && node \"$TOKENSIGHT\" || true'"
  }
}
```

This will display:
- Lines 1-4: claude-hud (context, tools, agents, todos)
- Line 5: tokensight (token quota + monthly quota on single line)

### If no statusLine exists:

Install tokensight-only:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node \"$(ls -td ~/.claude/plugins/cache/tokensight/tokensight/*/dist/statusline.js 2>/dev/null | head -1)\"'"
  }
}
```

### If another statusLine exists:

Ask the user if they want to:
1. Replace it with tokensight
2. Keep their existing statusLine
3. Manually combine both (show them how)

## Step 3: Update settings.json

Use the Edit tool to update `~/.claude/settings.json`. Preserve all other fields, only update the `statusLine` section.

## How the statusLine works

The statusLine:
1. Runs periodically (every few seconds)
2. Reads your auth token from `~/.tokensight.json`
3. Fetches current quota from Z.ai API
4. Displays compact, color-coded output:
   - `[Z.ai] ███████░░ 45% 110M left  ↺ 1h 30m`
   - Colors: green (<70%), yellow (70-90%), red (>90%)

The statusLine appears immediately - no restart needed.

## Step 4: Verify With User

After successful setup, check if we should ask about starring:

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
