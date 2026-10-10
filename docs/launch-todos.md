# Owner launch tasks

Everything that can be done in code is done. What is left needs the shop owner. Step-by-step guides: [go-live-checklist.md](go-live-checklist.md) and [domain-switch.md](domain-switch.md).

## 1. Contact form: DONE (9 October 2026)
- [x] FormSubmit is activated. A real test enquiry from the live site arrived at supermarketfarnborough@gmail.com as "New website enquiry". `FORMSUBMIT_ALIAS` in Vercel is currently the shop's email address.
- [ ] Optional: switch `FORMSUBMIT_ALIAS` to a private random address from FormSubmit, so the shop email is not in the form's HTML (it is already public on the page, so this is only tidiness).
- [ ] Optional: the free FormSubmit plan adds a small "Sponsor" advert to the emails the shop receives. Customers never see it.
- [ ] Run the rest of the manual checks in [TESTING.md](../TESTING.md) (phone test, no-JavaScript test).

## 2. Business details to confirm
- [ ] **Legal or trading name** for the privacy policy → `LEGAL_NAME`. Until set, the policy names "Farnborough Supermarket" as the data controller.
- [ ] **Opening hours**: Monday to Sunday, 7am to 10pm. Must match Google Business Profile exactly.
- [ ] **12-month retention** of enquiry emails (the privacy policy now states it as fact).
- [ ] **Facebook page**: the link is `https://www.facebook.com/share/1JGNKZoFTJ/`. Replace it with the page's normal address in `site.config.json` or `FACEBOOK_URL` if there is one.
- [ ] The product categories on Home and Products are right: fresh halal meat, rice and grains (including sella and jasmine), tea and dry fruits, olives and pickles, fresh fruit and vegetables, spices, sauces and world foods.
- [ ] Whether a **halal certifier** should be named (`HALAL_CERTIFIER`); nothing is claimed today.

## 3. Content only the owner can supply
- [x] **Store photos**: 10 real photos added on 9 October 2026 (shopfront, meat counter, produce, olives, grains, tea, shop floor). To add or swap photos see [assets/README.md](../assets/README.md).
- [ ] Look at the photos on the Gallery page: the meat counter and shop-floor photos show shelf prices (for example lamb at a price per kg). The site says prices change, so decide whether to keep those photos or retake them without price labels.
- [ ] **Our story**: 3–4 true sentences for the About page → `data/story.json`. The current text is generic starter copy.
- [ ] **FAQ facts** to add to `data/faq.json` once confirmed: parking, which cards are accepted, who certifies the halal meat.
- [ ] **Exact map coordinates** (from the Google listing) → `geo` in `site.config.json`, for better local search.
- [ ] Optional: `WHATSAPP_NUMBER` (only if the shop answers WhatsApp), `GOOGLE_REVIEWS_URL`.
- [ ] Genuine, dated offers if wanted → [OFFERS_GUIDE.md](../OFFERS_GUIDE.md).
- [ ] Bank holiday hours → `specialHours` in `site.config.json` ([content-guide.md](content-guide.md)).

## 4. Domain and Google
- [x] **Domain bought and live (10 October 2026):** https://farnboroughsupermarket.co.uk, registered at Namecheap (auto-renew should stay ON). DNS: `A @ 76.76.21.21` and `CNAME www cname.vercel-dns.com`. `www` and the old vercel.app address redirect permanently to the main address. HSTS is on.
- [ ] Send one more test enquiry from https://farnboroughsupermarket.co.uk/contact and check it arrives.
- [ ] Add the site to **Google Search Console** (Domain property, verify with the DNS record at Namecheap) and submit `https://farnboroughsupermarket.co.uk/sitemap.xml` ([google-business-profile.md](google-business-profile.md), section 9).
- [ ] Claim or update the **Google Business Profile** and put the website address in; check name, address, phone and hours (7am to 10pm) match exactly.
- [ ] Add the website link to the Facebook page.
- [ ] Optional: professional email on the domain, and cookieless analytics. If analytics is added, update the cookie panel and privacy policy at the same time.
- [ ] Optional: connect the GitHub repository to Vercel so every push deploys automatically (it already deploys from the command line; Vercel shows the repo as connected).
