// Runs every quality check in order and prints a summary. Exit code 1 if anything fails.
//   npm run check            all checks
//   npm run check -- --fast  skip the slow Lighthouse run
import { spawnSync } from 'node:child_process';
import { rootDir } from './lib/config.mjs';

const fast = process.argv.includes('--fast');
const node = (...args) => [process.execPath, ...args];

const STEPS = [
  { name: 'Unit tests', command: node('--test') },
  { name: 'Build (fails on any leftover {{placeholder}})', command: node('scripts/build.mjs') },
  { name: 'HTML validation', command: node('node_modules/html-validate/bin/html-validate.mjs', 'dist/*.html') },
  { name: 'Broken links', command: node('scripts/check-links.mjs') },
  { name: 'Accessibility (axe, WCAG 2.2 AA)', command: node('scripts/a11y.mjs') },
  { name: 'Browser smoke tests', command: node('--test', '--test-concurrency=1', 'tests/e2e/site.e2e.mjs') },
  ...(fast ? [] : [{ name: 'Lighthouse budgets (Performance >= 95, others 100)', command: node('scripts/lighthouse.mjs') }]),
];

const results = [];

for (const step of STEPS) {
  const started = Date.now();
  console.log(`\n=== ${step.name} ===`);
  const run = spawnSync(step.command[0], step.command.slice(1), { cwd: rootDir, stdio: 'inherit' });
  results.push({ name: step.name, ok: run.status === 0, seconds: Math.round((Date.now() - started) / 1000) });
}

console.log('\n=== Summary ===');
for (const result of results) console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name} (${result.seconds}s)`);

const failed = results.filter((result) => !result.ok);
if (failed.length) {
  console.error(`\n${failed.length} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll checks passed.');
