// Lighthouse (mobile) on the key pages against budgets: Performance >= 95, everything else 100.
// Saves HTML reports to reports/. Run: npm run lighthouse
import fs from 'node:fs';
import path from 'node:path';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';
import { rootDir } from './lib/config.mjs';
import { startCheckSite } from './lib/browser.mjs';

const PAGES = [['home', '/'], ['products', '/products'], ['gallery', '/gallery'], ['contact', '/contact']];
const BUDGETS = { performance: 95, accessibility: 100, 'best-practices': 100, seo: 100 };
const ATTEMPTS = 3; // Performance scores wobble a little between runs; the best of a few is what we budget on.

const reportsDir = path.join(rootDir, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

const site = await startCheckSite();
const chrome = await launch({
  chromePath: process.env.CHROME_PATH || (process.env.CI ? chromium.executablePath() : undefined),
  chromeFlags: ['--headless=new', '--no-sandbox'],
});

const failures = [];
const rows = [];

for (const [name, route] of PAGES) {
  let best;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    const run = await lighthouse(site.url + route, { port: chrome.port, output: 'html', logLevel: 'error' }, {
      extends: 'lighthouse:default',
      settings: { onlyCategories: Object.keys(BUDGETS) },
    });
    const scores = Object.fromEntries(Object.entries(run.lhr.categories).map(([key, category]) => [key, Math.round(category.score * 100)]));

    if (!best || scores.performance > best.scores.performance) best = { scores, report: run.report, lhr: run.lhr };
    if (Object.entries(BUDGETS).every(([key, minimum]) => scores[key] >= minimum)) break;
  }

  fs.writeFileSync(path.join(reportsDir, `lighthouse-${name}.report.html`), best.report);
  const audit = (id) => best.lhr.audits[id].displayValue;
  rows.push({ name, ...best.scores, fcp: audit('first-contentful-paint'), lcp: audit('largest-contentful-paint'), tbt: audit('total-blocking-time'), si: audit('speed-index'), cls: audit('cumulative-layout-shift') });

  for (const [key, minimum] of Object.entries(BUDGETS)) {
    if (best.scores[key] < minimum) failures.push(`${name}: ${key} ${best.scores[key]} is below ${minimum}`);
  }
}

await chrome.kill();
await site.close();
fs.rmSync(path.join(rootDir, 'dist-check'), { recursive: true, force: true });

console.table(rows);
if (failures.length) {
  console.error(`Lighthouse budget failures:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('Lighthouse: all pages meet the budgets (Performance >= 95, others 100).');
