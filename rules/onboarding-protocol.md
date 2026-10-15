# Onboarding & Conditional Calibration Protocol (Smooth Prose)

> **Agent Execution Rule:**
> This protocol is a **strictly sequential and conditional state machine**.
> **FORBIDDEN:** Anticipating or blending questions from secondary branches in Step 1. Step 2 executes exclusively based on the mode selected in Step 1.

---

## Step 1: Editorial Scope Diagnostic

The agent (or the CLI `smooth-prose init`) asks a single initial question with four mutually exclusive options:

**What is the editorial scope of this project?**
1. **Universal / All Copy:** Cross-cutting audit of any text in the repository (code comments, UI, docs, posts, emails).
2. **Literature / Narrative Fiction:** Novels, short stories, fiction with named characters, lexical quotas, and Lore Protection.
3. **Copywriting & Marketing:** Conversion copy, sales pages, Amazon KDP blurbs, social media hooks, and newsletters.
4. **Web Design & Interfaces:** UI/UX copy, button microcopy, modals, hero sections, and empty states.

---

## Step 2: Strict Conditional Branches

Once the user selects a mode in Step 1, the agent branches into that specific mode and **never references concepts from the other branches**.

---

### Branch 1: If "Universal / All Copy" was selected
* **Action:**
  * Do not ask about fictional characters, lore, or creative tropes.
  * Establish the core anti-slop directive as a transversal workspace guardrail.
  * Define the file patterns to audit (`**/*.md`, `**/*.html`, `**/*.txt`, etc.).
  * Generate `smooth-prose.config.json` with `mode: "universal"`.
* **User Response:**
  * Confirm active filters: zero binary contrasts, zero theatrical throat-clearing, portability test, and sentence cadence linter.
  * Offer to audit an existing file immediately or inspect a drafted snippet.

---

### Branch 2: If "Literature / Narrative Fiction" was selected
* **Action:**
  * Run **Lore Inspection**: scan `.docx`, `.md`, or `.txt` files in the workspace.
  * Identify candidate recurring proper nouns (characters, factions, locations).
* **User Interaction:**
  1. Present detected entities and request confirmation for **Lore Protection** (canonical entities the AI must never rename or mutate).
  2. Ask if any overused metaphors or analogies from previous chapters should be registered as banned.
* **Artifacts Generated:**
  * `smooth-prose.config.json` with `mode: "literature"`, `protected_entities`, `lexical_quotas` (*shadow*, *dust*, *refuge*), and RAE em-dash dialogue rules (`—`).
  * `Matriz_PreVuelo.md` with mandatory pre-writing vectors (timeline day tracker, quotas, and Quiroga weakener purges).

---

### Branch 3: If "Copywriting & Marketing" was selected
* **Action:**
  * Do not ask about fictional characters or literary lore.
  * Identify primary channels (Amazon KDP, social media, email, or sales landing pages).
* **Configuration Applied:**
  * For Amazon KDP: 4,000-character ceiling, 150–250 word sweet spot, and strict whitelist of 12 allowed HTML tags.
  * 2-line hook formula ($\le 40$ characters per line) free of manipulative clickbait.
  * Activate *Fact-Shielding* (protection of dates, prices, and metrics).
* **Artifacts Generated:**
  * `smooth-prose.config.json` with `mode: "marketing"`.

---

### Branch 4: If "Web Design & Interfaces" was selected
* **Action:**
  * Identify priority UI components (hero section, button labels, error alerts, empty states).
* **Configuration Applied:**
  * Hero Section: mandatory formula `[concrete mechanism] + [tangible outcome]` (banning empty slogans like *"empower your workflow"*).
  * Button Microcopy: verbs describing actual events (*"Download for macOS"* vs *"Discover the magic"*).
  * Non-blaming error messages with immediate resolution paths.
* **Artifacts Generated:**
  * `smooth-prose.config.json` with `mode: "web"`.
