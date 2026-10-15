# Tests

Two layers, both zero-dependency.

## 1. Deterministic claims (`npm test`)

`tests/cli.test.mjs` runs the real CLIs and checks what the README promises: the Before/After table, exit codes, line numbers, quotas, burstiness, `init` modes, `record`, `.docx` reading, link integrity, the zero-dependency claim.

Tests marked `todo` assert a claim the code does not meet yet. They are reported but do not fail the suite. Remove the `todo` when the gap is fixed.

## 2. Skill behavior evals (`tests/evals/`)

The four skills are prompts, so their behavior needs a model to run. The harness keeps the model out of the grading.

```bash
node tests/evals/evals.mjs list            # case ids (cases.json)
node tests/evals/evals.mjs prompt <id>     # brief to hand to a model
node tests/evals/evals.mjs score           # grade tests/evals/out/*.txt
```

Flow: give each brief to a cheap model (we use Haiku subagents, one per skill), have it write only the result to `tests/evals/out/<id>.txt`, then run `score`. Grading is deterministic: `smooth-lint`, required/forbidden patterns, fact preservation, hook line lengths, KDP tag whitelist and byte ceiling, dinkus presence.

Outputs in `tests/evals/out/` are git-ignored.
