# Integration with Anthropic Claude (Claude Code / Desktop / Web Projects)

### For Claude Code or Code Repositories
Copy or link the contents of `rules/anti-slop-directive.md` into your project's `CLAUDE.md`:

```markdown
<!-- In your CLAUDE.md -->
## Editorial Standards (Smooth Prose)
- Absolute ban on binary contrasts ("not X, but Y" / "no X, sino Y").
- Never use throat-clearing openings ("Here's the thing:", "Let's be clear:").
- Every statement must pass the Portability Test (concrete facts, no generic filler).
- Minimum effective change: preserve human cadence and rough edges.
```

### For Claude Desktop Projects
Attach the `skills/<skill-name>/SKILL.md` files as Project Knowledge so Claude loads the directives automatically.
