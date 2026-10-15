# Changelog

## 1.0.0

- Deterministic linter (`smooth-lint`) with English and Spanish rules loaded from `heuristics/slop-catalog.json`; rules are templates over word classes.
- Language auto-detection per document, `--lang` and `SMOOTH_PROSE_LANG`, localized reports.
- Warning families for stock idioms, unsupported social proof, unsourced metrics, absolute claims, unsupported attacks on alternatives and hype vocabulary; `--facts` for author-supplied metrics.
- Direct quotes and lines marked as bad examples are not flagged; `<!-- smooth-lint-disable -->` regions are skipped.
- `smooth-prose` CLI: `init` (four content types), `audit`, `scenes`, `lint`, `record`.
- Four skills (core, web, marketing, narrative) and the core directive.
- Test suite: claim tests, skill evals with a control condition, sandbox and naive-agent runs.
