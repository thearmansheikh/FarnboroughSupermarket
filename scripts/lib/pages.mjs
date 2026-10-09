import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { isNoindex, pagePathFor, parseFrontMatter } from './render.mjs';

export function loadPages(rootDir) {
  const pagesDir = path.join(rootDir, 'src', 'pages');

  return fs
    .readdirSync(pagesDir)
    .filter((file) => file.endsWith('.html'))
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)))
    .map((fileName) => {
      const { meta, body } = parseFrontMatter(fs.readFileSync(path.join(pagesDir, fileName), 'utf8'), fileName);
      return { fileName, meta, body };
    });
}

// Date (YYYY-MM-DD) of the last commit touching the file, or '' when git history is unavailable.
function lastModified(rootDir, relativePath) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', relativePath], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch {
    return '';
  }
}

// sitemap.xml with every indexable page (noindex pages and the 404 are left out).
export function sitemapXml(pages, config, rootDir) {
  const urls = pages
    .filter((page) => !isNoindex(page.meta) && page.fileName !== '404.html')
    .map((page) => {
      const lastmod = lastModified(rootDir, `src/pages/${page.fileName}`);
      return `  <url><loc>${config.siteUrl}${pagePathFor(page.fileName)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
    });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
