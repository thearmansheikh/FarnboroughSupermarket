const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveSiteConfig, applySiteTemplate } = require('../src/site-config');

test('resolveSiteConfig provides launch-safe defaults', () => {
  const config = resolveSiteConfig({
    SITE_URL: 'https://www.example.com',
    LEGAL_NAME: 'Example Traders Ltd',
    FORMSUBMIT_ALIAS: 'abc123',
    FACEBOOK_URL: 'https://facebook.com/example',
    HALAL_CERTIFIER: 'Example Halal Board',
  });

  assert.equal(config.DOMAIN, 'https://www.example.com');
  assert.equal(config.LEGAL_NAME, 'Example Traders Ltd');
  assert.equal(config.FORMSUBMIT_ALIAS, 'abc123');
  assert.equal(config.FACEBOOK_URL, 'https://facebook.com/example');
  assert.equal(config.HALAL_CERTIFIER, 'Example Halal Board');
});

test('applySiteTemplate replaces placeholders in content', () => {
  const config = resolveSiteConfig({
    SITE_URL: 'https://www.example.com',
    LEGAL_NAME: 'Example Traders Ltd',
    FORMSUBMIT_ALIAS: 'abc123',
    FACEBOOK_URL: 'https://facebook.com/example',
    HALAL_CERTIFIER: 'Example Halal Board',
  });

  const html = 'Canonical: {{DOMAIN}} | Legal: {{LEGAL_NAME}} | Form: {{FORMSUBMIT_ALIAS}} | Facebook: {{FACEBOOK_URL}} | Halal: {{HALAL_CERTIFIER}}';
  const rendered = applySiteTemplate(html, config);

  assert.equal(rendered, 'Canonical: https://www.example.com | Legal: Example Traders Ltd | Form: abc123 | Facebook: https://facebook.com/example | Halal: Example Halal Board');
});
