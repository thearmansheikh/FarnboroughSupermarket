# Farnborough Supermarket

A responsive, showcase-only website for Farnborough Supermarket. It presents the store, product categories, current dated offers, contact information and a consent-aware Google Maps embed. The website does not accept product orders or payments.

## Overview

This project presents a modern grocery brand focused on:
- fresh halal meat and produce
- world foods and pantry staples
- local family shopping convenience
- verified, date-limited offers when supplied by the owner

## Tech stack

- HTML5
- Tailwind CSS 3, compiled at build time (no CDN)
- Vanilla JavaScript
- Node.js local server and build script

## Project structure

- `site.config.json` — business facts (name, address, phone, email, hours, links) used everywhere
- `src/pages/` — one file per page: front matter (title, description, ...) plus the page content
- `src/partials/` — shared layout, head, header and footer
- `public/` — assets copied as-is: styles, scripts, images, icons, `robots.txt`, offer data
- `scripts/build.mjs` — builds the deployable site into `dist/`; fails if any `{{placeholder}}` is left
- `scripts/dev-server.mjs` — local server for `dist/` with the same redirects and headers as Vercel
- `tests/` — automated checks
- `docs/` — plan, launch checklists and guides

## Run locally

```bash
npm install
npm run dev
```

Then open:

- http://localhost:3000/

Other commands: `npm test` runs the automated checks, and `npm run build` writes the deployable site to `dist/`. Guides: [updating offers](docs/updating-offers.md), [go-live checklist](docs/go-live-checklist.md), [local SEO](docs/local-seo.md).

## Changing business details

Edit [site.config.json](site.config.json) (address, phone, email, opening hours, Facebook link) and rebuild. Every page, the footer, the structured data for Google and the sitemap update together. Never type these details into a page by hand.

Some values are set in the Vercel project settings (Settings → Environment Variables) and override the file: `SITE_URL`, `LEGAL_NAME`, `FACEBOOK_URL`, `FORMSUBMIT_ALIAS`, `GOOGLE_REVIEWS_URL`, `WHATSAPP_NUMBER`, `HALAL_CERTIFIER`. See [.env.example](.env.example). `npm run build` lists which owner values are still empty. Tracking parameters (such as `?mibextid=`) are stripped from link values automatically.

## Page front matter

Each file in `src/pages/` starts with a block like:

```
---
title: About | Farnborough Supermarket
description: One or two sentences for search results.
breadcrumb: About
scripts: contact.js
---
```

`robots: noindex,follow` keeps a page out of search and the sitemap. Canonical and Open Graph URLs, the active menu link and the structured data are generated for you.

## Pages included

- Home
- About
- Products
- Offers
- Gallery
- Contact
- Privacy
- Enquiry thank-you

## Notes

The site uses local SVG product artwork as a temporary fallback. Replace it with owner-approved store photographs when available. Product availability and pricing are confirmed in store. The enquiry form uses FormSubmit; its hashed alias and the final custom domain are owner configuration TODOs.

## Owner launch tasks

See [docs/launch-todos.md](docs/launch-todos.md) for custom-domain, FormSubmit and legal/business values that must be confirmed before launch.

## GitHub

Repository: https://github.com/thearmansheikh/FarnboroughSupermarket
