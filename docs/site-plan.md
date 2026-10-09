# Farnborough Supermarket: Site Plan

Written 9 October 2026 after a full review of the site. It replaces the generic phases in `roadmap.md`.

**Goal:** a trustworthy, fast, showcase-only website for the shop at 99 Eastmead that is ready to go live on a custom domain.

## Status (9 October 2026): road to 9.5–10/10

| Phase | State |
|-------|-------|
| 0. Audit | Done. Found that the live inner pages were serving raw templates (Vercel "Node" preset); fixed and verified |
| 1. Config and build | Done: `site.config.json`, one-file-per-page build, shared layout, canonical/og:url per page, build fails on any `{{placeholder}}` |
| 2. Launch blockers | Done: offers rendered at build time from validated JSON (no customer-facing error), privacy wording, clean Facebook URL |
| 3. Real photography | Pipeline done (EXIF-free AVIF/WebP at 480–1600, `<picture>`, hero preload, accessible lightbox, og-image script). 10 real photos added and placed (hero, "Step inside" mosaic, categories, gallery, About, share image) |
| 4. Contact form | Done and live: plain POST to FormSubmit (works without JS), hidden honeypot, inline validation. Activated; a real test enquiry reached the shop inbox |
| 5. Local SEO | Done: titles <= 60 and descriptions <= 155, GroceryStore + breadcrumbs + FAQPage JSON-LD, sitemap with lastmod, full icon set and manifest, branded 404. Needs owner-confirmed FAQ facts (parking, cards, certifier) and map coordinates |
| 6. Security and caching | Done: strict CSP (no inline script/style), COOP and friends, content-hashed CSS/JS cached a year, HTML always revalidated. HSTS is sent by Vercel and is added with the custom domain |
| 7. Performance | Done: Lighthouse mobile 97–100 locally and 98–100 on the live URL. One 6 KB gzipped stylesheet, 8 KB of JavaScript, system fonts |
| 8. Accessibility | Done: axe-core WCAG 2.2 AA, 0 violations in 44 scans; focus-trapped menu, equal Accept/Reject, emoji hidden from screen readers |
| 9. Delight features | Done: live open/closed badge, special-hours banner, phone action bar, sticky category chips, About story data, print styles. Needs owner content: story text, optional WhatsApp number, brands list |
| 10. Automated QA | Done: `npm run check` (66 unit tests, html-validate, links, axe, 12 browser tests, Lighthouse budgets) and a GitHub Action |
| 11. Domain launch | Owner task. Everything is prepared: [domain-switch.md](domain-switch.md) |

Known gap: `npm audit` reports issues in build-time tools (Lighthouse, Tailwind, linkinator). Nothing from them ships to visitors (`npm audit --omit=dev` is clean).

The older notes below record the state before this pass and are kept for reference.

## Where we were before this pass

- 10 pages, all static, built from `public/` into `dist/` and served on Vercel. Launch placeholders such as `{{DOMAIN}}` are filled in at build time.
- The cookie consent, consent-gated map, contact form (FormSubmit) and privacy policy are in place.
- Nothing from the last two work sessions is committed yet. That is about 30 files.
- Tests: 4 passing, covering config and build only.

## Review findings

### Must fix before launch

| # | Finding | Where |
|---|---------|-------|
| 1 | The homepage hero and the "Inside the shop / Fresh aisles" cards are **Unsplash stock photos** loaded from CSS, but they are labelled as if they were the shop. | `styles.css` lines 196, 217, 228, 678, 682, 686, 732 |
| 2 | Every visit contacts **Unsplash** and the **Tailwind CDN**. Neither is listed in the privacy policy, and neither is gated by consent. | `styles.css`, the `<script>` in every page |
| 3 | `sitemap.xml` lists `/checkout` and `/success`, but those pages are marked `noindex`. The two signals contradict each other. | `sitemap.xml` |
| 4 | `checkout.html` and `success.html` are leftover pages from the old shop. They should be redirected, not kept. | `public/`, `vercel.json` |
| 5 | **Unverified claims** need the owner to confirm them or we remove them. | see the list below |
| 6 | The contact form cannot send until the FormSubmit alias is set and activated. The setting exists, but the value and the activation are still owner tasks. | `docs/launch-todos.md` |

Claims to confirm or remove:

- Opening hours of 7am–10pm every day
- "Nearby parking"
- "Friendly service"
- "Fruit, veg and herbs selected daily"
- The Bread & eggs and Drinks & treats categories
- "Golden Sella"
- "Trusted quality" for the halal meat
- Whether the halal certifier is named

### Should fix

- **Tailwind runs in the browser.** The CDN build is not meant for production, delays the first paint, and the Tailwind config is copy-pasted into each page.
- **The header and footer are copied into all 10 pages** under a "SHARED: keep in sync" comment. The build step can now include them from one place.
- **Dead dark-theme CSS** in `styles.css`, because the site is light-only.
- **Only the homepage has JSON-LD** (the structured data Google reads for business details). It has no coordinates or `sameAs`, and the Facebook link is still a TODO comment.
- **Missing accessibility basics:** no "skip to content" link, and no verified keyboard or contrast check.
- **No security headers** (CSP, `X-Content-Type-Options`, `Referrer-Policy`) in `vercel.json`.
- **Stale docs:** `requirements.md` and `project-brief.md` still mention a "shop/explore" page and a demo checkout. `package.json` still has the starter description.
- **Stray file** `localhostfarnborough.html` in the project root. It looks like an old standalone draft with a different design.
- **Thin tests.** Nothing checks links, required metadata, or that the sitemap matches the real pages.

### Already good

- Consent-gated Google Maps with a clean fallback.
- Honeypot and validation on the contact form, and no payment or order handling.
- Date-limited offers that fall back to "ask in store" when the list is empty.
- Canonical URLs, Open Graph and Twitter tags, favicons, manifest and a 404 page on every page.

## Phases

### Phase 0: Land what exists (about 1 hour)
1. Commit the current work in logical commits: config and build, SEO files, page updates, docs.
2. Redirect `/checkout` and `/success` to `/products` in `vercel.json` and in the local server, then delete both pages and drop them from the sitemap.
3. Delete `localhostfarnborough.html`. Fix the `package.json` description.
4. Rewrite `requirements.md`, `project-brief.md` and `roadmap.md` to match the showcase-only site.

### Phase 1: Honest content (needs owner input)
1. Replace the Unsplash images with real store photos from the checklist in `public/images/photos/README.md`. Until they exist, drop the "Inside the shop" labels and use neutral artwork.
2. Go through the unverified-claims list with the owner. Keep what is confirmed and cut the rest.
3. Add real photos to the gallery and set a proper social share image from them.
4. Decide how offers get updated (see Phase 5).

### Phase 2: Engineering cleanup
1. Compile Tailwind at build time into one small CSS file and remove the CDN script. This also fixes privacy finding 2 for Tailwind.
2. Move the shared header, footer and head tags into partials that the build includes in every page.
3. Remove the dead dark-theme CSS and the unused scripts.
4. Add security headers and long-lived caching for fingerprinted assets in `vercel.json`.
5. Add tests: every internal link resolves, every page has a title, description and canonical, the sitemap matches the real pages, and no placeholders remain after a build.

### Phase 3: Local SEO
1. Put structured data on the right pages: `GroceryStore` with coordinates, opening hours, `sameAs`, plus `BreadcrumbList` on inner pages.
2. Check titles and descriptions for local search, such as "halal meat Farnborough" and "world food shop Farnborough".
3. Add `lastmod` to the sitemap.
4. Claim and complete the Google Business Profile with the same name, address, phone and hours as the site.

### Phase 4: Accessibility and QA
1. Add a skip link and visible focus styles, and make the mobile menu keyboard-friendly.
2. Run Lighthouse and axe on every page. Targets: 90 or more on performance, accessibility, best practices and SEO.
3. Test on real phone widths, and the cookie banner with a keyboard and screen reader.
4. Check the contact form end to end: success, FormSubmit failure and offline.

### Phase 5: Go live (owner tasks from `docs/launch-todos.md`)
1. Add the domain in Vercel, set DNS, and choose www or non-www as the main address.
2. Set the Vercel environment variables: `SITE_URL`, `LEGAL_NAME`, `FORMSUBMIT_ALIAS`, `FACEBOOK_URL`, `HALAL_CERTIFIER`.
3. Send a test enquiry to activate FormSubmit and confirm it arrives.
4. Update the privacy policy with the confirmed legal name and retention period, and re-date it.
5. Decide who edits offers: either edit `data/offers.json` through GitHub, or hand over a simple guide.
6. Submit the sitemap in Google Search Console and re-check that every redirect and canonical works on the live domain.

### Phase 6: After launch
- Check enquiries and 404s weekly for the first month.
- Refresh photos and offers on a schedule.
- Decide on analytics. If added, update the cookie panel and privacy policy at the same time.

## What I need from the owner

1. Confirmation of each item in the unverified-claims list.
2. Real photos: shopfront, aisles, produce, meat counter, rice, spices, tea, tills.
3. The domain name, the legal business name and the FormSubmit alias.
4. The halal certifier name, or confirmation that none should be named.
5. The 12-month retention period for enquiry emails.
