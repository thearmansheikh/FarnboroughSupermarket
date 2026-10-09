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
    logo: `${config.siteUrl}/icon-512.png`,
    priceRange: config.priceRange || '£',
    ...(sameAs.length ? { sameAs } : {}),
    ...(config.geo ? { geo: { '@type': 'GeoCoordinates', latitude: config.geo.latitude, longitude: config.geo.longitude } } : {}),
    ...(config.categories && config.categories.length
      ? {
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: `${config.name} product range`,
            itemListElement: config.categories.map((category) => ({
              '@type': 'OfferCatalog',
              name: category,
            })),
          },
        }
      : {}),
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
  const escaped = JSON.stringify(data, null, 2).replace(/</g, `${String.fromCharCode(92)}u003c`);
  return `<script type="application/ld+json">${escaped}</script>`;
}
