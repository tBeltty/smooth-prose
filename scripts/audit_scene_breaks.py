#!/usr/bin/env python3
"""
audit_scene_breaks.py - Auditor automático de saltos de escena y cortes ciegos.
Diseñado para uso agnóstico en cualquier proyecto literario o narrativa.
Soporta archivos .docx, .md, .txt y .json.
"""

import sys, re, os, argparse
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import i18n

LEXICON = i18n.load_heuristics("lexicon.json")
DINKUS_REGEX = re.compile(r'^(\*[\s\*]*\*|—[\s—]*—|⬥|•[\s•]*•|---|___)$')

STR = {
    "en": {
        "desc": "Scene-change and blind-cut auditor",
        "file_help": "Path of the file to audit (.docx, .md, .txt, .json)",
        "lang_help": "Rule/report language: auto|en|es|all",
        "missing": "Error: file not found: {f}",
        "title": "Scene Break Audit",
        "paras": "Total paragraphs analyzed",
        "found": "Total possible blind cuts detected",
        "between": "Between paragraph {a} and {b} [Confidence: {c}]:",
        "cause": "Cause: spatial or temporal opening detected («{m}»)",
        "end_a": "End of Scene A",
        "start_b": "Start of Scene B",
        "rec": "Recommendation: insert * * * (dinkus) and remove the indent in Scene B.",
        "high": "HIGH", "med": "MEDIUM",
    },
    "es": {
        "desc": "Auditor de cambios de escena y cortes ciegos",
        "file_help": "Ruta al archivo a auditar (.docx, .md, .txt, .json)",
        "lang_help": "Idioma de reglas e informe: auto|en|es|all",
        "missing": "Error: No se encontró el archivo {f}",
        "title": "Auditoría de Saltos de Escena",
        "paras": "Total de párrafos analizados",
        "found": "Total de posibles cortes ciegos detectados",
        "between": "Entre párrafo {a} y {b} [Confianza: {c}]:",
        "cause": "Causa: Apertura espacial o temporal detectada («{m}»)",
        "end_a": "Fin Escena A",
        "start_b": "Inicio Escena B",
        "rec": "Recomendación: Insertar * * * (dinkus) y suprimir sangría en Escena B.",
        "high": "ALTA", "med": "MEDIA",
    },
}


def scene_regex(rule_langs):
    patterns = [p for lg in rule_langs for p in LEXICON[lg]["scene_openers"]]
    return re.compile("|".join(f"(?:{p})" for p in patterns), re.IGNORECASE)

def extract_paragraphs(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    paragraphs = []
    if ext == ".docx":
        try:
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        except Exception:
            import zipfile, xml.etree.ElementTree as ET
            with zipfile.ZipFile(file_path) as z:
                tree = ET.fromstring(z.read('word/document.xml'))
                for p in tree.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
                    texts = [e.text for e in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if e.text]
                    joined = ''.join(texts).strip()
                    if joined:
                        paragraphs.append(joined)
    elif ext == ".json":
        import json
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, dict) and "chapters" in data:
                for c in data["chapters"]:
                    paragraphs.extend(c.get("paragraphs", []))
            elif isinstance(data, list):
                paragraphs = data
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            paragraphs = [line.strip() for line in f if line.strip()]

    return paragraphs

def audit_paragraphs(paragraphs, scene_re, high="HIGH", med="MEDIUM"):
    findings = []
    for i in range(len(paragraphs) - 1):
        curr_p = paragraphs[i].strip()
        next_p = paragraphs[i + 1].strip()

        if DINKUS_REGEX.match(curr_p) or DINKUS_REGEX.match(next_p):
            continue

        prev_is_dialogue = bool(re.search(r'[—–-]\s*$', curr_p) or curr_p.startswith('—') or curr_p.startswith('«'))
        match_opening = scene_re.search(next_p)

        if match_opening:
            confidence = high if prev_is_dialogue else med
            findings.append({
                "index": i + 1,
                "confidence": confidence,
                "match": match_opening.group(0),
                "prev_text": curr_p[-120:] if len(curr_p) > 120 else curr_p,
                "next_text": next_p[:120] if len(next_p) > 120 else next_p
            })
    return findings

def main():
    lang_opt, argv = i18n.pop_lang_arg(sys.argv[1:])
    ui_guess = i18n.system_lang()
    parser = argparse.ArgumentParser(description=STR[ui_guess]["desc"])
    parser.add_argument("file", help=STR[ui_guess]["file_help"])
    args = parser.parse_args(argv)

    if not os.path.exists(args.file):
        print(STR[ui_guess]["missing"].format(f=args.file))
        sys.exit(1)

    paragraphs = extract_paragraphs(args.file)
    rule_langs, ui = i18n.resolve(lang_opt, "\n".join(paragraphs))
    S = STR[ui]

    print(f"\n🔍 {S['title']}: {os.path.basename(args.file)}")
    print("=" * 65)
    print(f"{S['paras']}: {len(paragraphs)}")

    findings = audit_paragraphs(paragraphs, scene_regex(rule_langs), S["high"], S["med"])
    print(f"{S['found']}: {len(findings)}\n")

    for f in findings:
        print(f"   📍 {S['between'].format(a=f['index'], b=f['index'] + 1, c=f['confidence'])}")
        print(f"      {S['cause'].format(m=f['match'])}")
        print(f"      {S['end_a']}: «...{f['prev_text']}»")
        print(f"      {S['start_b']}: «{f['next_text']}...»")
        print(f"      👉 {S['rec']}\n")

    return 0 if len(findings) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
