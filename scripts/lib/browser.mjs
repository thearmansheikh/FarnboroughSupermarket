import path from 'node:path';
import { chromium } from 'playwright';
import { build } from '../build.mjs';
import { loadConfig, rootDir } from './config.mjs';
import { createSiteServer, listen } from './static-server.mjs';

// Builds the site into a temporary-style folder (dist-check/) and serves it with the Vercel headers, so checks run
// against exactly what would be deployed. Owner values such as the FormSubmit alias are filled with test values so
// every part of every page (including the contact form) is present.
export async function startCheckSite({ env = {} } = {}) {
  const outDir = path.join(rootDir, 'dist-check');
  const server = createSiteServer({ distDir: outDir, productionLike: true });
  const { url, close } = await listen(server);

  build({
    outDir,
    config: loadConfig({ env: { SITE_URL: url, FORMSUBMIT_ALIAS: 'check-alias', ...env } }),
  });

  return { url, close };
}

// Uses the installed Chrome locally and Playwright's Chromium in CI (npx playwright install chromium).
export function launchBrowser() {
  return chromium.launch(process.env.CI ? {} : { channel: 'chrome' });
}

export const PAGES = ['/', '/about', '/products', '/offers', '/gallery', '/contact', '/privacy', '/thank-you'];
