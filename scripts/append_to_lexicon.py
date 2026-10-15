#!/usr/bin/env python3
"""
scripts/append_to_lexicon.py - Registro dinámico de analogías y metáforas por capítulo.
Diseñado para uso agnóstico en cualquier saga literaria o proyecto.
"""

import sys, os, json

def find_lexicon_registry():
    """Localiza el archivo de registro en el proyecto actual."""
    candidates = [
        "Registro_de_Analogias_Modismos_y_Frecuencia_Lexica.md",
        "Registro_de_Analogias_y_Metaforas.md",
        "LEXICON_REGISTRY.md",
        "ANALOGIAS_Y_LORE.md"
    ]
    for c in candidates:
        if os.path.exists(c):
            return c

    # Si no existe, revisar smooth-prose.config.json
    if os.path.exists("smooth-prose.config.json"):
        try:
            with open("smooth-prose.config.json", "r", encoding="utf-8") as f:
                cfg = json.load(f)
                custom = cfg.get("lore_protection", {}).get("registry_path")
                if custom and os.path.exists(custom):
                    return custom
        except Exception:
            pass

    # Por defecto crear Registro_de_Analogias_y_Metaforas.md
    default_name = "Registro_de_Analogias_y_Metaforas.md"
    if not os.path.exists(default_name):
        with open(default_name, "w", encoding="utf-8") as f:
            f.write("# Registro Canónico de Analogías, Metáforas y Frecuencia Léxica\n\n> Documento de protección de Lore para evitar reciclaje de figuras retóricas.\n\n## 1. Catálogo por Categorías\n")
    return default_name

def append_entry(chapter_num, category, entry):
    registry_path = find_lexicon_registry()
    with open(registry_path, "r", encoding="utf-8") as f:
        content = f.read()

    target_header = f"### {category}"
    entry_line = f"* **Cap. {chapter_num}**: {entry}"

    if target_header not in content:
        content += f"\n\n### {category}\n{entry_line}\n"
    else:
        pos = content.find(target_header) + len(target_header)
        content = content[:pos] + f"\n{entry_line}" + content[pos:]

    with open(registry_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✔ Añadida metáfora de Cap. {chapter_num} en [{category}] -> {registry_path}")
    return True

if __name__ == "__main__":
    if len(sys.argv) >= 4:
        ch_num = sys.argv[1]
        cat = sys.argv[2]
        text = " ".join(sys.argv[3:])
        append_entry(ch_num, cat, text)
    else:
        print("Uso: smooth-prose record <cap_num> <categoria> <metáfora o analogía>")
        print("Ejemplo: smooth-prose record 4 'Agilidad/Movimiento' 'Se deslizó como aceite negro en el adoquín'")
        print("Categorías habituales: Agilidad/Movimiento, Reacciones Físicas, Descripciones del Entorno, Fuerza/Impacto, Voz/Sonido, Atmósfera")
        sys.exit(1)
