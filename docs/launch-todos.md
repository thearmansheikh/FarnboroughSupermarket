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
- [ ] **Store photos** → [assets/README.md](../assets/README.md). Shopfront, aisles, produce, meat counter, rice, spices, tea, tills. Until then the site shows illustrations and says photographs are coming soon.
- [ ] **Our story**: 3–4 true sentences for the About page → `data/story.json`. The current text is generic starter copy.
- [ ] **FAQ facts** to add to `data/faq.json` once confirmed: parking, which cards are accepted, who certifies the halal meat.
- [ ] **Exact map coordinates** (from the Google listing) → `geo` in `site.config.json`, for better local search.
- [ ] Optional: `WHATSAPP_NUMBER` (only if the shop answers WhatsApp), `GOOGLE_REVIEWS_URL`.
- [ ] Genuine, dated offers if wanted → [OFFERS_GUIDE.md](../OFFERS_GUIDE.md).
- [ ] Bank holiday hours → `specialHours` in `site.config.json` ([content-guide.md](content-guide.md)).

## 4. Domain and Google
- [ ] Buy the domain and follow [domain-switch.md](domain-switch.md).
- [ ] Claim the Google Business Profile → [google-business-profile.md](google-business-profile.md).
- [ ] Add the site to Google Search Console and submit the sitemap.
- [ ] Optional: connect the GitHub repository to Vercel (Settings → Git) so every push deploys automatically. Today deployments are started from the command line.
