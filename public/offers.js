document.addEventListener('DOMContentLoaded', async () => {
  const offersList = document.getElementById('offers-list');
  const emptyState = document.getElementById('offers-empty');
  const errorState = document.getElementById('offers-error');

  function londonDateString(date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/London',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const part = (type) => parts.find((entry) => entry.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  function isIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }

  function formatPrice(value) {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
  }

  function formatDate(value) {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function addTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  try {
    const response = await fetch('/data/offers.json');
    if (!response.ok) throw new Error('Offers could not be loaded.');
    const offers = await response.json();
    if (!Array.isArray(offers)) throw new Error('Offers data must be a list.');

    const today = londonDateString(new Date());
    const currentOffers = offers.filter((offer) =>
      offer &&
      typeof offer.title === 'string' &&
      typeof offer.description === 'string' &&
      typeof offer.emoji === 'string' &&
      Number.isFinite(offer.wasPrice) &&
      Number.isFinite(offer.nowPrice) &&
      isIsoDate(offer.validFrom) &&
      isIsoDate(offer.validUntil) &&
      offer.validFrom <= today &&
      today <= offer.validUntil
    );

    offersList.replaceChildren();
    emptyState.hidden = currentOffers.length > 0;

    for (const offer of currentOffers) {
      const card = document.createElement('article');
      card.className = 'card-hover rounded-3xl border border-slate-200 bg-white p-6 shadow-soft';
      const headingRow = document.createElement('div');
      headingRow.className = 'flex items-center justify-between';
      addTextElement(headingRow, 'span', 'rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700', 'Offer');
      const emoji = addTextElement(headingRow, 'span', 'text-2xl', offer.emoji);
      emoji.setAttribute('aria-hidden', 'true');
      card.append(headingRow);
      addTextElement(card, 'h2', 'mt-5 text-2xl font-black text-slate-900', offer.title);
      addTextElement(card, 'p', 'mt-3 text-slate-600', offer.description);
      const prices = document.createElement('div');
      prices.className = 'mt-6 flex items-end justify-between gap-4';
      const priceText = document.createElement('div');
      addTextElement(priceText, 'p', 'text-sm text-slate-500 line-through', formatPrice(offer.wasPrice));
      addTextElement(priceText, 'p', 'text-3xl font-black text-brand-600', formatPrice(offer.nowPrice));
      prices.append(priceText);
      card.append(prices);
      addTextElement(card, 'p', 'mt-4 text-sm font-semibold text-slate-600', `Valid until ${formatDate(offer.validUntil)}`);
      offersList.append(card);
    }
  } catch (error) {
    offersList.replaceChildren();
    emptyState.hidden = true;
    errorState.classList.remove('hidden');
  }
});
