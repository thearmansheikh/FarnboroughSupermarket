const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { build } = require('../src/build');
const { resolveSiteConfig } = require('../src/site-config');

const config = resolveSiteConfig({
  SITE_URL: 'https://www.example.com',
  LEGAL_NAME: 'Example Traders Ltd',
  FORMSUBMIT_ALIAS: 'abc123',
  FACEBOOK_URL: 'https://facebook.com/example',
  HALAL_CERTIFIER: 'Example Halal Board',
});

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-site-'));
build(outDir, config);
test.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

const pages = fs.readdirSync(outDir).filter((file) => file.endsWith('.html'));
const read = (file) => fs.readFileSync(path.join(outDir, file), 'utf8');
const vercel = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'vercel.json'), 'utf8'));

// Resolves a site-relative link to a file in the built output, honouring clean URLs and redirects.
function resolves(href) {
  const target = href.split('#')[0].split('?')[0];
  if (target === '' || target === '/') return true;
  if (vercel.redirects.some((redirect) => redirect.source === target)) return true;
  const file = target.replace(/^\//, '');
  return fs.existsSync(path.join(outDir, file)) || fs.existsSync(path.join(outDir, `${file}.html`));
}

test('every page has a title, description and one h1', () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /<title>[^<]{10,70}<\/title>/, `${page} title`);
    assert.match(html, /<meta name="description" content="[^"]{50,170}"/, `${page} description`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${page} h1 count`);
    assert.match(html, /<html lang="en-GB">/, `${page} lang`);
  }
});

test('indexable pages have a canonical URL on the configured domain', () => {
  for (const page of pages.filter((file) => !/noindex/.test(read(file)))) {
    const canonical = read(page).match(/<link rel="canonical" href="([^"]+)"/);
    assert.ok(canonical, `${page} canonical`);
    assert.ok(canonical[1].startsWith('https://www.example.com'), `${page} canonical domain`);
  }
});

test('internal links and assets resolve', () => {
  for (const page of pages) {
    const html = read(page);
    for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*|#[^"]*)"/g)) {
      if (href.startsWith('#')) {
        assert.ok(html.includes(`id="${href.slice(1)}"`), `${page} anchor ${href}`);
      } else {
        assert.ok(resolves(href), `${page} links to missing ${href}`);
      }
    }
  }
});

test('built output has no unresolved placeholders or template tokens', () => {
  for (const page of pages) {
    assert.doesNotMatch(read(page), /\{\{[A-Za-z_:/]+\}\}|@include/, page);
  }
});

test('pages share the header and footer, and mark the current page', () => {
  assert.match(read('about.html'), /<a href="\/about" class="text-brand-600" aria-current="page">About<\/a>/);
  assert.doesNotMatch(read('about.html'), /<a href="\/products" class="text-brand-600"/);
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /class="skip-link"/, `${page} skip link`);
    assert.match(html, /<main id="main"/, `${page} main`);
    assert.match(html, /<footer id="site-footer"/, `${page} footer`);
  }
});

test('sitemap lists only indexable pages on the configured domain', () => {
  const sitemap = read('sitemap.xml');
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.ok(locs.includes('https://www.example.com/'));
  assert.ok(locs.includes('https://www.example.com/contact'));
  assert.ok(!locs.some((loc) => /404|thank-you|checkout|success/.test(loc)));
  assert.equal(locs.length, pages.filter((file) => !/noindex/.test(read(file))).length);
});

test('no page loads third-party scripts, fonts or images', () => {
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /<script[^>]+src="https?:/, `${page} external script`);
    assert.doesNotMatch(html, /<link[^>]+href="https?:\/\/(fonts|cdn)/, `${page} external stylesheet`);
  }
  assert.doesNotMatch(read('styles.css'), /unsplash|https?:\/\//);
});

test('every image has alt text', () => {
  for (const page of pages) {
    for (const [tag] of read(page).matchAll(/<img\b[^>]*>/g)) {
      assert.match(tag, /\balt="[^"]+"/, `${page}: ${tag.slice(0, 60)}`);
    }
  }
});

test('robots.txt points at the sitemap and the contact form posts to FormSubmit', () => {
  assert.match(read('robots.txt'), /Sitemap: https:\/\/www\.example\.com\/sitemap\.xml/);
  assert.match(read('contact.html'), /action="https:\/\/formsubmit\.co\/abc123"/);
});

test('vercel config sends security headers and a CSP without inline scripts', () => {
  const headers = Object.fromEntries(vercel.headers[0].headers.map((header) => [header.key, header.value]));

  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.ok(headers['Referrer-Policy']);
  assert.match(headers['Content-Security-Policy'], /script-src 'self'(;|$)/);
  assert.doesNotMatch(headers['Content-Security-Policy'], /unsafe-eval|script-src[^;]*unsafe-inline/);
});

test('legacy shop URLs redirect to /products', () => {
  for (const source of ['/shop', '/shop.html', '/checkout', '/checkout.html', '/success', '/success.html']) {
    assert.ok(vercel.redirects.some((redirect) => redirect.source === source && redirect.destination === '/products'), source);
  }
});
