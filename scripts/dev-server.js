const http = require('http');
const fs = require('fs');
const path = require('path');
const { resolveSiteConfig, applySiteTemplate, TEMPLATED_EXTENSIONS } = require('../src/site-config');
const { renderPage } = require('../src/render');
const { sitemapXml } = require('../src/pages');

const port = process.env.PORT || 3000;
const publicDir = path.resolve(__dirname, '..', 'public');
const siteConfig = resolveSiteConfig();

// Mirror the permanent redirects in vercel.json.
const vercelConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'vercel.json'), 'utf8'));
const redirects = Object.fromEntries(vercelConfig.redirects.map((redirect) => [redirect.source, redirect.destination]));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

// Mirror Vercel's cleanUrls: /about serves about.html.
function resolveFile(requestPath) {
  const trimmed = requestPath.length > 1 ? requestPath.replace(/\/$/, '') : requestPath;
  const candidate = trimmed === '/' ? '/index.html' : trimmed;
  const filePath = path.resolve(publicDir, `.${candidate}`);

  if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) {
    return `${filePath}.html`;
  }

  return filePath;
}

function sendFile(res, filePath, data, status = 200) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  let body = data;

  if (ext === '.html') {
    body = renderPage(data.toString('utf8'), path.basename(filePath), siteConfig);
  } else if (TEMPLATED_EXTENSIONS.includes(ext)) {
    body = applySiteTemplate(data.toString('utf8'), siteConfig);
  }

  res.writeHead(status, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  });

  res.end(body);
}

const server = http.createServer((req, res) => {
  let requestPath;
  try {
    requestPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad request');
    return;
  }

  if (redirects[requestPath]) {
    res.writeHead(308, { Location: redirects[requestPath] });
    res.end();
    return;
  }

  if (requestPath === '/sitemap.xml') {
    res.writeHead(200, { 'Content-Type': mimeTypes['.xml'], 'Cache-Control': 'no-cache' });
    res.end(sitemapXml(siteConfig.DOMAIN));
    return;
  }

  const filePath = resolveFile(requestPath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (!err) {
      sendFile(res, filePath, data);
      return;
    }

    const notFoundPath = path.join(publicDir, '404.html');
    fs.readFile(notFoundPath, (notFoundErr, notFoundData) => {
      if (notFoundErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }

      sendFile(res, notFoundPath, notFoundData, 404);
    });
  });
});

server.listen(port, () => {
  console.log(`Homepage running at http://localhost:${port}`);
});
