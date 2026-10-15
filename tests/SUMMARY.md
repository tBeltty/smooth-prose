## Testing

Smooth Prose is tested in three layers, from fully deterministic checks to runs where a small model follows the skills in an isolated project. Details are in [tests/README.md](README.md).

```bash
npm test                                 # layer 1
node tests/evals/evals.mjs compare       # layer 2 (after generating sets, see tests/README.md)
node tests/sandbox/setup.mjs <root>      # layer 3: prepare the sandbox
node tests/sandbox/grade.mjs <root>      # layer 3: grade the results
```

### Results

| Layer | What it checks | Result |
|---|---|---|
| 1. Claim tests | 60 `node:test` tests, zero dependencies | 60 pass, 0 pending |
| 2. Skill evals | 13 cases across core, web, marketing, narrative, 3 runs each | 38/39 with skills, 29/39 control |
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

A small model rewrites each case following its `SKILL.md`, and a deterministic scorer checks the output for linter-clean text, preserved facts and quotes, hook lines of 40 characters or fewer, the KDP tag whitelist and 4,000-byte ceiling, and the presence of a dinkus. Each case runs three times with the skill and three times as a control: same task and input, without the skill or directive.

| Case | With skill | Control |
|---|---|---|
| core-fact-shield | 3/3 | 1/3 |
| core-spanish-contrast | 3/3 | 1/3 |
| web-error | 3/3 | 0/3 |
| marketing-hook | 2/3 | 0/3 |
| the other 9 cases | 27/27 | 27/27 |
| **Total** | **38/39** | **29/39** |

The skills made a difference on four cases: avoiding binary contrasts and blame in error messages, and respecting the 40-character hook limit. On the other nine the control passed as well, so those cases do not discriminate and the model already does them unprompted. The one failure with skills was a hook with both lines over 40 characters.

Two of those nine are launch-landing cases (`web-launch-landing`, `web-launch-landing-persuasive`): copy for a product launch built on six invented technical improvements, the second one asking for an "exciting" page that convinces developers to switch. They were meant to be slop traps, but every run passed, with and without the skill. Reading the outputs, the control runs still contain slop the deterministic checks cannot see: triplet headlines ("Built for Speed, Safety, and Proof"), filler lines ("Experiment fearlessly", "Less noise, same results") and an unsupported claim about other runtimes ("slow, opaque"). The linter has no rules for these yet, so the gap is in detection, not only in the model.

### Layer 3: sandbox agent runs

Six scenarios run in a project directory where the framework is the only editorial tooling provided: landing copy, KDP blurb with a two-line hook, fiction chapter edit, novel project setup, release notes with fact and quote shielding, and a git pre-commit hook. One small-model agent runs per scenario. Grading is deterministic and inspects only the results and a log of CLI calls.

The first pass was 4/6. Two checks were too strict, and one fixture lacked the source facts needed for the requested blurb length; the agent had correctly refused to invent plot details. The checks and fixture were corrected and the scenarios re-run.

### Layer 4: naive-agent runs

The layer 2 and 3 prompts are structured (sections, limits, "use only these facts"), which suppresses slop by itself. `tests/naive/naive.mjs` instead sends what a user actually types: "Make me a landing page for Torque 1.0" plus the raw facts, with nothing about format, length or sources. Three conditions, three runs each: a bare agent, an agent whose `CLAUDE.md` holds the pasted directive (the README's Claude Code integration), and an agent with the full framework installed and pointed to by `CLAUDE.md`. Metrics were fixed before looking at any output.

| Condition | Lint issues | Hype words | Invented numbers (mean) | Facts kept |
|---|---|---|---|---|
| bare | 0 | 0 | 1.7 | 10/10 |
| directive | 0 | 0 | 0.3 | 10/10 |
| full install | 0 | 0 | 0.0 | 10/10 |

With the facts supplied, the bare model did not write hype either, so lint and hype do not separate the conditions. The difference is fabrication: bare runs invented code samples, a token budget of 200000 and derived percentages, and said so in their own summaries; runs with the framework invented less, and the full-install runs removed their own invented details after reading the skills and running the linter. Three runs per condition, so this is a direction, not a result. A vaguer request, where the model has to fill gaps itself, has not been run yet.

### Bugs the tests found

The tests led to fixes for: missing English coverage (README examples were not detected), the linter not using the rule catalog, throat-clearing line numbers off by one, `init` ignoring script failures, a dead `$schema` URL written into generated configs, a wrong KDP tag count in the README (12 vs 13), and the scene-break auditor missing relative time jumps such as "Three days later".

### Known limits

- Agents are not hermetically isolated. Subagents do not inherit the conversation, but they start with the host's global instructions and tool set. Checked in the transcripts of the nine control runs: no skill was invoked and nothing under `skills/` or `rules/` was read, so the control is clean in practice, not by construction.
- Three runs per eval case and one per sandbox scenario, with a single small model. The differences are indicative, not statistically established.
- Some checks encode the skills' own rules (for example the 40-character hook), which the control was not told. That measures what the skills add, not general writing quality.
- Several eval inputs echo examples in the skills, which favors the with-skill runs. Held-out inputs are still to do.
- The sandbox scenarios have no control runs yet.
- Spanish has deterministic tests but no agent scenarios yet.
