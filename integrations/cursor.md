# Integration with Cursor / Windsurf / VS Code Copilot

### Cursor (`.cursorrules` or `.cursor/rules/`)
Append the core directive to your project root:

```bash
cat rules/anti-slop-directive.md >> .cursorrules
```

Or when using modern Cursor Rules (`.cursor/rules/writing.mdc`):

```markdown
---
description: Smooth Prose Editorial and Writing Standard
globs: ["**/*.md", "**/*.mdx", "**/*.tsx", "**/*.html"]
---

<!-- Insert the contents of rules/anti-slop-directive.md here -->
```
