import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml } from './html.mjs';
import { formatTime } from './config.mjs';
import { londonToday } from './offers.mjs';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// The "Our story" paragraphs from data/story.json (the owner writes these in their own words).
export function storyHtml(rootDir) {
  const file = path.join(rootDir, 'data', 'story.json');
  if (!fs.existsSync(file)) return '';

  const { paragraphs = [] } = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(paragraphs) || paragraphs.some((text) => typeof text !== 'string')) {
    throw new Error('data/story.json needs {"paragraphs": ["text", "text"]}');
  }

  return paragraphs
    .filter((text) => text.trim())
    .map((text, index) => `<p class="mt-5 ${index === 0 ? 'text-lg ' : ''}text-slate-600">${escapeHtml(text.trim())}</p>`)
    .join('\n            ');
}

// Validates config.specialHours: [{ "from": "2026-12-25", "to": "2026-12-25", "label": "Christmas Day", "closed": true }]
// or with "opens"/"closes" ("09:00") for shorter hours.
export function validateSpecialHours(specialHours) {
  if (!Array.isArray(specialHours)) throw new Error('specialHours in site.config.json must be a list');

  specialHours.forEach((entry, index) => {
    const label = `specialHours #${index + 1}`;
    if (!entry || !ISO_DATE.test(entry.from) || !ISO_DATE.test(entry.to) || entry.from > entry.to) {
      throw new Error(`${label}: "from" and "to" must be dates like 2026-12-25, with "from" not after "to"`);
    }
    if (!entry.label || typeof entry.label !== 'string') throw new Error(`${label}: needs a "label", for example "Christmas Day"`);
    if (!entry.closed && !(/^\d{2}:\d{2}$/.test(entry.opens) && /^\d{2}:\d{2}$/.test(entry.closes))) {
      throw new Error(`${label}: use "closed": true, or give "opens" and "closes" like "09:00" and "18:00"`);
    }
  });
}

// Banners for upcoming and current special opening hours. They start hidden; status.js shows the one that applies
// today (in UK time), so a banner appears and disappears on the right day without a rebuild.
export function specialHoursHtml(specialHours, today = londonToday()) {
  validateSpecialHours(specialHours);

  return specialHours
    .filter((entry) => entry.to >= today)
    .map((entry) => {
      const text = entry.closed
        ? `${entry.label}: we are closed.`
        : `${entry.label}: open ${formatTime(entry.opens)} to ${formatTime(entry.closes)}.`;
      const data = `data-special data-from="${entry.from}" data-to="${entry.to}" data-label="${escapeHtml(entry.label)}"${entry.closed ? ' data-closed="true"' : ` data-opens="${entry.opens}" data-closes="${entry.closes}"`}`;

      return `<div class="special-hours" role="status" ${data} hidden>${escapeHtml(text)}</div>`;
    })
    .join('');
}
