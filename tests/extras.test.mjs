import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';
import { loadConfig } from '../scripts/lib/config.mjs';
import { specialHoursHtml, storyHtml, validateSpecialHours } from '../scripts/lib/extras.mjs';
import { rootDir } from '../scripts/lib/config.mjs';

function render(env, mutate) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-extras-'));
  try {
    const config = mutate ? mutate(loadConfig({ env })) : loadConfig({ env });
    build({ outDir, config, css: false });
    const read = (file) => fs.readFileSync(path.join(outDir, file), 'utf8');
    return { index: read('index.html'), contact: read('contact.html'), products: read('products.html'), about: read('about.html'), assets: fs.readdirSync(path.join(outDir, 'assets')) };
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

const christmas = { from: '2026-12-25', to: '2026-12-25', label: 'Christmas Day', closed: true };
const shortDay = { from: '2026-12-24', to: '2026-12-24', label: 'Christmas Eve', opens: '09:00', closes: '18:00' };

test('special hours are validated with plain-English errors', () => {
  assert.doesNotThrow(() => validateSpecialHours([christmas, shortDay]));
  assert.throws(() => validateSpecialHours([{ ...christmas, from: '2026-12-31' }]), /"from" and "to"/);
  assert.throws(() => validateSpecialHours([{ ...christmas, label: '' }]), /label/);
  assert.throws(() => validateSpecialHours([{ from: '2026-12-24', to: '2026-12-24', label: 'X' }]), /closed|opens/);
  assert.throws(() => validateSpecialHours('nope'), /list/);
});

test('special-hours banners are hidden until their day, and expired ones are dropped at build time', () => {
  const html = specialHoursHtml([christmas, shortDay, { from: '2026-01-01', to: '2026-01-01', label: 'Old', closed: true }], '2026-10-09');

  assert.match(html, /data-special data-from="2026-12-25" data-to="2026-12-25" data-label="Christmas Day" data-closed="true" hidden>Christmas Day: we are closed\.</);
  assert.match(html, /Christmas Eve: open 9am to 6pm\./);
  assert.match(html, /data-opens="09:00" data-closes="18:00"/);
  assert.doesNotMatch(html, /Old/);
  assert.equal(specialHoursHtml([], '2026-10-09'), '');
});

test('pages carry the opening hours for the live status and a static fallback', () => {
  const { index, contact } = render({});

  assert.match(index, /<body[^>]*data-opens="07:00" data-closes="22:00"/);
  assert.match(index, /data-open-wrapper[^>]*>.*<span data-open-status>Open daily, 7am to 10pm<\/span>/);
  assert.match(contact, /<span class="open-line" data-open-wrapper hidden>/);
  assert.ok(render({}).assets.some((file) => /^status\.[0-9a-f]{10}\.js$/.test(file)));
});

test('special hours from the config appear on every page', () => {
  const { index } = render({}, (config) => ({ ...config, specialHours: [{ ...christmas, from: '2099-12-25', to: '2099-12-25' }] }));

  assert.match(index, /class="special-hours" role="status" data-special/);
});

test('the quick-action bar has Call and Directions, and WhatsApp only when a number is set', () => {
  const without = render({});
  const withWhatsapp = render({ WHATSAPP_NUMBER: '+44 7700 900123' });

  for (const html of [without.index, withWhatsapp.index]) {
    assert.match(html, /<aside class="action-bar" aria-label="Quick actions">/);
    assert.match(html, /href="tel:01252940815" class="action-bar__item"/);
    assert.match(html, /google\.com\/maps\/dir\/[^"]*" target="_blank" rel="noopener noreferrer" class="action-bar__item"/);
  }
  assert.doesNotMatch(without.index, /wa\.me/);
  assert.match(withWhatsapp.index, /href="https:\/\/wa\.me\/447700900123"[^>]*class="action-bar__item"/);
  assert.equal((without.index.match(/<nav[\s>]/g) || []).length, 1);
});

test('the products page has sticky category chips', () => {
  assert.match(render({}).products, /<div role="group" aria-label="Product categories" class="category-chips /);
});

test('the about story comes from data/story.json and is escaped', () => {
  const html = storyHtml(rootDir);

  assert.match(html, /^<p class="mt-5 text-lg text-slate-600">Our supermarket/);
  assert.ok(html.includes('<p class="mt-5 text-slate-600">Whether you need'));

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-story-'));
  try {
    fs.mkdirSync(path.join(root, 'data'));
    fs.writeFileSync(path.join(root, 'data', 'story.json'), JSON.stringify({ paragraphs: ['We opened in <2020> & grew.', '  ', 'Second.'] }));
    assert.equal(storyHtml(root).match(/<p /g).length, 2);
    assert.match(storyHtml(root), /We opened in &lt;2020&gt; &amp; grew\./);
    fs.writeFileSync(path.join(root, 'data', 'story.json'), JSON.stringify({ paragraphs: 'text' }));
    assert.throws(() => storyHtml(root), /paragraphs/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  assert.match(render({}).about, /Our supermarket was created/);
});

test('print styles hide the page chrome and the form', () => {
  const css = fs.readFileSync(path.join(rootDir, 'public', 'styles.css'), 'utf8');
  const print = css.slice(css.indexOf('@media print'));

  for (const selector of ['header', 'footer', '.cookie-notice', '.action-bar', '#store-map', '#contact-form']) assert.ok(print.includes(selector), selector);
});

test('client scripts compute UK time without Intl, which blocks the main thread on phones', () => {
  for (const file of ['status.js', 'offers.js']) {
    const source = fs.readFileSync(path.join(rootDir, 'public', file), 'utf8');

    assert.doesNotMatch(source, /Intl/, file);
    assert.doesNotMatch(source, /toLocale/, file);
  }
});
