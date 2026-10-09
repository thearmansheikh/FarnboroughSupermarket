# How to update the offers

Offers live in one file: [data/offers.json](data/offers.json). The website is rebuilt from it every time you push a change, so there is nothing to upload and no database.

- An empty list `[]` shows the friendly message **"Ask in store for this week's deals."**
- Customers never see an error message. If the file has a mistake, the build stops and the live site stays as it was (see "If something goes wrong").

## Add an offer

Open `data/offers.json` and add an item between the square brackets. Separate items with a comma.

```json
[
  {
    "title": "Basmati rice 5kg",
    "description": "A family-size bag for the weekly shop.",
    "emoji": "🍚",
    "wasPrice": 12.99,
    "nowPrice": 9.99,
    "validFrom": "2026-10-12",
    "validUntil": "2026-10-18"
  }
]
```

| Field | Needed? | Notes |
|-------|---------|-------|
| `title` | Yes | Short product name |
| `description` | Yes | One sentence |
| `nowPrice` | Yes | The offer price in pounds, as a number: `9.99` (no £ sign, no quotes) |
| `validFrom` | Yes | First day, `YYYY-MM-DD` |
| `validUntil` | Yes | Last day (included), `YYYY-MM-DD` |
| `wasPrice` | No | The normal price. **Only add it if it is a genuine price you charged recently** (UK pricing rules). If unsure, leave it out |
| `emoji` | No | A small decorative emoji |

## What customers see

- Offers appear from `validFrom` to `validUntil`, in UK time, on the Offers page.
- Each card shows the title, description, the price now, the old price (if you gave one) and **"Valid until 18 Oct 2026"**.
- An offer whose last day has passed disappears by itself when the page loads, even before the site is rebuilt. Delete old offers from the file now and then to keep it tidy.
- An offer that starts in the future appears once the site is rebuilt on or after its first day, so push the change on the first day or later.

## Publish

1. Edit `data/offers.json` (on GitHub you can click the pencil icon and edit in the browser).
2. Commit the change to `main`.
3. Wait a minute or two for the site to rebuild, then check the Offers page.

## If something goes wrong

The build checks the file and stops with a plain message, for example:

> data/offers.json offer #2 ("Basmati rice 5kg") "validUntil" must be a real date like 2026-10-18.

The live site keeps showing the previous version until the file is fixed. Common causes: a missing comma between items, a price written as `"9.99"` in quotes, or a date such as `2026-10-32`.
