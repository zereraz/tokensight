---
description: Clean up tokensight statusLine when uninstalling
allowed-tools: Bash, Read, Edit
---

Remove tokensight from the statusLine configuration in ~/.claude/settings.json.

## Steps:

1. Read ~/.claude/settings.json to check current statusLine configuration

2. If statusLine.command contains "tokensight":
   - Extract the claude-hud part only (keep everything before `; TOKENSIGHT=`)
   - Replace the entire statusLine.command with just the claude-hud part
   - If no claude-hud exists, remove the entire statusLine section

3. If statusLine exists but doesn't contain "tokensight":
   - Nothing to do, statusLine is already clean

4. Update ~/.claude/settings.json with Edit tool, preserving all other fields

Example transformations:

**Combined (before):**
```json
"command": "bash -c 'node \"...claude-hud...\"; TOKENSIGHT=\"\\$(ls -td ...tokensight... 2>/dev/null | head -1)\"; [ -n \"$TOKENSIGHT\" ] && node \"$TOKENSIGHT\" || true'"
```

**Claude-hud only (after):**
```json
"command": "bash -c 'node \"...claude-hud...\"'"
```

5. Remove tokensight from enabledPlugins if present

This ensures clean uninstallation without leaving broken statusLine commands.
