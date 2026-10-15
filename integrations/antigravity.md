# Integration with Google Antigravity / Gemini CLI

You can use Smooth Prose as a native plugin or by symlinking the skills directly into your environment.

### Option 1: As a Native Plugin (Recommended)
Create a symbolic link from your `smooth-prose` folder into the Antigravity plugins directory:

```bash
ln -s "/path/to/smooth-prose" ~/.gemini/config/plugins/smooth-prose
```

Antigravity will automatically detect `plugin.json` and register the four modular skills:
* `smooth-core`
* `smooth-web`
* `smooth-marketing`
* `smooth-narrative`

### Option 2: As a Global System Rule
To enforce the anti-slop directive across all agent sessions by default without manually invoking skills:

```bash
cp rules/anti-slop-directive.md ~/.gemini/config/rules/smooth-prose.md
```
