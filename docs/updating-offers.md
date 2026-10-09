# Updating offers

Offers are shown on the Offers page from [public/data/offers.json](../public/data/offers.json). An empty list (`[]`) shows "Ask in store for this week's deals."

## Add an offer

Add an object to the list:

```json
[
  {
    "title": "Basmati rice 5kg",
    "description": "Stock up on a family-size bag.",
    "emoji": "🍚",
    "wasPrice": 12.99,
    "nowPrice": 9.99,
    "validFrom": "2026-10-12",
    "validUntil": "2026-10-18"
  }
]
```

Rules:

- `wasPrice` must be a price you genuinely charged recently (UK pricing rules). If unsure, do not add the offer.
- Dates are `YYYY-MM-DD`, in UK time. The offer shows from `validFrom` to `validUntil`, inclusive, and disappears by itself afterwards.
- Remove expired offers from the file now and then to keep it tidy.

## Publish

Commit the change to `main` on GitHub. Vercel rebuilds and publishes within a minute or two. Check the live Offers page afterwards.
