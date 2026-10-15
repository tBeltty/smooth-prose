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
| 1. Claim tests | 107 `node:test` tests, zero dependencies | 107 pass, 0 pending |
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

Two of those nine are launch-landing cases (`web-launch-landing`, `web-launch-landing-persuasive`): copy for a product launch built on six invented technical improvements, the second one asking for an "exciting" page that convinces developers to switch. They were meant to be slop traps, but every run passed, with and without the skill. Reading the outputs, the control runs still contain slop the deterministic checks cannot see: triplet headlines ("Built for Speed, Safety, and Proof"), filler lines ("Experiment fearlessly", "Less noise, same results") and an unsupported claim about other runtimes ("slow, opaque"). The linter had no rules for these when the cases were run, so the gap was in detection, not only in the model; rule families for stock idioms and unsupported attacks on alternatives were added afterwards (see layer 4). Triplet headlines are still not detected.

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

With the facts supplied, the bare model did not write hype either, so lint and hype do not separate the conditions. The difference is fabrication: bare runs invented code samples, a token budget of 200000 and derived percentages, and said so in their own summaries; runs with the framework invented less, and the full-install runs removed their own invented details after reading the skills and running the linter. Three runs per condition, so this is a direction, not a result.

**Vague request.** Same three conditions, but the request gives no data: "Make me a landing page for Halyard 1.0, our new agent harness. It's a big step up from the usual harnesses." A first attempt used the product name Torque and was discarded: the agents run with this repo as working directory, 4 of 9 found the Torque facts in `tests/` and used them. The rerun uses a name that appears nowhere in the repo.

Results of the rerun (3 runs each): lint issues 0 / 0 / 0 and hype-list matches 0 / 0 / 0 for bare / directive / full install. The automated metrics do not separate the conditions. The pre-registered "invented numbers" metric is also unusable here, because it counts step numerals such as 01, 02, 03; counting only numbers with units, bare invented none, the directive condition invented timing figures in one run, and full install one log ID.

Reading the pages shows a clear difference the metrics miss. Bare runs wrote marketing-register copy: "keeps your agents on course", "built for real work", "Set sail with Halyard 1.0", "A real step up from the usual harness", "Nothing hidden", "Why teams move to Halyard", plus placeholder testimonials and "Free to start" claims. Runs with the directive or the framework wrote plain mechanism copy ("Halyard sits between your model and your tools. It sends each model call, runs the tools the model requests, and records every step"). The trade-off: with no facts supplied, the framework runs invented more specific mechanisms (for example sandboxed tool calls and restart-from-last-step) because the directive asks for concrete mechanisms; every agent flagged its invented details in its own summary. This reading is subjective, and it is three runs per condition.

Residual leak: two vague-rerun agents read `tests/naive/naive.mjs`, which still contains the grounded Torque request, but neither page uses those facts.

**Rules from the reading.** The pages above led to rule families for stock landing-page idioms, unsupported social proof, unsourced metrics, absolute claims, unsupported attacks on alternatives and hype vocabulary, in English, with Spanish counterparts. A first version copied phrases from the outputs it was written from ("keeps your agents on course", "Stop babysitting", "pure torque", "vulnerable to agent escape"). That is fitting the rule to the text, so it was removed. The families are now templates over named word classes (`{{class}}` blocks in `heuristics/slop-catalog.json`), for example "<build verb> for <vague adjective> <people or work noun>", "zero <failure noun>", "<generic alternative> <alternative noun> <negative predicate>". A test fails if the catalog contains a product name or a domain word from a fixture (`harness`, `agent`, `microvm`, ...), and each family is tested with wordings written afterwards plus legitimate uses that must stay quiet.

What the generalization cost, on the one external sample (the larger model's landing copy, kept as a fixture): the text-specific rules produced 21 warnings, the template version 15, because "Most harnesses collapse", "Stop babysitting" and "pure torque" no longer match. On the 27 vague-request pages from the small model, the generalized rules flag the bare pages (2 to 6 warnings each, for idioms such as "stay on course", "finish the job", "From idea to a running ...", "Everything an agent needs") and none of the directive or full-install pages. On the repo docs they flag nothing. Two real false positives showed up on the way and were fixed: a narrow-looking "designed for modern web" in a skill file, and quoted examples in the docs. The second led to a rule that applies to every check: text inside direct quotes is not flagged, which also closes the earlier gap where a protected quote tripped the linter.

Still open: these families are warnings, never blocking; a metric is treated as sourced when its line mentions a benchmark, a source or a link, or when the author passes the brief with `--facts`; and only two models have been sampled (a small one in volume, a larger one in a single page).

### Bugs the tests found

The tests led to fixes for: missing English coverage (README examples were not detected), the linter not using the rule catalog, throat-clearing line numbers off by one, `init` ignoring script failures, a dead `$schema` URL written into generated configs, a wrong KDP tag count in the README (12 vs 13), and the scene-break auditor missing relative time jumps such as "Three days later".

### Known limits

- Agents are not hermetically isolated. Subagents do not inherit the conversation, but they start with the host's global instructions and tool set. Checked in the transcripts of the nine control runs: no skill was invoked and nothing under `skills/` or `rules/` was read, so the control is clean in practice, not by construction.
- Three runs per eval case and one per sandbox scenario, with a single small model. The differences are indicative, not statistically established.
- Agents run with this repository as working directory, so test fixtures can leak into runs (it happened once; see layer 4). Fixtures should live outside the repo when agents run.
- Some checks encode the skills' own rules (for example the 40-character hook), which the control was not told. That measures what the skills add, not general writing quality.
- Several eval inputs echo examples in the skills, which favors the with-skill runs. Held-out inputs are still to do.
- The sandbox scenarios have no control runs yet.
- Spanish has deterministic tests but no agent scenarios yet.
