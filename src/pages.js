const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { pagePathFor } = require('./render');

const publicDir = path.resolve(__dirname, '..', 'public');

// Pages that should appear in the sitemap: every HTML page except noindex ones (404, thank-you).
function listIndexablePages(dir = publicDir) {
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.html'))
    .filter((file) => !/<meta[^>]+name="robots"[^>]+noindex/i.test(fs.readFileSync(path.join(dir, file), 'utf8')))
    .sort((a, b) => (a === 'index.html' ? -1 : b === 'index.html' ? 1 : a.localeCompare(b)));
}

// Date (YYYY-MM-DD) of the last commit touching the file, or '' when git history is unavailable.
function lastModified(file) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', file], {
      cwd: path.resolve(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString().trim();
  } catch (error) {
    return '';
  }
}

function sitemapXml(domain, dir = publicDir) {
  const urls = listIndexablePages(dir).map((file) => {
    const pagePath = pagePathFor(file);
    const lastmod = lastModified(path.join('public', file));
    const loc = pagePath === '/' ? `${domain}/` : `${domain}${pagePath}`;
    return `  <url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

module.exports = { listIndexablePages, sitemapXml };
