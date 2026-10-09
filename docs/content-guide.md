# Updating the website: where things live

You never edit the built site. Change the file below, commit it to `main` on GitHub, and the site rebuilds in about a minute. If a file has a mistake, the build stops with a plain message and the live site stays as it was.

| To change | Edit | Guide |
|-----------|------|-------|
| Address, phone, email, opening hours, Facebook link | [site.config.json](../site.config.json) | below |
| Offers and deals | [data/offers.json](../data/offers.json) | [OFFERS_GUIDE.md](../OFFERS_GUIDE.md) |
| Frequently asked questions (Contact page) | [data/faq.json](../data/faq.json) | below |
| "Our story" on the About page | [data/story.json](../data/story.json) | below |
| Store photos | `assets/photos.json` + `npm run photos` | [assets/README.md](../assets/README.md) |
| Wording on a page | the file in `src/pages/` | edit the text between the tags |

## Opening hours and bank holidays

Normal hours are `hours.opens` and `hours.closes` in `site.config.json` (24-hour times, for example `"07:00"` and `"22:00"`). Every page, the footer, Google's structured data and the live "Open now / Closed" badge update together.

For bank holidays or other special days, add entries to `specialHours`:

```json
"specialHours": [
  { "from": "2026-12-25", "to": "2026-12-25", "label": "Christmas Day", "closed": true },
  { "from": "2026-12-24", "to": "2026-12-24", "label": "Christmas Eve", "opens": "09:00", "closes": "18:00" }
]
```

A yellow banner appears at the top of every page on those days (and only those days, UK time), and the open/closed badge uses the special hours. Remove old entries now and then.

## WhatsApp and Google reviews

Set `whatsappNumber` (with country code, for example `"+447700900123"`) to add a WhatsApp button to the phone action bar. Leave it empty for no button. Set `googleReviewsUrl` to add "See our reviews on Google" to the footer and Contact page. Only use a number the shop really answers on WhatsApp, and only your own review link.

## FAQ

Each item in `data/faq.json` has a `question` and an `answer`. Answers can use `{{PHONE_DISPLAY}}`, `{{HOURS_SHORT}}`, `{{HOURS_DAYS}}` and `{{ADDRESS_ONE_LINE}}` so they never go out of date. The same text feeds the questions Google can show in search results.

**Only add facts the owner has confirmed.** Good candidates once confirmed: where customers can park, which cards or payment methods the shop accepts, and who certifies the halal meat.

## Our story

`data/story.json` holds the paragraphs shown under "Our story" on the About page. Replace the starter text with three or four true sentences about the shop: who started it, when, and why.

## Checking your change

```bash
npm test        # automated checks
npm run build   # builds the site into dist/ (fails if something is wrong)
npm run dev     # preview at http://localhost:3000
```
