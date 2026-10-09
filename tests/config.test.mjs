import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanUrl, formatTime, loadConfig, missingOwnerValues, tokensFor } from '../scripts/lib/config.mjs';

test('formatTime renders friendly 12-hour labels', () => {
  assert.equal(formatTime('07:00'), '7am');
  assert.equal(formatTime('22:00'), '10pm');
  assert.equal(formatTime('07:30'), '7:30am');
  assert.equal(formatTime('00:00'), '12am');
  assert.equal(formatTime('12:00'), '12pm');
  assert.equal(formatTime('07:00', true), '7:00am');
});

test('cleanUrl strips tracking parameters and rejects non-http URLs', () => {
  assert.equal(
    cleanUrl('https://www.facebook.com/share/1JGNKZoFTJ/?mibextid=wwXIfr'),
    'https://www.facebook.com/share/1JGNKZoFTJ/',
  );
  assert.equal(cleanUrl('https://example.com/page?id=7&utm_source=x&fbclid=y#top'), 'https://example.com/page?id=7');
  assert.equal(cleanUrl('javascript:alert(1)'), '');
  assert.equal(cleanUrl('not a url'), '');
  assert.equal(cleanUrl(''), '');
});

test('loadConfig lets environment variables override site.config.json', () => {
  const config = loadConfig({
    env: {
      SITE_URL: 'https://www.example.co.uk/',
      LEGAL_NAME: 'Example Traders Ltd',
      FACEBOOK_URL: 'https://facebook.com/example?mibextid=abc',
      FORMSUBMIT_ALIAS: 'abc123',
      WHATSAPP_NUMBER: '+44 7700 900123',
    },
  });

  assert.equal(config.siteUrl, 'https://www.example.co.uk');
  assert.equal(config.legalName, 'Example Traders Ltd');
  assert.equal(config.facebookUrl, 'https://facebook.com/example');
  assert.equal(config.formsubmitAlias, 'abc123');
  assert.equal(config.whatsappNumber, '447700900123');
});

test('loadConfig rejects a site URL with a path', () => {
  assert.throws(() => loadConfig({ env: { SITE_URL: 'https://example.com/shop' } }), /siteUrl/);
});

test('shipped config uses a clean Facebook URL and the confirmed hours', () => {
  const config = loadConfig({ env: {} });
  const tokens = tokensFor(config);

  assert.doesNotMatch(config.facebookUrl, /\?/);
  assert.equal(tokens.HOURS_SHORT, '7am to 10pm');
  assert.equal(tokens.HOURS_LONG, '7:00am – 10:00pm');
  assert.equal(tokens.PHONE_TEL, '01252940815');
  assert.equal(tokens.ADDRESS_ONE_LINE, '99 Eastmead, Farnborough GU14 7SA');
});

test('LEGAL_ENTITY reads naturally with and without a separate legal name', () => {
  assert.equal(tokensFor(loadConfig({ env: {} })).LEGAL_ENTITY, 'Farnborough Supermarket');
  assert.equal(
    tokensFor(loadConfig({ env: { LEGAL_NAME: 'Example Traders Ltd' } })).LEGAL_ENTITY,
    'Example Traders Ltd, trading as Farnborough Supermarket',
  );
});

test('missingOwnerValues lists the empty owner values', () => {
  const missing = missingOwnerValues(loadConfig({ env: { LEGAL_NAME: 'X Ltd' } }));

  assert.ok(missing.includes('FORMSUBMIT_ALIAS'));
  assert.ok(!missing.includes('LEGAL_NAME'));
});
