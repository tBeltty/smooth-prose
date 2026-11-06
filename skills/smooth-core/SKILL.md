---
name: smooth-core
description: >-
  Universal editorial engine and auditor for human cadence and zero AI slop. Detects and neutralizes synthetic clichés, binary contrasts, throat-clearing, and generic filler across any draft, document, or code comment while preserving the author's authentic voice.
---

# Smooth Core: Universal Editorial Engine & AI Slop Auditor

Smooth Core is an editorial intelligence skill designed to eliminate synthetic LLM artifacts (*AI slop*) from drafts, documentation, articles, and communications without sanitizing the human personality or idiosyncrasies of the text.

---

## 1. Operating Modes

### Mode 0: Project Setup & Local Lore Isolation (`smooth-prose.config.json`)
* **Strict Workspace Isolation:** Smooth Prose is context-agnostic. Before drafting or editing any prose, inspect the active workspace's `smooth-prose.config.json` (and local `AGENTS.md` / `docs/BRAND.md` if present) to load project-specific tone, locale rules (e.g., `tuteo` vs `voseo`), or protected lore entities. **Never bleed lore, character names, brand terms, or domain constraints from one project into another.**
* When starting in a new workspace without `smooth-prose.config.json`, execute the **Onboarding Protocol** (`rules/onboarding-protocol.md`) as a strictly sequential state machine:
  1. **Step 1:** Ask project scope: Universal, Literature, Marketing, or Web.
  2. **Step 2 (Conditional Branching):**
     - If **Universal**: set global anti-slop rules for all copy; do NOT ask about literature or characters.
     - If **Literature**: inspect existing copy for characters/lore, prompt for Lore Protection and banned metaphors, setup `Matriz_PreVuelo.md`.
     - If **Marketing**: configure Amazon KDP limits (4,000 bytes, HTML whitelist) and 2-line hook constraints.
     - If **Web**: configure microcopy and hero section standards.
  3. Generate local `smooth-prose.config.json`.

### Mode 1: Edit Mode (`smooth-core edit <text>` or default)
* Applies the **Minimum Effective Change**: fixes slop patterns, awkward syntax, and fluff while leaving sharp, human phrasing untouched.
* Preserves numbers, technical terms, and factual claims without tampering.
* Outputs the refined text followed by a concise `## Changes Applied` summary highlighting only substantive structural edits.

### Mode 2: Audit & Detect Mode (`smooth-core audit <text>`)
* Performs a non-destructive forensic audit.
* Highlights exact offending snippets, classifies the pattern (Binary Contrast, Throat-Clearing, Faux-Profundity, Passive Abstraction), and provides a 1-sentence deterministic fix.
* Does not rewrite the text automatically.

---

## 2. Core Heuristics & Verification Checklist

When evaluating or generating prose under `smooth-core`:

1. **Binary Contrast Check:** Scan for (`«no X, sino Y»`), (`«not because X, but because Y»`). Rewrite with direct assertion.
2. **Throat-Clearing Check:** Strip opening rhetorical filler (`«Hablemos de...»`, `«Seamos honestos:»`, `«Let's dive in»`).
3. **Portability Test:** If a paragraph could appear word-for-word in an unrelated competitor's blog, replace vague assertions with concrete specifics.
4. **Factual Integrity:** Dates, prices, benchmark results, and quotes must remain unaltered.
5. **Cadence Variation:** Mix short, punchy declarative statements with structured explanatory sentences. Break monotonous sentence length.

---

## 3. Example Transformations

### Example A: Throat-Clearing + Binary Contrast
* ❌ `Let's be clear: the real bottleneck in modern engineering is not a lack of tools. It's the inability to coordinate distributed teams.`
* ✅ `The primary bottleneck in modern engineering stems from coordination friction across distributed teams.`
* ❌ `Seamos claros: el verdadero cuello de botella de la ingeniería moderna no es la falta de herramientas. Es la incapacidad de coordinar equipos distribuidos.`
* ✅ `El cuello de botella de la ingeniería moderna radica en la falta de coordinación entre equipos distribuidos.`

### Example B: Abstract Nominalization + Corporate Jargon
* ❌ `This platform empowers organizations to navigate the complex data landscape and unlock unprecedented synergies.`
* ✅ `The platform indexes telemetry streams across clusters to query latency regressions in seconds.`
- ❌ `Esta plataforma permite a las organizaciones navegar el complejo panorama de datos para desbloquear sinergias sin precedentes.`
- ✅ `La plataforma centraliza métricas de múltiples fuentes para auditar tiempos de respuesta en segundos.`

---

## 4. Progressive Disclosure References (Load On-Demand Only)

When performing specialized editorial passes, read the relevant reference inside `./references/`:
- [Seven-Sweep Copy Editing](./references/seven-sweep-copy-editing.md) & [Plain-English Alternatives](./references/plain-english-alternatives.md): Message-level clarity, voice/tone, "so what", proof, and specificity sweeps.
- [Proofreading Mechanics (ES/EN)](./references/proofreading-mechanics.md): Surface-level punctuation, grammar, capitalization, and Spanish/English typographic rules.
- [Paragraph Structure & Segmentation](./references/paragraph-structure.md): Determining when a multi-sentence block requires a paragraph break.
- [Burstiness & Fact-Shielded Humanization](./references/burstiness-humanizer.md): Sentence-length variation, Flesch 60–70 readability, and strict immutability of proper nouns, numbers, and dates.
