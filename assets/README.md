# Store photos: how to add them

The website uses your real photos automatically. Until you add them it shows illustration placeholders.

## 1. Put the original photos here

Copy JPG, PNG or WebP photos into `assets/photos-source/`. **These originals are never uploaded to GitHub** (the folder is git-ignored) because phone photos can contain the GPS position of where they were taken. Use photos taken at Farnborough Supermarket, and only include people who have given permission. Avoid clearly identifiable customers or staff.

Suggested set: shopfront, aisle view, fresh produce, meat counter, rice and grains, spices and world foods, tea and dry fruits, olives and pickles, tills.

## 2. Describe each photo in `assets/photos.json`

```json
[
  {
    "file": "shopfront.jpg",
    "alt": "The Farnborough Supermarket shopfront on Eastmead",
    "slots": ["hero", "og"],
    "caption": "Our shopfront"
  },
  {
    "file": "meat-counter.jpg",
    "alt": "Halal meat counter with fresh lamb and chicken cuts",
    "slots": ["cat-meat"]
  }
]
```

- `alt` is read aloud by screen readers and shown if the image fails. Describe what is in the photo (at least 10 characters).
- `slots` says where the photo is used. Every photo also appears in the Gallery unless you add `"gallery": false`.

| Slot | Where it appears |
|------|------------------|
| `hero` | Large photo at the top of the home page (use the shopfront) |
| `tile-greens`, `tile-tea`, `tile-pantry` | The three photo cards on the home page |
| `cat-meat`, `cat-rice`, `cat-tea`, `cat-olives`, `cat-produce`, `cat-world` | The Products page categories |
| `inside-main`, `inside-a`, `inside-b` | The "Step inside" photo mosaic on the home page (one large photo and two smaller ones) |
| `about` | Photo on the About page |
| `og` | The image shown when the site is shared (falls back to `hero`) |

## 3. Generate the web versions

```bash
npm run photos     # makes small AVIF + WebP files in assets/photos/ (safe to commit)
npm run og         # makes the 1200x630 sharing image from the "og" or "hero" photo
npm run build      # check the result locally, then commit and push
```

The generated files have all camera and GPS information removed. Commit `assets/photos/`, `assets/photos.json` and `public/images/og-image.jpg`, but not `assets/photos-source/`.
