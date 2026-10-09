const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { build } = require('../src/build');
const { resolveSiteConfig, TEMPLATED_EXTENSIONS } = require('../src/site-config');

test('build leaves no placeholders in templated output files', (t) => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-build-'));
  t.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

  build(outDir, resolveSiteConfig({
    SITE_URL: 'https://www.example.com',
    LEGAL_NAME: 'Example Traders Ltd',
    FORMSUBMIT_ALIAS: 'abc123',
    FACEBOOK_URL: 'https://facebook.com/example',
    HALAL_CERTIFIER: 'Example Halal Board',
  }));

  const files = fs.readdirSync(outDir, { recursive: true })
    .filter((file) => TEMPLATED_EXTENSIONS.includes(path.extname(file).toLowerCase()));

  assert.ok(files.includes('index.html'));
  for (const file of files) {
    assert.doesNotMatch(fs.readFileSync(path.join(outDir, file), 'utf8'), /\{\{[A-Z_]+\}\}/, file);
  }

  assert.match(fs.readFileSync(path.join(outDir, 'robots.txt'), 'utf8'), /https:\/\/www\.example\.com/);
});

test('resolveSiteConfig falls back to the Vercel production hostname', () => {
  const config = resolveSiteConfig({ SITE_URL: '', DOMAIN: '', VERCEL_PROJECT_PRODUCTION_URL: 'farnborough.vercel.app' });

  assert.equal(config.DOMAIN, 'https://farnborough.vercel.app');
});
