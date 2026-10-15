#!/usr/bin/env python3
"""
audit_scene_breaks.py - Auditor automático de saltos de escena y cortes ciegos.
Diseñado para uso agnóstico en cualquier proyecto literario o narrativa.
Soporta archivos .docx, .md, .txt y .json.
"""

import sys, re, os, argparse

SCENE_START_PATTERNS = [
    r'^(Al otro lado|Lejos de all[ií]|En otra parte)',
    r'^(La comisar[ií]a|El refugio|El dep[oó]sito|El teatro|El mercado|El callej[oó]n|La guarida|El almac[eé]n|La torre|El muelle|Las cloacas|La habitaci[oó]n|La sala|El s[oó]tano)',
    r'^(En la comisar[ií]a|En el refugio|En el dep[oó]sito|En el teatro|En el mercado|En el muelle|En la habitaci[oó]n|En el despacho|En la cocina)',
    r'^(Horas m[aá]s tarde|Minutos despu[eé]s|Al caer la noche|Al anochecer|A la ma[ñn]ana siguiente|A medianoche|El d[ií]a siguiente|A la madrugada|Poco despu[eé]s)',
    r'^(Mientras tanto|Entretanto)',
    r'^(En una celda|En un rinc[oó]n|Bajo los escombros|Desde las alturas)'
]

SCENE_START_REGEX = re.compile('|'.join(SCENE_START_PATTERNS), re.IGNORECASE)
DINKUS_REGEX = re.compile(r'^(\*[\s\*]*\*|—[\s—]*—|⬥|•[\s•]*•|---|___)$')

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

def audit_paragraphs(paragraphs):
    findings = []
    for i in range(len(paragraphs) - 1):
        curr_p = paragraphs[i].strip()
        next_p = paragraphs[i + 1].strip()

        if DINKUS_REGEX.match(curr_p) or DINKUS_REGEX.match(next_p):
            continue

        prev_is_dialogue = bool(re.search(r'[—–-]\s*$', curr_p) or curr_p.startswith('—') or curr_p.startswith('«'))
        match_opening = SCENE_START_REGEX.search(next_p)

        if match_opening:
            confidence = "ALTA" if prev_is_dialogue else "MEDIA"
            findings.append({
                "index": i + 1,
                "confidence": confidence,
                "reason": f"Apertura espacial o temporal detectada («{match_opening.group(0)}»)",
                "prev_text": curr_p[-120:] if len(curr_p) > 120 else curr_p,
                "next_text": next_p[:120] if len(next_p) > 120 else next_p
            })
    return findings

def main():
    parser = argparse.ArgumentParser(description="Auditor de cambios de escena y cortes ciegos")
    parser.add_argument("file", help="Ruta al archivo a auditar (.docx, .md, .txt, .json)")
    args = parser.parse_args()

    if not os.path.exists(args.file):
        print(f"Error: No se encontró el archivo {args.file}")
        sys.exit(1)

    print(f"\n🔍 Auditoría de Saltos de Escena: {os.path.basename(args.file)}")
    print("=" * 65)

    paragraphs = extract_paragraphs(args.file)
    print(f"Total de párrafos analizados: {len(paragraphs)}")

    findings = audit_paragraphs(paragraphs)
    print(f"Total de posibles cortes ciegos detectados: {len(findings)}\n")

    for f in findings:
        print(f"   📍 Entre párrafo {f['index']} y {f['index']+1} [Confianza: {f['confidence']}]:")
        print(f"      Causa: {f['reason']}")
        print(f"      Fin Escena A: «...{f['prev_text']}»")
        print(f"      Inicio Escena B: «{f['next_text']}...»")
        print(f"      👉 Recomendación: Insertar * * * (dinkus) y suprimir sangría en Escena B.\n")

    return 0 if len(findings) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
