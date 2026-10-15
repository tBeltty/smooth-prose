// Scenario data for the sandbox tests: fixtures, the task given to the agent, and the deterministic checks.
// Everything the agent sees is English. Checks never depend on how the agent got there.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';

export const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

const read = (p) => fs.readFileSync(p, 'utf8');
const exists = (p) => fs.existsSync(p);

// ---- helpers shared by checks -------------------------------------------------
export function lintJson(root, file) {
  const r = sh('node', [path.join(root, 'framework', 'bin', 'smooth-lint.mjs'), '--json', file]);
  return { status: r.status, ...JSON.parse(r.stdout) };
}
const usage = (root, tool, dir) =>
  exists(path.join(root, 'usage.log')) &&
  read(path.join(root, 'usage.log')).split('\n').some((l) => l.startsWith(tool + '|') && l.includes(dir));
const words = (t) => (t.toLowerCase().match(/[a-z']+/g) || []);
function retained(original, edited) {
  const bag = new Map();
  for (const w of words(edited)) bag.set(w, (bag.get(w) || 0) + 1);
  const o = words(original);
  let kept = 0;
  for (const w of o) if ((bag.get(w) || 0) > 0) { kept++; bag.set(w, bag.get(w) - 1); }
  return kept / o.length;
}

// Each check returns an array of failure strings.
export const SCENARIOS = [
  {
    id: 'web-landing',
    files: {
      'landing.md': `# CodeGuard

Take your development workflow to the next level with cutting-edge AI.

[Discover the magic]

CodeGuard v2.4.1 scans your lockfile against 1,200 security advisories and costs $19/month.

If a scan fails, users see: "Error: You entered an invalid token. Access denied."

Don't get left behind in the AI revolution.
`,
    },
    task:
      'landing.md is the landing page copy for CodeGuard, a CLI that audits npm lockfiles for known vulnerabilities. ' +
      'Improve the copy following the project standards. Edit landing.md in place. It must pass the project linter.',
    requiresUsage: ['smooth-lint'],
    check({ root, dir }) {
      const f = path.join(dir, 'landing.md');
      const t = read(f);
      const fails = [];
      const r = lintJson(root, f);
      if (r.status !== 0) fails.push(`lint errors: ${r.issues.filter((i) => i.severity === 'error').map((i) => i.id)}`);
      for (const s of ['2.4.1', '$19/month', '1,200']) if (!t.includes(s)) fails.push(`fact lost: ${s}`);
      for (const re of [/next level/i, /cutting-edge/i, /magic/i, /empower/i, /seamless/i, /revolution/i, /left behind/i, /\byou (entered|typed|failed|made|provided)\b/i, /access denied/i])
        if (re.test(t)) fails.push(`forbidden: ${re}`);
      if (!/\b(download|install|run|scan|start|get)\b/i.test(t)) fails.push('no actionable CTA verb');
      return fails;
    },
  },
  {
    id: 'marketing-kdp',
    files: {
      'blurb.html': `<h2>The Salt Ledger</h2>
<p>The ultimate thriller that will transform your life! Act now: once in a lifetime, you won't believe the hidden secrets inside.</p>
<p>Lighthouse keeper Elias Vane finds a ledger of shipwrecks at Halloran Point. It isn't just a book, but a death sentence.</p>
<h3>Don't get left behind!</h3>
`,
      'notes.md': `# Source facts for the blurb (all true, use freely)
- Setting: Halloran Point, a lighthouse on a rocky stretch of the Maine coast, winter 1998.
- Elias Vane has kept the light for 31 years. He is a widower and counts the passing ships every night.
- After a storm, a ledger wrapped in oilcloth washes up in the cellar. It lists eleven vessels lost between 1961 and 1997, with each cargo and the buyer's initials.
- Every entry is in the handwriting of his late wife, Nora.
- The last page dates a twelfth ship: the night of the next full moon. The supply boat that carries his daughter Wren.
- Standalone psychological thriller, 312 pages.
`,
      'hook.txt': `Discover the hidden secrets top marketers never want you to know about the new Salt Ledger launch.\n`,
    },
    task:
      'blurb.html is a draft Amazon KDP description for the novel "The Salt Ledger" (keeper Elias Vane, Halloran Point). ' +
      'Rewrite it following the project standards and Amazon rules, 150-250 words, in place. Use the true facts in notes.md; do not invent anything beyond them. ' +
      'hook.txt must become a two-line social hook announcing the book (keep it factual).',
    requiresUsage: [],
    check({ dir }) {
      const fails = [];
      const b = read(path.join(dir, 'blurb.html'));
      const allowed = new Set(['b', 'strong', 'i', 'em', 'u', 'p', 'br', 'h4', 'h5', 'h6', 'ul', 'ol', 'li']);
      for (const m of b.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9]*)/g)) if (!allowed.has(m[1].toLowerCase())) fails.push(`tag not allowed: <${m[1]}>`);
      if (Buffer.byteLength(b) > 4000) fails.push('over 4000 bytes');
      const w = b.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
      if (w < 80 || w > 300) fails.push(`word count ${w}`);
      for (const re of [/ultimate/i, /transform your life/i, /act now/i, /once in a lifetime/i, /hidden secrets/i, /won['’]t believe/i, /left behind/i, /isn['’]t just/i])
        if (re.test(b)) fails.push(`hype/slop left: ${re}`);
      for (const s of ['The Salt Ledger', 'Elias Vane', 'Halloran Point']) if (!b.includes(s)) fails.push(`fact lost: ${s}`);
      const lines = read(path.join(dir, 'hook.txt')).split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length !== 2) fails.push(`hook has ${lines.length} lines`);
      for (const l of lines) if (l.length > 40) fails.push(`hook line over 40 chars (${l.length}): ${l}`);
      if (/secret|never want you/i.test(lines.join(' '))) fails.push('hook still uses bait');
      return fails;
    },
  },
  {
    id: 'narrative-chapter',
    files: {
      'chapter1.md': `Daniel pushed the door open and stepped into the warehouse. The shadows seemed to crawl along the walls, and the shadows beneath the crane looked almost alive. Dust hung in the air. Dust coated the crates, dust drifted from the rafters, and more dust settled on his sleeves. A palpable tension hung in the air. He felt a shiver run down his spine.

Here's the thing: the ledger wasn't just a book, it was a death sentence. Marta had seen it first, or perhaps she only thought she had. Her heart pounded in her chest as she crossed the floor, and the shadow of the crane fell over her like a shroud. Daniel let out a breath he didn't know he was holding.

Three days later, in the harbor town of Brennock, Marta counted the coins on the kitchen table. The shadows were longer now.
`,
    },
    task:
      'chapter1.md is a fiction draft. Edit it in place following the project standards for narrative fiction, ' +
      'with the minimum effective change: keep the plot, names, places and the author\'s voice. ' +
      'The project linter and the project audit commands must come out clean.',
    requiresUsage: ['smooth-lint'],
    check({ root, dir, original }) {
      const fails = [];
      const f = path.join(dir, 'chapter1.md');
      const t = read(f);
      const r = lintJson(root, f);
      if (r.status !== 0) fails.push(`lint errors: ${r.issues.filter((i) => i.severity === 'error').map((i) => i.id)}`);
      const nar = r.issues.filter((i) => ['narrative', 'hesitation', 'throat'].includes(i.category ?? '') || /narrative|hesitation|throat/.test(i.id));
      if (nar.length) fails.push(`narrative issues left: ${nar.map((i) => i.id + ':' + i.match.trim())}`);
      if (r.quotaViolations.length) fails.push(`quota violations: ${r.quotaViolations.map((q) => `${q.word}x${q.count}`)}`);
      const au = sh('python3', [path.join(root, 'framework', 'scripts', 'lexicon_audit.py'), f], { cwd: dir });
      if (au.status !== 0) fails.push('lexicon_audit rejects the chapter');
      const sc = sh('python3', [path.join(root, 'framework', 'scripts', 'audit_scene_breaks.py'), f]);
      if (sc.status !== 0) fails.push('blind scene cut remains');
      if (!/^\* \* \*$/m.test(t)) fails.push('no dinkus');
      for (const n of ['Daniel', 'Marta', 'Brennock', 'ledger']) if (!t.includes(n)) fails.push(`lost: ${n}`);
      const keep = retained(original['chapter1.md'], t);
      if (keep < 0.6) fails.push(`over-edited: only ${(keep * 100).toFixed(0)}% of original words kept`);
      return fails;
    },
  },
  {
    id: 'novel-setup',
    files: {
      'chapter_01.md': 'Aria Voss crossed the harbor at dawn. The Ember Court had sealed the gates, and Aria Voss counted the guards twice.\n',
      'chapter_02.md': 'The Ember Court met at noon. Aria Voss refused the summons, and the Ember Court answered with fire.\n',
    },
    task:
      'This folder is a novel in progress. Set the project up for fiction using the framework\'s own setup command, ' +
      'protect the lore entities "Aria Voss" and "Ember Court" so the audit knows them, ' +
      'and register this metaphor from chapter 3 under the category "Setting Descriptions": "The sky bled copper over the harbor". ' +
      'Do not run anything interactive that waits for input.',
    requiresUsage: ['smooth-prose'],
    check({ dir }) {
      const fails = [];
      const cfgPath = path.join(dir, 'smooth-prose.config.json');
      if (!exists(cfgPath)) return ['no smooth-prose.config.json'];
      const cfg = JSON.parse(read(cfgPath));
      if (cfg.mode !== 'literature') fails.push(`mode is ${cfg.mode}`);
      const ents = (cfg.lore_protection?.protected_entities || []).join('|');
      if (!/Aria/.test(ents)) fails.push('Aria Voss not protected');
      if (!/Ember/.test(ents)) fails.push('Ember Court not protected');
      if (!exists(path.join(dir, 'Matriz_PreVuelo.md'))) fails.push('no pre-flight matrix');
      const reg = fs.readdirSync(dir).find((n) => /Registry|Registro/.test(n));
      if (!reg) fails.push('no metaphor registry');
      else {
        const rt = read(path.join(dir, reg));
        if (!rt.includes('The sky bled copper over the harbor')) fails.push('metaphor not recorded');
        if (!/Setting Descriptions/.test(rt)) fails.push('category missing');
        if (!/Ch\. 3/.test(rt)) fails.push('chapter 3 missing');
      }
      return fails;
    },
  },
  {
    id: 'release-notes',
    files: {
      'release-notes.md': `Let's be clear: v3.2.0 isn't just a patch, but a game-changer. It shipped on 14 March 2026 and cuts p95 latency from 480 ms to 310 ms. Unlock the potential of your pipeline and leverage synergies across teams. In today's fast-paced world, the upgrade is seamless.

"We delved into the data for six months," said Priya Nair, VP of Engineering.
`,
    },
    task:
      'release-notes.md are the notes for a software release. Make them follow the project standards, in place. ' +
      'Facts, numbers, dates and direct quotes must stay exactly as written. The project linter must pass.',
    requiresUsage: ['smooth-lint'],
    check({ root, dir }) {
      const f = path.join(dir, 'release-notes.md');
      const t = read(f);
      const fails = [];
      const r = lintJson(root, f);
      if (r.status !== 0) fails.push(`lint errors: ${r.issues.filter((i) => i.severity === 'error').map((i) => i.id)}`);
      for (const s of ['v3.2.0', '14 March 2026', '480 ms', '310 ms', '"We delved into the data for six months,"', 'Priya Nair', 'VP of Engineering'])
        if (!t.includes(s)) fails.push(`fact/quote altered: ${s}`);
      const outsideQuote = t.replace(/"[^"]*"/g, '');
      for (const re of [/game-changer/i, /unlock/i, /synerg/i, /fast-paced/i, /seamless/i, /let['’]s be clear/i, /isn['’]t just/i])
        if (re.test(outsideQuote)) fails.push(`slop left: ${re}`);
      return fails;
    },
  },
  {
    id: 'precommit-hook',
    files: { 'README.txt': 'Empty repo. Hooks live in ./ci/.\n' },
    task:
      'Create an executable git pre-commit hook at ./ci/pre-commit that lints every staged Markdown file with the framework\'s linter ' +
      'and blocks the commit (non-zero exit) when any file has blocking errors. It must find the linter through the PATH ' +
      'variable or through the SMOOTH_LINT environment variable if set. Test it yourself in a throwaway git repo inside your folder.',
    requiresUsage: [],
    check({ root, dir }) {
      const fails = [];
      const hook = path.join(dir, 'ci', 'pre-commit');
      if (!exists(hook)) return ['no ci/pre-commit'];
      if (!(fs.statSync(hook).mode & 0o111)) fails.push('hook not executable');
      const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'sp-hook-'));
      const env = { ...process.env, PATH: `${path.join(root, 'bin')}:${process.env.PATH}`, SMOOTH_LINT: path.join(root, 'bin', 'smooth-lint') };
      const g = (...a) => sh('git', a, { cwd: repo, env });
      g('init', '-q'); g('config', 'user.email', 't@t'); g('config', 'user.name', 't');
      fs.writeFileSync(path.join(repo, 'bad.md'), "Here's the thing: it's not about speed, it's about trust.\n");
      g('add', 'bad.md');
      const bad = sh('bash', [hook], { cwd: repo, env });
      if (bad.status === 0) fails.push('hook let a bad file through');
      g('reset', '-q');
      fs.writeFileSync(path.join(repo, 'good.md'), 'Trust drives adoption.\n');
      g('add', 'good.md');
      const good = sh('bash', [hook], { cwd: repo, env });
      if (good.status !== 0) fails.push(`hook blocked a clean file (exit ${good.status}): ${good.stderr.slice(0, 120)}`);
      g('reset', '-q');
      const none = sh('bash', [hook], { cwd: repo, env });
      if (none.status !== 0) fails.push('hook fails with nothing staged');
      return fails;
    },
  },
];

export { usage, read, exists };
