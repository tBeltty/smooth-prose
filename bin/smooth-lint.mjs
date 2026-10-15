#!/usr/bin/env node

/**
 * Smooth Lint - Deterministic AI Slop, Word Repetition & Cadence Linter
 * Zero external dependencies. Works with Node.js 18+
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

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

// 1. Deterministic Slop Rules Catalog
const SLOP_RULES = [
  {
    id: 'contrast-no-sino',
    name: 'Contraste Binario (No X, sino Y)',
    category: 'contrast',
    severity: 'error',
    pattern: /\b(?:no\s+(?:es|era|fue|había|hay|se\s+trata\s+de|busca|quiere|se\s+limita\s+a)?\s*(?:solo|solamente|únicamente|tan\s+solo)?\s+[^,.;\n]{2,60},?\s*sino(?:\s+(?:también|que|el|la|los|las|un|una|de))?|no\s+porque\s+[^,.;\n]{2,60},?\s*sino\s+porque|el\s+problema\s+no\s+es\s+[^,.;\n]{2,40},?\s*(?:sino|es)|más\s+que\s+un[a]?\s+[^,.;\n]{2,40},?\s*(?:es|era|fue)\s+un[a]?|lejos\s+de\s+ser\s+[^,.;\n]{2,40},?\s*(?:es|era|fue))\b/gi,
    fix: 'Afirma la idea directamente sin el rodeo de la negación previa.'
  },
  {
    id: 'contrast-en-binary',
    name: 'Binary Contrast (Not X, but Y)',
    category: 'contrast',
    severity: 'error',
    pattern: /\b(?:it['’]?s\s+not\s+(?:about|just)\s+[^,.\n]+,?\s*it['’]?s\s+(?:about\s+)?|the\s+question\s+isn['’]?t\s+[^,.\n]+,?\s*it['’]?s\s+|not\s+because\s+it['’]?s\s+[^,.\n]+,?\s*but\s+because|not\s+only\s+[^,.\n]+,?\s*but\s+(?:also\s+)?)\b/gi,
    fix: 'State the affirmative claim directly without the artificial negative setup.'
  },
  {
    id: 'throat-clearing-es',
    name: 'Carraspeo / Apertura Teatral',
    category: 'throat',
    severity: 'error',
    pattern: /(?:^|[\n.?!]\s*)(?:aquí\s+está\s+el\s+detalle|seamos\s+claros|seamos\s+honestos|la\s+verdad\s+es\s+que|hablemos\s+de|déjame\s+decirte\s+algo|la\s+realidad\s+es\s+simple)\s*[:,-]/gi,
    fix: 'Elimina el preámbulo y comienza directamente con el argumento o sujeto.'
  },
  {
    id: 'throat-clearing-en',
    name: 'Throat-Clearing Preamble',
    category: 'throat',
    severity: 'error',
    pattern: /(?:^|[\n.?!]\s*)(?:here['’]?s\s+the\s+thing|let['’]?s\s+be\s+honest|make\s+no\s+mistake|the\s+truth\s+is|let['’]?s\s+dive\s+in|at\s+the\s+end\s+of\s+the\s+day)\s*[:,-]/gi,
    fix: 'Delete preamble and begin immediately with the subject and verb.'
  },
  {
    id: 'narrative-cliches-es',
    name: 'Cliché Narrativo / Ficción LLM',
    category: 'narrative',
    severity: 'warning',
    pattern: /\b(?:en\s+alerta\s+máxima|sus\s+sentidos\s+alerta|la\s+leyenda\s+hecha\s+carne|hech[oa]\s+carne|nada\s+menos\s+que|invaluable|a\s+gran\s+escala|procesión\s+silenciosa|tensión\s+(?:abrumadora|palpable|electrizante|en\s+el\s+aire)|silencio\s+(?:sepulcral|ensordecedor|tenso)|miradas\s+furtivas|miradas\s+cómplices|a\s+una\s+distancia\s+respetuosa|un\s+escalofrío\s+recorrió\s+su\s+espalda|un\s+nudo\s+en\s+la\s+garganta|el\s+peso\s+del\s+mundo\s+sobre\s+sus\s+hombros)\b/gi,
    fix: 'Sustituye el cliché melodramático por una acción física o somática concreta.'
  },
  {
    id: 'corporate-jargon-es',
    name: 'Jerga Corporativa Hueca',
    category: 'jargon',
    severity: 'warning',
    pattern: /\b(?:desempacar|navegar\s+(?:el\s+panorama|los\s+desafíos)|hacer\s+un\s+deep\s+dive|redoblar\s+la\s+apuesta|game\s+changer|disruptivo|ecosistema\s+integral|desbloquear\s+el\s+potencial|elevar\s+(?:al\s+siguiente\s+nivel|tu\s+experiencia))\b/gi,
    fix: 'Sustituye por un verbo o métrica precisa (resolver, analizar, optimizar).'
  },
  {
    id: 'pseudo-profound-closure',
    name: 'Cierre Pseudo-Profundo',
    category: 'closure',
    severity: 'warning',
    pattern: /\b(?:el\s+futuro\s+(?:no\s+está\s+llegando|ya\s+está\s+aquí)|piénsalo\s+bien|punto\s+final|y\s+eso\s+está\s+bien)\b/gi,
    fix: 'Concluye con un dato comprobable o un desenlace específico.'
  },
  {
    id: 'hesitation-quirola',
    name: 'Atenuador de Certeza (Decálogo Quiroga)',
    category: 'hesitation',
    severity: 'info',
    pattern: /\b(?:parecía\s+(?:tener|estar|ser|quedar|resistir|quebrar)|quizás\s+(?:sentía|era|estaba)|casi\s+sin\s+darse\s+cuenta)\b/gi,
    fix: 'Usa la forma asertiva directa (resistió, sintió, avanzó).'
  }
];

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

// Quotas for overused words in literary fiction
const LEXICAL_QUOTAS = {
  'sombra': { max: 2, label: 'sombra/sombras (sustituir por penumbra, tinieblas, silueta)' },
  'sombras': { max: 2, label: 'sombra/sombras (sustituir por penumbra, tinieblas, silueta)' },
  'polvo': { max: 3, label: 'polvo (alternar con hollín, herrumbre, ceniza, tierra seca)' },
  'polvoriento': { max: 2, label: 'polvoriento (alternar con ceniciento, herrumbroso)' },
  'refugio': { max: 2, label: 'refugio (alternar con bastión, guarida, escondite)' }
};

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

  if (rawSentences.length < 3) return { burstiness: 10, rating: 'Pocas oraciones' };

  const wordCounts = rawSentences.map(s => s.split(/\s+/).filter(Boolean).length);
  const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  const variance = wordCounts.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / wordCounts.length;
  const burstiness = Math.sqrt(variance);

  let rating = 'Orgánico / Humano';
  if (burstiness < 5.0) rating = 'Monótono / Sintético';
  else if (burstiness < 7.5) rating = 'Equilibrado';

  return {
    burstiness: parseFloat(burstiness.toFixed(2)),
    avgSentenceLength: parseFloat(avg.toFixed(1)),
    sentenceCount: rawSentences.length,
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
 * Strips code blocks and inline code in markdown to prevent false positives on code examples
 */
function stripMarkdownCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, match => '\n'.repeat((match.match(/\n/g) || []).length))
    .replace(/`[^`\n]+`/g, match => ' '.repeat(match.length));
}

/**
 * Main Linter Execution
 */
function lintText(text, filePath = '<stdin>') {
  const isMarkdown = filePath.endsWith('.md') || filePath.endsWith('.markdown');
  const scannableText = isMarkdown ? stripMarkdownCode(text) : text;
  const issues = [];

  // 1. Scan Slop Rules
  for (const rule of SLOP_RULES) {
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
        match: m[0].trim(),
        fix: rule.fix
      });
    }
  }

  // 2. Scan Word Repetitions & Quotas
  const { proximityIssues, quotaViolations } = analyzeWordRepetitions(scannableText);

  // 3. Cadence Metrics
  const cadence = calculateBurstiness(scannableText);

  return {
    filePath,
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

  console.log(`\n${colors.bold}${colors.cyan}=== Smooth Prose Lint Report ===${colors.reset}`);
  console.log(`${colors.gray}File: ${result.filePath}${colors.reset}\n`);

  // Cadence Summary
  console.log(`${colors.bold}📊 Ritmo & Cadencia (Burstiness):${colors.reset}`);
  const burstColor = result.cadence.rating.includes('Monótono') ? colors.red : colors.green;
  console.log(`   Desviación: ${result.cadence.burstiness} | Oraciones: ${result.cadence.sentenceCount} | Diagnóstico: ${burstColor}${result.cadence.rating}${colors.reset}\n`);

  // Slop Issues
  if (result.issues.length === 0) {
    console.log(`${colors.green}✔ Cero patrones de AI Slop detectados.${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.red}❌ Patrones de AI Slop encontrados (${result.issues.length}):${colors.reset}`);
    for (const issue of result.issues) {
      const sevColor = issue.severity === 'error' ? colors.red : colors.yellow;
      console.log(`   ${colors.gray}L${issue.line}:${issue.column}${colors.reset} [${sevColor}${issue.name}${colors.reset}]`);
      console.log(`     ${colors.dim}"${issue.match}"${colors.reset}`);
      console.log(`     ${colors.green}💡 Solución:${colors.reset} ${issue.fix}\n`);
    }
  }

  // Quota Violations
  if (result.quotaViolations.length > 0) {
    console.log(`${colors.bold}${colors.yellow}⚠️  Cuotas Léxicas Superadas:${colors.reset}`);
    for (const q of result.quotaViolations) {
      console.log(`   Palabra "${colors.bold}${q.word}${colors.reset}": ${q.count} veces (Máx permitido: ${q.max}).`);
      console.log(`   ${colors.gray}Sugerencia: ${q.label}${colors.reset}\n`);
    }
  }

  // Repetition in close proximity
  if (result.proximityIssues.length > 0) {
    console.log(`${colors.bold}${colors.yellow}🔁 Repetición Excesiva en Proximidad (<120 palabras):${colors.reset}`);
    const sample = result.proximityIssues.slice(0, 8);
    for (const rep of sample) {
      console.log(`   ${colors.gray}L${rep.line}:${rep.column}${colors.reset} Palabra repetida: "${colors.bold}${rep.word}${colors.reset}" (vista previamente en L${rep.firstOccurrenceLine})`);
    }
    if (result.proximityIssues.length > 8) {
      console.log(`   ${colors.dim}... y ${result.proximityIssues.length - 8} repeticiones adicionales.${colors.reset}`);
    }
    console.log();
  }

  const totalErrors = result.issues.filter(i => i.severity === 'error').length;
  console.log(`${colors.bold}Resumen Final:${colors.reset} ${totalErrors === 0 ? colors.green + 'Aprobado' : colors.red + totalErrors + ' errores bloqueantes'}${colors.reset}\n`);
}

// CLI entry point
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const targetFile = args.find(a => !a.startsWith('--'));

if (!targetFile) {
  // Read from stdin if piped
  if (!process.stdin.isTTY) {
    let input = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { input += chunk; });
    process.stdin.on('end', () => {
      const res = lintText(input, 'stdin');
      printReport(res, jsonMode);
      process.exit(res.issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
    });
  } else {
    console.log(`${colors.bold}Uso:${colors.reset} smooth-lint <archivo.md> [--json]`);
    console.log(`     cat texto.txt | smooth-lint [--json]`);
    process.exit(0);
  }
} else {
  const absPath = path.resolve(process.cwd(), targetFile);
  if (!fs.existsSync(absPath)) {
    console.error(`${colors.red}Error:${colors.reset} El archivo "${targetFile}" no existe.`);
    process.exit(1);
  }
  const content = fs.readFileSync(absPath, 'utf-8');
  const result = lintText(content, targetFile);
  printReport(result, jsonMode);
  process.exit(result.issues.filter(i => i.severity === 'error').length > 0 ? 1 : 0);
}
