# Contributing to Smooth Prose

Thank you for your interest in improving human cadence and eradicating AI slop.

---

## Code of Conduct

All contributors are expected to uphold a welcoming, professional, and respectful environment.

---

## How to Contribute

### 1. Adding Deterministic Heuristics
If you identify a new, recurring synthetic AI writing pattern:
1. Ensure the pattern is verifiable via deterministic RegEx or lexical parsing (no black-box LLM classifiers).
2. Add the rule definition to `heuristics/slop-catalog.json`. Describe a family of patterns, not one text: write a template over word classes (`{{class}}` placeholders expand from the `classes` block) and do not copy phrases, product names or domain words from a single example. A test guards against fixture-specific words in the catalog.
3. Add test cases in `tests/cli.test.mjs`: one wording the rule must flag that you did not take from your example, and one legitimate use it must leave alone.
4. Direct quotes are shielded by the linter, and markdown lines marked with a cross mark or starting with `Avoid:` are skipped, so documentation can quote slop.

### 2. Proposing Editorial Rules
Changes to the core anti-slop directive (`rules/anti-slop-directive.md`) or domain skills must adhere to the **Minimum Effective Change** and **Portability Test** principles.

---

## Development Workflow

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/tBeltty/smooth-prose.git
   cd smooth-prose
   ```
2. Verify existing tests and scripts:
   ```bash
   node bin/smooth-lint.mjs README.md
   python3 scripts/lexicon_audit.py README.md
   ```
3. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. Commit using conventional commit messages (`feat:`, `fix:`, `docs:`, `chore:`).
5. Open a Pull Request with a clear rationale.
