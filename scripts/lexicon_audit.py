#!/usr/bin/env python3
"""
lexicon_audit.py - Auditor literario determinista y anti-AI-slop.
Sanitizado para ser agnóstico de contexto, con soporte de 'Protección de Lore' vía smooth-prose.config.json.
Soporta archivos .docx, .md y .txt.
"""
import sys, re, os, json

# Valores predeterminados (estándar canónico)
DEFAULT_OVERUSED_TERMS = {
    "sombra": ["penumbra", "negrura", "silueta", "contorno", "oscuridad", "tinieblas"],
    "sombras": ["penumbras", "negruras", "siluetas", "tinieblas"],
    "polvo": ["hollín", "herrumbre", "ceniza", "partículas flotantes", "tierra seca", "pátina"],
    "polvoriento": ["enmohecido", "cubierto de ceniza", "gastado", "descolorido"],
    "aire": ["atmósfera", "ambiente", "brisa", "corriente", "humo", "éter"],
    "tensión": ["crispación", "rigidez", "silencio expectante", "fricción"],
    "refugio": ["guarida", "madriguera", "bastión", "escondite", "rincón seguro"],
}

DEFAULT_WEAKENERS = [
    "parecía", "parecían", "quizás", "quizá", "tal vez", "casi", "podría", "podrían", "como si fuera"
]

# 1. Patrones de contrastes binarios de IA (no X, sino Y)
BINARY_CONTRAST_PATTERNS = [
    (re.compile(r'\bno\s+[^.,;:—\n]+[,;—]?\s+sino\b', re.IGNORECASE), "no ... sino ..."),
    (re.compile(r'\bno\s+por\s+[^.,;:—\n]+[,;—]?\s+sino\b', re.IGNORECASE), "no por ... sino ..."),
    (re.compile(r'\bno\s+era\s+[^.,;:—\n]+[,;—]?\s+era\b', re.IGNORECASE), "no era ... era ..."),
    (re.compile(r'\bno\s+se\s+trata\s+de\b', re.IGNORECASE), "no se trata de ..."),
]

# 2. Léxico pretencioso, pedante o anacrónico (inconsistente con prosa viva y directa)
DEFAULT_PRETENTIOUS_OR_BANNED_LEXICON = [
    "expolio", "alféizar", "proclama", "omnipresente", "catalizador"
]

def load_project_config(start_dir="."):
    """Busca y carga smooth-prose.config.json en el árbol de directorios para protección de Lore."""
    curr = os.path.abspath(start_dir)
    while True:
        candidate = os.path.join(curr, "smooth-prose.config.json")
        if os.path.exists(candidate):
            try:
                with open(candidate, "r", encoding="utf-8") as f:
                    return json.load(f), candidate
            except Exception as e:
                print(f"Aviso: No se pudo leer {candidate}: {e}")
        parent = os.path.dirname(curr)
        if parent == curr:
            break
        curr = parent
    return None, None

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
            raw = f.read()
        # Eliminar bloques de código cercados preservando saltos de línea
        raw = re.sub(r'```[\s\S]*?```', lambda m: '\n' * m.group(0).count('\n'), raw)
        # Eliminar código en línea (backticks)
        raw = re.sub(r'`[^`\n]+`', lambda m: ' ' * len(m.group(0)), raw)
        return raw
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read()

def audit_text(text, source_name="Texto", config=None):
    print("=" * 65)
    print(f"=== AUDITORÍA LITERARIA Y ANTI-SLOP (SMOOTH PROSE): {source_name} ===")
    print("=" * 65)
    words = text.split()
    total_words = len(words)
    print(f"Total de palabras analizadas: {total_words}")
    has_errors = False

    # Configuración activa
    overused = dict(DEFAULT_OVERUSED_TERMS)
    weakeners = list(DEFAULT_WEAKENERS)
    banned_lexicon = list(DEFAULT_PRETENTIOUS_OR_BANNED_LEXICON)
    protected_entities = []
    banned_analogies = []

    if config and "lore_protection" in config:
        lore = config["lore_protection"]
        protected_entities = lore.get("protected_entities", [])
        banned_analogies = lore.get("banned_analogies", [])

        # Sobrescribir o añadir cuotas
        if "lexical_quotas" in lore:
            for k, v in lore["lexical_quotas"].items():
                if isinstance(v, list):
                    overused[k] = v
                elif isinstance(v, dict):
                    overused[k] = v.get("alternatives", [])

        if "banned_lexicon" in lore:
            banned_lexicon.extend(lore["banned_lexicon"])

    # 1. Overused terms check
    print("\n[1] Control de Términos Frecuentes (Cuota de Moderación):")
    text_lower = text.lower()
    for term, suggestions in overused.items():
        count = len(re.findall(r"\b" + re.escape(term) + r"\b", text_lower))
        status = "ALERTA" if count > 5 else "OK"
        alts = ", ".join(suggestions[:3]) if suggestions else "revisar contexto"
        print(f"  - {term:14}: {count:2d} usos [{status}] (Alternativas: {alts})")
        if count > 8:
            has_errors = True

    # 2. Weakeners check
    print("\n[2] Atenuadores de Certeza (Inseguridad Narrativa / Horacio Quiroga):")
    weak_found = []
    for w in weakeners:
        c = len(re.findall(r"\b" + re.escape(w) + r"\b", text_lower))
        if c > 0:
            weak_found.append((w, c))
    if weak_found:
        for w, c in weak_found:
            print(f"  - '{w}': {c} veces -> Evaluar sustitución por afirmación asertiva.")
    else:
        print("  Ningún atenuador excesivo detectado. Prosa firme y asertiva.")

    # 3. Ortotipografía de Diálogos
    print("\n[3] Revisión Ortotipográfica de Diálogos:")
    short_hyphen_dialogues = re.findall(r"^\s*-[^-\s]", text, re.MULTILINE)
    if short_hyphen_dialogues:
        print(f"  ERROR BLOQUEANTE: Se detectaron {len(short_hyphen_dialogues)} diálogos con guion corto (-). Debe usarse raya (—, U+2014).")
        has_errors = True
    else:
        print("  Correcto: No hay guiones cortos abriendo diálogos.")

    em_dashes = text.count("—")
    print(f"  Rayas tipográficas (—) detectadas: {em_dashes}")

    # 4. Auditoría Anti-AI Slop: Contrastes Binarios
    print("\n[4] Escaneo Anti-AI Slop (Contrastes Binarios Telegrafiados):")
    binary_matches = []
    for pat, label in BINARY_CONTRAST_PATTERNS:
        for m in pat.finditer(text):
            start = max(0, m.start() - 30)
            end = min(len(text), m.end() + 30)
            snip = text[start:end].replace('\n', ' ').strip()
            binary_matches.append((label, m.group(0), snip))

    if binary_matches:
        print(f"  ERROR BLOQUEANTE: Se detectaron {len(binary_matches)} contrastes binarios de IA:")
        for label, exact, snip in binary_matches:
            print(f"    * [{label}] -> \"...{snip}...\"")
        has_errors = True
    else:
        print("  Correcto: 0 contrastes binarios telegrafiados encontrados.")

    # 5. Auditoría Léxica: Palabras pretenciosas / Proscritas
    print("\n[5] Escaneo de Léxico Pretencioso / Proscrito:")
    pretentious_matches = []
    for term in set(banned_lexicon):
        c = len(re.findall(r"\b" + re.escape(term) + r"\b", text_lower))
        if c > 0:
            pretentious_matches.append((term, c))

    if pretentious_matches:
        print(f"  ERROR BLOQUEANTE: Se detectaron {len(pretentious_matches)} términos proscritos o pretenciosos:")
        for term, c in pretentious_matches:
            print(f"    * '{term}': {c} veces -> Proscrito por IA-slop o artificiosidad.")
        has_errors = True
    else:
        print("  Correcto: 0 términos proscritos detectados.")

    # 6. Protección de Lore: Metáforas Prohibidas / Analogías ya quemadas
    if banned_analogies:
        print("\n[6] Protección de Lore (Analogías y Metáforas Prohibidas/Quemadas):")
        analogy_hits = []
        for a in banned_analogies:
            if a.lower() in text_lower:
                analogy_hits.append(a)
        if analogy_hits:
            print(f"  ERROR BLOQUEANTE: Se detectaron {len(analogy_hits)} analogías ya gastadas del canon:")
            for a in analogy_hits:
                print(f"    * «{a}»")
            has_errors = True
        else:
            print(f"  Correcto: 0 metáforas quemadas encontradas (evaluadas {len(banned_analogies)} registradas).")

    # 7. Protección de Lore: Verificación de Entidades Canónicas
    if protected_entities:
        print("\n[7] Protección de Lore (Entidades y Personajes Canónicos):")
        detected = [e for e in protected_entities if re.search(r'\b' + re.escape(e) + r'\b', text, re.IGNORECASE)]
        print(f"  Entidades detectadas en el texto: {', '.join(detected) if detected else 'Ninguna de la lista registrada'}")

    print("\n" + "=" * 65)
    if has_errors:
        print("RESULTADO FINAL: RECHAZADO (Existen errores ortotipográficos, de Lore o de AI-slop).")
        return False
    else:
        print("RESULTADO FINAL: APROBADO (Cumple con rigor estilístico, editorial y de Lore).")
        return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        target = sys.argv[1]
        cfg, cfg_path = load_project_config(os.path.dirname(os.path.abspath(target)))
        if cfg_path:
            print(f"ℹ️  Cargada configuración de proyecto y Protección de Lore desde: {cfg_path}")
        text_content = extract_text_from_file(target)
        success = audit_text(text_content, source_name=os.path.basename(target), config=cfg)
        sys.exit(0 if success else 1)
    else:
        print("Uso: python3 lexicon_audit.py <archivo.docx|archivo.md|archivo.txt>")
        sys.exit(1)
