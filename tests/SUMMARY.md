## Testing

Smooth Prose is tested in three layers, from fully deterministic checks to runs where a small model follows the skills in an isolated project. Details are in [tests/README.md](README.md).

```bash
npm test                                 # layer 1
node tests/evals/evals.mjs score         # layer 2
node tests/sandbox/setup.mjs <root>      # layer 3: prepare the sandbox
node tests/sandbox/grade.mjs <root>      # layer 3: grade the results
```

### Results

| Layer | What it checks | Result |
|---|---|---|
| 1. Claim tests | 60 `node:test` tests, zero dependencies | 60 pass, 0 pending |
| 2. Skill evals | 11 cases across core, web, marketing, narrative | 11/11 |
| 3. Sandbox runs | 6 English scenarios, 38 framework CLI calls logged | 6/6 |

### Layer 1: claim tests

`tests/cli.test.mjs` covers:

- every Before/After example in the README
- each lint rule, with a positive and a negative sample in English and Spanish
- `--lang` and language auto-detection, exit codes, line numbers
- lexical quotas and burstiness
- project `init` in four modes
- the metaphor registry and `.docx` reading
- scene-break detection in English and Spanish
- the zero-dependency claim, README links, and that docs linted in CI stay clean

### Layer 2: skill behavior evals

A small model rewrites each case following its `SKILL.md`, and a deterministic scorer checks the output for linter-clean text, preserved facts and quotes, hook lines of 40 characters or fewer, the KDP tag whitelist and 4,000-byte ceiling, and the presence of a dinkus.

### Layer 3: sandbox agent runs

Six scenarios run in an isolated project where the framework is installed and nothing else: landing copy, KDP blurb with a two-line hook, fiction chapter edit, novel project setup, release notes with fact and quote shielding, and a git pre-commit hook. One small-model agent runs per scenario. Grading is deterministic and inspects only the results and a log of CLI calls.

The first pass was 4/6. Two checks were too strict, and one fixture lacked the source facts needed for the requested blurb length; the agent had correctly refused to invent plot details. The checks and fixture were corrected and the scenarios re-run.

### Bugs the tests found

The tests led to fixes for: missing English coverage (README examples were not detected), the linter not using the rule catalog, throat-clearing line numbers off by one, `init` ignoring script failures, a dead `$schema` URL written into generated configs, a wrong KDP tag count in the README (12 vs 13), and the scene-break auditor missing relative time jumps such as "Three days later".

### Known limits

- Each agent scenario was run once, with a single small model.
- There are no control runs without the skills yet. These runs show the framework is usable and its checks work, not that the skills improve output over no skills.
- Spanish has deterministic tests but no agent scenarios yet.
