import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from '../scripts/build.mjs';
import { loadConfig } from '../scripts/lib/config.mjs';

function render(env) {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-contact-'));
  try {
    build({ outDir, config: loadConfig({ env }), css: false });
    return {
      contact: fs.readFileSync(path.join(outDir, 'contact.html'), 'utf8'),
      thanks: fs.readFileSync(path.join(outDir, 'thank-you.html'), 'utf8'),
    };
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

const withForm = render({ SITE_URL: 'https://www.example.com', FORMSUBMIT_ALIAS: 'abc123' });
const formHtml = withForm.contact.match(/<form id="contact-form"[\s\S]*?<\/form>/)[0];

test('the form posts to the FormSubmit alias and the shop email is not in the form HTML', () => {
  assert.match(formHtml, /action="https:\/\/formsubmit\.co\/abc123" method="POST"/);
  assert.doesNotMatch(formHtml, /supermarketfarnborough@gmail\.com|mailto:/);
});

test('the form carries the FormSubmit hidden fields', () => {
  assert.match(formHtml, /name="_subject" value="New website enquiry"/);
  assert.match(formHtml, /name="_template" value="table"/);
  assert.match(formHtml, /name="_next" value="https:\/\/www\.example\.com\/thank-you"/);
  assert.match(formHtml, /name="_captcha" value="false"/);
});

test('the honeypot is hidden from people and assistive technology, with no visible label text', () => {
  const honeypot = formHtml.match(/<div class="honeypot"[\s\S]*?<\/div>/)[0];

  assert.match(honeypot, /aria-hidden="true"/);
  assert.match(honeypot, /name="_honey" tabindex="-1" autocomplete="off"/);
  assert.doesNotMatch(honeypot, /<label|Leave this field blank/);
  assert.doesNotMatch(withForm.contact, /Leave this field blank/);
});

test('fields have labels, types, limits and autocomplete', () => {
  assert.match(formHtml, /<label for="enquiry-name"/);
  assert.match(formHtml, /id="enquiry-name" type="text" name="name" autocomplete="name" maxlength="80" required/);
  assert.match(formHtml, /id="enquiry-email" type="email" name="email" autocomplete="email" maxlength="120" required/);
  assert.match(formHtml, /<textarea id="enquiry-message" name="message"[^>]*maxlength="2000"[^>]*required/);
  assert.match(formHtml, /id="contact-form-status"[^>]*role="status" aria-live="polite"/);
  for (const id of ['name', 'email', 'message']) assert.match(formHtml, new RegExp(`id="enquiry-${id}-error"`));
});

test('without a FormSubmit alias the page shows call and email instead of a form that cannot send', () => {
  const { contact } = render({});

  assert.doesNotMatch(contact, /<form id="contact-form"/);
  assert.doesNotMatch(contact, /formsubmit\.co/);
  assert.match(contact, /Online enquiries are being set up/);
  assert.match(contact, /href="tel:01252940815"/);
  assert.match(contact, /href="mailto:supermarketfarnborough@gmail\.com"/);
});

test('the thank-you page has hours, a call button, a link home, and is noindex', () => {
  const { thanks } = withForm;

  assert.match(thanks, /<meta name="robots" content="noindex,follow" \/>/);
  assert.match(thanks, /Mon–Sun, 7am to 10pm/);
  assert.match(thanks, /href="tel:01252940815"[^>]*>Call 01252 940815/);
  assert.match(thanks, /href="\/"[^>]*>Back to homepage/);
});

test('a Google reviews link appears in the footer, contact page and structured data only when configured', () => {
  const none = render({});
  const some = render({ GOOGLE_REVIEWS_URL: 'https://g.page/r/example/review?utm_source=x' });

  assert.doesNotMatch(none.contact, /Google reviews|See our reviews on Google/);
  assert.match(some.contact, /href="https:\/\/g\.page\/r\/example\/review"[^>]*>See our reviews on Google/);
  assert.match(some.contact, /href="https:\/\/g\.page\/r\/example\/review"[^>]*>Google reviews/);
  assert.match(some.contact, /"sameAs": \[\s*"https:\/\/www\.facebook\.com\/share\/1JGNKZoFTJ\/",\s*"https:\/\/g\.page\/r\/example\/review"/);
});
