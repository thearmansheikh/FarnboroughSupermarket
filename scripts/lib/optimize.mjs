import fs from 'node:fs';
import path from 'node:path';
import { transformSync } from 'esbuild';

// Pieces of an HTML page that must keep their whitespace exactly as written.
const PRESERVE = /<(script|style|textarea|pre)\b[\s\S]*?<\/\1>/gi;

// Safe HTML minifier: drops comments and collapses runs of whitespace to a single space, which is what a
// browser does when it renders the page anyway. Scripts, styles, textareas and <pre> blocks are left alone.
export function minifyHtml(html) {
  const kept = [];
  const protectedHtml = html.replace(PRESERVE, (block) => {
    kept.push(block);
    return `\u0000${kept.length - 1}\u0000`;
  });

  const minified = protectedHtml
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(<(?:html|head|body|header|footer|main|section|nav|ul|ol|li|div|article|figure|aside|dialog|details|picture|meta|link|title|h[1-6]|p|hr|br|form|label|button|input|textarea|script)\b[^>]*>) /g, '$1')
    .replace(/ (<\/?(?:html|head|body|header|footer|main|section|nav|ul|ol|li|div|article|figure|aside|dialog|details|picture|meta|link|title|h[1-6]|p|hr|br|form|label|button|input|textarea|script)\b)/g, '$1')
    .trim();

  return minified.replace(/\u0000(\d+)\u0000/g, (match, index) => kept[Number(index)]);
}

export const minifyCss = (css) => transformSync(css, { loader: 'css', minify: true, legalComments: 'none' }).code;
export const minifyJs = (js) => transformSync(js, { loader: 'js', minify: true, target: 'es2020', legalComments: 'none' }).code;

// Merges Tailwind output and styles.css into one minified site.css, minifies every script, and minifies pages.
// One stylesheet means one request instead of two.
export function optimizeOutput(outDir) {
  const cssParts = ['tailwind.css', 'styles.css']
    .map((file) => path.join(outDir, file))
    .filter((file) => fs.existsSync(file));
  const combined = cssParts.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  for (const file of cssParts) fs.rmSync(file);
  fs.writeFileSync(path.join(outDir, 'site.css'), minifyCss(combined));

  for (const file of fs.readdirSync(outDir).filter((name) => name.endsWith('.js'))) {
    const target = path.join(outDir, file);
    fs.writeFileSync(target, minifyJs(fs.readFileSync(target, 'utf8')));
  }

  for (const file of fs.readdirSync(outDir).filter((name) => name.endsWith('.html'))) {
    const target = path.join(outDir, file);
    fs.writeFileSync(target, minifyHtml(fs.readFileSync(target, 'utf8')));
  }
}
