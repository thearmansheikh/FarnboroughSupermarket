# Go-live checklist

Work through this in order. Owner-only values are listed in [launch-todos.md](launch-todos.md).

## 1. Domain and hosting
- [ ] Buy or choose the custom domain.
- [ ] In Vercel: Project → Settings → Domains → add the domain, plus the www or non-www version.
- [ ] Add the DNS records Vercel shows at the domain registrar.
- [ ] Choose one canonical host (www or non-www) and redirect the other to it. Vercel does this when you mark one domain as the redirect.
- [ ] Wait for the HTTPS certificate to be issued, then open the site on the new domain.

## 2. Environment variables (Vercel → Settings → Environment Variables, Production)
- [ ] `SITE_URL` = the final HTTPS address, with no trailing slash
- [ ] `LEGAL_NAME` = the trading entity named in the privacy policy
- [ ] `FORMSUBMIT_ALIAS` = the hashed endpoint from FormSubmit (see below)
- [ ] `FACEBOOK_URL` = the verified business page address
- [ ] `HALAL_CERTIFIER` = optional, only if confirmed
- [ ] Redeploy so the new values are built in.

## 3. Contact form
- [ ] Send a first enquiry from the live site to supermarketfarnborough@gmail.com.
- [ ] Open the activation email from FormSubmit and confirm it.
- [ ] Copy the hashed endpoint from FormSubmit into `FORMSUBMIT_ALIAS`, redeploy, and send a second test.
- [ ] Check the test arrives, including in spam.

## 4. Content sign-off by the owner
- [ ] Opening hours: 7am to 10pm every day.
- [ ] Phone 01252 940815 and email supermarketfarnborough@gmail.com.
- [ ] Every statement in the privacy policy, including the 12-month retention of enquiry emails.
- [ ] Product category wording on Home and Products.
- [ ] Real store photos added (see [public/images/photos/README.md](../public/images/photos/README.md)).

## 5. Checks on the live site
- [ ] Every page loads and the navigation highlights the right page.
- [ ] `/sitemap.xml` and `/robots.txt` show the live domain.
- [ ] View source on the home page: canonical, Open Graph and structured data all use the live domain.
- [ ] Share the home page address in a chat app and check the preview image and title.
- [ ] `/shop`, `/checkout` and `/success` redirect to `/products`; a made-up address shows the 404 page.
- [ ] Cookie banner appears on first visit; the map does not load until allowed.
- [ ] Run Lighthouse (Chrome DevTools) on the home page: 90+ in every category.

## 6. Search
- [ ] Add the domain in Google Search Console and submit `/sitemap.xml`.
- [ ] Claim or update the Google Business Profile (see [google-business-profile.md](google-business-profile.md)).
