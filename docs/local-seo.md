# Local SEO

## Already done in the site
- One title, description and canonical address per page, with Open Graph and Twitter preview tags.
- Structured data on every page: a `GroceryStore` record (name, address, phone, email, hours, Facebook page) and breadcrumbs on inner pages.
- A sitemap generated at build time (indexable pages only, with last-changed dates from git) and `robots.txt` pointing to it.
- Pages in English (UK), with clean addresses such as `/products`.

## Google Business Profile (owner task)

A copy-ready pack with all the text, categories, questions and answers is in [google-business-profile.md](google-business-profile.md). The summary:
1. Search for the shop on Google Maps. Claim the listing, or create one at business.google.com.
2. Use exactly the same details as the website: **Farnborough Supermarket**, 99 Eastmead, Farnborough GU14 7SA, 01252 940815, hours 7am to 10pm daily.
3. Set the category to "Supermarket" or "Grocery store", and add "Halal grocery store" if it applies.
4. Add the website address, a short description and real photos (shopfront, aisles, fresh produce, meat counter).
5. Ask happy customers for reviews, and reply to them.

## Keep consistent
Use the same name, address and phone number on Facebook, Google and any directories. If anything changes, update `src/partials/head-common.html` (structured data), the contact page, the footer and the privacy policy together.

## Possible later additions
- Exact map coordinates in the structured data (`geo`) once confirmed from the Google listing.
- A short "Areas we serve" section if the owner wants to target nearby areas.
