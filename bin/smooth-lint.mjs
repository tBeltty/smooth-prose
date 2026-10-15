#!/usr/bin/env node

/**
 * Smooth Lint - Deterministic AI Slop, Word Repetition & Cadence Linter
 * Zero external dependencies. Works with Node.js 18+
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// ANSI terminal colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// 1. Rules catalog: heuristics/slop-catalog.json is the single source of truth (EN + ES).
const CATALOG_PATH = fileURLToPath(new URL('../heuristics/slop-catalog.json', import.meta.url));
const CATALOG = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf-8'));
// Rules may use {{class}} placeholders; each expands to a non-capturing alternation from CATALOG.classes
const expandClasses = src => src.replace(/\{\{(\w+)\}\}/g, (_, name) => {
  const words = CATALOG.classes && CATALOG.classes[name];
  if (!Array.isArray(words)) throw new Error(`slop-catalog: unknown class {{${name}}}`);
  return `(?:${words.join('|')})`;
});
const SLOP_RULES = CATALOG.rules.map(r => ({ ...r, pattern: new RegExp(expandClasses(r.regex), r.flags || 'gi') }));

// Distinctive function words used to guess the document language (no overlap between sets)
const LANG_HINTS = {
  en: new Set(['the', 'and', 'of', 'to', 'is', 'in', 'that', 'it', 'for', 'with', 'was', 'on', 'are', 'this', 'but', 'not', 'his', 'her', 'you', 'your', 'they', 'from', 'by', 'be', 'have', 'an']),
  es: new Set(['de', 'la', 'que', 'el', 'en', 'y', 'los', 'del', 'las', 'por', 'un', 'una', 'con', 'para', 'es', 'se', 'su', 'sus', 'al', 'lo', 'como', 'pero', 'sino', 'más', 'está', 'son'])
};

/**
 * Returns 'en', 'es' or 'all' (mixed or undetectable text: apply every rule)
 */
function detectLanguage(text) {
  const counts = { en: 0, es: 0 };
  for (const w of text.toLowerCase().match(/[a-záéíóúüñ]+/g) || []) {
    if (LANG_HINTS.en.has(w)) counts.en++;
    if (LANG_HINTS.es.has(w)) counts.es++;
  }
  const total = counts.en + counts.es;
  if (total < 2) return 'all';
  const [major, minor] = counts.en >= counts.es ? ['en', 'es'] : ['es', 'en'];
  return counts[minor] / total < 0.25 ? major : 'all';
}

// Stopwords in Spanish & English (excluded from excessive repetition linter)
const STOPWORDS = new Set([
  'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para', 'con',
  'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya', 'o', 'este', 'sí',
  'porque', 'esta', 'son', 'entre', 'está', 'cuando', 'muy', 'sin', 'sobre', 'ser', 'tiene',
  'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante', 'todos',
  'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e', 'esto', 'mí',
  'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él', 'tanto', 'esa', 'estos',
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on', 'with',
  'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her',
  'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out'
]);

// Quotas for overused words in literary fiction (per language, from the catalog)
const LEXICAL_QUOTAS = { ...CATALOG.quotas.es, ...CATALOG.quotas.en };

// Report strings (the report language follows the document language, --lang or SMOOTH_PROSE_LANG)
const UI = {
  en: {
    ratings: { organic: 'Organic / Human', balanced: 'Balanced', monotone: 'Monotone / Synthetic', few: 'Too few sentences' },
    title: 'Smooth Prose Lint Report', file: 'File',
    cadence: 'Rhythm & Cadence (Burstiness)', deviation: 'Deviation', sentences: 'Sentences', diagnosis: 'Diagnosis',
    clean: 'Zero AI Slop patterns detected.', found: 'AI Slop patterns found', fixLabel: 'Fix',
    quota: 'Lexical Quotas Exceeded', quotaLine: 'Word "{w}": {c} times (max allowed: {m}).', hint: 'Suggestion',
    prox: 'Excessive Repetition in Proximity (<120 words)', repeated: 'Repeated word: "{w}" (first seen on L{l})', more: '... and {n} more repetitions.',
    summary: 'Final Summary', ok: 'Approved', blocking: '{n} blocking errors',
    usage: 'Usage', missing: 'Error: file "{f}" does not exist.', badLang: 'Error: --lang must be one of auto|en|es|all.'
  },
  es: {
    ratings: { organic: 'Orgánico / Humano', balanced: 'Equilibrado', monotone: 'Monótono / Sintético', few: 'Pocas oraciones' },
    title: 'Smooth Prose Lint Report', file: 'Archivo',
    cadence: 'Ritmo & Cadencia (Burstiness)', deviation: 'Desviación', sentences: 'Oraciones', diagnosis: 'Diagnóstico',
    clean: 'Cero patrones de AI Slop detectados.', found: 'Patrones de AI Slop encontrados', fixLabel: 'Solución',
    quota: 'Cuotas Léxicas Superadas', quotaLine: 'Palabra "{w}": {c} veces (Máx permitido: {m}).', hint: 'Sugerencia',
    prox: 'Repetición Excesiva en Proximidad (<120 palabras)', repeated: 'Palabra repetida: "{w}" (vista previamente en L{l})', more: '... y {n} repeticiones adicionales.',
    summary: 'Resumen Final', ok: 'Aprobado', blocking: '{n} errores bloqueantes',
    usage: 'Uso', missing: 'Error: El archivo "{f}" no existe.', badLang: 'Error: --lang debe ser auto|en|es|all.'
  }
};

function systemLang() {
  const env = (process.env.SMOOTH_PROSE_LANG || '').toLowerCase();
  if (env === 'en' || env === 'es') return env;
  const loc = (process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG || '').toLowerCase();
  return loc.startsWith('es') ? 'es' : 'en';
}

/**
 * Parses line numbers from byte offset
 */
function getLineAndCol(text, index) {
  const lines = text.slice(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

/**
 * Calculates sentence length variance (Burstiness)
 */
function calculateBurstiness(text) {
  const rawSentences = text
    .split(/(?<=[.?!;:\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (rawSentences.length < 3) return { burstiness: 10, sentenceCount: rawSentences.length, ratingKey: 'few', rating: 'few' };

  const wordCounts = rawSentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const variance = wordCounts.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / wordCounts.length;
  const burstiness = Math.sqrt(variance);

  let rating = 'organic';
  if (burstiness < 5.0) rating = 'monotone';
  else if (burstiness < 7.5) rating = 'balanced';

  return {
    burstiness: parseFloat(burstiness.toFixed(2)),
    avgSentenceLength: parseFloat(avg.toFixed(1)),
    sentenceCount: rawSentences.length,
    ratingKey: rating,
    rating
  };
}

/**
 * Detects word repetitions in close proximity (window of 120 words) and quotas
 */
function analyzeWordRepetitions(text) {
  const tokens = [];
  const regex = /\b([a-záéíóúüñA-ZÁÉÍÓÚÜÑ]{4,})\b/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    tokens.push({
      word: match[1].toLowerCase(),
      index: match.index,
      raw: match[1]
    });
  }

  const proximityIssues = [];
  const quotaCounts = {};
  const WINDOW_SIZE = 120; // Words window

  for (let i = 0; i < tokens.length; i++) {
    const current = tokens[i];
    const word = current.word;

    // Quota tracking
    if (LEXICAL_QUOTAS[word]) {
      quotaCounts[word] = (quotaCounts[word] || 0) + 1;
    }

    if (STOPWORDS.has(word)) continue;

    // Check next words in window
    for (let j = i + 1; j < Math.min(tokens.length, i + WINDOW_SIZE); j++) {
      const neighbor = tokens[j];
      if (neighbor.word === word) {
        const distance = j - i;
        const { line, column } = getLineAndCol(text, neighbor.index);
        proximityIssues.push({
          word,
          distance,
          line,
          column,
          firstOccurrenceLine: getLineAndCol(text, current.index).line
        });
        break; // Only report once per pair
      }
    }
  }

  const quotaViolations = [];
  for (const [word, count] of Object.entries(quotaCounts)) {
    const quota = LEXICAL_QUOTAS[word];
    if (count > quota.max) {
      quotaViolations.push({
        word,
        count,
        max: quota.max,
        label: quota.label
      });
    }
  }

  return { proximityIssues, quotaViolations };
}

/**
 * Strips code blocks, inline code and <!-- smooth-lint-disable --> regions in markdown and lines that mark bad examples (a line containing ❌, or starting with "Avoid:") so that quoted slop is not flagged
 */
function stripMarkdownCode(text) {
  const blank = match => match.replace(/[^\n]/g, ' ');
  return text
    .replace(/<!--\s*smooth-lint-disable\s*-->[\s\S]*?<!--\s*smooth-lint-enable\s*-->/g, blank)
    .replace(/^.*❌.*$/gm, blank)
    .replace(/^[ \t]*(?:[*-][ \t]+)?\*{0,2}(?:Avoid|Evita)\*{0,2}:.*$/gim, blank)
    .replace(/```[\s\S]*?```/g, match => '\n'.repeat((match.match(/\n/g) || []).length))
    .replace(/`[^`\n]+`/g, match => ' '.repeat(match.length));
}

/**
 * Main Linter Execution
 */
function lintText(text, filePath = '<stdin>', langOpt = 'auto', factsText = '') {
  const isMarkdown = filePath.endsWith('.md') || filePath.endsWith('.markdown');
  const scannableText = isMarkdown ? stripMarkdownCode(text) : text;
  const issues = [];
  const lang = langOpt === 'auto' ? detectLanguage(scannableText) : langOpt;

  // 1. Scan Slop Rules
  for (const rule of SLOP_RULES) {
    if (lang !== 'all' && rule.lang !== lang) continue;
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m;
    while ((m = regex.exec(scannableText)) !== null) {
      const { line, column } = getLineAndCol(text, m.index);
      issues.push({
        type: 'slop',
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        line,
        column,
        offset: m.index,
        match: m[0].trim(),
        fix: rule.fix
      });
    }
  }

  // Direct quotes are shielded: text inside "..." / “...” / «...» is somebody's words, not ours to flag
  const quoted = [];
  for (const q of scannableText.matchAll(/"[^"\n]{3,300}"|“[^”\n]{3,300}”|«[^»\n]{3,300}»/g)) quoted.push([q.index, q.index + q[0].length]);
  if (quoted.length) {
    for (let i = issues.length - 1; i >= 0; i--) {
      const o = issues[i].offset;
      if (quoted.some(([a, b]) => o >= a && o < b)) issues.splice(i, 1);
    }
  }

  // Metrics the author supplied (--facts) are sourced by definition: drop unsourced-metric hits whose numbers appear there
  if (factsText) {
    const factNums = new Set(factsText.match(/\d+(?:[.,]\d+)?/g) || []);
    for (let i = issues.length - 1; i >= 0; i--) {
      if (!issues[i].id.startsWith('unsourced-metric')) continue;
      const nums = issues[i].match.match(/\d+(?:[.,]\d+)?/g) || [];
      if (nums.length && nums.every(n => factNums.has(n))) issues.splice(i, 1);
    }
  }

  // 2. Scan Word Repetitions & Quotas
  const { proximityIssues, quotaViolations } = analyzeWordRepetitions(scannableText);

  // 3. Cadence Metrics
  const cadence = calculateBurstiness(scannableText);
  const ui = (lang === 'en' || lang === 'es') ? lang : systemLang();
  cadence.rating = UI[ui].ratings[cadence.ratingKey];

  return {
    filePath,
    lang,
    ui,
    issues,
    proximityIssues,
    quotaViolations,
    cadence
  };
}

/**
 * Terminal Reporter
 */
function printReport(result, jsonMode = false) {
  if (jsonMode) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }
  const T = UI[result.ui];
  const fmt = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => vars[k]);

  console.log(`\n${colors.bold}${colors.cyan}=== ${T.title} ===${colors.reset}`);
  console.log(`${colors.gray}${T.file}: ${result.filePath}${colors.reset}\n`);

  console.log(`${colors.bold}📊 ${T.cadence}:${colors.reset}`);
  const burstColor = result.cadence.ratingKey === 'monotone' ? colors.red : colors.green;
  console.log(`   ${T.deviation}: ${result.cadence.burstiness} | ${T.sentences}: ${result.cadence.sentenceCount} | ${T.diagnosis}: ${burstColor}${result.cadence.rating}${colors.reset}\n`);

  if (result.issues.length === 0) {
    console.log(`${colors.green}✔ ${T.clean}${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.red}❌ ${T.found} (${result.issues.length}):${colors.reset}`);
    for (const issue of result.issues) {
      const sevColor = issue.severity === 'error' ? colors.red : colors.yellow;
      console.log(`   ${colors.gray}L${issue.line}:${issue.column}${colors.reset} [${sevColor}${issue.name}${colors.reset}]`);
      console.log(`     ${colors.dim}"${issue.match}"${colors.reset}`);
      console.log(`     ${colors.green}💡 ${T.fixLabel}:${colors.reset} ${issue.fix}\n`);
    }
  }

  if (result.quotaViolations.length > 0) {
    console.log(`${colors.bold}${colors.yellow}⚠️  ${T.quota}:${colors.reset}`);
    for (const q of result.quotaViolations) {
      console.log(`   ${fmt(T.quotaLine, { w: colors.bold + q.word + colors.reset, c: q.count, m: q.max })}`);
      console.log(`   ${colors.gray}${T.hint}: ${q.label}${colors.reset}\n`);
    }
  }

  if (result.proximityIssues.length > 0) {
    console.log(`${colors.bold}${colors.yellow}🔁 ${T.prox}:${colors.reset}`);
    const sample = result.proximityIssues.slice(0, 8);
    for (const rep of sample) {
      console.log(`   ${colors.gray}L${rep.line}:${rep.column}${colors.reset} ${fmt(T.repeated, { w: colors.bold + rep.word + colors.reset, l: rep.firstOccurrenceLine })}`);
    }
    if (result.proximityIssues.length > 8) {
      console.log(`   ${colors.dim}${fmt(T.more, { n: result.proximityIssues.length - 8 })}${colors.reset}`);
    }
    console.log();
  }

  const totalErrors = result.issues.filter(i => i.severity === 'error').length;
  console.log(`${colors.bold}${T.summary}:${colors.reset} ${totalErrors === 0 ? colors.green + T.ok : colors.red + fmt(T.blocking, { n: totalErrors })}${colors.reset}\n`);
}

// CLI entry point
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const langIdx = args.findIndex(a => a === '--lang' || a.startsWith('--lang='));
let langOpt = ['en', 'es', 'all'].includes((process.env.SMOOTH_PROSE_LANG || '').toLowerCase()) ? process.env.SMOOTH_PROSE_LANG.toLowerCase() : 'auto';
if (langIdx !== -1) {
  langOpt = args[langIdx].includes('=') ? args[langIdx].split('=')[1] : args[langIdx + 1];
  if (!['auto', 'en', 'es', 'all'].includes(langOpt)) {
    console.error(`${colors.red}${UI[systemLang()].badLang}${colors.reset}`);
    process.exit(2);
  }
}
const factsIdx = args.findIndex(a => a === '--facts' || a.startsWith('--facts='));
let factsText = '';
if (factsIdx !== -1) {
  const factsPath = args[factsIdx].includes('=') ? args[factsIdx].split('=')[1] : args[factsIdx + 1];
  if (!factsPath || !fs.existsSync(path.resolve(process.cwd(), factsPath))) {
    console.error(`${colors.red}Error: --facts needs an existing file.${colors.reset}`);
    process.exit(2);
  }
  factsText = fs.readFileSync(path.resolve(process.cwd(), factsPath), 'utf-8');
}
const valueIdx = new Set();
for (const [idx, flag] of [[langIdx, '--lang'], [factsIdx, '--facts']]) {
  if (idx !== -1 && args[idx] === flag) valueIdx.add(idx + 1);
}
const targetFile = args.find((a, i) => !a.startsWith('--') && !valueIdx.has(i));

if (!targetFile) {
  // Read from stdin if piped
  if (!process.stdin.isTTY) {
    let input = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      const res = lintText(input, 'stdin', langOpt, factsText);
      printReport(res, jsonMode);
      process.exit(res.issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
    });
  } else {
    console.log(`${colors.bold}${UI[systemLang()].usage}:${colors.reset} smooth-lint <archivo.md> [--json] [--lang auto|en|es|all] [--facts brief.txt]`);
    console.log(`     cat text.txt | smooth-lint [--json]`);
    process.exit(0);
  }
} else {
  const absPath = path.resolve(process.cwd(), targetFile);
  if (!fs.existsSync(absPath)) {
    console.error(`${colors.red}${UI[systemLang()].missing.replace('{f}', targetFile)}${colors.reset}`);
    process.exit(1);
  }
  const content = fs.readFileSync(absPath, 'utf-8');
  const result = lintText(content, targetFile, langOpt, factsText);
  printReport(result, jsonMode);
  process.exit(result.issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
}
