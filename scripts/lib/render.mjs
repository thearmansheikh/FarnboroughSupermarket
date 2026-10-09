import fs from 'node:fs';
import path from 'node:path';
import { tokensFor } from './config.mjs';
import { breadcrumbJsonLd, groceryStoreJsonLd, jsonLdScript } from './structured-data.mjs';

const ACTIVE_LINK = ' class="text-brand-600" aria-current="page"';
const IDLE_LINK = ' class="hover:text-brand-500"';

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Splits "---\nkey: value\n---\nbody" into { meta, body }.
export function parseFrontMatter(source, label = 'page') {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) throw new Error(`${label} is missing its front matter block`);

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(':');
    if (separator < 1) throw new Error(`${label}: bad front matter line "${line}"`);
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  for (const key of ['title', 'description']) {
    if (!meta[key]) throw new Error(`${label}: front matter needs "${key}"`);
  }

  return { meta, body: source.slice(match[0].length) };
}

// Maps a page file name to its clean URL path.
export function pagePathFor(fileName) {
  const name = path.basename(fileName, '.html');
  return name === 'index' ? '/' : `/${name}`;
}

export function isNoindex(meta) {
  return /noindex/i.test(meta.robots || '');
}

function applyIncludes(content, partialsDir) {
  let output = content;

  for (let depth = 0; depth < 4 && /<!--\s*@include\s+[\w-]+\s*-->/.test(output); depth++) {
    output = output.replace(/^[ \t]*<!--\s*@include\s+([\w-]+)\s*-->[ \t]*$/gm, (match, name) =>
      fs.readFileSync(path.join(partialsDir, `${name}.html`), 'utf8').replace(/\r\n/g, '\n').trimEnd());
  }

  return output;
}

function applyNavState(content, pagePath) {
  return content
    .replace(/ ?\{\{NAV:([^}]+)\}\}/g, (match, link) => (link === pagePath ? ACTIVE_LINK : IDLE_LINK))
    .replace(/\{\{NAVM:([^}]+)\}\}/g, (match, link) => (link === pagePath ? ACTIVE_LINK : ''))
    .replace(/\{\{AC:([^}]+)\}\}/g, (match, link) => (link === pagePath ? ' aria-current="page"' : ''));
}

function pageTokens(page, config) {
  const { meta, fileName } = page;
  const pagePath = pagePathFor(fileName);
  const pageUrl = `${config.siteUrl}${pagePath}`;
  const noindex = isNoindex(meta);
  const jsonLd = [groceryStoreJsonLd(config)];
  if (meta.breadcrumb) jsonLd.push(breadcrumbJsonLd(config, meta.breadcrumb, pagePath));

  const scripts = (meta.scripts ? meta.scripts.split(',').map((name) => name.trim()).filter(Boolean) : [])
    .concat('theme.js')
    .map((name) => `<script src="/${name}"></script>`)
    .join('\n    ');

  return {
    '@title': escapeHtml(meta.title),
    '@description': escapeHtml(meta.description),
    '@ogTitle': escapeHtml(meta.ogTitle || meta.title),
    '@ogDescription': escapeHtml(meta.ogDescription || meta.description),
    '@pageUrl': escapeHtml(pageUrl),
    '@robots': noindex ? `<meta name="robots" content="${escapeHtml(meta.robots)}" />` : '',
    '@canonical': noindex ? '' : `<link rel="canonical" href="${escapeHtml(pageUrl)}" />`,
    '@jsonld': jsonLd.map(jsonLdScript).join('\n'),
    '@scripts': scripts,
  };
}

// Renders one page (front matter + body) into a complete HTML document.
export function renderPage(page, config, partialsDir) {
  const layout = fs.readFileSync(path.join(partialsDir, 'layout.html'), 'utf8').replace(/\r\n/g, '\n');
  let html = applyIncludes(layout.replace('{{@content}}', () => page.body.trim()), partialsDir);

  const special = pageTokens(page, config);
  html = html.replace(/\{\{(@\w+)\}\}/g, (match, key) => (key in special ? special[key] : match));
  html = applyNavState(html, pagePathFor(page.fileName));

  const tokens = tokensFor(config);
  return html.replace(/\{\{([A-Z_0-9]+)\}\}/g, (match, key) => (key in tokens ? escapeHtml(tokens[key]) : match));
}

// Replaces {{TOKEN}} values in non-page text files (robots.txt, site.webmanifest, ...).
export function renderText(content, config) {
  const tokens = tokensFor(config);
  return content.replace(/\{\{([A-Z_0-9]+)\}\}/g, (match, key) => (key in tokens ? tokens[key] : match));
}
