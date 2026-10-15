// Deterministic claim tests. Run: node --test tests/
// A `todo` test asserts a README claim that the code does not meet yet:
// it is reported but does not fail the suite. Remove `todo` once fixed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LINT = path.join(ROOT, 'bin', 'smooth-lint.mjs');
const CLI = path.join(ROOT, 'bin', 'smooth-prose');
const SCRIPTS = path.join(ROOT, 'scripts');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'sp-test-'));
const run = (cmd, args, opts = {}) =>
  spawnSync(cmd, args, { encoding: 'utf8', ...opts });
const lint = (text) => {
  const r = run('node', [LINT, '--json'], { input: text });
  return { status: r.status, ...JSON.parse(r.stdout) };
};
const ids = (res) => res.issues.map((i) => i.id);

// README "Before vs. After" table: every "before" must be flagged, every "after" must pass.
const BEFORE_AFTER = [
  {
    name: 'binary contrast + throat-clearing',
    before: "Let's be clear: the bottleneck isn't a lack of tools, but a failure of coordination.",
    after: 'Engineering bottlenecks stem from coordination friction across distributed teams.',
  },
  {
    name: 'vacuous hero slogan',
    before: 'Take your development workflow to the next level with cutting-edge AI.',
    after: 'Audit dependencies and detect vulnerabilities in your terminal before each deployment.',
  },
  {
    name: 'hype hook',
    before: 'Discover the hidden secrets top marketers never want you to know.',
    after: 'Tested 400 cold outreach emails. One single subject line change doubled replies.',
  },
  {
    name: 'hesitation weakeners',
    before: "The iron seemed to almost resist Daniel's desperate blow. Tension hung thick in the air.",
    after: "The iron resisted Daniel's blow. Cold sweat stung his knuckles.",
  },
];

for (const c of BEFORE_AFTER) {
  test(`lint flags README "before": ${c.name}`, () => {
    const r = lint(c.before);
    assert.ok(r.issues.length > 0, `no issue reported for: ${c.before}`);
  });
  test(`lint passes README "after": ${c.name}`, () => {
    const r = lint(c.after);
    assert.equal(r.issues.length, 0, JSON.stringify(ids(r)));
    assert.equal(r.status, 0);
  });
}

test('lint: README stdin example is flagged and exits 1', () => {
  const r = lint("Here's the thing: It's not about working harder, but working smarter.");
  assert.ok(ids(r).includes('throat-clearing-en'));
  assert.equal(r.status, 1);
});

test('lint: Spanish binary contrast + throat-clearing flagged', () => {
  const r = lint('Seamos claros: no es un problema de herramientas, sino de coordinación.');
  assert.deepEqual(new Set(ids(r)), new Set(['contrast-es', 'throat-clearing-es']));
});

test('lint: clean text exits 0, warnings alone do not block', () => {
  assert.equal(lint('El hierro resistió el golpe.').status, 0);
  const warn = lint('Hubo un silencio sepulcral.');
  assert.ok(ids(warn).includes('narrative-cliches-es'));
  assert.equal(warn.status, 0);
});

test('lint: file argument, missing file exits 1', () => {
  const d = tmp();
  fs.writeFileSync(path.join(d, 'a.md'), "Here's the thing: x.\n");
  assert.equal(run('node', [LINT, path.join(d, 'a.md')]).status, 1);
  assert.equal(run('node', [LINT, path.join(d, 'nope.md')]).status, 1);
});

test('lint: markdown code blocks and inline code are ignored', () => {
  const d = tmp();
  const f = path.join(d, 'a.md');
  fs.writeFileSync(f, "Texto limpio.\n\n```\nHere's the thing: x\n```\n\nY `Seamos claros:` inline.\n");
  assert.equal(run('node', [LINT, f]).status, 0);
});

test('lint: reports 1-based line numbers', () => {
  const r = lint("Linea uno.\nLinea dos.\nHere's the thing: tres.\n");
  assert.equal(r.issues[0].line, 3);
});

test('lint: lexical quotas (sombra max 2)', () => {
  const r = lint('La sombra cayó. Otra sombra. Una tercera sombra apareció.');
  assert.ok(r.quotaViolations.some((q) => q.word === 'sombra' && q.count === 3));
});

test('lint: proximity repetition detected', () => {
  const r = lint('El farol parpadeó junto al farol roto del muelle.');
  assert.ok(r.proximityIssues.some((p) => p.word === 'farol'));
});

test('lint: burstiness rates monotone text as synthetic, varied text as organic', () => {
  const mono = Array(8).fill('Esta frase tiene exactamente seis palabras.').join(' ');
  assert.equal(lint(mono).cadence.ratingKey, 'monotone');
  const varied =
    'No. ' +
    'Caminó durante horas por el muelle desierto sin encontrar a nadie que pudiera explicarle por qué las luces seguían encendidas después de tantos años. ' +
    'Nada. ' +
    'El mar respondió con un golpe seco contra los pilotes y después volvió a quedarse quieto como si esperara algo más de él.';
  assert.equal(lint(varied).cadence.ratingKey, 'organic');
});

test('catalog: valid, every rule has lang/severity/fix and a compiling regex', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'heuristics', 'slop-catalog.json'), 'utf8'));
  assert.ok(cat.rules.length > 0);
  const expand = (src) => src.replace(/\{\{(\w+)\}\}/g, (_, n) => {
    assert.ok(Array.isArray(cat.classes[n]), `unknown class ${n}`);
    return `(?:${cat.classes[n].join('|')})`;
  });
  for (const r of cat.rules) {
    assert.doesNotThrow(() => new RegExp(expand(r.regex), r.flags), r.id);
    assert.ok(['en', 'es'].includes(r.lang), `${r.id}: lang`);
    assert.ok(['error', 'warning', 'info'].includes(r.severity), `${r.id}: severity`);
    assert.ok(r.fix, `${r.id}: fix`);
  }
  assert.equal(new Set(cat.rules.map((r) => r.id)).size, cat.rules.length, 'duplicate rule ids');
});

test('catalog: no rule or class is tied to a product name or to the domain of a test fixture', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'heuristics', 'slop-catalog.json'), 'utf8'));
  const blob = JSON.stringify({ rules: cat.rules.map((r) => r.regex), classes: cat.classes }).toLowerCase();
  for (const w of ['torque', 'halyard', 'skerry', 'babysit', 'harness', 'agent', 'llm', 'microvm', 'langgraph'])
    assert.ok(!blob.includes(w), `catalog contains the fixture-specific word "${w}"`);
});

test('catalog: EN and ES cover the same categories', () => {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'heuristics', 'slop-catalog.json'), 'utf8'));
  const cats = (l) => new Set(cat.rules.filter((r) => r.lang === l).map((r) => r.category));
  for (const c of ['contrast', 'throat', 'jargon', 'narrative', 'closure', 'hesitation', 'hype', 'metric']) {
    assert.ok(cats('en').has(c), `en missing ${c}`);
    assert.ok(cats('es').has(c), `es missing ${c}`);
  }
  assert.ok(Object.keys(cat.quotas.en).length > 0 && Object.keys(cat.quotas.es).length > 0);
});

test('catalog: linter loads the catalog (single source of truth)', () => {
  assert.match(fs.readFileSync(LINT, 'utf8'), /slop-catalog/);
});

// Every rule gets a positive and a negative sample per language.
const SAMPLES = [
  ['contrast-en', "It's not about speed, it's about trust.", 'Trust drives adoption.'],
  ['contrast-en', 'It is not just a tool, it is a movement.', 'It is a tool.'],
  ['contrast-en', "The fix isn't a patch, but a rewrite of the parser.", 'The fix is a rewrite of the parser.'],
  ['throat-clearing-en', 'Intro line.\nMake no mistake: it breaks.', 'It breaks on empty input.'],
  ['llm-openers-en', "In today's fast-paced world, teams ship faster.", 'Teams ship faster with CI.'],
  ['llm-vocabulary-en', 'We delve into the logs and find a tapestry of errors.', 'We read the logs and find 12 errors.'],
  ['corporate-jargon-en', 'Unlock the potential and leverage synergies.', 'Cut the build time by 40%.'],
  ['marketing-hype-en', 'Discover the hidden secrets of growth.', 'We measured growth over 12 weeks.'],
  ['narrative-cliches-en', 'A shiver ran down his spine as tension hung in the air.', 'Her hands shook over the keys.'],
  ['pseudo-profound-en', 'Let that sink in.', 'Revenue grew 12% in Q3.'],
  ['hesitation-en', 'The iron seemed to resist the blow.', 'The iron resisted the blow.'],
  // Held-out wordings of each family (not taken from any observed output) plus legitimate uses that must stay quiet.
  ['slogan-template-en', 'Made for modern teams.', 'The binary is built for Linux and macOS.'],
  ['slogan-template-en', 'Built for serious developers.', 'Designed for modern web browsers.'],
  ['slogan-template-en', 'It keeps every pipeline on track.', 'The job keeps the cache on disk.'],
  ['slogan-template-en', 'Embark on a smarter workflow.', 'Run the installer, then restart the shell.'],
  ['slogan-template-en', 'A giant leap forward for builders.', 'The array grows by one element per call.'],
  ['slogan-template-en', 'No gimmicks, no hidden fees.', 'The license has no restrictions on commercial use.'],
  ['slogan-template-en', 'From prototype to production in minutes.', 'The migration runs from staging to production on Fridays.'],
  ['slogan-template-en', 'Everything your team needs in one place.', 'Your team needs a reviewer for each release.'],
  ['slogan-template-en', 'So you can focus on what matters.', 'Focus the camera on the label.'],
  ['slogan-template-en', "Whether you're a founder or an engineer, it fits.", 'Whether the test passes depends on the seed.'],
  ['social-proof-en', 'Why developers love it.', 'Two developers reported the bug; the issue links the logs.'],
  ['social-proof-en', 'Trusted by thousands of teams.', 'Used by the build server since March.'],
  ['social-proof-en', 'Join 10,000 developers today.', 'Join the meeting at 10:00.'],
  ['unsourced-metric-en', 'It delivers 14.2x faster throughput.', 'Median task time fell from 14.8 to 6.4 minutes on the 300-task benchmark.'],
  ['unsourced-metric-en', 'Cold start under 8ms.', 'The timeout is 8 seconds.'],
  ['unsourced-metric-en', 'Uptime of 99.98% nominal.', 'Uptime above 99% (measured monthly, see the status page).'],
  ['unsourced-metric-en', 'Throughput\n14.2x\nover the baseline', 'Throughput\nincreased over the baseline'],
  ['absolute-claim-en', 'Zero downtime, zero risk.', 'Downtime stayed under four minutes in March.'],
  ['absolute-claim-en', '100% secure by design.', 'Passwords are hashed with Argon2.'],
  ['absolute-claim-en', 'An unhackable vault.', 'A vault that rotates keys weekly.'],
  ['absolute-claim-en', 'It never crashes.', 'It retries three times before it fails.'],
  ['absolute-claim-en', 'Verified safe for every workload.', 'The workload was verified in staging.'],
  ['absolute-claim-en', 'Error-free deployments.', 'Deployments log their errors.'],
  ['competitor-strawman-en', 'Traditional frameworks lack observability.', 'Traditional Chinese text is supported.'],
  ['competitor-strawman-en', 'Why existing platforms fail.', 'Existing sessions keep their tokens.'],
  ['competitor-strawman-en', 'Unlike legacy tools, we log every step.', 'We log every step.'],
  ['competitor-strawman-en', 'Our runtime crushes the competition.', 'Our runtime compresses logs with zstd.'],
  ['competitor-strawman-en', 'Most tools are merely wrappers.', 'Most tools accept JSON input.'],
  ['hype-vocabulary-en', 'Military-grade encryption.', 'AES-256 encryption at rest.'],
  ['hype-vocabulary-en', 'Battle-tested in production.', 'Tested in staging on 12 March.'],
  ['hype-vocabulary-en', 'Lightning-fast builds.', 'Builds finish in 40 seconds on a 4-core runner.'],
  ['hype-vocabulary-en', 'Unrivalled performance.', 'Performance is tracked per release.'],
  ['slogan-template-es', 'Diseñado para equipos exigentes.', 'El binario está diseñado para Linux y macOS.'],
  ['slogan-template-es', 'De la idea a producción en minutos.', 'La migración pasa de staging a producción los viernes.'],
  ['slogan-template-es', 'Sin trucos ni letra pequeña.', 'La licencia no tiene restricciones de uso comercial.'],
  ['unsourced-metric-es', 'Entrega 14x más rendimiento.', 'La latencia mediana bajó de 14,8 a 6,4 minutos en el benchmark de 300 tareas.'],
  ['unsourced-metric-es', 'Arranque en menos de 8 ms.', 'El tiempo de espera es de 8 segundos.'],
  ['absolute-claim-es', 'Cero fallos en cualquier carga.', 'La latencia mediana fue de 40 ms.'],
  ['absolute-claim-es', 'Un sistema impenetrable.', 'Un sistema con reintentos.'],
  ['competitor-strawman-es', 'Las herramientas existentes colapsan bajo carga.', 'Las colas de trabajo reintentan tres veces.'],
  ['competitor-strawman-es', 'A diferencia de otros arneses, registramos cada paso.', 'Registramos cada paso.'],
  ['hype-vocabulary-es', 'Un runtime de grado industrial.', 'Un runtime con cuarenta líneas de política.'],
  ['contrast-es', 'No es un problema técnico, sino de coordinación.', 'Es un problema de coordinación.'],
  ['throat-clearing-es', 'Seamos claros: falla.', 'Falla con entradas vacías.'],
  ['narrative-cliches-es', 'Hubo un silencio sepulcral.', 'Nadie habló.'],
  ['corporate-jargon-es', 'Hay que desempacar el problema.', 'Hay que analizar el problema.'],
  ['pseudo-profound-es', 'Piénsalo bien.', 'Las ventas subieron un 12%.'],
  ['hesitation-es', 'El hierro parecía resistir el golpe.', 'El hierro resistió el golpe.'],
];
for (const [id, bad, good] of SAMPLES) {
  test(`lint rule ${id}: flags "${bad.slice(0, 40).replace(/\n/g, ' ')}" and passes the clean version`, () => {
    assert.ok(ids(lint(bad)).includes(id), `${id} not triggered; got ${ids(lint(bad))}`);
    assert.ok(!ids(lint(good)).includes(id), `${id} false positive on clean text`);
  });
}

test('lint: --lang restricts rules, bad value exits 2, auto detects language', () => {
  const es = 'Seamos claros: no es un problema técnico, sino de coordinación.';
  const en = run('node', [LINT, '--json', '--lang', 'en'], { input: es });
  assert.equal(JSON.parse(en.stdout).issues.length, 0);
  assert.equal(JSON.parse(en.stdout).lang, 'en');
  assert.equal(lint(es).lang, 'es');
  assert.equal(lint("Here's the thing: the plan is in the repo and it works for the team.").lang, 'en');
  assert.equal(run('node', [LINT, '--lang', 'xx'], { input: 'hola' }).status, 2);
});

test('lint: the frontier-model landing fixture is flagged by the new rule families', () => {
  const r = JSON.parse(run('node', [LINT, '--json', path.join(ROOT, 'tests', 'fixtures', 'frontier-landing.txt')]).stdout);
  const by = (id) => r.issues.filter((i) => i.id === id).length;
  assert.ok(by('unsourced-metric-en') >= 8, `metrics: ${by('unsourced-metric-en')}`);
  assert.ok(by('absolute-claim-en') >= 3, 'absolutes');
  assert.ok(by('competitor-strawman-en') >= 2, 'strawmen');
  assert.ok(by('hype-vocabulary-en') >= 1, 'hype vocabulary');
  assert.equal(r.issues.filter((i) => i.severity === 'error').length, 0, 'new families are warnings, never blocking');
});

test('lint: direct quotes are shielded from every rule, the same words outside quotes are not', () => {
  const quoted = lint('"Here\'s the thing: we delved into the data, it is not about speed, but trust," said Priya Nair.');
  assert.equal(quoted.issues.length, 0, JSON.stringify(ids(quoted)));
  assert.ok(lint("Here's the thing: we delved into the data.").issues.length > 0);
  assert.equal(lint('«Seamos claros: no es velocidad, sino confianza», dijo Ana.').issues.length, 0);
});

test('lint: --facts exempts metrics the author supplied, and only those', () => {
  const d = tmp();
  const facts = path.join(d, 'brief.txt');
  fs.writeFileSync(facts, 'Our numbers: 61% smaller context, 34% lower spend.');
  const text = '61% smaller context and 34% lower spend. Also 14.2x faster.';
  const without = lint(text);
  assert.equal(without.issues.filter((i) => i.id === 'unsourced-metric-en').length, 3);
  const withFacts = JSON.parse(run('node', [LINT, '--json', '--facts', facts], { input: text }).stdout);
  const left = withFacts.issues.filter((i) => i.id === 'unsourced-metric-en').map((i) => i.match);
  assert.equal(left.length, 1);
  assert.match(left[0], /14\.2x/);
  assert.equal(run('node', [LINT, '--facts', path.join(d, 'nope.txt')], { input: 'x' }).status, 2);
});

test('lint: markdown lines marked as bad examples (❌ or "Avoid:") are not flagged', () => {
  const d = tmp();
  const f = path.join(d, 'a.md');
  fs.writeFileSync(f, '* Avoid: "Blazing fast performance", "Bank-grade security".\n- ❌ Zero downtime, 14.2x faster.\n\nPlain sentence.\n');
  const r = JSON.parse(run('node', [LINT, '--json', f]).stdout);
  assert.equal(r.issues.length, 0, JSON.stringify(r.issues.map((i) => i.id)));
});

test('lint: <!-- smooth-lint-disable --> regions are skipped in markdown', () => {
  const d = tmp();
  const f = path.join(d, 'a.md');
  fs.writeFileSync(f, "<!-- smooth-lint-disable -->\nHere's the thing: x.\n<!-- smooth-lint-enable -->\n\nTexto limpio.\n");
  assert.equal(run('node', [LINT, f]).status, 0);
  fs.writeFileSync(f, "<!-- smooth-lint-disable -->\nOk.\n<!-- smooth-lint-enable -->\n\nHere's the thing: x.\n");
  assert.equal(run('node', [LINT, f]).status, 1);
});

test('docs checked by CI lint clean', () => {
  for (const f of ['README.md', 'CONTRIBUTING.md', 'rules/anti-slop-directive.md']) {
    const hits = JSON.parse(run('node', [LINT, '--json', path.join(ROOT, f)]).stdout).issues.filter((i) => /metric|absolute|strawman|hype|landing|social/.test(i.id));
    assert.equal(hits.length, 0, `${f}: ${hits.map((i) => i.id + ':' + i.match.trim())}`);
    assert.equal(run('node', [LINT, path.join(ROOT, f)]).status, 0, f);
  }
});

test('cli: help, unknown command, missing file args', () => {
  assert.equal(run('python3', [CLI, 'help']).status, 0);
  assert.equal(run('python3', [CLI, 'bogus']).status, 1);
  assert.equal(run('python3', [CLI, 'audit']).status, 1);
  assert.equal(run('python3', [CLI, 'scenes']).status, 1);
});

test('cli: `lint` subcommand proxies exit code of smooth-lint', () => {
  const d = tmp();
  const f = path.join(d, 'bad.md');
  fs.writeFileSync(f, "Here's the thing: x.\n");
  assert.equal(run('python3', [CLI, 'lint', f]).status, 1);
});

test('cli: `init` exits non-zero on failure (propagates script status)', () => {
  const d = tmp();
  const r = run('python3', [CLI, 'init', '--mode', 'bogus'], { cwd: d });
  assert.notEqual(r.status, 0);
});

test('audit: flags banned lexicon / passes clean file', () => {
  const d = tmp();
  const clean = path.join(d, 'clean.md');
  fs.writeFileSync(clean, 'El hierro resistió el golpe.\n');
  assert.equal(run('python3', [path.join(SCRIPTS, 'lexicon_audit.py'), clean], { cwd: d }).status, 0);
});

test('audit: missing file prints usage and exits 1', () => {
  assert.equal(run('python3', [path.join(SCRIPTS, 'lexicon_audit.py'), '/nonexistent.md']).status, 1);
});

test('audit: reads .docx (stdlib zip fallback)', () => {
  const d = tmp();
  const f = path.join(d, 'a.docx');
  const py = `
import zipfile,sys
body='<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>El hierro resistió el golpe.</w:t></w:r></w:p></w:body></w:document>'
with zipfile.ZipFile(sys.argv[1],'w') as z:
    z.writestr('word/document.xml',body)
`;
  run('python3', ['-c', py, f]);
  const r = run('python3', [path.join(SCRIPTS, 'lexicon_audit.py'), f], { cwd: d });
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test('scenes: reports blind cuts, accepts dinkus', () => {
  const d = tmp();
  const ok = path.join(d, 'ok.md');
  fs.writeFileSync(ok, 'Primera escena.\n\n* * *\n\nSegunda escena.\n');
  const r = run('python3', [path.join(SCRIPTS, 'audit_scene_breaks.py'), ok]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /: 0\n/);
});

test('scenes: detects a blind time/place cut without dinkus (ES and EN)', () => {
  const d = tmp();
  const f = path.join(d, 'blind.md');
  fs.writeFileSync(
    f,
    'Daniel cerró la puerta y se quedó mirando la calle vacía.\n\nTres días después, en el puerto de Cádiz, Marta contaba las monedas.\n'
  );
  const r = run('python3', [path.join(SCRIPTS, 'audit_scene_breaks.py'), f]);
  assert.equal(r.status, 1);
  const g = path.join(d, 'blind-en.md');
  fs.writeFileSync(g, 'Daniel shut the door and watched the street.\n\nThree days later, at the harbor, Marta counted the coins.\n');
  assert.equal(run('python3', [path.join(SCRIPTS, 'audit_scene_breaks.py'), g]).status, 1);
});

for (const mode of ['universal', 'literature', 'marketing', 'web']) {
  test(`init --mode ${mode}: writes valid config with matching mode`, () => {
    const d = tmp();
    const r = run('python3', [path.join(SCRIPTS, 'init_project.py'), '--mode', mode, '--non-interactive'], { cwd: d });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const cfg = JSON.parse(fs.readFileSync(path.join(d, 'smooth-prose.config.json'), 'utf8'));
    assert.equal(cfg.mode, mode);
    for (const k of ['ban_binary_contrast', 'ban_throat_clearing', 'minimum_effective_change']) {
      assert.equal(cfg.rules[k], true, k);
    }
    assert.equal(fs.existsSync(path.join(d, 'Matriz_PreVuelo.md')), mode === 'literature');
  });
}

test('init: universal config matches the README example (globs, window 120)', () => {
  const d = tmp();
  run('python3', [path.join(SCRIPTS, 'init_project.py'), '--mode', 'universal', '--non-interactive'], { cwd: d });
  const cfg = JSON.parse(fs.readFileSync(path.join(d, 'smooth-prose.config.json'), 'utf8'));
  assert.equal(cfg.universal_scope.proximity_repetition_window, 120);
  assert.ok(cfg.universal_scope.globs.includes('**/*.docx'));
});

test('init: generated config does not point at a dead $schema URL', () => {
  const d = tmp();
  run('python3', [path.join(SCRIPTS, 'init_project.py'), '--mode', 'web', '--non-interactive'], { cwd: d });
  const cfg = JSON.parse(fs.readFileSync(path.join(d, 'smooth-prose.config.json'), 'utf8'));
  assert.equal(cfg.$schema, undefined);
});

test('record: appends metaphor under chapter + category, idempotent file creation', () => {
  const d = tmp();
  const r = run('python3', [CLI, 'record', '4', 'Agility', 'Slid like black oil across the cobbles'], { cwd: d });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const f = path.join(d, fs.readdirSync(d).find((n) => /Registry|Registro/.test(n)));
  assert.match(fs.readFileSync(f, 'utf8'), /black oil across the cobbles/);
  run('python3', [CLI, 'record', '5', 'Agility', 'Second one'], { cwd: d });
  const txt = fs.readFileSync(f, 'utf8');
  assert.match(txt, /Second one/);
  assert.match(txt, /black oil/);
});

test('record: too few args exits 1', () => {
  assert.equal(run('python3', [CLI, 'record', '4'], { cwd: tmp() }).status, 1);
});

test('zero-dependency claim: no third-party imports at module level', () => {
  const stdlib = new Set(['sys', 'os', 'subprocess', 're', 'json', 'argparse', 'zipfile', 'datetime', 'collections', 'pathlib', 'xml', 'glob', 'textwrap', 'shutil', 'time', 'i18n']);
  for (const f of fs.readdirSync(SCRIPTS).filter((n) => n.endsWith('.py'))) {
    const src = fs.readFileSync(path.join(SCRIPTS, f), 'utf8');
    for (const m of src.matchAll(/^(?:import|from)\s+([a-zA-Z_][\w]*)/gm)) {
      assert.ok(stdlib.has(m[1]), `${f}: unexpected top-level import ${m[1]}`);
    }
  }
  assert.equal(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).dependencies, undefined);
});

test('skills: each SKILL.md has name + description frontmatter matching its folder', () => {
  for (const s of fs.readdirSync(path.join(ROOT, 'skills'))) {
    const t = fs.readFileSync(path.join(ROOT, 'skills', s, 'SKILL.md'), 'utf8');
    const fm = t.match(/^---\n([\s\S]*?)\n---/);
    assert.ok(fm, `${s}: no frontmatter`);
    assert.match(fm[1], new RegExp(`name:\\s*${s}\\b`));
    assert.match(fm[1], /description:/);
  }
});

test('README: every relative link/path in the architecture tree exists', () => {
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  const links = [...readme.matchAll(/\]\(((?!https?:)[^)#]+)\)/g)].map((m) => m[1]);
  for (const l of links) assert.ok(fs.existsSync(path.join(ROOT, l)), `broken link: ${l}`);
});

test('README: KDP tag count matches the skill whitelist', () => {
  const skill = fs.readFileSync(path.join(ROOT, 'skills', 'smooth-marketing', 'SKILL.md'), 'utf8');
  const line = skill.split('\n').find((l) => l.includes('Permitted:'));
  const n = (line.match(/<\w+>/g) || []).length;
  assert.match(fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8'), new RegExp(`whitelist of ${n} allowed HTML tags`));
});
