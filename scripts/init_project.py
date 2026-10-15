#!/usr/bin/env python3
"""
scripts/init_project.py - Onboarding and conditional calibration protocol for Smooth Prose (EN | ES).
Runs a strictly sequential, conditional state machine:
  1. Domain selection (Literature, Marketing, Web, Universal).
  2. Exclusive conditional branches:
     - Literature  -> Lore inspection (characters, lexical quotas, banned metaphors) + pre-flight matrix.
     - Marketing   -> Channels, KDP (4,000 chars), hook formulas, fact-shielding.
     - Web         -> UI microcopy, Hero standard, empty states.
     - Universal   -> Global guardrail for all copy in the repository.
The interface language follows --lang, SMOOTH_PROSE_LANG or the system locale.
"""

import os, sys, json, re, argparse, shutil
from collections import Counter
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import i18n

LEXICON = i18n.load_heuristics("lexicon.json")
_UI = {"lang": "en"}

STR = {
    "en": {
        "desc": "Smooth Prose project initializer",
        "mode_help": "Preset editorial mode",
        "ni_help": "Run without interactive prompts",
        "lang_help": "Interface and defaults language: en|es",
        "banner": "🪶 SMOOTH PROSE: ONBOARDING AND CONFIGURATION PROTOCOL",
        "step1": "[Step 1/2] What is the editorial scope of this project?",
        "opt1": "  1) Universal / All Copy (audit any text generated in the repository)",
        "opt2": "  2) Literature / Narrative Fiction (novels, stories, lore and characters)",
        "opt3": "  3) Copywriting & Marketing (Amazon KDP blurbs, hooks, newsletters)",
        "opt4": "  4) Web Design & Product (UI/UX copy, interface microcopy, landing pages)",
        "select": "\nSelect [1-4] (default 1): ",
        "mode_on": "\n✔ Mode activated: {m}",
        "uni_h": "\n[Step 2/2: Universal Mode]",
        "uni_1": "Configuring guardrails to audit all copy in the repository...",
        "uni_2": "  ✔ Active filters: zero binary contrasts («not X, but Y»), zero throat-clearing, cadence linter.",
        "lit_h": "\n[Step 2/2: Literature Mode — Lore and Style Inspection]",
        "lit_scan": "  Analyzing {n} existing files to detect Lore entities...",
        "lit_found": "\n  Entities and characters detected automatically:",
        "lit_confirm": "\n  Confirm these entities for 'Lore Protection'? [Y/n]: ",
        "lit_yes": ["", "y", "yes", "s", "si", "sí"],
        "lit_custom": "  Type the protected entities separated by commas: ",
        "lit_custom2": "  Type the protected characters or factions (comma-separated): ",
        "lit_matrix": "  ✔ Narrative pre-flight matrix generated: {f}",
        "mkt_h": "\n[Step 2/2: Marketing Mode — Channels and Conversion]",
        "mkt_1": "  ✔ Amazon KDP restrictions and two-line hooks enabled.",
        "web_h": "\n[Step 2/2: Web Mode — UI/UX Copy & Microcopy]",
        "web_1": "  ✔ Actionable microcopy rules and empty-slogan ban enabled.",
        "saved": "\n✔ Configuration file generated: {f}",
        "done": "   ✅ ONBOARDING COMPLETED SUCCESSFULLY",
        "cmds": "Commands available in this project:",
        "c_audit": "  smooth-prose audit <file>   -> Lexicon and project-rule audit",
        "c_lint": "  smooth-prose lint <file>    -> Deterministic cliché and cadence linter",
        "c_scenes": "  smooth-prose scenes <file>  -> Blind-cut detection (dinkus * * *)",
        "c_record": "  smooth-prose record <ch> <cat> <text> -> Canonical metaphor registry",
        "no_entities": "None registered yet (update with smooth-prose init)",
        "eof": "No input available (stdin is closed). Run it in a terminal, or pass the mode explicitly:\n  smooth-prose init --mode universal|literature|marketing|web --non-interactive",
        "bad_choice": "  '{c}' is not an option. Enter 1, 2, 3 or 4 (or universal, literature, marketing, web).",
        "too_many": "Too many invalid answers. Run again, or pass --mode.",
        "exists": "\n⚠ {f} already exists.",
        "overwrite": "  Overwrite it? The current file is kept as {f}.bak [y/N]: ",
        "kept": "Nothing changed. Existing configuration kept.",
        "backup": "  Previous file saved as {f}.bak",
        "matrix": """# Narrative Pre-Flight Matrix (Smooth Prose)
> **Project:** {project}
> **Mode:** Literature / Narrative Fiction
> **Guardrail:** Lore Protection Active

---

## 1. Protected Lore Entities
* **Canonical list:** {entities}
* **Inviolable rule:** No collaborator or assistant may rename these entities, alter their species/nature, or reinterpret their core motivations.

---

## 2. Mandatory Pre-Writing Vectors

### A. Diegetic Timeline
* Fix the canonical day ($T = X$ days elapsed since the start).
* Wrong relative time references are forbidden (*"that morning"*).

### B. Lexical Quotas per Chapter
* `shadow / shadows`: at most 2 mentions per chapter.
* `dust`: alternate with *soot, rust, ash, floating particles*.
* `air / tension`: describe through bodily physiology (dryness, raised hairs, trembling), never with inert abstractions.

### C. Weakeners (Horacio Quiroga's Decalogue)
* Purge doubt verbs (*seemed, perhaps, almost*). Assert with direct force.

### D. Dialogue and Scene Orthotypography
* Dialogue formatting follows the project's language convention (Spanish: RAE em-dash `—` attached to the first letter).
* Scene breaks delimited with a **Dinkus** (`* * *`) and an unindented paragraph after.

### E. Zero AI Slop
* Absolute ban on binary contrasts (*"not X, but Y"*).
* Zero theatrical throat-clearing (*"Here's the thing"*).
""",
    },
    "es": {
        "desc": "Inicializador de proyecto Smooth Prose",
        "mode_help": "Modo editorial predefinido",
        "ni_help": "Modo sin preguntas interactivas",
        "lang_help": "Idioma de la interfaz y de los valores por defecto: en|es",
        "banner": "🪶 SMOOTH PROSE: PROTOCOLO DE ONBOARDING Y CONFIGURACIÓN",
        "step1": "[Paso 1/2] ¿Cuál es el alcance editorial de este proyecto?",
        "opt1": "  1) Universal / Todo el Copy (Auditar cualquier texto generado en el repositorio)",
        "opt2": "  2) Literatura / Ficción Narrativa (Novelas, relatos, lore y personajes)",
        "opt3": "  3) Copywriting & Marketing (Amazon KDP blurbs, ganchos, newsletters)",
        "opt4": "  4) Diseño Web & Producto (UI/UX copy, microcopy de interfaces, landings)",
        "select": "\nSelecciona [1-4] (por defecto 1): ",
        "mode_on": "\n✔ Modo activado: {m}",
        "uni_h": "\n[Paso 2/2: Modo Universal]",
        "uni_1": "Configurando guardarraíles para auditar todo el copy del repositorio...",
        "uni_2": "  ✔ Filtros activos: Zero contrastes binarios («no X, sino Y»), cero carraspeos, linter de cadencia.",
        "lit_h": "\n[Paso 2/2: Modo Literatura — Inspección de Lore y Estilo]",
        "lit_scan": "  Analizando {n} archivos existentes para detectar entidades de Lore...",
        "lit_found": "\n  Entidades y personajes detectados automáticamente:",
        "lit_confirm": "\n  ¿Confirmar estas entidades para 'Protección de Lore'? [S/n]: ",
        "lit_yes": ["", "s", "si", "sí", "y", "yes"],
        "lit_custom": "  Escribe las entidades protegidas separadas por coma: ",
        "lit_custom2": "  Escribe los personajes o facciones protegidas (separados por coma): ",
        "lit_matrix": "  ✔ Matriz de Pre-Vuelo narrativa generada: {f}",
        "mkt_h": "\n[Paso 2/2: Modo Marketing — Canales y Conversión]",
        "mkt_1": "  ✔ Restricciones de Amazon KDP y ganchos de 2 líneas activadas.",
        "web_h": "\n[Paso 2/2: Modo Web — UI/UX Copy & Microcopy]",
        "web_1": "  ✔ Reglas de microcopy accionable y prohibición de eslóganes vacíos activadas.",
        "saved": "\n✔ Archivo de configuración generado: {f}",
        "done": "   ✅ ONBOARDING FINALIZADO CON ÉXITO",
        "cmds": "Comandos disponibles en este proyecto:",
        "c_audit": "  smooth-prose audit <archivo>   -> Auditoría de léxico y reglas de proyecto",
        "c_lint": "  smooth-prose lint <archivo>    -> Linter determinista de clichés y cadencia",
        "c_scenes": "  smooth-prose scenes <archivo>  -> Detección de cortes ciegos (dinkus * * *)",
        "c_record": "  smooth-prose record <cap> <cat> <texto> -> Registro de metáforas canónicas",
        "no_entities": "Ninguna registrada inicialmente (actualizar con smooth-prose init)",
        "eof": "No hay entrada disponible (stdin está cerrado). Ejecútalo en una terminal o indica el modo:\n  smooth-prose init --mode universal|literature|marketing|web --non-interactive",
        "bad_choice": "  '{c}' no es una opción. Escribe 1, 2, 3 o 4 (o universal, literature, marketing, web).",
        "too_many": "Demasiadas respuestas inválidas. Vuelve a ejecutarlo o pasa --mode.",
        "exists": "\n⚠ {f} ya existe.",
        "overwrite": "  ¿Sobrescribirlo? El archivo actual se conserva como {f}.bak [s/N]: ",
        "kept": "No se cambió nada. Se conserva la configuración existente.",
        "backup": "  Archivo anterior guardado como {f}.bak",
        "matrix": """# Matriz de Pre-Vuelo Narrativa (Smooth Prose)
> **Proyecto:** {project}
> **Modo:** Literatura / Ficción Narrativa
> **Guardarraíl:** Protección de Lore Activa

---

## 1. Entidades de Lore Protegidas
* **Lista Canónica:** {entities}
* **Regla Inviolable:** Ningún colaborador o asistente puede renombrar, alterar la especie/naturaleza ni reinterpretar las motivaciones fundamentales de estas entidades.

---

## 2. Vectores Obligatorios Pre-Redacción

### A. Línea Temporal Diegética
* Fijar el día canónico ($T = X$ días transcurridos desde el inicio).
* Prohibidas referencias temporales relativas erróneas (*«aquella mañana»*).

### B. Cuotas Léxicas por Capítulo
* `sombra / sombras`: Máximo 2 menciones por capítulo.
* `polvo`: Alternar con *hollín, herrumbre, ceniza, partículas flotantes*.
* `aire / tensión`: Describir mediante fisiología corporal (sequedad, erizamiento del lomo, temblor), jamás con abstracciones inertes.

### C. Atenuadores (Decálogo de Horacio Quiroga)
* Purgar verbos de duda (*parecía, quizás, casi*). Afirmar con fuerza directa.

### D. Ortotipografía de Diálogos y Escenas
* Diálogos exclusivamente con raya RAE (`—`, U+2014) unida a la primera letra.
* Saltos de escena delimitados con **Dinkus** (`* * *`) y párrafo posterior sin sangría.

### E. Zero AI Slop
* Prohibición absoluta de contrastes binarios (*«no X, sino Y»*).
* Cero carraspeos teatrales (*«Aquí está el detalle»*).
""",
    },
}

# Language-specific defaults written to the generated config
DEFAULTS = {
    "en": {
        "quotas": {
            "shadow": {"max": 2, "alternatives": ["gloom", "silhouette", "darkness", "dusk"]},
            "shadows": {"max": 2, "alternatives": ["gloom", "silhouettes", "dusk"]},
            "dust": {"max": 3, "alternatives": ["soot", "rust", "ash", "dry earth"]},
            "refuge": {"max": 2, "alternatives": ["den", "bastion", "hideout"]},
        },
        "banned_lexicon": ["ubiquitous", "catalyst", "plethora", "myriad", "multifaceted"],
        "buzzwords": ["revolutionary", "take it to the next level", "unlimited potential", "ultimate experience"],
        "stopwords": {"this", "that", "these", "those", "when", "then", "after", "before", "chapter", "part", "book", "there", "their", "with", "from"},
    },
    "es": {
        "quotas": {
            "sombra": {"max": 2, "alternatives": ["penumbra", "negrura", "silueta", "tinieblas"]},
            "sombras": {"max": 2, "alternatives": ["penumbras", "negruras", "siluetas"]},
            "polvo": {"max": 3, "alternatives": ["hollín", "herrumbre", "ceniza", "tierra seca"]},
            "refugio": {"max": 2, "alternatives": ["guarida", "bastión", "escondite"]},
        },
        "banned_lexicon": ["expolio", "catalizador", "alféizar", "omnipresente", "proclama"],
        "buzzwords": ["revolucionario", "eleva tu flujo", "potencial ilimitado", "experiencia definitiva"],
        "stopwords": {"para", "como", "pero", "este", "esta", "estos", "estas", "todos", "todas", "cuando", "entre", "sobre", "desde", "hasta", "donde", "quien", "porque", "entonces", "después", "luego", "capítulo", "parte", "libro"},
    },
}


MODE_NAMES = {"1": "universal", "2": "literature", "3": "marketing", "4": "web",
              "universal": "universal", "literature": "literature", "literatura": "literature",
              "marketing": "marketing", "web": "web"}


def ask(prompt, default=None):
    """input() that never raises on a closed stdin: returns the default, or exits with a clear message."""
    try:
        return input(prompt)
    except EOFError:
        if default is None:
            print("\n" + STR[_UI["lang"]]["eof"], file=sys.stderr)
            sys.exit(2)
        print()
        return default


def choose_mode(S):
    for _ in range(3):
        print(f"\n{S['step1']}")
        for k in ("opt1", "opt2", "opt3", "opt4"):
            print(S[k])
        raw = ask(S["select"]).strip().lower() or "1"
        if raw in MODE_NAMES:
            return MODE_NAMES[raw]
        print(S["bad_choice"].format(c=raw))
    print(S["too_many"], file=sys.stderr)
    sys.exit(2)


def write_safely(path, content, S, interactive):
    """Writes a file; if it exists, asks (interactive) and always keeps the previous one as <file>.bak."""
    if os.path.exists(path):
        if interactive:
            print(S["exists"].format(f=path))
            if ask(S["overwrite"].format(f=path), default="n").strip().lower() not in S["lit_yes"][1:]:
                print(S["kept"])
                return False
        shutil.copy2(path, path + ".bak")
        print(S["backup"].format(f=path))
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return True



def scan_existing_files(directory=".", extensions=(".md", ".txt", ".docx")):
    """Finds text files, skipping build/dependency folders."""
    text_files = []
    for root, _, files in os.walk(directory):
        if any(skip in root for skip in [".git", "node_modules", "dist", ".cache", "venv", "__pycache__"]):
            continue
        for f in files:
            if f.endswith(extensions) and not f.startswith("."):
                text_files.append(os.path.join(root, f))
    return text_files


def extract_candidate_lore(files, lang):
    """Extracts proper-name / character candidates (literature mode only)."""
    capitalized_words = Counter()
    stopwords = DEFAULTS["es"]["stopwords"] | DEFAULTS["en"]["stopwords"] if lang == "all" else DEFAULTS[lang]["stopwords"]

    for fpath in files[:12]:
        try:
            content = ""
            if fpath.endswith(".docx"):
                try:
                    import zipfile, xml.etree.ElementTree as ET
                    with zipfile.ZipFile(fpath) as z:
                        tree = ET.fromstring(z.read('word/document.xml'))
                        texts = [e.text for e in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if e.text]
                        content = " ".join(texts)
                except Exception:
                    continue
            else:
                with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()

            caps = re.findall(r'\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]{3,}\b', content)
            for c in caps:
                if c.lower() not in stopwords:
                    capitalized_words[c] += 1
        except Exception:
            continue

    return [word for word, count in capitalized_words.most_common(15) if count >= 2]


def generate_literature_matrix(project_name, entities, lang):
    S = STR[lang]
    ent_str = ", ".join(entities) if entities else S["no_entities"]
    return S["matrix"].format(project=project_name, entities=ent_str)


def run_init(mode_override=None, non_interactive=False, lang="en"):
    S, D = STR[lang], DEFAULTS[lang]
    _UI["lang"] = lang
    interactive = not non_interactive and not mode_override
    print("\n" + "=" * 68)
    print(f"   {S['banner']}")
    print("=" * 68)

    # STEP 1: primary domain
    if mode_override:
        mode = mode_override
    elif non_interactive:
        mode = "universal"
    else:
        mode = choose_mode(S)

    print(S["mode_on"].format(m=mode.upper()))
    project_name = os.path.basename(os.path.abspath("."))

    config = {
        "name": project_name,
        "mode": mode,
        "language": lang,
        "rules": {
            "ban_binary_contrast": True,
            "ban_throat_clearing": True,
            "enforce_portability_test": True,
            "minimum_effective_change": True,
            "show_dont_tell": True
        }
    }

    # STEP 2: strict conditional branches (no leakage between modes)
    if mode == "universal":
        print(S["uni_h"])
        print(S["uni_1"])
        config["universal_scope"] = {
            "globs": ["**/*.md", "**/*.mdx", "**/*.html", "**/*.txt", "**/*.docx"],
            "cadence_check": True,
            "proximity_repetition_window": 120,
            "auto_lint_on_build": False
        }
        print(S["uni_2"])

    elif mode == "literature":
        print(S["lit_h"])
        files = scan_existing_files(".", extensions=(".md", ".txt", ".docx"))
        print(S["lit_scan"].format(n=len(files)))

        detected_entities = extract_candidate_lore(files, lang)
        protected_entities = []

        if detected_entities and not non_interactive:
            print(S["lit_found"])
            for idx, ent in enumerate(detected_entities, 1):
                print(f"    {idx}. {ent}")
            ans = ask(S["lit_confirm"], default="").strip().lower()
            if ans in S["lit_yes"]:
                protected_entities = detected_entities
            else:
                custom = ask(S["lit_custom"], default="").strip()
                protected_entities = [e.strip() for e in custom.split(",") if e.strip()]
        elif not non_interactive:
            custom = ask(S["lit_custom2"], default="").strip()
            if custom:
                protected_entities = [e.strip() for e in custom.split(",") if e.strip()]

        config["lore_protection"] = {
            "protected_entities": protected_entities,
            "banned_analogies": [],
            "lexical_quotas": D["quotas"],
            "banned_lexicon": D["banned_lexicon"],
            "quirola_weakeners_strict": True,
            "rae_dialogue_em_dash": lang == "es"
        }

        preflight_file = "Matriz_PreVuelo.md"
        if write_safely(preflight_file, generate_literature_matrix(project_name, protected_entities, lang), S, interactive):
            print(S["lit_matrix"].format(f=preflight_file))

    elif mode == "marketing":
        print(S["mkt_h"])
        config["marketing"] = {
            "amazon_kdp": {
                "enforce_byte_limit": 4000,
                "optimal_words": [150, 250],
                "allowed_html": ["b", "strong", "i", "em", "u", "p", "br", "h4", "h5", "h6", "ul", "ol", "li"]
            },
            "hooks": {
                "max_line_length": 40,
                "prohibit_clickbait_formulas": True
            },
            "fact_shielding": True
        }
        print(S["mkt_1"])

    elif mode == "web":
        print(S["web_h"])
        config["web_copy"] = {
            "hero_formula": "concrete_mechanism_plus_tangible_outcome",
            "button_cta_rule": "describe_actual_event_not_emotion",
            "prohibited_buzzwords": D["buzzwords"]
        }
        print(S["web_1"])

    out_path = "smooth-prose.config.json"
    if not write_safely(out_path, json.dumps(config, indent=2, ensure_ascii=False), S, interactive):
        return 0

    print(S["saved"].format(f=out_path))
    print("=" * 68)
    print(S["done"])
    print("=" * 68)
    print(S["cmds"])
    print(S["c_audit"])
    print(S["c_lint"])
    if mode == "literature":
        print(S["c_scenes"])
        print(S["c_record"])
    print()
    return 0


if __name__ == "__main__":
    lang_opt, argv = i18n.pop_lang_arg(sys.argv[1:])
    ui = lang_opt if lang_opt in i18n.LANGS else i18n.system_lang()
    parser = argparse.ArgumentParser(description=STR[ui]["desc"])
    parser.add_argument("--mode", choices=["universal", "literature", "marketing", "web"], help=STR[ui]["mode_help"])
    parser.add_argument("--non-interactive", action="store_true", help=STR[ui]["ni_help"])
    args = parser.parse_args(argv)

    sys.exit(run_init(mode_override=args.mode, non_interactive=args.non_interactive, lang=ui))
