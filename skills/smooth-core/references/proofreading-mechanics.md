---
name: proofreading
description: "When the user wants a mechanical grammar/punctuation/spelling pass on finished copy (not a rewrite) in Spanish or English. Also use when the user says 'revisa la puntuación,' 'proofread this,' 'corrige gramática,' or 'chequeo mecánico.' Surface-level error correction only. It runs after the Seven Sweeps (message level) and the smooth-core pattern pass, and replaces neither."
metadata:
  version: 1.0.0
---

*Adapted from the `proofreader` skill of [xcrrr/claude-skills](https://github.com/xcrrr/claude-skills)
(MIT, Copyright (c) 2026 Adam Parszewski; see `THIRD_PARTY_NOTICES.md`). The source is English-only
(Oxford comma, apostrophes, etc.). This version keeps its scope, process and output format and adds the
Spanish rule next to each English one.*

# Proofreading

Surface-level error correction for finished copy. Grammar, spelling, punctuation, style
consistency, tone matching — never restructuring, never rewriting for message or persuasion.

## Scope — what this is and isn't

**Use for:** a final mechanical pass before publishing — the copy's message and structure are
already settled (by the user, by the Seven Sweeps in `seven-sweep-copy-editing.md`, or by the
smooth-core pattern pass).

**Do not use for:** a rough draft that still needs restructuring, or as a substitute for the
smooth-core pattern pass (banned words, AI-sounding patterns) or the Seven Sweeps (message-level
clarity, tone, specificity). Those run first; this runs last, right before the copy ships.

## Before starting

Confirm the language of the draft and which surfaces use which language. Spanish and English have
different rule sets below. Read the locale rules from the workspace's `smooth-prose.config.json`
(and `AGENTS.md` / `docs/BRAND.md` if present): some products keep UI copy in one language only.

For Spanish copy, confirm the register the workspace sets (**tuteo** or **voseo**) and check every
imperative and present-tense verb against it. Register is a conjugation issue as much as a tone one,
so it belongs in this pass too.

## Main focus areas

### Grammar

| English | Español |
|---|---|
| Subject-verb agreement | Concordancia sujeto-verbo (número y género) |
| Tense consistency | Consistencia de tiempo verbal (no mezclar presente/pretérito sin razón) |
| Dangling modifiers | Gerundios mal referenciados ("gerundio de posterioridad" — un error real y común) |
| Fragments / run-ons | Oraciones incompletas / oraciones fusionadas sin conector ni puntuación |
| — | Leísmo, laísmo, loísmo (uso incorrecto de le/la/lo como objeto) |
| — | Concordancia de tiempo entre cláusulas subordinadas |

### Punctuation

| English | Español |
|---|---|
| Oxford comma | La coma no se usa antes de "y"/"o" en enumeraciones (regla opuesta al inglés — error frecuente al traducir mentalmente) |
| Apostrophes (possessive/contraction) | No existen apóstrofes posesivos en español — revisar que no se haya calcado del inglés |
| Em/en dashes | Raya (—) para incisos, distinta del guion (-); en copy corto, evitarla del todo (regla de smooth-core) |
| Semicolons | Punto y coma: uso correcto para unir cláusulas relacionadas sin conjunción — ver "Coma vs. punto y coma vs. punto y seguido" abajo |
| Comma splices | Comas que unen dos oraciones independientes sin conjunción ni punto y coma |
| — | Signos de apertura obligatorios: ¿...? y ¡...! (nunca solo el de cierre) |
| — | Tildes: diacríticas (sí/si, más/mas, tú/tu, él/el) — omitirlas cambia el significado |
| — | Mayúscula después de dos puntos solo si introduce una cita textual o enumeración formal, no en uso general |

#### Coma vs. punto y coma vs. punto y seguido (RAE)

Cuando dos ideas están relacionadas, la [Ortografía de la RAE](https://www.rae.es/ortograf%C3%ADa/usos-del-punto-y-coma) y la
[duda lingüística oficial](https://www.rae.es/duda-linguistica/cuando-se-usa-el-punto-y-coma) dan una escala de tres
niveles según la fuerza del vínculo semántico entre las dos oraciones — no es una preferencia de estilo, es la regla:

1. **Coma** — el vínculo es casi de una sola idea (una es aclaración o ampliación directa de la otra dentro de la misma
   estructura). Ejemplo de la RAE: *"Lo hizo, lamentablemente."*
2. **Punto y coma** — las oraciones son sintácticamente independientes pero mantienen una relación semántica estrecha,
   normalmente de consecuencia inmediata. Ejemplo oficial de la RAE: *"Puede irse a casa; ya no hay nada más que
   hacer."* Señal para detectarlo: la segunda oración es casi el mismo acto de habla que la primera (una invitación,
   una orden, una consecuencia directa), no una idea nueva.
3. **Punto y seguido** — el vínculo se estima débil; cada oración tiene peso informativo propio, aunque compartan
   tema. Un pronombre o adjetivo demostrativo (*"eso", "esa", "esos", "por eso"*) al inicio de la oración siguiente es
   un mecanismo de cohesión (anáfora) **perfectamente válido con punto y seguido** — no obliga a usar punto y coma.
   Ejemplo: *"El capibara es conocido por no alterarse por nada. Esa calma es la idea detrás del
   nombre."* Son dos proposiciones distintas (un hecho zoológico, una decisión de nombre) enlazadas por
   "Esa", sin formar una sola idea partida en dos.

**El signo puede cambiar cuando cambia el contenido.** En *"Es un proyecto pequeño y las mismas manos que
escriben el código responden tus mensajes; escríbeme a hola@ejemplo.com."* el punto y coma es correcto: la
segunda cláusula es la invitación directa que se sigue de la primera, como en el ejemplo de la RAE. Si la
revisión añade un motivo (*"...responden tus mensajes. Si necesitas ayuda, escríbeme a hola@ejemplo.com."*),
la segunda oración gana peso informativo propio (una condición más una acción) y el signo correcto pasa a
ser punto y seguido. Decide primero si la oración dice lo que debe decir; la puntuación se ajusta después.

**Regla práctica:** antes de decidir el signo entre dos oraciones relacionadas, pregunta "¿la segunda es la
consecuencia o invitación inmediata de la primera, o una proposición con su propio peso informativo?". Lo
primero pide punto y coma; lo segundo, punto y seguido. La anáfora con "eso/esa" ya da cohesión sin
necesidad de un signo más fuerte.

### Commonly confused words

| English | Español |
|---|---|
| affect / effect | haber / a ver |
| its / it's | echo (de "echar") / hecho (de "hacer") |
| their / there / they're | halla (de "hallar") / haya (de "haber") / allá |
| that / which | porque / por qué / porqué / por que |
| who / whom | sino / si no |

## Process

1. Confirm language(s) and, for Spanish, the target register (tuteo or voseo) from the workspace config.
2. Read once for meaning — flag anything a mechanical pass would miss (that's out of scope,
   route back to the Seven Sweeps or the user).
3. Run one focused pass per category above (grammar, then punctuation, then confused words) —
   multiple narrow passes catch more than one pass trying to do everything at once.
4. For bilingual pairs, run the Spanish and English versions as two independent passes, not a
   translation-equivalence check.

## Output

Match what the user asked for:
- Corrected full text
- Marked-up original with inline notes (what changed and why, one line each)
- Bulleted error report only (no rewrite) — best when the user wants to fix it themselves

Always name the specific rule broken (e.g. "leísmo: 'le vi' → 'lo vi'"), not just "grammar
error" — the reason is what makes the correction checkable and the pattern avoidable next time.
