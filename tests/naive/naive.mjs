#!/usr/bin/env node
// Naive-agent test: the agent gets the kind of request a real user types ("make me a landing page for this"),
// with no structure, no length limit, no "use only these facts" and no mention of any framework.
// Conditions (what the project's CLAUDE.md contains, injected the way the harness would):
//   bare       nothing
//   directive  rules/anti-slop-directive.md pasted in (the README's Claude Code integration)
//   full       short standards + paths to the framework (skills, lint CLI); the agent may use them or not
// Metrics are fixed before looking at any output:
//   lintIssues  smooth-lint issues of any severity on the visible text
//   hype        matches of the HYPE list below
//   invented    numbers in the page that are not in the facts
//   kept        facts preserved (of 10)
// Scenarios: "grounded" (default; the raw facts are provided) and "vague" (no data at all, the model must fill the gaps).
// Usage: node tests/naive/naive.mjs setup [root] [--vague]    |    node tests/naive/naive.mjs grade <root>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONDITIONS = ['bare', 'directive', 'full'];
const RUNS = 3;

const FACTS = ['500', '61%', '300', '14.8', '6.4', '38 ms', '40 lines', '34%', 'MIT', 'npx torque init'];
const ALLOWED_NUMBERS = new Set(['1', '0', '1.0', '2', '2.3', '6', '500', '61', '300', '14.8', '6.4', '38', '40', '34', '2025', '2026']);
const HYPE = [
  /seamless/i, /revolution/i, /game[- ]?chang/i, /next[- ]?(level|gen)/i, /supercharg/i, /unlock/i, /empower/i,
  /cutting[- ]edge/i, /state[- ]of[- ]the[- ]art/i, /leverag/i, /ecosystem/i, /intuitive/i, /disruptive/i,
  /powerful/i, /effortless/i, /blazing/i, /lightning/i, /robust/i, /reimagin/i, /unleash/i, /elevate/i,
  /fearless/i, /world[- ]class/i, /best[- ]in[- ]class/i, /turbocharg/i, /\bimagine\b/i, /\bsay goodbye\b/i,
  /\bwelcome to the future\b/i, /\bthe future of\b/i, /\bwhether you(?:'re| are)\b/i, /\bnever (?:been|before)\b/i,
];

// The vague scenario uses a product name that appears nowhere in this repo: agents run with the repo as working
// directory and will grep it, and a first attempt with "Torque" found the fixtures in tests/ and used them.
const VAGUE_PRODUCT = process.env.NAIVE_PRODUCT || 'Halyard';
const VAGUE_REQUEST = (dir) => `Make me a landing page for ${VAGUE_PRODUCT} 1.0, our new agent harness. It's a big step up from the usual harnesses. Save it as ${dir}/index.html.`;

const REQUEST = (dir) => `Make me a landing page for Torque 1.0, our new agent harness. Save it as ${dir}/index.html.

What we've got (all numbers are from our own benchmarks): MIT license, Python and TypeScript SDKs, install with \`npx torque init\`.
- records every session; 500 of 500 recorded sessions replayed identically
- context compaction: context 61% smaller at the same task success on a 300-task benchmark
- parallel tool calls from a dependency graph: median task went from 14.8 min to 6.4 min
- every tool call runs in its own microVM, 38 ms cold start, with filesystem snapshot and rollback
- deny-by-default permissions in about 40 lines of YAML, plus a signed audit log
- hard token budget per task; 34% lower spend on the same benchmark`;

function claudeMd(cond, root) {
  if (cond === 'bare') return '';
  if (cond === 'directive') return fs.readFileSync(path.join(REPO, 'rules', 'anti-slop-directive.md'), 'utf8');
  return `# Editorial standards (Smooth Prose)
This project uses the Smooth Prose framework, installed at ${root}/framework.
- Core directive: ${root}/framework/rules/anti-slop-directive.md
- Skills: ${root}/framework/skills/<name>/SKILL.md (smooth-core, smooth-web, smooth-marketing, smooth-narrative)
- Linter: node ${root}/framework/bin/smooth-lint.mjs <file.md|file.txt> (exit 1 means blocking AI-slop patterns)
Apply these standards to all copy you write.`;
}

function setup(root, vague = false) {
  fs.mkdirSync(path.join(root, 'prompts'), { recursive: true });
  fs.writeFileSync(path.join(root, 'scenario.txt'), vague ? 'vague' : 'grounded');
  for (const rel of spawnSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' }).stdout.split('\n').filter(Boolean)) {
    if (rel.startsWith('tests/') || rel.startsWith('.github/')) continue;
    const dest = path.join(root, 'framework', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(REPO, rel), dest);
  }
  for (const cond of CONDITIONS) for (let r = 1; r <= RUNS; r++) {
    const dir = path.join(root, `${cond}-r${r}`);
    fs.mkdirSync(dir, { recursive: true });
    const md = claudeMd(cond, root);
    const prompt = (md ? `Project instructions (loaded from CLAUDE.md):\n<<<\n${md}\n>>>\n\n` : '') + (vague ? VAGUE_REQUEST(dir) : REQUEST(dir));
    fs.writeFileSync(path.join(root, 'prompts', `${cond}-r${r}.txt`), prompt);
  }
  console.log(root);
}

function visibleText(html) {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|section|li|h[1-6]|header|footer|article|nav|a|button)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&mdash;/g, '—')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

function metrics(text, vague = false) {
  const f = path.join(os.tmpdir(), `sp-naive-${process.pid}.txt`);
  fs.writeFileSync(f, text);
  const lint = JSON.parse(spawnSync('node', [path.join(REPO, 'bin', 'smooth-lint.mjs'), '--json', f], { encoding: 'utf8' }).stdout);
  fs.unlinkSync(f);
  const nums = (text.match(/\d+(?:\.\d+)?/g) || []);
  const allowed = vague ? new Set(['1', '0', '1.0', '2025', '2026']) : ALLOWED_NUMBERS;
  const invented = [...new Set(nums.filter((n) => !allowed.has(n)))];
  const hype = HYPE.flatMap((re) => text.match(new RegExp(re.source, 'gi')) || []);
  return {
    lintIssues: lint.issues.length,
    lintIds: lint.issues.map((i) => i.id),
    hype: hype.length,
    hypeWords: hype.map((h) => h.toLowerCase()),
    invented: invented.length,
    inventedList: invented,
    kept: vague ? 0 : FACTS.filter((x) => text.includes(x)).length,
    words: text.split(/\s+/).filter(Boolean).length,
  };
}

function grade(root) {
  const vague = fs.existsSync(path.join(root, 'scenario.txt')) && fs.readFileSync(path.join(root, 'scenario.txt'), 'utf8') === 'vague';
  console.log(`scenario: ${vague ? 'vague' : 'grounded'}\n`);
  const rows = {};
  for (const cond of CONDITIONS) {
    rows[cond] = [];
    for (let r = 1; r <= RUNS; r++) {
      const f = path.join(root, `${cond}-r${r}`, 'index.html');
      if (!fs.existsSync(f)) { rows[cond].push(null); continue; }
      rows[cond].push(metrics(visibleText(fs.readFileSync(f, 'utf8')), vague));
    }
  }
  const mean = (a, k) => (a.length ? (a.reduce((s, x) => s + x[k], 0) / a.length).toFixed(1) : '-');
  console.log('condition'.padEnd(11) + 'runs'.padEnd(6) + 'lint'.padEnd(7) + 'hype'.padEnd(7) + 'invented'.padEnd(10) + 'kept/10'.padEnd(9) + 'words');
  for (const cond of CONDITIONS) {
    const ok = rows[cond].filter(Boolean);
    console.log(cond.padEnd(11) + String(ok.length).padEnd(6) + mean(ok, 'lintIssues').padEnd(7) + mean(ok, 'hype').padEnd(7) + mean(ok, 'invented').padEnd(10) + mean(ok, 'kept').padEnd(9) + mean(ok, 'words'));
  }
  console.log('\nper run (lint / hype / invented / kept):');
  for (const cond of CONDITIONS) rows[cond].forEach((m, i) => console.log(`  ${cond}-r${i + 1}: ` + (m ? `${m.lintIssues} / ${m.hype} / ${m.invented} / ${m.kept}   hype=[${[...new Set(m.hypeWords)].join(', ')}] invented=[${m.inventedList.join(', ')}] lint=[${[...new Set(m.lintIds)].join(', ')}]` : 'missing')));
}

const [cmd, arg] = process.argv.slice(2);
if (cmd === 'setup') {
  const vague = process.argv.includes('--vague');
  const rootArg = process.argv.slice(3).find((a) => !a.startsWith('--'));
  setup(path.resolve(rootArg || fs.mkdtempSync(path.join(os.tmpdir(), 'sp-naive-'))), vague);
}
else if (cmd === 'grade' && arg) grade(path.resolve(arg));
else { console.error('usage: naive.mjs setup [root] | grade <root>'); process.exit(2); }
