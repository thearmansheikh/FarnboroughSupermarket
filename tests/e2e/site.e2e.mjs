// Browser smoke tests: the built site, served with the Vercel headers, driven in a real browser.
// Run: npm run e2e   (needs Chrome locally, or `npx playwright install chromium` in CI)
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { rootDir } from '../../scripts/lib/config.mjs';
import { launchBrowser, PAGES, startCheckSite } from '../../scripts/lib/browser.mjs';

const site = await startCheckSite({ env: { WHATSAPP_NUMBER: '+447700900123' } });
const browser = await launchBrowser();
test.after(async () => {
  await browser.close();
  await site.close();
  fs.rmSync(path.join(rootDir, 'dist-check'), { recursive: true, force: true });
});

// Runs a test body with a fresh page (and so a fresh cookie/storage state) at a phone or desktop size.
async function withPage(run, { width = 1280, height = 900, consent = true, time } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, locale: 'en-GB', timezoneId: 'Europe/London' });
  if (consent) {
    await context.addInitScript(() => localStorage.setItem('farnborough-cookie-consent-v2', JSON.stringify({ essential: true, analytics: false, marketing: false, maps: false })));
  }
  const page = await context.newPage();
  const problems = [];
  page.on('console', (message) => ['error', 'warning'].includes(message.type()) && problems.push(`${message.type()}: ${message.text()}`));
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  if (time) await page.clock.install({ time: new Date(time) });

  try {
    await run(page, problems);
  } finally {
    await context.close();
  }
}

test('every page loads with status 200, a title and one h1, and no console or CSP errors', async () => {
  await withPage(async (page, problems) => {
    for (const route of PAGES) {
      const response = await page.goto(site.url + route, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200, route);
      assert.ok((await page.title()).length > 5, `${route} title`);
      assert.equal(await page.locator('h1').count(), 1, `${route} h1`);
    }
    assert.deepEqual(problems, []);
  });
});

test('the header navigation reaches every page', async () => {
  await withPage(async (page) => {
    await page.goto(site.url + '/');
    for (const [label, route] of [['About', '/about'], ['Products', '/products'], ['Offers', '/offers'], ['Gallery', '/gallery'], ['Contact', '/contact'], ['Home', '/']]) {
      await page.locator('header nav').getByRole('link', { name: label, exact: true }).click();
      await page.waitForURL(site.url + route);
      assert.equal(await page.locator('header nav [aria-current="page"]').innerText(), label);
    }
  });
});

test('the mobile menu opens, traps focus, closes with Esc and returns focus', async () => {
  await withPage(async (page) => {
    await page.goto(site.url + '/');
    const toggle = page.locator('[data-nav-toggle]');
    const menu = page.locator('[data-mobile-menu]');

    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    await toggle.click();
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
    assert.ok(await menu.isVisible());

    // Tab all the way round (forwards, then backwards): focus must stay in the header, never reaching the page behind.
    const stops = await menu.locator('a').count();
    for (let i = 0; i < stops + 4; i++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => document.querySelector('header').contains(document.activeElement)), 'focus escaped the menu (forwards)');
    }
    for (let i = 0; i < stops + 4; i++) {
      await page.keyboard.press('Shift+Tab');
      assert.ok(await page.evaluate(() => document.querySelector('header').contains(document.activeElement)), 'focus escaped the menu (backwards)');
    }

    await page.keyboard.press('Escape');
    assert.ok(!(await menu.isVisible()));
    assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
    assert.ok(await page.evaluate(() => document.activeElement === document.querySelector('[data-nav-toggle]')));
  }, { width: 390, height: 800 });
});

test('an unknown address shows the branded 404 page with a 404 status', async () => {
  await withPage(async (page) => {
    const response = await page.goto(site.url + '/no-such-page');

    assert.equal(response.status(), 404);
    assert.match(await page.textContent('h1'), /couldn't find that page/);
    assert.ok(await page.locator('header').isVisible());
    assert.ok(await page.getByRole('link', { name: 'Products' }).first().isVisible());
  });
});

test('old shop addresses redirect permanently to /products', async () => {
  await withPage(async (page) => {
    for (const old of ['/shop', '/shop.html', '/checkout', '/success']) {
      const response = await page.request.get(site.url + old, { maxRedirects: 0 });
      assert.equal(response.status(), 308, old);
      assert.equal(response.headers().location, '/products', old);
    }
    await page.goto(site.url + '/about.html');
    assert.equal(new URL(page.url()).pathname, '/about');
  });
});

test('the offers page shows the friendly message and never an error', async () => {
  await withPage(async (page) => {
    await page.goto(site.url + '/offers', { waitUntil: 'networkidle' });
    const body = await page.textContent('body');

    assert.match(body, /Ask in store for this week's deals\./);
    assert.doesNotMatch(body, /could not be loaded|error|undefined|NaN/i);
    assert.ok(await page.locator('#offers-empty').isVisible());
  });
});

test('the map loads only after a click, and never before consent', async () => {
  await withPage(async (page) => {
    const googleRequests = [];
    page.on('request', (request) => request.url().includes('google.com') && googleRequests.push(request.url()));

    await page.goto(site.url + '/contact', { waitUntil: 'networkidle' });
    assert.equal(googleRequests.length, 0, 'Google contacted before consent');
    assert.equal(await page.locator('[data-map-frame] iframe').count(), 0);

    await page.click('[data-map-load]');
    await page.waitForSelector('[data-map-frame] iframe');
    assert.ok(googleRequests.some((url) => url.includes('/maps')), 'map requested after the click');
  });
});

test('the contact form validates its fields and posts to FormSubmit when valid', async () => {
  await withPage(async (page) => {
    const posts = [];
    await page.route('https://formsubmit.co/**', (route) => {
      posts.push(route.request().postData());
      return route.fulfill({ status: 303, headers: { location: `${site.url}/thank-you` } });
    });
    await page.goto(site.url + '/contact', { waitUntil: 'networkidle' });

    await page.click('#contact-form [type=submit]');
    assert.equal(posts.length, 0, 'invalid form was sent');
    assert.match(await page.textContent('#enquiry-name-error'), /enter your name/);
    assert.match(await page.textContent('#enquiry-email-error'), /enter your email/);
    assert.match(await page.textContent('#enquiry-message-error'), /enter your message/);
    assert.equal(await page.evaluate(() => document.activeElement.id), 'enquiry-name');

    await page.fill('#enquiry-name', 'Test User');
    await page.fill('#enquiry-email', 'not-an-email');
    await page.fill('#enquiry-message', 'short');
    await page.click('#contact-form [type=submit]');
    assert.match(await page.textContent('#enquiry-email-error'), /valid email/);
    assert.match(await page.textContent('#enquiry-message-error'), /a little more/);
    assert.equal(posts.length, 0);

    await page.fill('#enquiry-email', 'test@example.com');
    await page.fill('#enquiry-message', 'Do you stock fresh dates?');
    await Promise.all([page.waitForURL(site.url + '/thank-you'), page.click('#contact-form [type=submit]')]);

    assert.equal(posts.length, 1);
    const fields = new URLSearchParams(posts[0]);
    assert.equal(fields.get('name'), 'Test User');
    assert.equal(fields.get('email'), 'test@example.com');
    assert.equal(fields.get('message'), 'Do you stock fresh dates?');
    assert.equal(fields.get('_honey'), '', 'the honeypot must be sent empty');
    assert.equal(fields.get('_captcha'), 'false');
    assert.equal(fields.get('_next'), `${site.url}/thank-you`);
    assert.match(await page.textContent('h1'), /Thank you/);
  });
});

test('cookie banner: shown on first visit, takes focus, Reject and Accept are equal, choice is remembered', async () => {
  await withPage(async (page) => {
    await page.goto(site.url + '/', { waitUntil: 'networkidle' });
    const banner = page.locator('.cookie-notice');

    assert.ok(await banner.isVisible());
    assert.equal(await page.evaluate(() => document.activeElement.id), 'cookie-title');
    const accept = await page.locator('[data-cookie-accept-all]').boundingBox();
    const reject = await page.locator('[data-cookie-reject]').boundingBox();
    assert.ok(Math.abs(accept.height - reject.height) < 2, 'buttons are the same height');
    assert.ok(reject.height >= 40, 'reject is a comfortable target');

    await page.click('[data-cookie-reject]');
    assert.ok(!(await banner.isVisible()));
    await page.reload({ waitUntil: 'networkidle' });
    assert.ok(!(await banner.isVisible()), 'choice was not remembered');

    await page.click('footer [data-cookie-settings]');
    assert.ok(await banner.isVisible(), 'footer link reopens the banner');
  }, { consent: false });
});

test('the live open/closed badge follows UK time', async () => {
  const cases = [
    ['2026-10-12T05:30:00Z', /Closed · opens 7am/], // 06:30 BST, before opening
    ['2026-10-12T06:00:00Z', /Open now · closes 10pm/], // 07:00 BST, the moment it opens
    ['2026-10-12T12:00:00Z', /Open now · closes 10pm/],
    ['2026-10-12T20:59:00Z', /Open now · closes 10pm/], // 21:59 BST
    ['2026-10-12T21:00:00Z', /Closed · opens 7am/], // 22:00 BST, closed
    ['2026-01-12T06:30:00Z', /Closed · opens 7am/], // winter (GMT): 06:30 in London, still closed
    ['2026-01-12T07:00:00Z', /Open now · closes 10pm/], // winter: 07:00 in London, open
  ];

  for (const [time, expected] of cases) {
    await withPage(async (page) => {
      await page.goto(site.url + '/', { waitUntil: 'networkidle' });
      assert.match(await page.textContent('[data-open-status]'), expected, time);
    }, { time });
  }
});

test('the phone action bar shows on phones only, with Call, Directions and WhatsApp', async () => {
  await withPage(async (page) => {
    await page.goto(site.url + '/');
    const bar = page.locator('.action-bar');

    assert.ok(await bar.isVisible());
    assert.deepEqual((await bar.locator('a').allInnerTexts()).map((text) => text.split('\n')[0].trim()), ['Call', 'Directions', 'WhatsApp']);
    assert.equal(await bar.locator('a').first().getAttribute('href'), 'tel:01252940815');
  }, { width: 390, height: 800 });

  await withPage(async (page) => {
    await page.goto(site.url + '/');
    assert.ok(!(await page.locator('.action-bar').isVisible()));
  });
});

test('the products page keeps its category chips in view and scrolls to a category', async () => {
  await withPage(async (page) => {
    await page.goto(site.url + '/products');
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(200);

    const chips = await page.locator('.category-chips').boundingBox();
    assert.ok(chips.y >= 0 && chips.y < 120, `chips are stuck near the top (y=${chips.y})`);

    await page.getByRole('link', { name: 'World foods' }).click();
    await page.waitForTimeout(800);
    const target = await page.locator('#world-foods').boundingBox();
    assert.ok(target.y > chips.y + chips.height - 4 && target.y < 400, `category lands below the chips (y=${target.y})`);
  });
});
