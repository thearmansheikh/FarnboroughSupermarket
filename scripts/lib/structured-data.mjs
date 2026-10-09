const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function groceryStoreJsonLd(config) {
  const { address, hours } = config;
  const digits = config.phone.replace(/\D/g, '');
  const sameAs = [config.facebookUrl, config.googleReviewsUrl].filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'GroceryStore',
    '@id': `${config.siteUrl}/#store`,
    name: config.name,
    url: `${config.siteUrl}/`,
    telephone: `+44${digits.replace(/^0/, '')}`,
    email: config.email,
    image: `${config.siteUrl}/images/og-image.jpg`,
    ...(sameAs.length ? { sameAs } : {}),
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address.street} ${address.town} ${address.postcode}`).replace(/%20/g, '+')}`,
    areaServed: { '@type': 'City', name: address.town },
    address: {
      '@type': 'PostalAddress',
      streetAddress: address.street,
      addressLocality: address.town,
      postalCode: address.postcode,
      addressCountry: address.country,
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: DAYS,
      opens: hours.opens,
      closes: hours.closes,
    }],
  };
}

export function breadcrumbJsonLd(config, name, pagePath) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${config.siteUrl}/` },
      { '@type': 'ListItem', position: 2, name, item: `${config.siteUrl}${pagePath}` },
    ],
  };
}

// JSON for an inline <script type="application/ld+json">; "<" is escaped so it cannot close the tag.
export function jsonLdScript(data) {
  return `<script type="application/ld+json">${JSON.stringify(data, null, 2).replace(/</g, '\u003c')}</script>`;
}
