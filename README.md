# Smooth Prose

[![CI & Prose Quality Gate](https://github.com/tBeltty/smooth-prose/actions/workflows/ci.yml/badge.svg)](https://github.com/tBeltty/smooth-prose/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](package.json)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.10-3776AB.svg?logo=python&logoColor=white)](scripts/lexicon_audit.py)
[![Editorial Standard](https://img.shields.io/badge/anti--slop-zero%20tolerance-critical.svg)](rules/anti-slop-directive.md)
[![Supported Languages](https://img.shields.io/badge/heuristics-EN%20%7C%20ES-orange.svg)](heuristics/slop-catalog.json)

> **Context-agnostic editorial suite for human cadence, zero AI slop, and high-craft writing across web design, marketing, and narrative fiction.**

---

## The Philosophy

Large Language Models (LLMs) suffer from predictable convergence: symmetrical sentences, theatrical throat-clearing openers (*"Here's the thing:"*), binary contrasts (*"Not X, but Y"*), and hollow corporate buzzwords (*"unpack"*, *"unlock synergies"*). This synthetic prose—**AI Slop**—dilutes author authority, creates cognitive fatigue, and undermines credibility.

**Smooth Prose** restores natural human cadence and assertive, fact-driven clarity. It pairs qualitative rules for AI agents with deterministic zero-dependency linters for automated CI/CD verification.

---

## Minimum Effective Change: Before vs. After

Smooth Prose operates under the principle of **Minimum Effective Change (MEC)**: eliminate synthetic friction and repetition while fiercely preserving the author's voice and intent.

<!-- smooth-lint-disable -->
| Synthetic / AI Slop (Before) | Smooth Prose (After) | Rule Applied |
| :--- | :--- | :--- |
| *Let's be clear: the bottleneck isn't a lack of tools, but a failure of coordination.* | *Engineering bottlenecks stem from coordination friction across distributed teams.* | Strip throat-clearing & state affirmative assertion directly without binary contrast. |
| *Take your development workflow to the next level with cutting-edge AI.* | *Audit dependencies and detect vulnerabilities in your terminal before each deployment.* | The Hero Formula: Concrete mechanism + tangible outcome. No vacuous slogans. |
| *Discover the hidden secrets top marketers never want you to know.* | *Tested 400 cold outreach emails. One single subject line change doubled replies.* | 2-Line Hook Formula ($\le 40$ chars). Replace manipulative hype with verified data. |
| *The iron seemed to almost resist Daniel's desperate blow. Tension hung thick in the air.* | *The iron resisted Daniel's blow. Cold sweat stung his knuckles.* | Quiroga Decalogue: Purge hesitation weakeners (*seemed, almost*) and ground tension somatically. |

<!-- smooth-lint-enable -->

---

## Architecture

```
smooth-prose/
├── rules/
│   ├── anti-slop-directive.md      # Core golden rule (system-level directive)
│   └── onboarding-protocol.md      # Strictly sequential calibration state machine
├── skills/
│   ├── smooth-core/                # Universal editorial engine & slop auditor
│   ├── smooth-web/                 # UI/UX copy, microcopy, modals & landing pages
│   ├── smooth-marketing/           # Conversion copy, KDP blurbs & 2-line hooks
│   └── smooth-narrative/           # Literary fiction, sensory pacing & RAE orthotypography
├── heuristics/
│   └── slop-catalog.json           # Deterministic regex patterns (EN & ES) for zero-AI linting
├── scripts/
│   ├── lexicon_audit.py            # Canonical lexicon & weakeners auditor (.docx, .md, .txt)
│   ├── audit_scene_breaks.py       # Blind cuts & scene break auditor (* * *)
│   ├── append_to_lexicon.py        # Cross-chapter metaphor recorder
│   └── init_project.py             # Interactive project onboarding & Lore Protection
├── bin/
│   ├── smooth-prose                # Unified CLI runner (Python 3)
│   └── smooth-lint.mjs             # Zero-dependency Node.js burstiness & regex linter
├── smooth-prose.config.json        # Workspace project configuration (generated via init)
└── integrations/                   # Setup guides for Antigravity, Claude, and Cursor
```

### The 4 Modular Skills

#### 1. [`smooth-core`](skills/smooth-core/SKILL.md) — Universal Editor & Auditor
* **Minimum Effective Change:** Eradicates synthetic clichés while protecting voice and rough edges.
* **Audit Mode:** Pinpoints exact line coordinates, pattern classifications, and 1-sentence fixes.
* **Fact-Shielding:** Guarantees that dates, prices, technical metrics, and direct quotes remain untouched.

#### 2. [`smooth-web`](skills/smooth-web/SKILL.md) — Web Design & Product Interfaces
* **Hero Section Standard:** Mandatory `[concrete mechanism] + [tangible outcome]`. Banned slogans (*"Empower your workflow"*).
* **Actionable Microcopy:** Button CTAs describe actual events (*"Download for macOS"*), not vague emotional promises (*"Discover the magic"*).
* **Non-Blaming Errors:** Explains what occurred in plain language and provides an immediate resolution path.
* **Empty States & Onboarding:** Spatial orientation without patronizing cheerleading.

#### 3. [`smooth-marketing`](skills/smooth-marketing/SKILL.md) — Conversion & Publishing
* **Amazon KDP Blurbs:** Strict compliance with Amazon's 4,000-character ceiling, above-the-fold optimization, and whitelist of 12 allowed HTML tags.
* **Two-Line Hook Formula:** Line 1 (context $\le 40$ chars) + Line 2 (punchy contrast $\le 40$ chars). No clickbait.
* **Authentic Frameworks:** Problem-Agitate-Solve (PAS) and Before-After-Bridge (BAB) without artificial scarcity or hype.

#### 4. [`smooth-narrative`](skills/smooth-narrative/SKILL.md) — Literary Fiction & Craft
* **Sensory Immediacy:** Replaces abstract atmospheric declarations (*"tension was in the air"*) with somatic bodily reactions.
* **Lexical Quotas:** Prevents word fatigue (strict quota on overused words like *shadows*, *dust*, *refuge*).
* **Dialogue Orthotypography:** Strict application of em-dashes (`—`) without spacing, adhering to RAE standards.
* **Cinematic Scene Breaks:** Canonical typographic Dinkus (`* * *`) and unindented paragraphs to eliminate blind transitions.

---

## Project Configuration (`smooth-prose.config.json`)

Running `smooth-prose init` generates a workspace configuration tailored to your domain:

```json
{
  "name": "my-project",
  "mode": "universal",
  "rules": {
    "ban_binary_contrast": true,
    "ban_throat_clearing": true,
    "enforce_portability_test": true,
    "minimum_effective_change": true,
    "show_dont_tell": true
  },
  "universal_scope": {
    "globs": ["**/*.md", "**/*.mdx", "**/*.html", "**/*.txt", "**/*.docx"],
    "cadence_check": true,
    "proximity_repetition_window": 120,
    "auto_lint_on_build": false
  }
}
```

### The 4 Calibration Modes

1. **`universal`:** Transversal guardrail across documentation, code comments, emails, and general copy.
2. **`literature`:** Activates **Lore Protection** (locks character names, factions, and rules), recurring word quotas, and Quiroga weakener audits. Generates `Matriz_PreVuelo.md`.
3. **`marketing`:** Enforces Amazon KDP character limits, HTML tag whitelisting, fact-shielding, and 2-line hook constraints.
4. **`web`:** Enforces the Hero formula, actionable button CTAs, and empty-state guidance.

---

## Installation & CLI Setup

Smooth Prose has **zero external package dependencies** (only Node.js 18+ and Python 3.10+ standard libraries).

### 1. Link to Global PATH

```bash
git clone https://github.com/tBeltty/smooth-prose.git
cd smooth-prose

# Option A: Link via npm (registers smooth-prose and smooth-lint)
npm link

# Option B: Manual symlink
chmod +x bin/smooth-prose bin/smooth-lint.mjs
ln -s "$(pwd)/bin/smooth-prose" /usr/local/bin/smooth-prose
ln -s "$(pwd)/bin/smooth-lint.mjs" /usr/local/bin/smooth-lint
```

### 2. Available Commands

```bash
# Initialize workspace configuration & Lore Protection
smooth-prose init

# Lint sentence burstiness, cadence, and AI slop patterns
smooth-prose lint document.md

# Force the rule language (default: auto-detected per document; en | es | all)
smooth-lint document.md --lang en

# Forensic audit of lexical quotas and weakeners (.docx, .md, .txt)
smooth-prose audit manuscript.docx

# Detect blind scene cuts lacking dinkus (* * *)
smooth-prose scenes chapter_1.docx

# Record a canonical metaphor for cross-chapter protection
smooth-prose record 4 "Agility" "Slid like black oil across the cobbles"
```

---

## CI/CD & Automation

Integrate Smooth Prose directly into Git hooks and automated CI pipelines:

### Stdin & Git Pre-Commit Hook

```bash
# Check staged markdown files before committing
git diff --cached --name-only --diff-filter=ACM "*.md" | while read -r file; do
  smooth-lint "$file" || exit 1
done

# Direct stdin piping
cat draft.md | smooth-lint
echo "Here's the thing: It's not about working harder, but working smarter." | smooth-lint
```

### GitHub Actions Workflow

```yaml
name: Prose Quality Gate

on: [push, pull_request]

jobs:
  lint-prose:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm link
      - name: Run Smooth Lint
        run: |
          find docs/ -name "*.md" -exec smooth-lint {} +
```

---

## Integrations

Smooth Prose integrates natively into modern AI coding assistants:

* **Google Antigravity / Gemini CLI:** See [integrations/antigravity.md](integrations/antigravity.md) to install as a native plugin.
* **Anthropic Claude (Code / Desktop):** See [integrations/claude.md](integrations/claude.md) to configure `CLAUDE.md`.
* **Cursor / Windsurf:** See [integrations/cursor.md](integrations/cursor.md) to configure `.cursorrules`.

---

## Contributing & Security

* **Contributing:** Please read [CONTRIBUTING.md](CONTRIBUTING.md) for pull request guidelines and heuristic submission.
* **Code of Conduct:** Read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
* **Security:** Review [SECURITY.md](SECURITY.md) to report vulnerabilities responsibly.

---

## License

MIT License © 2026 Smooth Prose Contributors. Free for personal and commercial use.
