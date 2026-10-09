# Switching to the custom domain

Do this when the shop has chosen and bought its domain. Everything on the site that mentions the web address (canonical links, social previews, structured data, the sitemap, `robots.txt`, the form redirect) updates from one value, so the switch is small.

Below, `www.example.co.uk` stands for the real domain.

## 1. Owner: add the domain in Vercel (about 10 minutes)

1. Vercel dashboard → the `farnborough-supermarket` project → **Settings → Domains** → **Add**, and enter `www.example.co.uk`. Also add `example.co.uk` (without www).
2. Vercel shows the DNS records to create. At the domain registrar, add them exactly as shown (usually an `A` record for the apex and a `CNAME` for `www`).
3. Choose the main address (www or without www). In Vercel, set the other one to **redirect** to it. Wait for the green tick and the HTTPS certificate (minutes to a few hours).

## 2. Set the web address

Either set it in Vercel (**Settings → Environment Variables → Production**): `SITE_URL` = `https://www.example.co.uk` (no trailing slash, no path), or change `siteUrl` in [site.config.json](../site.config.json). Then redeploy. Check:

```bash
curl -s https://www.example.co.uk/ | grep -o 'rel="canonical" href="[^"]*"'
curl -s https://www.example.co.uk/sitemap.xml | head -4
curl -s https://www.example.co.uk/robots.txt
```

All three must show `www.example.co.uk`, not `vercel.app`.

## 3. Redirect the old vercel.app address (permanent, 301/308)

Add this to the `redirects` list in [vercel.json](../vercel.json), above the existing entries, replacing the destination:

```json
{
  "source": "/(.*)",
  "has": [{ "type": "host", "value": "farnborough-supermarket.vercel.app" }],
  "destination": "https://www.example.co.uk/$1",
  "permanent": true
}
```

Redeploy, then check `curl -sI https://farnborough-supermarket.vercel.app/about` shows a `308` with `location: https://www.example.co.uk/about`.

Note: the local development server and the unit tests read `vercel.json`'s redirect list by exact path, so this host rule is simply ignored there. That is expected.

## 4. Turn on HSTS (only once HTTPS works on the real domain)

Vercel already sends `Strict-Transport-Security` on `*.vercel.app`. For the custom domain, add this header to the `/(.*)` rule in `vercel.json`:

```json
{ "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" }
```

Do not add it earlier: browsers remember it for two years, and `preload` is very hard to undo.

## 5. Owner: tell the world

- **Google Search Console**: add the domain, verify with the DNS record, submit `https://www.example.co.uk/sitemap.xml` (see [google-business-profile.md](google-business-profile.md)).
- **Google Business Profile**: put the website address in, and check the name, address, phone and **opening hours** match the website exactly (07:00 to 22:00 every day).
- **Facebook**: add the website link to the page.
- **FormSubmit**: after the domain change, send one test enquiry from the live site to confirm the form still delivers.
- Optional: a professional email address on the domain, and privacy-friendly analytics. If analytics is added, update the cookie panel and the privacy policy at the same time.

## 6. Final check

```bash
npm run check
```

and the manual checks in [TESTING.md](../TESTING.md).
