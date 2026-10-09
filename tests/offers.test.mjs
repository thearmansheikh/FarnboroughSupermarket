import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';
import { loadConfig, rootDir } from '../scripts/lib/config.mjs';
import { currentOffers, loadOffers, londonToday, offerTokens } from '../scripts/lib/offers.mjs';

const offer = (overrides = {}) => ({
  title: 'Basmati rice 5kg',
  description: 'A family-size bag.',
  emoji: '🍚',
  wasPrice: 12.99,
  nowPrice: 9.99,
  validFrom: '2026-10-12',
  validUntil: '2026-10-18',
  ...overrides,
});

// A throwaway project root containing only what offers need.
function withOffers(offers, run) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-offers-'));
  try {
    fs.mkdirSync(path.join(root, 'data'));
    fs.writeFileSync(path.join(root, 'data', 'offers.json'), typeof offers === 'string' ? offers : JSON.stringify(offers));
    return run(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

test('londonToday uses UK time around midnight', () => {
  assert.equal(londonToday(new Date('2026-07-01T23:30:00Z')), '2026-07-02');
  assert.equal(londonToday(new Date('2026-01-01T23:30:00Z')), '2026-01-01');
});

test('only offers valid today are shown, soonest ending first', () => {
  const offers = [
    offer({ title: 'Later', validFrom: '2026-10-20', validUntil: '2026-10-25' }),
    offer({ title: 'Expired', validFrom: '2026-10-01', validUntil: '2026-10-10' }),
    offer({ title: 'B', validUntil: '2026-10-18' }),
    offer({ title: 'A', validUntil: '2026-10-15' }),
  ];

  assert.deepEqual(currentOffers(offers, '2026-10-14').map((item) => item.title), ['A', 'B']);
  assert.equal(currentOffers(offers, '2026-10-18')[0].title, 'B');
  assert.equal(currentOffers(offers, '2026-10-19').length, 0);
});

test('an empty list shows the friendly message and no cards', () => {
  withOffers([], (root) => {
    const tokens = offerTokens(root, '2026-10-14');
    assert.equal(tokens['@offers'], '');
    assert.equal(tokens['@offersEmpty'], '');
  });
});

test('cards show prices, was price and the valid-until date, and hide the empty message', () => {
  withOffers([offer()], (root) => {
    const tokens = offerTokens(root, '2026-10-14');

    assert.match(tokens['@offers'], /Basmati rice 5kg/);
    assert.match(tokens['@offers'], /£9\.99/);
    assert.match(tokens['@offers'], /Was <span class="line-through">£12\.99<\/span>/);
    assert.match(tokens['@offers'], /Valid until 18 Oct 2026/);
    assert.match(tokens['@offers'], /data-valid-until="2026-10-18"/);
    assert.equal(tokens['@offersEmpty'], ' hidden');
  });
});

test('the was price is optional and offer text is escaped', () => {
  withOffers([offer({ title: '<b>Tea</b> & more', wasPrice: undefined })], (root) => {
    const html = offerTokens(root, '2026-10-14')['@offers'];

    assert.doesNotMatch(html, /Was /);
    assert.match(html, /&lt;b&gt;Tea&lt;\/b&gt; &amp; more/);
  });
});

test('malformed offers stop the build with a clear message', () => {
  const cases = [
    [[offer({ nowPrice: '9.99' })], /nowPrice/],
    [[offer({ wasPrice: 5 })], /wasPrice/],
    [[offer({ validUntil: '2026-10-32' })], /validUntil/],
    [[offer({ validFrom: '2026-10-20', validUntil: '2026-10-18' })], /after/],
    [[offer({ title: '' })], /title/],
    [{ not: 'a list' }, /list/],
    ['{ broken json', /not valid JSON/],
  ];

  for (const [data, message] of cases) {
    withOffers(data, (root) => assert.throws(() => loadOffers(root), message));
  }
});

test('the real offers file is valid and the built page never shows an error message', () => {
  assert.doesNotThrow(() => loadOffers(rootDir));

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-offers-site-'));
  try {
    build({ outDir, config: loadConfig({ env: {} }), css: false });
    const html = fs.readFileSync(path.join(outDir, 'offers.html'), 'utf8');

    assert.doesNotMatch(html, /could not be loaded|offers-error/i);
    assert.match(html, /id="offers-empty"/);
    assert.match(html, /Ask in store for this week's deals\./);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
