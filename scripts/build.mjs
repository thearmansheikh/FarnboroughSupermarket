import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig, missingOwnerValues, rootDir as projectRoot } from './lib/config.mjs';
import { offerTokens } from './lib/offers.mjs';
import { loadPhotos } from './lib/photos.mjs';
import { loadPages, sitemapXml } from './lib/pages.mjs';
import { renderPage, renderText } from './lib/render.mjs';

const CHECKED_EXTENSIONS = ['.html', '.xml', '.txt', '.webmanifest', '.json', '.js', '.css', '.svg'];
const TEMPLATED_EXTENSIONS = ['.txt', '.webmanifest', '.xml'];

// Compiles Tailwind utilities for the pages and partials into one minified file.
function compileCss(rootDir, outFile) {
  const cli = path.join(rootDir, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
  const args = [
    cli,
    '-c', path.join(rootDir, 'tailwind.config.cjs'),
    '-i', path.join(rootDir, 'src', 'tailwind.css'),
    '-o', outFile,
    '--minify',
  ];

  execFileSync(process.execPath, args, { cwd: rootDir, stdio: ['ignore', 'ignore', 'pipe'] });
}

function copyPublic(src, dest, config) {
  fs.mkdirSync(dest, { recursive: true });

  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    const ext = path.extname(entry.name).toLowerCase();

    if (entry.isDirectory()) copyPublic(from, to, config);
    else if (TEMPLATED_EXTENSIONS.includes(ext)) fs.writeFileSync(to, renderText(fs.readFileSync(from, 'utf8'), config));
    else fs.copyFileSync(from, to);
  }
}

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]);
}

// Throws when any "{{...}}" placeholder survives into the output.
export function assertNoPlaceholders(outDir) {
  const problems = [];

  for (const file of listFiles(outDir)) {
    if (!CHECKED_EXTENSIONS.includes(path.extname(file).toLowerCase())) continue;

    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\{\{[^}]*\}\}/g)) {
      problems.push(`${path.relative(outDir, file)}: ${match[0]}`);
    }
  }

  if (problems.length) throw new Error(`Unresolved placeholders in build output:\n  ${problems.join('\n  ')}`);
}

// Builds the deployable site: public/ assets + rendered pages + sitemap + CSS, written to outDir.
export function build({ rootDir = projectRoot, outDir = path.join(rootDir, 'dist'), config = loadConfig(), css = true } = {}) {
  fs.rmSync(outDir, { recursive: true, force: true });
  copyPublic(path.join(rootDir, 'public'), outDir, config);
  const photosDir = path.join(rootDir, 'assets', 'photos');
  if (fs.existsSync(photosDir)) {
    fs.cpSync(photosDir, path.join(outDir, 'images', 'photos'), { recursive: true, filter: (source) => !source.endsWith('index.json') });
  }

  const pages = loadPages(rootDir);
  const partialsDir = path.join(rootDir, 'src', 'partials');
  const context = { tokens: offerTokens(rootDir), photos: loadPhotos(rootDir) };
  for (const page of pages) {
    fs.writeFileSync(path.join(outDir, page.fileName), renderPage(page, config, partialsDir, context));
  }

  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml(pages, config, rootDir));
  if (css) compileCss(rootDir, path.join(outDir, 'tailwind.css'));

  assertNoPlaceholders(outDir);
  return { config, pages };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { config, pages } = build();
  console.log(`Built ${pages.length} pages for ${config.siteUrl} into dist/`);

  const missing = missingOwnerValues(config);
  if (missing.length) console.warn(`Owner values still empty: ${missing.join(', ')}`);
}
