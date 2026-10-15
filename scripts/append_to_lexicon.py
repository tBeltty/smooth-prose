#!/usr/bin/env python3
"""
scripts/append_to_lexicon.py - Registro dinámico de analogías y metáforas por capítulo.
Diseñado para uso agnóstico en cualquier saga literaria o proyecto.
"""

import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.realpath(__file__)))
import i18n

STR = {
    "en": {
        "header": "# Canonical Registry of Analogies, Metaphors and Lexical Frequency\n\n> Lore-protection document that prevents recycled figures of speech.\n\n## 1. Catalog by Category\n",
        "chapter": "Ch.",
        "added": "✔ Added metaphor from Ch. {ch} under [{cat}] -> {path}",
        "usage": "Usage: smooth-prose record <chapter_num> <category> <metaphor or analogy>",
        "example": "Example: smooth-prose record 4 'Agility/Movement' 'Slid like black oil across the cobbles'",
        "cats": "Common categories: Agility/Movement, Physical Reactions, Setting Descriptions, Force/Impact, Voice/Sound, Atmosphere",
        "default_name": "Analogy_and_Metaphor_Registry.md",
    },
    "es": {
        "header": "# Registro Canónico de Analogías, Metáforas y Frecuencia Léxica\n\n> Documento de protección de Lore para evitar reciclaje de figuras retóricas.\n\n## 1. Catálogo por Categorías\n",
        "chapter": "Cap.",
        "added": "✔ Añadida metáfora de Cap. {ch} en [{cat}] -> {path}",
        "usage": "Uso: smooth-prose record <cap_num> <categoria> <metáfora o analogía>",
        "example": "Ejemplo: smooth-prose record 4 'Agilidad/Movimiento' 'Se deslizó como aceite negro en el adoquín'",
        "cats": "Categorías habituales: Agilidad/Movimiento, Reacciones Físicas, Descripciones del Entorno, Fuerza/Impacto, Voz/Sonido, Atmósfera",
        "default_name": "Registro_de_Analogias_y_Metaforas.md",
    },
}

def find_lexicon_registry(lang="en"):
    """Localiza el archivo de registro en el proyecto actual."""
    candidates = [
        "Registro_de_Analogias_Modismos_y_Frecuencia_Lexica.md",
        "Registro_de_Analogias_y_Metaforas.md",
        "Analogy_and_Metaphor_Registry.md",
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
    default_name = STR[lang]["default_name"]
    if not os.path.exists(default_name):
        with open(default_name, "w", encoding="utf-8") as f:
            f.write(STR[lang]["header"])
    return default_name

def append_entry(chapter_num, category, entry, lang="en"):
    registry_path = find_lexicon_registry(lang)
    with open(registry_path, "r", encoding="utf-8") as f:
        content = f.read()

    target_header = f"### {category}"
    entry_line = f"* **{STR[lang]['chapter']} {chapter_num}**: {entry}"

    if target_header not in content:
        content += f"\n\n### {category}\n{entry_line}\n"
    else:
        pos = content.find(target_header) + len(target_header)
        content = content[:pos] + f"\n{entry_line}" + content[pos:]

    with open(registry_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(STR[lang]["added"].format(ch=chapter_num, cat=category, path=registry_path))
    return True

if __name__ == "__main__":
    lang_opt, argv = i18n.pop_lang_arg(sys.argv[1:])
    ui = lang_opt if lang_opt in i18n.LANGS else i18n.resolve(lang_opt, " ".join(argv[1:]))[1]
    if len(argv) >= 3:
        ch_num = argv[0]
        cat = argv[1]
        text = " ".join(argv[2:])
        append_entry(ch_num, cat, text, ui)
    else:
        S = STR[ui]
        print(S["usage"])
        print(S["example"])
        print(S["cats"])
        sys.exit(1)
