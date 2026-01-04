---
description: Clean up tokensight statusLine when uninstalling
allowed-tools: Bash, Read, Edit
---

Remove tokensight from the statusLine configuration in ~/.claude/settings.json.

1. Read ~/.claude/settings.json
2. Check if statusLine contains "tokensight"
3. If it does, remove the tokensight part:
   - If combined with claude-hud, restore claude-hud only
   - If standalone tokensight, remove entire statusLine
4. Update settings.json

This ensures clean uninstallation without leaving broken statusLine commands.
