---
name: text-humanizer
description: "Rewrites AI-generated or robotic-sounding text into natural human prose: increases sentence-length variation (burstiness), cuts cliché AI vocabulary (ES/EN), restores active voice, targets Flesch readability 60-70. Treats every proper name, number, date, quote, brand, command and product token in the source as immutable (grounding/fact-shielding) and flags unsupported claims instead of inventing replacements. Two modes: Balanced (default, for formal/technical prose) and Intense (opt-in, creative/brand-voice writing). For product UI copy, run smooth-web first; use this reference for general marketing prose, blog posts, emails, or explicit humanization requests."
---

# 🧬 Text Humanizer

## 🎯 Objective
Erase the statistical fingerprint of LLM output (homogeneous sentence length, low perplexity, corporate cliché vocabulary, weak transitions, passive voice) while every fact, name, number, date, quote, brand and technical parameter of the source stays exactly as written. The style changes; the substance does not.

## 🔀 When to Use This Reference
- **Product UI copy** (buttons, modals, notifications, command responses, empty states): run `smooth-web` first. It already carries interface rules and the workspace's own voice from `smooth-prose.config.json`.
- **Marketing, guides and external text** (blog articles, case studies, comparison pages, founder emails, or explicit "humanize this" / "make it sound human" requests): use this reference.

## 🔒 Non-Negotiable Rule: Grounding (Fact-Shielding)
Before rewriting, extract and lock down every **protected token** from the source:
- **Commands, handles and syntax**: slash commands, CLI flags, mentions (`@user`, `#channel`), placeholders, code identifiers.
- **Numerical specifications**: durations, percentages, limits, prices, version numbers, retention or privacy guarantees.
- **Brand and character names**: the product, its mascot or characters, partner platforms and technologies. Load the list from the workspace's `smooth-prose.config.json` (protected entities) when it exists.
- **Direct quotes, statistics and dates**.

These are immutable in **both modes**: never delete, rephrase or substitute them. If an original sentence asserts a capability not found in the codebase or docs, do not launder it into smooth human prose; append `[verify source]` instead.

## 🎛️ Two Modes

### Balanced Mode (default)
For documentation, technical release notes, onboarding guides and B2B emails.
- Varies sentence length (burstiness).
- Cuts robotic vocabulary and corporate filler.
- Converts passive voice to active voice.
- Targets Flesch reading ease 60–70.
- Preserves the professional engineering register.

### Intense Mode (opt-in, marketing narrative and brand storytelling only)
Only when the user asks for it, or for founder origin stories, brand narrative and creative case studies.
- Breaks predictable, inoffensive AI cadence.
- Drops two-sided hedging ("while some may argue...").
- Grounds descriptions in tangible sensory friction (the awkward silence when someone talks on mute, frantic tab switching during a demo, 45 minutes lost to a minor code style debate).
- Uses asymmetric punctuation and conversational transitions.
- *Strict limitation*: never apply Intense Mode to UI copy or technical specs; those stay in Balanced Mode.

## 📊 Metrics (Applied as Judgment)
| Metric | Target | How to Act on It |
|---|---|---|
| **Burstiness** | Dynamic sentence variation | If every sentence sits between 15 and 25 words, break at least one under 6 words. Follow a short punchy sentence with a longer descriptive clause. |
| **Perplexity** | Unpredictable, natural phrasing | Replace stock LLM collocations ("significantly optimize", "streamline your workflow") with concrete verbs tied to the product ("stop standups from dragging past 15 minutes"). |
| **Readability** | Flesch ease ~60–70 | Keep sentences easy to parse for a reader skimming a feed, an inbox or quick documentation. |

## ⛔ Cliché Lexicon

### English Banned Terms
| AI Cliché | Human Alternative |
|---|---|
| delve into | look at, explore, examine |
| empower teams | give teams, let developers |
| seamlessly integrate | works with, connects to |
| robust solution | reliable tool, solid system |
| revolutionize (meetings, workflows) | the concrete result: finish calls on time, cut review time |
| testament to | shows, proves |
| in today's fast-paced world | today |
| game changer | practical fix, major improvement |

### Spanish Banned Terms
| Cliché IA | Reemplazo Humano |
|---|---|
| aprovechar | usar, exprimir, utilizar |
| sumergirse en | ver, revisar, entrar en |
| facilitar | permitir, ayudar, dar |
| iniciativa estratégica | proyecto, plan, objetivo |
| partes interesadas | equipo, clientes, participantes |
| en la era digital | hoy |
| es importante destacar | directo al punto sin preámbulos |

## 🔁 Voice: Active Over Passive
- *Passive AI*: "Time overruns are prevented by the automated notifications."
- *Active Human*: "The app pings the speaker before the timebox runs out."
- *Passive ES*: "Una mejor cadencia de reunión es facilitada por la división en módulos..."
- *Active ES*: "Dividir la reunión en módulos mantiene al equipo enfocado..."

## ✅ Post-Edit Verification
1. All protected tokens (commands, numbers, handles, names, guarantees) remain intact and unaltered.
2. Cliché buzzwords have been purged.
3. Sentence length varies visibly across paragraphs.
4. No new factual claims or unsupported features were invented.
5. Return the humanized draft with a brief **What Changed** summary.
