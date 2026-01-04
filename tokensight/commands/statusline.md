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
    "command": "bash -c '(node \"$(ls -td ~/.claude/plugins/cache/claude-hud/*/dist/index.js 2>/dev/null | head -1)\") && node \"$(ls -td ~/.claude/plugins/cache/tokensight/*/dist/statusline.js 2>/dev/null | head -1)\"'"
  }
}
```

This will display:
- Lines 1-4: claude-hud (context, tools, agents, todos)
- Lines 5-6: tokensight (token quota, monthly quota)

### If no statusLine exists:

Install tokensight-only:

```json
{
  "statusLine": {
    "type": "command",
    "command": "bash -c 'node \"$(ls -td ~/.claude/plugins/cache/tokensight/*/dist/statusline.js 2>/dev/null | head -1)\"'"
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

After successful setup, ask the user if they'd like to star the repository to support the project.

If they agree, run: `gh api -X PUT /user/starred/zereraz/tokensight`

Only run the star command if they explicitly say yes.
