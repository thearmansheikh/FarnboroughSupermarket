import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from './build.mjs';
import { loadConfig, rootDir } from './lib/config.mjs';

const port = Number(process.env.PORT) || 3000;
const distDir = path.join(rootDir, 'dist');
const vercel = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));

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
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

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

// vercel.json "headers" entries whose source is "/(.*)" or a path prefix such as "/images/(.*)".
function headersFor(requestPath) {
  const headers = {};

  for (const rule of vercel.headers || []) {
    const prefix = rule.source.replace(/\(\.\*\)$/, '');
    if (!requestPath.startsWith(prefix)) continue;
    for (const { key, value } of rule.headers) headers[key] = value;
  }

  return headers;
}

function resolveFile(requestPath) {
  const target = requestPath === '/' ? '/index.html' : requestPath;
  const filePath = path.resolve(distDir, `.${target}`);
  if (!filePath.startsWith(distDir)) return null;
  if (!path.extname(filePath) && fs.existsSync(`${filePath}.html`)) return `${filePath}.html`;
  return filePath;
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

  // Same rules as vercel.json: cleanUrls, no trailing slash, and the listed redirects.
  const cleaned = requestPath.replace(/\/index\.html$/, '/').replace(/\.html$/, '').replace(/(.)\/$/, '$1');
  const redirect = (vercel.redirects || []).find((rule) => rule.source === requestPath);
  const location = redirect ? redirect.destination : cleaned !== requestPath ? cleaned || '/' : null;

  if (location) {
    res.writeHead(redirect?.permanent === false ? 307 : 308, { Location: location });
    res.end();
    return;
  }

  const headers = headersFor(requestPath);
  const filePath = resolveFile(requestPath);

  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  const send = (file, data, status) => {
    const type = mimeTypes[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const compressible = /^(text\/|application\/(javascript|json|xml|manifest))|svg/.test(type);
    const gzip = compressible && /\bgzip\b/.test(req.headers['accept-encoding'] || '');

    res.writeHead(status, {
      ...headers,
      'Content-Type': type,
      // PRODUCTION_LIKE=1 keeps the cache headers from vercel.json (used for performance checks).
      ...(process.env.PRODUCTION_LIKE ? {} : { 'Cache-Control': 'no-cache' }),
      ...(compressible ? { Vary: 'Accept-Encoding' } : {}),
      ...(gzip ? { 'Content-Encoding': 'gzip' } : {}),
    });
    res.end(gzip ? gzipSync(data) : data);
  };

  fs.readFile(filePath, (error, data) => {
    if (!error) return send(filePath, data, 200);

    const notFound = path.join(distDir, '404.html');
    fs.readFile(notFound, (notFoundError, notFoundData) => {
      if (notFoundError) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found');
        return;
      }
      send(notFound, notFoundData, 404);
    });
  });
});

rebuild();

// Rebuild when sources change (debounced; the build takes about a second).
let timer;
for (const dir of ['src', 'public', 'scripts']) {
  fs.watch(path.join(rootDir, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 300);
  });
}
fs.watch(path.join(rootDir, 'site.config.json'), () => {
  clearTimeout(timer);
  timer = setTimeout(rebuild, 300);
});

server.listen(port, () => {
  console.log(`Site running at http://localhost:${port}`);
});
