import fs from 'node:fs';
import path from 'node:path';

export const rootDir = path.resolve(import.meta.dirname, '..', '..');

// Environment variables that override site.config.json (set them in the Vercel project).
const ENV_OVERRIDES = {
  SITE_URL: 'siteUrl',
  LEGAL_NAME: 'legalName',
  FACEBOOK_URL: 'facebookUrl',
  FORMSUBMIT_ALIAS: 'formsubmitAlias',
  GOOGLE_REVIEWS_URL: 'googleReviewsUrl',
  WHATSAPP_NUMBER: 'whatsappNumber',
  HALAL_CERTIFIER: 'halalCertifier',
};

// Owner-supplied values that may legitimately be empty; the build reports which still are.
export const OWNER_VALUES = {
  legalName: 'LEGAL_NAME',
  formsubmitAlias: 'FORMSUBMIT_ALIAS',
  googleReviewsUrl: 'GOOGLE_REVIEWS_URL (optional)',
  whatsappNumber: 'WHATSAPP_NUMBER (optional)',
  halalCertifier: 'HALAL_CERTIFIER (optional)',
};

const TRACKING_PARAMS = /^(mibextid|fbclid|utm_.*|igshid|ref|fb_.*)$/i;

// Removes tracking parameters and fragments from a URL; returns '' for anything that is not http(s).
export function cleanUrl(value) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key);
    }
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

// "07:00" -> "7am", "22:30" -> "10:30pm". withMinutes forces "7:00am".
export function formatTime(value, withMinutes = false) {
  const [hours, minutes] = value.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return minutes || withMinutes ? `${hour12}:${String(minutes).padStart(2, '0')}${suffix}` : `${hour12}${suffix}`;
}

export function loadConfig({ env = process.env, file = path.join(rootDir, 'site.config.json') } = {}) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const config = { ...raw };

  for (const [variable, key] of Object.entries(ENV_OVERRIDES)) {
    if (env[variable]) config[key] = env[variable];
  }

  config.siteUrl = String(config.siteUrl || '').replace(/\/+$/, '');
  config.facebookUrl = cleanUrl(config.facebookUrl);
  config.googleReviewsUrl = cleanUrl(config.googleReviewsUrl);
  config.whatsappNumber = String(config.whatsappNumber || '').replace(/[^\d]/g, '');

  if (!/^https?:\/\/[^/\s]+$/.test(config.siteUrl)) {
    throw new Error(`siteUrl must be an absolute URL without a path, got "${config.siteUrl}"`);
  }

  return config;
}

export function missingOwnerValues(config) {
  return Object.entries(OWNER_VALUES).filter(([key]) => !config[key]).map(([, label]) => label);
}

// Flat map of every {{TOKEN}} usable in pages and partials.
export function tokensFor(config) {
  const { address, hours } = config;
  const digits = config.phone.replace(/\D/g, '');
  const oneLine = `${address.street}, ${address.town} ${address.postcode}`;
  const legalEntity = config.legalName && config.legalName !== config.name
    ? `${config.legalName}, trading as ${config.name}`
    : config.name;

  return {
    SITE_URL: config.siteUrl,
    SITE_NAME: config.name,
    LEGAL_ENTITY: legalEntity,
    PHONE_DISPLAY: config.phone,
    PHONE_TEL: digits,
    EMAIL: config.email,
    ADDRESS_LINE1: address.street,
    TOWN: address.town,
    ADDRESS_LINE2: `${address.town} ${address.postcode}`,
    ADDRESS_ONE_LINE: oneLine,
    POSTCODE: address.postcode,
    MAPS_SEARCH_URL: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(oneLine).replace(/%20/g, '+')}`,
    MAPS_DIRECTIONS_URL: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${config.name}, ${oneLine}`)}`,
    MAPS_EMBED_URL: `https://www.google.com/maps?q=${encodeURIComponent(oneLine).replace(/%20/g, '+')}&output=embed`,
    HOURS_DAYS: hours.days,
    OPENS_24: hours.opens,
    CLOSES_24: hours.closes,
    WHATSAPP_NUMBER: config.whatsappNumber,
    OPENS_LABEL: formatTime(hours.opens),
    CLOSES_LABEL: formatTime(hours.closes),
    HOURS_SHORT: `${formatTime(hours.opens)} to ${formatTime(hours.closes)}`,
    HOURS_DASH: `${formatTime(hours.opens)} – ${formatTime(hours.closes)}`,
    HOURS_LONG: `${formatTime(hours.opens, true)} – ${formatTime(hours.closes, true)}`,
    FACEBOOK_URL: config.facebookUrl,
    GOOGLE_REVIEWS_URL: config.googleReviewsUrl,
    FORMSUBMIT_ALIAS: config.formsubmitAlias,
    PRIVACY_UPDATED: new Date(`${config.privacyUpdated}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
  };
}
