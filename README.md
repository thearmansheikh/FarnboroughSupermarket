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
- Tailwind CSS via CDN
- Vanilla JavaScript
- Node.js static file server

## Project structure

- `public/` — static pages, styling, scripts, offer data, and image assets
- `src/server.js` — simple local HTTP server
- `docs/` — planning and project notes
- `package.json` — project scripts

## Run locally

```bash
npm start
```

Then open:

- http://localhost:3000/

## Launch configuration

The site reads production values from environment variables. Copy [.env.example](.env.example) to a local environment file such as `.env` and fill in the owner-confirmed values before deployment:

- `SITE_URL` — the final HTTPS origin, for example `https://www.farnboroughsupermarket.com`
- `LEGAL_NAME` — the legal or trading entity name for privacy wording
- `FORMSUBMIT_ALIAS` — the FormSubmit hashed endpoint
- `FACEBOOK_URL` — verified business page URL
- `HALAL_CERTIFIER` — optional certifier name, if confirmed

The local server substitutes these values into pages as it serves them. For deployment, `npm run build` writes the substituted site to `dist/`, which Vercel builds and serves automatically. Set the same variables in the Vercel project settings; if `SITE_URL` is missing, the build falls back to Vercel's production hostname.

The local server does not read `.env` files by itself. To use one locally, run `node --env-file=.env src/server.js`.

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
