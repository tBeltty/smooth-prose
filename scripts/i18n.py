"""
scripts/i18n.py - Shared language handling for the Smooth Prose scripts.

Two independent notions of language:
  * rule languages: which lexicons/patterns apply to the text (en, es, or both)
  * UI language: the language of the report/messages (en or es)

Resolution order: --lang flag, SMOOTH_PROSE_LANG env var, text detection, system locale.
"""
import json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
LANGS = ("en", "es")

# Distinctive function words (no overlap between the sets)
HINTS = {
    "en": {"the", "and", "of", "to", "is", "in", "that", "it", "for", "with", "was", "on", "are", "this",
           "but", "not", "his", "her", "you", "your", "they", "from", "by", "be", "have", "an"},
    "es": {"de", "la", "que", "el", "en", "y", "los", "del", "las", "por", "un", "una", "con", "para", "es",
           "se", "su", "sus", "al", "lo", "como", "pero", "sino", "más", "está", "son"},
}


def load_heuristics(name):
    with open(os.path.join(ROOT, "heuristics", name), "r", encoding="utf-8") as f:
        return json.load(f)


def system_lang():
    env = os.environ.get("SMOOTH_PROSE_LANG", "").lower()
    if env in LANGS:
        return env
    for var in ("LC_ALL", "LC_MESSAGES", "LANG"):
        val = os.environ.get(var, "").lower()
        if val:
            return "es" if val.startswith("es") else "en"
    return "en"


def detect(text):
    """Returns (rule_langs, ui_lang) guessed from the text."""
    counts = {"en": 0, "es": 0}
    for w in re.findall(r"[a-záéíóúüñ]+", text.lower()):
        for lang in LANGS:
            if w in HINTS[lang]:
                counts[lang] += 1
    total = counts["en"] + counts["es"]
    if total < 2:
        return list(LANGS), system_lang()
    major, minor = ("en", "es") if counts["en"] >= counts["es"] else ("es", "en")
    if counts[minor] / total < 0.25:
        return [major], major
    return list(LANGS), major


def resolve(opt, text=""):
    """opt: 'en' | 'es' | 'all' | 'auto' | None -> (rule_langs, ui_lang)."""
    if opt in (None, "auto"):
        env = os.environ.get("SMOOTH_PROSE_LANG", "").lower()
        opt = env if env in LANGS + ("all",) else "auto"
    if opt in LANGS:
        return [opt], opt
    if opt == "all":
        return list(LANGS), detect(text)[1]
    return detect(text)


def pop_lang_arg(argv):
    """Extracts --lang X / --lang=X from argv. Returns (value or None, remaining argv). Exits 2 if invalid."""
    out, value, i = [], None, 0
    while i < len(argv):
        a = argv[i]
        if a == "--lang" and i + 1 < len(argv):
            value, i = argv[i + 1], i + 2
            continue
        if a.startswith("--lang="):
            value, i = a.split("=", 1)[1], i + 1
            continue
        out.append(a)
        i += 1
    if value is not None and value not in LANGS + ("all", "auto"):
        import sys
        print("Error: --lang must be one of auto|en|es|all.", file=sys.stderr)
        sys.exit(2)
    return value, out
