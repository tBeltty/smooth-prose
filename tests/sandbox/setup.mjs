#!/usr/bin/env node
// Builds a sandbox that imitates a user project with the framework installed and nothing else:
//   <root>/framework   copy of the tracked files (minus tests/), as an installed package would be
//   <root>/bin         smooth-lint / smooth-prose shims that log every call to <root>/usage.log
//   <root>/project/<scenario>/   fixtures the agent works on, plus <root>/project/CLAUDE.md
//   <root>/briefs/<scenario>.md  the prompt to give each agent
// Usage: node tests/sandbox/setup.mjs [root]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SCENARIOS } from './scenarios.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const root = path.resolve(process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'sp-sandbox-')));
fs.mkdirSync(root, { recursive: true });

const tracked = spawnSync('git', ['ls-files'], { cwd: REPO, encoding: 'utf8' }).stdout.split('\n').filter(Boolean);
for (const rel of tracked) {
  if (rel.startsWith('tests/') || rel.startsWith('.github/')) continue;
  const dest = path.join(root, 'framework', rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(REPO, rel), dest);
  fs.chmodSync(dest, fs.statSync(path.join(REPO, rel)).mode);
}

fs.mkdirSync(path.join(root, 'bin'), { recursive: true });
const shim = (name, cmd) => {
  const p = path.join(root, 'bin', name);
  fs.writeFileSync(p, `#!/usr/bin/env bash\necho "${name}|$PWD|$*" >> "${root}/usage.log"\nexec ${cmd} "$@"\n`);
  fs.chmodSync(p, 0o755);
};
shim('smooth-lint', `node "${root}/framework/bin/smooth-lint.mjs"`);
shim('smooth-prose', `python3 "${root}/framework/bin/smooth-prose"`);
fs.writeFileSync(path.join(root, 'usage.log'), '');

fs.mkdirSync(path.join(root, 'project'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'project', 'CLAUDE.md'),
  `# Project editorial setup

This project uses the Smooth Prose editorial framework.

- Framework (rules, skills, scripts): ${root}/framework
- CLI shims (use these absolute paths): ${root}/bin/smooth-lint and ${root}/bin/smooth-prose
- Core standard: ${root}/framework/rules/anti-slop-directive.md
- Domain skills: ${root}/framework/skills/<name>/SKILL.md (smooth-core, smooth-web, smooth-marketing, smooth-narrative)

## Editorial Standards (Smooth Prose)
- Absolute ban on binary contrasts ("not X, but Y").
- Never use throat-clearing openings ("Here's the thing:", "Let's be clear:").
- Every statement must pass the Portability Test (concrete facts, no generic filler).
- Minimum effective change: preserve human cadence and rough edges.
`
);

const originals = {};
fs.mkdirSync(path.join(root, 'briefs'), { recursive: true });
for (const s of SCENARIOS) {
  const dir = path.join(root, 'project', s.id);
  fs.mkdirSync(dir, { recursive: true });
  originals[s.id] = s.files;
  for (const [name, content] of Object.entries(s.files)) fs.writeFileSync(path.join(dir, name), content);
  fs.writeFileSync(
    path.join(root, 'briefs', `${s.id}.md`),
    `You are an editor/developer working in a user's project. Read ${root}/project/CLAUDE.md first and follow what it points to.

Rules of this environment:
- Work only inside ${dir}. You may run the CLI shims in ${root}/bin. Never edit anything under ${root}/framework.
- Use only shell and file tools. Do not use any skills, plugins or tools outside the project.
- Nothing interactive: never run a command that waits for keyboard input.

Task: ${s.task}

When finished, reply with at most 3 lines: what you changed and which framework commands you ran.`
  );
}
fs.writeFileSync(path.join(root, 'originals.json'), JSON.stringify(originals));
console.log(root);
