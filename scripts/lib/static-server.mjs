import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { rootDir } from './config.mjs';

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

// A small static file server for the built site that behaves like Vercel with this project's vercel.json:
// clean URLs, the listed redirects, the 404 page, the security headers and gzip.
//   productionLike: keep the Cache-Control headers from vercel.json (otherwise everything is no-cache)
export function createSiteServer({ distDir, productionLike = false, vercelFile = path.join(rootDir, 'vercel.json') }) {
  const vercel = JSON.parse(fs.readFileSync(vercelFile, 'utf8'));
  const redirects = (vercel.redirects || []).map((rule) => [rule.source, rule]);

  // "headers" rules whose source is "/(.*)" or a path prefix such as "/images/(.*)"; later rules win, as on Vercel.
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

  return http.createServer((req, res) => {
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
    const redirect = redirects.find(([source]) => source === requestPath);
    const location = redirect ? redirect[1].destination : cleaned !== requestPath ? cleaned || '/' : null;

    if (location) {
      res.writeHead(redirect && redirect[1].permanent === false ? 307 : 308, { Location: location });
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
        ...(productionLike ? {} : { 'Cache-Control': 'no-cache' }),
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
}

// Starts a server on a free port (or the given one) and resolves with { server, url, close }.
export function listen(server, port = 0) {
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => {
      const { port: actual } = server.address();
      resolve({ server, url: `http://127.0.0.1:${actual}`, port: actual, close: () => new Promise((done) => server.close(done)) });
    });
  });
}
