// Crawls the built site and checks every internal link, image, script and stylesheet, plus external links.
// Run: npm run links
import fs from 'node:fs';
import path from 'node:path';
import { LinkChecker } from 'linkinator';
import { rootDir } from './lib/config.mjs';
import { startCheckSite } from './lib/browser.mjs';

// Sites that block automated requests: a 4xx from these says nothing about whether the link works for people.
const SKIP_EXTERNAL = [/facebook\.com/, /wa\.me/, /formsubmit\.co/, /g\.page/];
const SOFT_STATUS = new Set([401, 403, 405, 429, 999]);

const site = await startCheckSite({ env: { WHATSAPP_NUMBER: '+447700900123', GOOGLE_REVIEWS_URL: 'https://www.google.com/maps' } });
const checker = new LinkChecker();
const origin = new URL(site.url).origin;

const result = await checker.check({
  path: site.url,
  recurse: true,
  timeout: 15000,
  retry: true,
  linksToSkip: SKIP_EXTERNAL.map((pattern) => pattern.source),
});

await site.close();
fs.rmSync(path.join(rootDir, 'dist-check'), { recursive: true, force: true });

const broken = result.links.filter((link) => link.state === 'BROKEN' && !(!link.url.startsWith(origin) && SOFT_STATUS.has(link.status)));
const internal = result.links.filter((link) => link.url.startsWith(origin)).length;

if (broken.length) {
  console.error(`${broken.length} broken link(s):\n`);
  for (const link of broken) console.error(`  ${link.status} ${link.url}\n    found on ${link.parent}`);
  process.exit(1);
}

console.log(`Links: ${result.links.length} checked (${internal} internal, ${result.links.length - internal} external), 0 broken.`);
