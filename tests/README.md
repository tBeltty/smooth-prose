# Tests

Two layers, both zero-dependency.

## 1. Deterministic claims (`npm test`)

`tests/cli.test.mjs` runs the real CLIs and checks what the README promises: the Before/After table, exit codes, line numbers, quotas, burstiness, `init` modes, `record`, `.docx` reading, link integrity, the zero-dependency claim.

Tests marked `todo` assert a claim the code does not meet yet. They are reported but do not fail the suite. Remove the `todo` when the gap is fixed.

## 2. Skill behavior evals (`tests/evals/`)

The four skills are prompts, so their behavior needs a model to run. The harness keeps the model out of the grading.

```bash
node tests/evals/evals.mjs list            # case ids (cases.json)
node tests/evals/evals.mjs prompt <id> --set with-r1      # brief to hand to a model
node tests/evals/evals.mjs prompt <id> --set control-r1   # same task without the skill
node tests/evals/evals.mjs score --set with-r1            # grade tests/evals/out/with-r1/*.txt
node tests/evals/evals.mjs compare                        # with-skill vs control pass rates
```

Flow: give each brief to a cheap model (we use Haiku subagents, one per skill), have it write only the result to the path in the brief, then run `score`. Any set named `control*` gets the task without the skill, so `compare` can show what the skill adds. Grading is deterministic: `smooth-lint`, required/forbidden patterns, fact preservation, hook line lengths, KDP tag whitelist and byte ceiling, dinkus presence.

Outputs in `tests/evals/out/` are git-ignored.

## 3. Sandbox runs (`tests/sandbox/`)

Simulates a user project where the framework is the only editorial tooling provided (agents still start with the host's global instructions and tool set), then lets an agent do realistic tasks in English: polish landing copy, write a KDP blurb and hook, edit a fiction chapter, set up a novel project, clean release notes without touching facts, and build a pre-commit hook.

```bash
node tests/sandbox/setup.mjs /tmp/sp-sandbox      # framework copy, logging CLI shims, fixtures, one brief per scenario
# give each briefs/<id>.md to an agent (we use Haiku), one agent per scenario
node tests/sandbox/grade.mjs /tmp/sp-sandbox      # deterministic grading + record of framework CLI calls
```

Grading looks only at the result (lint, preserved facts, limits, generated files, behavior of the hook), plus `usage.log` to confirm the agent really used the CLI.

## 4. Naive-agent runs (`tests/naive/`)

A plain user request with no structure, run bare and with the framework installed. `node tests/naive/naive.mjs setup <root>` writes one prompt per run under `<root>/prompts/`; give each prompt, verbatim, to an agent; `node tests/naive/naive.mjs grade <root>` reports lint issues, hype words, invented numbers and facts kept per condition.
