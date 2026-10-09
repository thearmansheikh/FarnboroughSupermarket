const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { resolveSiteConfig, applySiteTemplate, TEMPLATED_EXTENSIONS } = require('./site-config');
const { renderPage } = require('./render');
const { sitemapXml } = require('./pages');

const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const defaultOutDir = path.join(rootDir, 'dist');

// Compiles Tailwind utilities for the pages and partials into one minified file.
function compileCss(outFile) {
  const cli = path.join(rootDir, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
  execFileSync(process.execPath, [cli, '-i', path.join(rootDir, 'src', 'tailwind.css'), '-o', outFile, '--minify'], {
    cwd: rootDir,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
}

// Copies public/ into outDir, rendering pages (shared partials and {{PLACEHOLDER}} values),
// generating the sitemap and compiling the CSS.
function build(outDir = defaultOutDir, config = resolveSiteConfig()) {
  fs.rmSync(outDir, { recursive: true, force: true });

  const copyDir = (src, dest) => {
    fs.mkdirSync(dest, { recursive: true });

    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const from = path.join(src, entry.name);
      const to = path.join(dest, entry.name);
      const ext = path.extname(entry.name).toLowerCase();

      if (entry.isDirectory()) {
        copyDir(from, to);
      } else if (entry.name === 'tailwind.css') {
        continue;
      } else if (ext === '.html' && src === publicDir) {
        fs.writeFileSync(to, renderPage(fs.readFileSync(from, 'utf8'), entry.name, config));
      } else if (TEMPLATED_EXTENSIONS.includes(ext)) {
        fs.writeFileSync(to, applySiteTemplate(fs.readFileSync(from, 'utf8'), config));
      } else {
        fs.copyFileSync(from, to);
      }
    }
  };

  copyDir(publicDir, outDir);
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), sitemapXml(config.DOMAIN));
  compileCss(path.join(outDir, 'tailwind.css'));
  return config;
}

if (require.main === module) {
  if (process.argv.includes('--css-only')) {
    compileCss(path.join(publicDir, 'tailwind.css'));
    console.log('Compiled public/tailwind.css');
  } else {
    const config = build();
    console.log(`Built site for ${config.DOMAIN} into dist/`);

    if (!config.FORMSUBMIT_ALIAS) {
      console.warn('Warning: FORMSUBMIT_ALIAS is not set, so the contact form will not send enquiries.');
    }
  }
}

module.exports = { build, compileCss };
