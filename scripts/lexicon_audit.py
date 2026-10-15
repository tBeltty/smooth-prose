#!/usr/bin/env python3
"""
lexicon_audit.py - Deterministic literary and anti-AI-slop auditor (EN | ES).
Context-agnostic, with 'Lore Protection' via smooth-prose.config.json.
Supports .docx, .md and .txt files.

Usage: lexicon_audit.py <file> [--lang auto|en|es|all]
The lexicons live in heuristics/lexicon.json. The report language follows the
document (or --lang / SMOOTH_PROSE_LANG).
"""
import sys, re, os, json
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import i18n

STR = {
    "en": {
        "title": "LITERARY & ANTI-SLOP AUDIT (SMOOTH PROSE)",
        "words": "Total words analyzed",
        "cfg_warn": "Warning: could not read {path}: {err}",
        "cfg_loaded": "Loaded project configuration and Lore Protection from: {path}",
        "s1": "[1] Frequent Terms Control (Moderation Quota):",
        "uses": "uses",
        "alts": "Alternatives",
        "review": "review context",
        "alert": "ALERT",
        "s2": "[2] Certainty Weakeners (Narrative Insecurity / Horacio Quiroga):",
        "weak_item": "  - '{w}': {c} times -> Consider a firm assertive statement.",
        "weak_none": "  No excessive weakeners detected. Firm, assertive prose.",
        "s3": "[3] Dialogue Orthotypography:",
        "dash_err": "  BLOCKING ERROR: {n} dialogue line(s) open with a short hyphen (-). Use the em-dash (—, U+2014).",
        "dash_ok": "  OK: no short hyphens opening dialogue.",
        "dash_count": "  Typographic em-dashes (—) found: {n}",
        "dash_na": "  Not applicable: the RAE em-dash convention applies to Spanish dialogue.",
        "s4": "[4] Anti-AI Slop Scan (Telegraphed Binary Contrasts):",
        "bin_err": "  BLOCKING ERROR: {n} AI binary contrast(s) found:",
        "bin_ok": "  OK: 0 telegraphed binary contrasts found.",
        "s5": "[5] Pretentious / Banned Lexicon Scan:",
        "ban_err": "  BLOCKING ERROR: {n} banned or pretentious term(s) found:",
        "ban_item": "    * '{t}': {c} times -> Banned as AI slop or artifice.",
        "ban_ok": "  OK: 0 banned terms found.",
        "s6": "[6] Lore Protection (Banned / Burnt Analogies and Metaphors):",
        "ana_err": "  BLOCKING ERROR: {n} already-spent canon analogy(ies) found:",
        "ana_ok": "  OK: 0 burnt metaphors found ({n} registered checked).",
        "s7": "[7] Lore Protection (Canonical Entities and Characters):",
        "ents": "  Entities found in the text: {e}",
        "ents_none": "none of the registered list",
        "bad": "FINAL RESULT: REJECTED (orthotypography, Lore or AI-slop errors found).",
        "good": "FINAL RESULT: APPROVED (meets stylistic, editorial and Lore rigor).",
        "usage": "Usage: python3 lexicon_audit.py <file.docx|file.md|file.txt> [--lang auto|en|es|all]",
    },
    "es": {
        "title": "AUDITORÍA LITERARIA Y ANTI-SLOP (SMOOTH PROSE)",
        "words": "Total de palabras analizadas",
        "cfg_warn": "Aviso: No se pudo leer {path}: {err}",
        "cfg_loaded": "Cargada configuración de proyecto y Protección de Lore desde: {path}",
        "s1": "[1] Control de Términos Frecuentes (Cuota de Moderación):",
        "uses": "usos",
        "alts": "Alternativas",
        "review": "revisar contexto",
        "alert": "ALERTA",
        "s2": "[2] Atenuadores de Certeza (Inseguridad Narrativa / Horacio Quiroga):",
        "weak_item": "  - '{w}': {c} veces -> Evaluar sustitución por afirmación asertiva.",
        "weak_none": "  Ningún atenuador excesivo detectado. Prosa firme y asertiva.",
        "s3": "[3] Revisión Ortotipográfica de Diálogos:",
        "dash_err": "  ERROR BLOQUEANTE: Se detectaron {n} diálogos con guion corto (-). Debe usarse raya (—, U+2014).",
        "dash_ok": "  Correcto: No hay guiones cortos abriendo diálogos.",
        "dash_count": "  Rayas tipográficas (—) detectadas: {n}",
        "dash_na": "  No aplica: la raya RAE es una convención del diálogo en español.",
        "s4": "[4] Escaneo Anti-AI Slop (Contrastes Binarios Telegrafiados):",
        "bin_err": "  ERROR BLOQUEANTE: Se detectaron {n} contrastes binarios de IA:",
        "bin_ok": "  Correcto: 0 contrastes binarios telegrafiados encontrados.",
        "s5": "[5] Escaneo de Léxico Pretencioso / Proscrito:",
        "ban_err": "  ERROR BLOQUEANTE: Se detectaron {n} términos proscritos o pretenciosos:",
        "ban_item": "    * '{t}': {c} veces -> Proscrito por IA-slop o artificiosidad.",
        "ban_ok": "  Correcto: 0 términos proscritos detectados.",
        "s6": "[6] Protección de Lore (Analogías y Metáforas Prohibidas/Quemadas):",
        "ana_err": "  ERROR BLOQUEANTE: Se detectaron {n} analogías ya gastadas del canon:",
        "ana_ok": "  Correcto: 0 metáforas quemadas encontradas (evaluadas {n} registradas).",
        "s7": "[7] Protección de Lore (Entidades y Personajes Canónicos):",
        "ents": "  Entidades detectadas en el texto: {e}",
        "ents_none": "Ninguna de la lista registrada",
        "bad": "RESULTADO FINAL: RECHAZADO (Existen errores ortotipográficos, de Lore o de AI-slop).",
        "good": "RESULTADO FINAL: APROBADO (Cumple con rigor estilístico, editorial y de Lore).",
        "usage": "Uso: python3 lexicon_audit.py <archivo.docx|archivo.md|archivo.txt> [--lang auto|en|es|all]",
    },
}

LEXICON = i18n.load_heuristics("lexicon.json")


def load_project_config(start_dir="."):
    """Searches the directory tree for smooth-prose.config.json (Lore Protection)."""
    curr = os.path.abspath(start_dir)
    while True:
        candidate = os.path.join(curr, "smooth-prose.config.json")
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    return json.load(f), candidate
            except Exception as e:
                print(f"Warning: could not read {candidate}: {e}", file=sys.stderr)
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        curr = parent
    return None, None


def strip_markdown(raw):
    """Blanks fenced code, inline code and <!-- smooth-lint-disable --> regions, preserving line breaks."""
    blank = lambda m: re.sub(r"[^\n]", " ", m.group(0))
    raw = re.sub(r"<!--\s*smooth-lint-disable\s*-->[\s\S]*?<!--\s*smooth-lint-enable\s*-->", blank, raw)
    raw = re.sub(r"```[\s\S]*?```", lambda m: "\n" * m.group(0).count("\n"), raw)
    raw = re.sub(r"`[^`\n]+`", lambda m: " " * len(m.group(0)), raw)
    return raw


def extract_text_from_file(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            return "\n".join([p.text for p in doc.paragraphs if p.text])
        except Exception:
            import zipfile, xml.etree.ElementTree as ET
            with zipfile.ZipFile(file_path) as z:
                tree = ET.fromstring(z.read('word/document.xml'))
                texts = [e.text for e in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if e.text]
                return "\n".join(texts)
    elif ext in [".md", ".markdown"]:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return strip_markdown(f.read())
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()


def audit_text(text, source_name="Text", config=None, lang_opt="auto"):
    rule_langs, ui = i18n.resolve(lang_opt, text)
    S = STR[ui]

    print("=" * 65)
    print(f"=== {S['title']}: {source_name} ===")
    print("=" * 65)
    print(f"{S['words']}: {len(text.split())}")
    has_errors = False

    # Active configuration (union of the selected languages)
    overused, weakeners, banned_lexicon, contrast = {}, [], [], []
    for lg in rule_langs:
        block = LEXICON[lg]
        overused.update({k: list(v) for k, v in block["overused"].items()})
        weakeners += block["weakeners"]
        banned_lexicon += block["banned"]
        contrast += [(re.compile(b["regex"], re.IGNORECASE), b["label"]) for b in block["binary_contrast"]]
    check_dashes = any(LEXICON[lg]["dialogue_em_dash"] for lg in rule_langs)
    protected_entities, banned_analogies = [], []

    if config and "lore_protection" in config:
        lore = config["lore_protection"]
        protected_entities = lore.get("protected_entities", [])
        banned_analogies = lore.get("banned_analogies", [])
        if "lexical_quotas" in lore:
            for k, v in lore["lexical_quotas"].items():
                if isinstance(v, list):
                    overused[k] = v
                elif isinstance(v, dict):
                    overused[k] = v.get("alternatives", [])
        if "banned_lexicon" in lore:
            banned_lexicon.extend(lore["banned_lexicon"])

    text_lower = text.lower()

    # 1. Overused terms
    print(f"\n{S['s1']}")
    for term, suggestions in overused.items():
        count = len(re.findall(r"\b" + re.escape(term) + r"\b", text_lower))
        status = S["alert"] if count > 5 else "OK"
        alts = ", ".join(suggestions[:3]) if suggestions else S["review"]
        print(f"  - {term:14}: {count:2d} {S['uses']} [{status}] ({S['alts']}: {alts})")
        if count > 8:
            has_errors = True

    # 2. Weakeners
    print(f"\n{S['s2']}")
    weak_found = []
    for w in weakeners:
        c = len(re.findall(r"\b" + re.escape(w) + r"\b", text_lower))
        if c > 0:
            weak_found.append((w, c))
    if weak_found:
        for w, c in weak_found:
            print(S["weak_item"].format(w=w, c=c))
    else:
        print(S["weak_none"])

    # 3. Dialogue orthotypography (Spanish RAE em-dash)
    print(f"\n{S['s3']}")
    if check_dashes:
        short_hyphen_dialogues = re.findall(r"^\s*-[^-\s]", text, re.MULTILINE)
        if short_hyphen_dialogues:
            print(S["dash_err"].format(n=len(short_hyphen_dialogues)))
            has_errors = True
        else:
            print(S["dash_ok"])
        print(S["dash_count"].format(n=text.count("—")))
    else:
        print(S["dash_na"])

    # 4. Binary contrasts
    print(f"\n{S['s4']}")
    binary_matches = []
    for pat, label in contrast:
        for m in pat.finditer(text):
            start = max(0, m.start() - 30)
            end = min(len(text), m.end() + 30)
            snip = text[start:end].replace('\n', ' ').strip()
            binary_matches.append((label, m.group(0), snip))
    if binary_matches:
        print(S["bin_err"].format(n=len(binary_matches)))
        for label, exact, snip in binary_matches:
            print(f"    * [{label}] -> \"...{snip}...\"")
        has_errors = True
    else:
        print(S["bin_ok"])

    # 5. Pretentious / banned lexicon
    print(f"\n{S['s5']}")
    pretentious_matches = []
    for term in sorted(set(banned_lexicon)):
        c = len(re.findall(r"\b" + re.escape(term) + r"\b", text_lower))
        if c > 0:
            pretentious_matches.append((term, c))
    if pretentious_matches:
        print(S["ban_err"].format(n=len(pretentious_matches)))
        for term, c in pretentious_matches:
            print(S["ban_item"].format(t=term, c=c))
        has_errors = True
    else:
        print(S["ban_ok"])

    # 6. Lore protection: burnt analogies
    if banned_analogies:
        print(f"\n{S['s6']}")
        analogy_hits = [a for a in banned_analogies if a.lower() in text_lower]
        if analogy_hits:
            print(S["ana_err"].format(n=len(analogy_hits)))
            for a in analogy_hits:
                print(f"    * «{a}»")
            has_errors = True
        else:
            print(S["ana_ok"].format(n=len(banned_analogies)))

    # 7. Lore protection: canonical entities
    if protected_entities:
        print(f"\n{S['s7']}")
        detected = [e for e in protected_entities if re.search(r'\b' + re.escape(e) + r'\b', text, re.IGNORECASE)]
        print(S["ents"].format(e=", ".join(detected) if detected else S["ents_none"]))

    print("\n" + "=" * 65)
    if has_errors:
        print(S["bad"])
        return False
    print(S["good"])
    return True


if __name__ == "__main__":
    lang_opt, args = i18n.pop_lang_arg(sys.argv[1:])
    if args and os.path.exists(args[0]):
        target = args[0]
        cfg, cfg_path = load_project_config(os.path.dirname(os.path.abspath(target)))
        text_content = extract_text_from_file(target)
        if cfg_path:
            ui = i18n.resolve(lang_opt, text_content)[1]
            print(f"ℹ️  {STR[ui]['cfg_loaded'].format(path=cfg_path)}")
        success = audit_text(text_content, source_name=os.path.basename(target), config=cfg, lang_opt=lang_opt)
        sys.exit(0 if success else 1)
    else:
        print(STR[i18n.system_lang()]["usage"])
        sys.exit(1)
