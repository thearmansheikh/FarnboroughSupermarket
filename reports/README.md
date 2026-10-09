# Lighthouse reports

Mobile Lighthouse runs on the production build served with the Vercel headers (gzip on, long cache for hashed assets), 9 October 2026.

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| Home | 98 | 100 | 100 | 100 |
| Products | 99 | 100 | 100 | 100 |
| Gallery | 98 | 100 | 100 | 100 |
| Contact | 100 | 100 | 100 | 100 |

Open the `.report.html` files in a browser. Re-run any time with `npm run check` (see the repository README).

Note: these pages still use the illustration placeholders. Real photos are larger, so re-check the scores after adding them. The responsive AVIF/WebP pipeline and the hero preload are built for that.
