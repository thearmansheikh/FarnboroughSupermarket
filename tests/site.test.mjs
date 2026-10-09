import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build, assertNoPlaceholders } from '../scripts/build.mjs';
import { loadConfig, rootDir } from '../scripts/lib/config.mjs';

const config = loadConfig({
  env: {
    SITE_URL: 'https://www.example.com',
    LEGAL_NAME: 'Example Traders Ltd',
    FORMSUBMIT_ALIAS: 'abc123',
    FACEBOOK_URL: 'https://facebook.com/example?mibextid=xyz',
  },
});

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-site-'));
build({ outDir, config });
test.after(() => fs.rmSync(outDir, { recursive: true, force: true }));

const pages = fs.readdirSync(outDir).filter((file) => file.endsWith('.html'));
const read = (file) => fs.readFileSync(path.join(outDir, file), 'utf8');
const isIndexable = (file) => !/<meta name="robots" content="[^"]*noindex/.test(read(file));
const vercel = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));

// Resolves a site-relative link to a file in the built output, honouring clean URLs and redirects.
function resolves(href) {
  const target = href.split('#')[0].split('?')[0];
  if (target === '' || target === '/') return true;
  if (vercel.redirects.some((redirect) => redirect.source === target)) return true;
  const file = target.replace(/^\//, '');
  return fs.existsSync(path.join(outDir, file)) || fs.existsSync(path.join(outDir, `${file}.html`));
}

test('the build output has no {{placeholders}} or include markers', () => {
  assertNoPlaceholders(outDir);
  for (const page of pages) assert.doesNotMatch(read(page), /@include|\{\{/, page);
});

test('the build fails when a placeholder is left in a page', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-root-'));
  const out = path.join(root, 'dist');

  try {
    for (const dir of ['src', 'public']) fs.cpSync(path.join(rootDir, dir), path.join(root, dir), { recursive: true });
    fs.appendFileSync(path.join(root, 'src', 'pages', 'about.html'), '\n<p>{{NOT_A_REAL_TOKEN}}</p>\n');
    assert.throws(() => build({ rootDir: root, outDir: out, config, css: false }), /NOT_A_REAL_TOKEN/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('every page has the header, footer, skip link and exactly one nav and one h1', () => {
  assert.equal(pages.length, 9);

  for (const page of pages) {
    const html = read(page);
    assert.equal((html.match(/<nav[\s>]/g) || []).length, 1, `${page} nav count`);
    assert.equal((html.match(/<header[\s>]/g) || []).length, 1, `${page} header`);
    assert.equal((html.match(/<footer[\s>]/g) || []).length, 1, `${page} footer`);
    assert.equal((html.match(/<h1[\s>]/g) || []).length, 1, `${page} h1`);
    assert.match(html, /class="skip-link"/, `${page} skip link`);
    assert.match(html, /<main id="main"/, `${page} main`);
    assert.match(html, /<html lang="en-GB">/, `${page} lang`);
  }
});

test('indexable pages have an absolute canonical and og:url matching their path', () => {
  for (const page of pages.filter(isIndexable)) {
    const html = read(page);
    const expected = page === 'index.html' ? 'https://www.example.com/' : `https://www.example.com/${page.replace('.html', '')}`;

    assert.ok(html.includes(`<link rel="canonical" href="${expected}" />`), `${page} canonical`);
    assert.ok(html.includes(`<meta property="og:url" content="${expected}" />`), `${page} og:url`);
  }
});

test('noindex pages (404, thank-you) are marked and have no canonical', () => {
  for (const page of ['404.html', 'thank-you.html']) {
    assert.match(read(page), /<meta name="robots" content="noindex,follow" \/>/, page);
    assert.doesNotMatch(read(page), /rel="canonical"/, page);
  }
});

test('titles and descriptions are present and a sensible length', () => {
  for (const page of pages) {
    const html = read(page);
    const title = html.match(/<title>([^<]+)<\/title>/)[1].replace(/&amp;/g, '&');
    const description = html.match(/<meta name="description" content="([^"]+)"/)[1];

    assert.ok(title.length >= 10 && title.length <= 60, `${page} title length ${title.length}: ${title}`);
    assert.ok(description.length >= 50 && description.length <= 155, `${page} description length ${description.length}: ${description}`);
  }
});

test('the nav marks the current page', () => {
  assert.match(read('about.html'), /<a href="\/about" class="text-brand-600" aria-current="page">About<\/a>/);
  assert.doesNotMatch(read('about.html'), /<a href="\/products" class="text-brand-600"/);
  assert.match(read('index.html'), /<a href="\/" class="text-brand-600" aria-current="page">Home<\/a>/);
});

test('opening hours come from the config and are identical everywhere', () => {
  const allowed = new Set(['7am', '10pm', '7:00am', '10:00pm']);

  for (const page of pages) {
    const html = read(page).replace(/<script[\s\S]*?<\/script>/g, '');
    for (const [time] of html.matchAll(/\b\d{1,2}(?::\d{2})?\s?(?:am|pm)\b/gi)) {
      assert.ok(allowed.has(time), `${page} has unexpected time "${time}"`);
    }
  }

  assert.match(read('contact.html'), /Mon–Sun, 7am – 10pm/);
  assert.match(read('index.html'), /Open daily, 7am to 10pm/);
  assert.match(read('index.html'), /"opens": "07:00"/);
  assert.match(read('index.html'), /"closes": "22:00"/);
});

test('contact details and the Facebook link come from the config, without tracking', () => {
  for (const page of pages) {
    const html = read(page);
    assert.match(html, /href="tel:01252940815"/, `${page} tel`);
    assert.doesNotMatch(html, /mibextid/, `${page} tracking`);
  }

  assert.match(read('index.html'), /href="https:\/\/facebook\.com\/example"/);
  assert.match(read('contact.html'), /action="https:\/\/formsubmit\.co\/abc123"/);
  assert.match(read('contact.html'), /value="https:\/\/www\.example\.com\/thank-you"/);
});

test('the privacy page names the controller from the config', () => {
  assert.match(read('privacy.html'), /<strong>Example Traders Ltd, trading as Farnborough Supermarket<\/strong> is the data controller/);
  assert.match(read('privacy.html'), /Last updated: 6 October 2026\./);
});

test('structured data parses as JSON and uses the configured site', () => {
  for (const page of pages) {
    const blocks = [...read(page).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
    assert.ok(blocks.length >= 1, `${page} json-ld`);
    for (const [, json] of blocks) JSON.parse(json);
  }

  const store = JSON.parse(read('index.html').match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(store['@type'], 'GroceryStore');
  assert.equal(store.telephone, '+441252940815');
  assert.deepEqual(store.sameAs, ['https://facebook.com/example']);

  const breadcrumbs = read('about.html').match(/BreadcrumbList[\s\S]*?<\/script>/)[0];
  assert.match(breadcrumbs, /https:\/\/www\.example\.com\/about/);
});

const jsonLd = (page) => [...read(page).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));

test('the business record carries logo, price range, product catalogue and no coordinates unless confirmed', () => {
  const [store] = jsonLd('index.html');

  assert.equal(store.logo, 'https://www.example.com/icon-512.png');
  assert.equal(store.priceRange, '£');
  assert.equal(store.hasOfferCatalog.itemListElement.length, 6);
  assert.equal(store.geo, undefined);
  assert.equal(store.areaServed.name, 'Farnborough');
});

test('the contact page has an FAQ section and matching FAQPage structured data', () => {
  const html = read('contact.html');
  const faq = jsonLd('contact.html').find((block) => block['@type'] === 'FAQPage');

  assert.ok(faq, 'FAQPage json-ld');
  assert.ok(faq.mainEntity.length >= 4);
  for (const { name, acceptedAnswer } of faq.mainEntity) {
    assert.ok(html.includes(`<summary>${name.replace(/&/g, '&amp;')}</summary>`), `FAQ question on page: ${name}`);
    assert.ok(acceptedAnswer.text.length > 20);
  }

  const hours = faq.mainEntity.find((item) => /opening hours/i.test(item.name));
  assert.match(hours.acceptedAnswer.text, /Mon–Sun, 7am to 10pm/);
  assert.match(hours.acceptedAnswer.text, /01252 940815/);
  assert.equal(jsonLd('about.html').filter((block) => block['@type'] === 'FAQPage').length, 0);
});

test('the icon set and web manifest are complete', () => {
  const manifest = JSON.parse(read('site.webmanifest'));

  assert.equal(manifest.theme_color, '#165a35');
  assert.deepEqual(manifest.icons.map((icon) => icon.sizes), ['192x192', '512x512', '512x512']);
  for (const icon of manifest.icons) assert.ok(fs.existsSync(path.join(outDir, icon.src)), icon.src);
  for (const file of ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png']) {
    assert.ok(fs.existsSync(path.join(outDir, file)), file);
  }
});

test('the 404 page is branded with helpful links and a call button', () => {
  const html = read('404.html');

  for (const href of ['/', '/products', '/offers', '/contact']) assert.ok(html.includes(`href="${href}"`), href);
  assert.match(html, /href="tel:01252940815"/);
  assert.match(html, /<header[\s>]/);
});

test('sitemap lists only indexable pages on the configured domain', () => {
  const locs = [...read('sitemap.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.ok(locs.includes('https://www.example.com/'));
  assert.ok(locs.includes('https://www.example.com/contact'));
  assert.ok(!locs.some((loc) => /404|thank-you|checkout|success/.test(loc)));
  assert.equal(locs.length, pages.filter(isIndexable).length);
  assert.match(read('robots.txt'), /Sitemap: https:\/\/www\.example\.com\/sitemap\.xml/);
});

test('internal links, anchors and assets resolve', () => {
  for (const page of pages) {
    const html = read(page);
    for (const [, href] of html.matchAll(/(?:href|src)="(\/[^"]*|#[^"]*)"/g)) {
      if (href.startsWith('#')) assert.ok(html.includes(`id="${href.slice(1)}"`), `${page} anchor ${href}`);
      else assert.ok(resolves(href), `${page} links to missing ${href}`);
    }
  }
});

test('no page loads third-party scripts, fonts or images, and every image has alt text', () => {
  for (const page of pages) {
    const html = read(page);
    assert.doesNotMatch(html, /<script[^>]+src="https?:/, `${page} external script`);
    assert.doesNotMatch(html, /<link[^>]+href="https?:\/\/(fonts|cdn)/, `${page} external stylesheet`);
    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) assert.match(tag, /\balt="[^"]+"/, `${page}: ${tag.slice(0, 60)}`);
  }

  assert.doesNotMatch(read('styles.css'), /unsplash|https?:\/\//);
});

test('the products page keeps its category chips out of the nav landmark', () => {
  assert.match(read('products.html'), /<div role="group" aria-label="Product categories"/);
});

test('vercel config builds dist with no framework preset and sends security headers', () => {
  assert.equal(vercel.framework, null);
  assert.equal(vercel.outputDirectory, 'dist');
  assert.equal(vercel.buildCommand, 'node scripts/build.mjs');

  const headers = Object.fromEntries(vercel.headers[0].headers.map((header) => [header.key, header.value]));
  assert.equal(headers['X-Content-Type-Options'], 'nosniff');
  assert.match(headers['Content-Security-Policy'], /script-src 'self'(;|$)/);
});

test('the CSP lets the contact form post to FormSubmit and be redirected back to this site', () => {
  const csp = vercel.headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value;
  const formAction = csp.match(/form-action ([^;]+)/)[1];

  // Chrome applies form-action to the redirect FormSubmit sends back to /thank-you, so 'self' is required.
  assert.match(formAction, /'self'/);
  assert.ok(formAction.includes('https://formsubmit.co'));
});

test('no file named like a server entry point exists where Vercel would pick it up', () => {
  for (const name of ['src/server.js', 'src/app.js', 'src/index.js', 'server.js', 'app.js', 'index.js']) {
    assert.ok(!fs.existsSync(path.join(rootDir, name)), `${name} would be detected as a Node app`);
  }
});

test('legacy shop URLs redirect to /products', () => {
  for (const source of ['/shop', '/shop.html', '/checkout', '/checkout.html', '/success', '/success.html']) {
    assert.ok(vercel.redirects.some((redirect) => redirect.source === source && redirect.destination === '/products'), source);
  }
});
