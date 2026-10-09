import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml } from './html.mjs';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Today's date in UK time as YYYY-MM-DD.
export function londonToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (type) => parts.find((entry) => entry.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const formatPrice = (value) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const formatDate = (value) => new Date(`${value}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Reads data/offers.json and throws a clear error for anything malformed, so a typo cannot reach the live site.
export function loadOffers(rootDir) {
  const file = path.join(rootDir, 'data', 'offers.json');
  if (!fs.existsSync(file)) return [];

  let offers;
  try {
    offers = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`data/offers.json is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(offers)) throw new Error('data/offers.json must contain a list: [ ... ]');

  offers.forEach((offer, index) => {
    const label = `data/offers.json offer #${index + 1}${offer && offer.title ? ` ("${offer.title}")` : ''}`;
    const problems = [];

    if (!offer || typeof offer !== 'object') problems.push('is not an object');
    else {
      if (typeof offer.title !== 'string' || !offer.title.trim()) problems.push('needs a "title"');
      if (typeof offer.description !== 'string' || !offer.description.trim()) problems.push('needs a "description"');
      if (!Number.isFinite(offer.nowPrice) || offer.nowPrice <= 0) problems.push('needs a positive "nowPrice" number');
      if (offer.wasPrice !== undefined && (!Number.isFinite(offer.wasPrice) || offer.wasPrice <= offer.nowPrice)) problems.push('"wasPrice" must be a number higher than "nowPrice" (or leave it out)');
      if (!isIsoDate(offer.validFrom)) problems.push('"validFrom" must be a real date like 2026-10-12');
      if (!isIsoDate(offer.validUntil)) problems.push('"validUntil" must be a real date like 2026-10-18');
      if (isIsoDate(offer.validFrom) && isIsoDate(offer.validUntil) && offer.validFrom > offer.validUntil) problems.push('"validFrom" is after "validUntil"');
    }

    if (problems.length) throw new Error(`${label} ${problems.join('; ')}.`);
  });

  return offers;
}

export function currentOffers(offers, today = londonToday()) {
  return offers
    .filter((offer) => offer.validFrom <= today && today <= offer.validUntil)
    .sort((a, b) => a.validUntil.localeCompare(b.validUntil) || a.title.localeCompare(b.title));
}

function renderCard(offer) {
  const emoji = offer.emoji ? `<span class="text-2xl" aria-hidden="true">${escapeHtml(offer.emoji)}</span>` : '';
  const was = offer.wasPrice === undefined ? '' : `<p class="text-sm text-slate-500">Was <span class="line-through">${formatPrice(offer.wasPrice)}</span></p>`;

  return `<article class="card-hover rounded-3xl border border-slate-200 bg-white p-6 shadow-soft" data-valid-until="${offer.validUntil}">
          <div class="flex items-center justify-between">
            <span class="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-brand-700">Offer</span>
            ${emoji}
          </div>
          <h2 class="mt-5 text-2xl font-black text-slate-900">${escapeHtml(offer.title)}</h2>
          <p class="mt-3 text-slate-600">${escapeHtml(offer.description)}</p>
          <div class="mt-6">
            ${was}
            <p class="text-3xl font-black text-brand-600"><span class="sr-only">Now </span>${formatPrice(offer.nowPrice)}</p>
          </div>
          <p class="mt-4 text-sm font-semibold text-slate-600">Valid until ${formatDate(offer.validUntil)}</p>
        </article>`;
}

// Special tokens for the Offers page: the cards and whether the "ask in store" message starts hidden.
export function offerTokens(rootDir, today = londonToday()) {
  const live = currentOffers(loadOffers(rootDir), today);

  return {
    '@offers': live.map(renderCard).join('\n        '),
    '@offersEmpty': live.length ? ' hidden' : '',
  };
}
