#!/usr/bin/env node
// Grades a sandbox built by setup.mjs. Usage: node tests/sandbox/grade.mjs <root> [scenario-id...]
import fs from 'node:fs';
import path from 'node:path';
import { SCENARIOS, usage } from './scenarios.mjs';

const root = path.resolve(process.argv[2] || '');
if (!fs.existsSync(path.join(root, 'originals.json'))) { console.error('not a sandbox root'); process.exit(2); }
const originals = JSON.parse(fs.readFileSync(path.join(root, 'originals.json'), 'utf8'));
const only = process.argv.slice(3);
let failed = 0;
for (const s of SCENARIOS.filter((x) => !only.length || only.includes(x.id))) {
  const dir = path.join(root, 'project', s.id);
  const fails = [];
  try { fails.push(...s.check({ root, dir, original: originals[s.id] })); }
  catch (e) { fails.push(`grader error: ${e.message}`); }
  for (const tool of s.requiresUsage) if (!usage(root, tool, dir)) fails.push(`framework not used: no ${tool} call recorded`);
  if (fails.length) { failed++; console.log(`FAIL  ${s.id}\n${fails.map((f) => '      - ' + f).join('\n')}`); }
  else console.log(`PASS  ${s.id}`);
}
const calls = fs.readFileSync(path.join(root, 'usage.log'), 'utf8').split('\n').filter(Boolean).length;
console.log(`\n${failed ? failed + ' failed' : 'all passed'} (${calls} framework CLI calls logged)`);
process.exit(failed ? 1 : 0);
