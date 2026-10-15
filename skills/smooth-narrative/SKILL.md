---
name: smooth-narrative
description: >-
  Contextual editorial skill for Fiction, Literary Prose, and Creative Writing. Governs sensory precision, dialogue orthotypography with RAE em-dashes (—), dinkus scene breaks (* * *), lexical quotas, and the eradication of recycled metaphors and hesitation markers.
---

# Smooth Narrative: Literary Prose Craft & Editorial Precision

Smooth Narrative ensures that literary fiction maintains sensory immediacy, character agency, and cinematic momentum, eradicating the passive, repetitive, and melodramatic patterns typical of synthetic storytelling.

---

## 1. Editorial Rules of Literary Craft

### 1.1. Eradication of Recycled Metaphors
* Never reuse stock analogies across scenes or chapters (*«agilidad de un espectro hambriento»*, *«tablero de ajedrez con múltiples jugadores»*, *«enredadera venenosa»*).
* Ground visual imagery in the tactile, physical environment of the scene (materials, temperatures, sounds, smells) rather than stock literary tropes.

### 1.2. Lexical Quotas & Moderation
Prevent vocabulary fatigue by enforcing strict quotas per scene/chapter:
* **`Sombra / Sombras`:** Maximum 2 mentions per chapter. Alternate with *penumbra, silueta, negrura, tinieblas, contorno*.
* **`Polvo / Polvoriento`:** Alternate with *hollín, ceniza, herrumbre, partículas flotantes, tierra seca*.
* **Atmospheric Clichés:** Never describe tension with inert abstractions (`«había tensión en el aire»`). Convey it through somatic, bodily responses (dryness in the throat, stiffened neck muscles, shallow breaths, tremor in the fingers).

### 1.3. Decalogue of Quiroga: Purge Hesitation Words (*Atenuadores*)
Purge weak modal qualifiers that sap authority from narrative actions:
* ❌ `El hierro parecía resistir el embate...`, `Quizás sintió un leve escalofrío...`, `Casi sin darse cuenta...`
* ✅ `El hierro resistió el embate.`, `Sintió un escalofrío.`, `Avanzó hacia la puerta.`
* State actions with direct declarative force.

### 1.4. Orthotypography of Dialogues (RAE Standard)
Dialogues in Spanish must strictly adhere to the Spanish Royal Academy (RAE) em-dash (`—`, Unicode `U+2014`) standard:
* **Opening:** The em-dash is glued directly to the first word of the speech without spaces:
  * `—No pienso volver —dijo Daniel—. Tenemos que seguir.`
* **Verbs of speech (*verba dicendi*):** If the narrator's tag uses a verb of speaking (*dijo, murmuró, replicó*), the incise begins in lowercase, and punctuation belongs after the second dash:
  * `—Abre la puerta —susurró ella—. Están afuera.`
* **No verb of speech:** If the tag describes an independent action rather than a verb of speech, the speech closes with a period, and the incise begins with a capital letter:
  * `—Ya es suficiente. —Dio un paso al frente y guardó el arma—. Nos vamos.`

### 1.5. Cinematic Scene Breaks (*Dinkus* Standard)
When dramatic space, time, or point-of-view shifts within a single chapter:
* **Never use blank empty line gaps:** They create "blind cuts" that confuse the reader.
* **Never start a new page:** New pages are reserved exclusively for new chapters.
* **Use the canonical typographic Dinkus:**
  ```markdown
  * * *
  ```
* **No-Indent Rule:** The paragraph immediately following a scene break begins **strictly without first-line paragraph indentation** (*no-indent*).

---

## 2. Pre-Flight Protocol & Lore Protection (Matriz de Pre-Vuelo)

Before drafting or editing any chapter, the assistant and author must enforce:
1. **Lore Protection Vector:** Verify that protected character names, factions, and canonical biology remain uncorrupted.
2. **Timeline Tracker Vector:** Establish exact temporal elapsed time ($T = X$ days). Prohibit contradictory relative time markers (*«aquella mañana»*).
3. **Deterministic Verification Scripts (Zero-AI):**
   * Run `smooth-prose audit <chapter.docx>` (`scripts/lexicon_audit.py`) to audit dialogue dashes, overused quotas, and Quiroga weakeners.
   * Run `smooth-prose scenes <chapter.docx>` (`scripts/audit_scene_breaks.py`) to catch blind scene cuts.

---

## 3. Narrative Slop Checklist

- [ ] Were binary contrast formulas removed (e.g. *"not out of cowardice, but out of prudence"* / *«no por cobardía, sino por prudencia»*)?
- [ ] Do dialogue lines use em-dashes (`—`) attached directly to the first character without spacing?
- [ ] Is narrative tension grounded in somatic physical reactions rather than abstract narrator assertions?
- [ ] Are mid-chapter scene transitions explicitly demarcated with a dinkus (`* * *`) followed by an unindented paragraph?
- [ ] Were recurring vocabulary quotas (*shadow*, *dust*) respected?
