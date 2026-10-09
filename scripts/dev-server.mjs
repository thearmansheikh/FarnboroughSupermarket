import fs from 'node:fs';
import path from 'node:path';
import { build } from './build.mjs';
import { loadConfig, rootDir } from './lib/config.mjs';
import { createSiteServer } from './lib/static-server.mjs';

const port = Number(process.env.PORT) || 3000;
const distDir = path.join(rootDir, 'dist');

// Canonical addresses use localhost while developing, so links and previews point at this server.
const devConfig = () => loadConfig({ env: { ...process.env, SITE_URL: process.env.SITE_URL || `http://localhost:${port}` } });

function rebuild() {
  try {
    build({ config: devConfig() });
    console.log('Rebuilt dist/');
  } catch (error) {
    console.error(`Build failed: ${error.message}`);
  }
}

rebuild();

// Rebuild when sources change (debounced; the build takes about a second).
let timer;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 300);
};
for (const dir of ['src', 'public', 'scripts', 'data', 'assets']) {
  fs.watch(path.join(rootDir, dir), { recursive: true }, schedule);
}
fs.watch(path.join(rootDir, 'site.config.json'), schedule);

// PRODUCTION_LIKE=1 keeps the cache headers from vercel.json (used for performance checks).
createSiteServer({ distDir, productionLike: Boolean(process.env.PRODUCTION_LIKE) }).listen(port, () => {
  console.log(`Site running at http://localhost:${port}`);
});
