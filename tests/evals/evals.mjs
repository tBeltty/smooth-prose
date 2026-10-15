#!/usr/bin/env node
// Behavioral eval harness.
//   node tests/evals/evals.mjs list               -> case ids
//   node tests/evals/evals.mjs prompt <id> [--set S] -> brief to give a model (skill text + task + input)
//   node tests/evals/evals.mjs score [--set S] [id...] -> grade tests/evals/out/<S>/<id>.txt (exit 1 on any failure)
//   node tests/evals/evals.mjs compare            -> pass rates per case, with-skill sets vs control sets
// A set named control* gets the same task WITHOUT the skill or directive; any other set gets them.
// Default set: "default" (with skill).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(HERE, 'out');
const { cases } = JSON.parse(fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8'));

const re = (src, defaults = 'm') => {
  const ci = src.startsWith('(?i)');
  return new RegExp(ci ? src.slice(4) : src, defaults + (ci ? 'i' : ''));
};

function brief(c, set = 'default') {
  const control = set.startsWith('control');
  if (control) {
    return [
      'You are a careful professional editor/copywriter.',
      '',
      `## Task\n${c.task}`,
      c.input ? `\n## Input\n${c.input}` : '',
      '',
      `Write ONLY the final result (no commentary, no code fences) to ${path.join(OUT, set, c.id + '.txt')}.`,
    ].filter((x) => x !== '').join('\n');
  }
  const skill = fs.readFileSync(path.join(ROOT, 'skills', c.skill, 'SKILL.md'), 'utf8');
  const core = c.skill === 'smooth-core' ? '' : fs.readFileSync(path.join(ROOT, 'rules', 'anti-slop-directive.md'), 'utf8');
  return [
    'You are applying an editorial skill. Follow it exactly.',
    '',
    core && `## Directive\n${core}\n`,
    `## Skill: ${c.skill}\n${skill}\n`,
    `## Task\n${c.task}`,
    c.input ? `\n## Input\n${c.input}` : '',
    '',
    `Write ONLY the final result (no commentary, no code fences) to ${path.join(OUT, set, c.id + '.txt')}.`,
  ].filter((x) => x !== '').join('\n');
}

function lintJson(text, name) {
  const f = path.join(os.tmpdir(), `sp-eval-${process.pid}-${name}`);
  fs.writeFileSync(f, text);
  const r = spawnSync('node', [path.join(ROOT, 'bin', 'smooth-lint.mjs'), '--json', f], { encoding: 'utf8' });
  fs.unlinkSync(f);
  return JSON.parse(r.stdout);
}

function grade(c, text) {
  const k = c.checks;
  const fails = [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  if (k.lintClean || k.noInfo) {
    const r = lintJson(text, c.id + '.txt');
    const bad = r.issues.filter((i) => (k.noInfo ? true : i.severity === 'error'));
    if (bad.length) fails.push(`lint: ${bad.map((i) => `${i.id}("${i.match.replace(/\s+/g, ' ')}")`).join(', ')}`);
  }
  for (const s of k.mustKeep || []) if (!text.includes(s)) fails.push(`missing required text: ${s}`);
  for (const p of k.mustNotMatch || []) if (re(p, 'im').test(text)) fails.push(`forbidden pattern present: /${p}/`);
  for (const p of k.mustMatch || []) if (!re(p).test(text)) fails.push(`required pattern absent: /${p}/`);
  if (k.maxChars && text.trim().length > k.maxChars) fails.push(`too long: ${text.trim().length} > ${k.maxChars}`);
  if (k.lines) {
    if (lines.length !== k.lines.count) fails.push(`expected ${k.lines.count} lines, got ${lines.length}`);
    for (const l of lines) if (l.length > k.lines.maxChars) fails.push(`line over ${k.lines.maxChars} chars (${l.length}): ${l}`);
  }
  if (k.words) {
    const w = text.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    if (w < k.words.min || w > k.words.max) fails.push(`word count ${w} outside ${k.words.min}-${k.words.max}`);
  }
  if (k.html) {
    const allowed = new Set(k.html.allowed);
    for (const m of text.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)) {
      if (!allowed.has(m[1].toLowerCase())) fails.push(`tag not whitelisted: <${m[1]}>`);
    }
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes > k.html.maxBytes) fails.push(`${bytes} bytes > ${k.html.maxBytes}`);
  }
  if (k.scenesClean) {
    const f = path.join(os.tmpdir(), `sp-eval-${process.pid}-scenes.md`);
    fs.writeFileSync(f, text);
    const r = spawnSync('python3', [path.join(ROOT, 'scripts', 'audit_scene_breaks.py'), f], { encoding: 'utf8' });
    fs.unlinkSync(f);
    if (r.status !== 0) fails.push('scene-break audit not clean');
  }
  return [...new Set(fails)];
}

const argv = process.argv.slice(2);
const si = argv.indexOf('--set');
const SET = si !== -1 ? argv[si + 1] : 'default';
const [cmd, ...restRaw] = si !== -1 ? argv.filter((_, i) => i !== si && i !== si + 1) : argv;
const rest = restRaw;

function scoreSet(set, sel, quiet = false) {
  const res = {};
  for (const c of sel) {
    const f = path.join(OUT, set, c.id + '.txt');
    if (!fs.existsSync(f)) { res[c.id] = null; continue; }
    res[c.id] = grade(c, fs.readFileSync(f, 'utf8'));
  }
  return res;
}

if (cmd === 'list') {
  for (const c of cases) console.log(c.id);
} else if (cmd === 'prompt') {
  const c = cases.find((x) => x.id === rest[0]);
  if (!c) { console.error('unknown case'); process.exit(2); }
  fs.mkdirSync(path.join(OUT, SET), { recursive: true });
  console.log(brief(c, SET));
} else if (cmd === 'score') {
  const sel = rest.length ? cases.filter((c) => rest.includes(c.id)) : cases;
  const res = scoreSet(SET, sel);
  let failed = 0, graded = 0;
  for (const c of sel) {
    if (res[c.id] === null) { console.log(`SKIP  ${c.id} (no output)`); continue; }
    graded++;
    if (res[c.id].length) { failed++; console.log(`FAIL  ${c.id}\n${res[c.id].map((x) => '      - ' + x).join('\n')}`); }
    else console.log(`PASS  ${c.id}`);
  }
  console.log(`\n${graded - failed}/${graded} passed, ${sel.length - graded} skipped`);
  process.exit(failed ? 1 : 0);
} else if (cmd === 'compare') {
  const sets = fs.existsSync(OUT) ? fs.readdirSync(OUT).filter((n) => fs.statSync(path.join(OUT, n)).isDirectory()) : [];
  const withSets = sets.filter((n) => !n.startsWith('control'));
  const ctrlSets = sets.filter((n) => n.startsWith('control'));
  const tally = (group) => {
    const t = {};
    for (const set of group) {
      const r = scoreSet(set, cases);
      for (const c of cases) {
        t[c.id] ??= { pass: 0, n: 0, fails: {} };
        if (r[c.id] === null) continue;
        t[c.id].n++;
        if (!r[c.id].length) t[c.id].pass++;
        for (const f of r[c.id]) t[c.id].fails[f] = (t[c.id].fails[f] || 0) + 1;
      }
    }
    return t;
  };
  const W = tally(withSets), C = tally(ctrlSets);
  const cell = (x) => (x && x.n ? `${x.pass}/${x.n}` : '-');
  console.log(`with skill sets: ${withSets.join(', ') || 'none'} | control sets: ${ctrlSets.join(', ') || 'none'}\n`);
  console.log('case'.padEnd(26) + 'skill'.padEnd(8) + 'control');
  let wp = 0, wn = 0, cp = 0, cn = 0;
  for (const c of cases) {
    console.log(c.id.padEnd(26) + cell(W[c.id]).padEnd(8) + cell(C[c.id]));
    wp += W[c.id].pass; wn += W[c.id].n; cp += C[c.id].pass; cn += C[c.id].n;
  }
  console.log('TOTAL'.padEnd(26) + `${wp}/${wn}`.padEnd(8) + `${cp}/${cn}`);
  console.log('\nMost frequent control failures:');
  const agg = {};
  for (const c of cases) for (const [f, n] of Object.entries(C[c.id].fails)) agg[`${c.id}: ${f}`] = n;
  Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([f, n]) => console.log(`  ${n}x ${f}`));
  console.log('\nMost frequent with-skill failures:');
  const agg2 = {};
  for (const c of cases) for (const [f, n] of Object.entries(W[c.id].fails)) agg2[`${c.id}: ${f}`] = n;
  Object.entries(agg2).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([f, n]) => console.log(`  ${n}x ${f}`));
} else {
  console.error('usage: evals.mjs list | prompt <id> [--set S] | score [--set S] [id...] | compare');
  process.exit(2);
}
