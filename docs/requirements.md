# Requirements

## Functional requirements
- The homepage must clearly communicate the supermarket brand, local positioning and main value proposition.
- The site must include Home, About, Products, Offers, Gallery, Contact and Privacy pages.
- Visitors must be able to find the address, phone number, opening hours and directions quickly.
- The Products page must showcase categories such as fresh produce, halal meat, rice, tea, spices and pantry staples, without prices or stock claims.
- The Offers page must show only owner-supplied, date-limited offers from `public/data/offers.json`, and fall back to "ask in store" when there are none.
- Visitors must be able to send an enquiry through the contact form, which is delivered by email through FormSubmit.
- The site must not take orders or payments.
- Optional third-party content (the Google Maps embed) must only load after the visitor consents.

## Non-functional requirements
- The site must load quickly and remain lightweight for a static website.
- The design should be responsive and usable across mobile, tablet and desktop layouts.
- Content should be readable and accessible, with strong contrast and clear hierarchy.
- The design should feel trustworthy, welcoming and local rather than generic or overly corporate.
- Pages should be easy to update when product ranges or promotional messaging change.
- Every claim on the site must be confirmed by the owner.

## Constraints
- The site is static, built by `npm run build` into `dist/` and hosted on Vercel.
- There is no database or backend.
- Launch values (domain, legal name, FormSubmit alias, Facebook URL, halal certifier) come from environment variables, not from the page source.
- The project must remain cost-effective and easy to run locally.

## Assumptions
- The supermarket is a local, family-focused business serving the Farnborough community.
- The site supports awareness, local discovery and customer contact rather than online ordering.
- The owner supplies photos, offers and business details.
