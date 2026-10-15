#!/usr/bin/env python3
"""
scripts/init_project.py - Protocolo de Inicialización y Calibración Condicional para Smooth Prose.
Ejecuta una máquina de estados estrictamente secuencial y condicional:
  1. Selección de Dominio (Literatura, Marketing, Web, Universal).
  2. Ramas Condicionales Exclusivas:
     - Literatura  -> Escaneo e Inspección de Lore (personajes, cuotas léxicas, metáforas prohibidas) + Matriz_PreVuelo.md.
     - Marketing   -> Canales, KDP (4.000 car.), fórmulas de ganchos, fact-shielding.
     - Web         -> Microcopy UI, Hero standard, empty states.
     - Universal   -> Guardarraíl global omnidireccional para todo el copy del repositorio.
"""

import os, sys, json, re, argparse
from collections import Counter

def scan_existing_files(directory=".", extensions=(".md", ".txt", ".docx")):
    """Busca archivos de texto excluyendo carpetas de build/dependencias."""
    text_files = []
    for root, _, files in os.walk(directory):
        if any(skip in root for skip in [".git", "node_modules", "dist", ".cache", "venv", "__pycache__"]):
            continue
        for f in files:
            if f.endswith(extensions) and not f.startswith("."):
                text_files.append(os.path.join(root, f))
    return text_files

def extract_candidate_lore(files):
    """Extrae candidatos a nombres propios / personajes solo para modo literatura."""
    capitalized_words = Counter()
    stopwords = {"para", "como", "pero", "este", "esta", "estos", "estas", "todos", "todas", "cuando", "entre", "sobre", "desde", "hasta", "donde", "quien", "porque", "entonces", "después", "luego", "capítulo", "parte", "libro"}

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

def run_init(mode_override=None, non_interactive=False):
    print("\n" + "=" * 68)
    print("   🪶 SMOOTH PROSE: PROTOCOLO DE ONBOARDING Y CONFIGURACIÓN")
    print("=" * 68)

    # PASO 1: Diagnóstico de Dominio Principal
    if mode_override:
        mode = mode_override
    elif non_interactive:
        mode = "universal"
    else:
        print("\n[Paso 1/2] ¿Cuál es el alcance editorial de este proyecto?")
        print("  1) Universal / Todo el Copy (Auditar cualquier texto generado en el repositorio)")
        print("  2) Literatura / Ficción Narrativa (Novelas, relatos, lore y personajes)")
        print("  3) Copywriting & Marketing (Amazon KDP blurbs, ganchos, newsletters)")
        print("  4) Diseño Web & Producto (UI/UX copy, microcopy de interfaces, landings)")

        choice = input("\nSelecciona [1-4] (por defecto 1): ").strip() or "1"
        mode_map = {
            "1": "universal",
            "2": "literature",
            "3": "marketing",
            "4": "web"
        }
        mode = mode_map.get(choice, "universal")

    print(f"\n✔ Modo activado: {mode.upper()}")
    project_name = os.path.basename(os.path.abspath("."))

    config = {
        "$schema": "https://raw.githubusercontent.com/smooth-prose/smooth-prose/main/schema.json",
        "name": project_name,
        "mode": mode,
        "rules": {
            "ban_binary_contrast": True,
            "ban_throat_clearing": True,
            "enforce_portability_test": True,
            "minimum_effective_change": True,
            "show_dont_tell": True
        }
    }

    # PASO 2: Ramas Condicionales Estrictas (Zero filtrado entre modos)

    # --- RAMA A: UNIVERSAL (TODO EL COPY) ---
    if mode == "universal":
        print("\n[Paso 2/2: Modo Universal]")
        print("Configurando guardarraíles para auditar todo el copy del repositorio...")
        config["universal_scope"] = {
            "globs": ["**/*.md", "**/*.mdx", "**/*.html", "**/*.txt", "**/*.docx"],
            "cadence_check": True,
            "proximity_repetition_window": 120,
            "auto_lint_on_build": False
        }
        print("  ✔ Filtros activos: Zero contrastes binarios («no X, sino Y»), cero carraspeos, linter de cadencia.")

    # --- RAMA B: LITERATURA / FICCIÓN NARRATIVA ---
    elif mode == "literature":
        print("\n[Paso 2/2: Modo Literatura — Inspección de Lore y Estilo]")
        files = scan_existing_files(".", extensions=(".md", ".txt", ".docx"))
        print(f"  Analizando {len(files)} archivos existentes para detectar entidades de Lore...")

        detected_entities = extract_candidate_lore(files)
        protected_entities = []

        if detected_entities and not non_interactive:
            print("\n  Entidades y personajes detectados automáticamente:")
            for idx, ent in enumerate(detected_entities, 1):
                print(f"    {idx}. {ent}")
            ans = input("\n  ¿Confirmar estas entidades para 'Protección de Lore'? [S/n]: ").strip().lower()
            if ans in ["", "s", "si", "y", "yes"]:
                protected_entities = detected_entities
            else:
                custom = input("  Escribe las entidades protegidas separadas por coma: ").strip()
                protected_entities = [e.strip() for e in custom.split(",") if e.strip()]
        elif not non_interactive:
            custom = input("  Escribe los personajes o facciones protegidas (separados por coma): ").strip()
            if custom:
                protected_entities = [e.strip() for e in custom.split(",") if e.strip()]

        config["lore_protection"] = {
            "protected_entities": protected_entities,
            "banned_analogies": [],
            "lexical_quotas": {
                "sombra": { "max": 2, "alternatives": ["penumbra", "negrura", "silueta", "tinieblas"] },
                "sombras": { "max": 2, "alternatives": ["penumbras", "negruras", "siluetas"] },
                "polvo": { "max": 3, "alternatives": ["hollín", "herrumbre", "ceniza", "tierra seca"] },
                "refugio": { "max": 2, "alternatives": ["guarida", "bastión", "escondite"] }
            },
            "banned_lexicon": ["expolio", "catalizador", "alféizar", "omnipresente", "proclama"],
            "quirola_weakeners_strict": True,
            "rae_dialogue_em_dash": True
        }

        # Generar Matriz de Pre-Vuelo para literatura
        preflight_file = "Matriz_PreVuelo.md"
        with open(preflight_file, "w", encoding="utf-8") as pf:
            pf.write(generate_literature_matrix(project_name, protected_entities))
        print(f"  ✔ Matriz de Pre-Vuelo narrativa generada: {preflight_file}")

    # --- RAMA C: MARKETING & CONVERSIÓN ---
    elif mode == "marketing":
        print("\n[Paso 2/2: Modo Marketing — Canales y Conversión]")
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
        print("  ✔ Restricciones de Amazon KDP y ganchos de 2 líneas activadas.")

    # --- RAMA D: DISEÑO WEB & UI/UX ---
    elif mode == "web":
        print("\n[Paso 2/2: Modo Web — UI/UX Copy & Microcopy]")
        config["web_copy"] = {
            "hero_formula": "concrete_mechanism_plus_tangible_outcome",
            "button_cta_rule": "describe_actual_event_not_emotion",
            "prohibited_buzzwords": ["revolucionario", "eleva tu flujo", "potencial ilimitado", "experiencia definitiva"]
        }
        print("  ✔ Reglas de microcopy accionable y prohibición de eslóganes vacíos activadas.")

    # Guardar configuración local en el proyecto
    out_path = "smooth-prose.config.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)

    print(f"\n✔ Archivo de configuración generado: {out_path}")
    print("=" * 68)
    print("   ✅ ONBOARDING FINALIZADO CON ÉXITO")
    print("=" * 68)
    print("Comandos disponibles en este proyecto:")
    print("  smooth-prose audit <archivo>   -> Auditoría de léxico y reglas de proyecto")
    print("  smooth-prose lint <archivo>    -> Linter determinista de clichés y cadencia")
    if mode == "literature":
        print("  smooth-prose scenes <archivo>  -> Detección de cortes ciegos (dinkus * * *)")
        print("  smooth-prose record <cap> <cat> <texto> -> Registro de metáforas canónicas")
    print()

def generate_literature_matrix(project_name, entities):
    ent_str = ", ".join(entities) if entities else "Ninguna registrada inicialmente (actualizar con smooth-prose init)"
    return f"""# Matriz de Pre-Vuelo Narrativa (Smooth Prose)
> **Proyecto:** {project_name}
> **Modo:** Literatura / Ficción Narrativa
> **Guardarraíl:** Protección de Lore Activa

---

## 1. Entidades de Lore Protegidas
* **Lista Canónica:** {ent_str}
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
"""

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Inicializador de proyecto Smooth Prose")
    parser.add_argument("--mode", choices=["universal", "literature", "marketing", "web"], help="Modo editorial predefinido")
    parser.add_argument("--non-interactive", action="store_true", help="Modo sin preguntas interactivas")
    args = parser.parse_args()

    run_init(mode_override=args.mode, non_interactive=args.non_interactive)
