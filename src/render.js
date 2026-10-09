const fs = require('fs');
const path = require('path');
const { applySiteTemplate } = require('./site-config');

const partialsDir = path.resolve(__dirname, 'partials');
const activeLink = ' class="text-brand-600" aria-current="page"';
const idleLink = ' class="hover:text-brand-500"';

function readPartial(name) {
  return fs.readFileSync(path.join(partialsDir, `${name}.html`), 'utf8');
}

// Replaces <!-- @include name --> with src/partials/name.html.
function applyIncludes(content) {
  return content.replace(/^[ \t]*<!--\s*@include\s+([\w-]+)\s*-->[ \t]*$/gm, (match, name) => readPartial(name).trimEnd());
}

// Marks the navigation entry for the current page, e.g. pagePath "/about".
function applyNavState(content, pagePath) {
  return content
    .replace(/ ?\{\{NAV:([^}]+)\}\}/g, (match, link) => (link === pagePath ? activeLink : idleLink))
    .replace(/\{\{NAVM:([^}]+)\}\}/g, (match, link) => (link === pagePath ? activeLink : ''))
    .replace(/\{\{AC:([^}]+)\}\}/g, (match, link) => (link === pagePath ? ' aria-current="page"' : ''));
}

// Maps a file name inside public/ to its clean URL path.
function pagePathFor(fileName) {
  const name = path.basename(fileName, '.html');
  return name === 'index' ? '/' : `/${name}`;
}

function renderPage(content, fileName, config) {
  const withIncludes = applyIncludes(String(content));
  const withNav = applyNavState(withIncludes, pagePathFor(fileName));
  return applySiteTemplate(withNav, config);
}

module.exports = { applyIncludes, applyNavState, pagePathFor, renderPage };
