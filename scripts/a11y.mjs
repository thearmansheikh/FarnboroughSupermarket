// Runs axe-core (WCAG 2.0, 2.1 and 2.2 level A and AA, plus best practices) on every page in the real browser,
// at phone and desktop width, with the cookie banner open, after choosing, and with the mobile menu open.
// Run: npm run a11y
import fs from 'node:fs';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { rootDir } from './lib/config.mjs';
import { launchBrowser, PAGES, startCheckSite } from './lib/browser.mjs';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];

const site = await startCheckSite();
const browser = await launchBrowser();
const failures = [];
let scans = 0;

async function scan(page, label) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  scans++;

  for (const violation of violations) {
    for (const node of violation.nodes) {
      failures.push(`${label}: [${violation.impact}] ${violation.id}: ${violation.help}\n    ${node.target.join(' ')}\n    ${(node.failureSummary || '').split('\n').slice(0, 2).join(' ')}`);
    }
  }
}

for (const viewport of VIEWPORTS) {
  for (const route of PAGES) {
    // A fresh browser context per page, so the cookie banner shows on every page.
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();
    await page.goto(site.url + route, { waitUntil: 'networkidle' });
    await scan(page, `${viewport.name} ${route} (cookie banner open)`);

    await page.click('[data-cookie-reject]');
    await scan(page, `${viewport.name} ${route}`);

    if (viewport.name === 'phone') {
      await page.click('[data-nav-toggle]');
      await scan(page, `${viewport.name} ${route} (menu open)`);
    }

    if (route === '/contact') {
      await page.click('#contact-form [type=submit]');
      await scan(page, `${viewport.name} ${route} (form errors showing)`);
      await page.click('[data-map-load]');
      await page.waitForSelector('[data-map-frame] iframe');
      await scan(page, `${viewport.name} ${route} (map loaded)`);
    }

    if (route === '/gallery' && (await page.$('[data-gallery-open]'))) {
      await page.click('[data-gallery-open]');
      await scan(page, `${viewport.name} ${route} (lightbox open)`);
    }
    await context.close();
  }
}

await browser.close();
await site.close();
fs.rmSync(path.join(rootDir, 'dist-check'), { recursive: true, force: true });

if (failures.length) {
  console.error(`${failures.length} accessibility problem(s) in ${scans} scans:\n\n${failures.join('\n\n')}`);
  process.exit(1);
}
console.log(`Accessibility: 0 violations across ${scans} scans (${PAGES.length} pages x phone and desktop, plus open menu, banner, form errors, map).`);
