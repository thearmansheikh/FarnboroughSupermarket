import fs from 'node:fs';
import path from 'node:path';
import { escapeHtml } from './html.mjs';
import { tokensFor } from './config.mjs';

// Reads data/faq.json: a list of { "question": "...", "answer": "..." }. Answers may use {{TOKENS}} such as
// {{PHONE_DISPLAY}} or {{HOURS_SHORT}}. Only add facts the owner has confirmed.
export function loadFaq(rootDir, config) {
  const file = path.join(rootDir, 'data', 'faq.json');
  if (!fs.existsSync(file)) return [];

  let entries;
  try {
    entries = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`data/faq.json is not valid JSON: ${error.message}`);
  }
  if (!Array.isArray(entries)) throw new Error('data/faq.json must contain a list: [ ... ]');

  const tokens = tokensFor(config);
  const fill = (text) => text.replace(/\{\{([A-Z_0-9]+)\}\}/g, (match, key) => (key in tokens ? tokens[key] : match)).trim();

  return entries.map((entry, index) => {
    if (!entry || typeof entry.question !== 'string' || !entry.question.trim() || typeof entry.answer !== 'string' || !entry.answer.trim()) {
      throw new Error(`data/faq.json item #${index + 1} needs a "question" and an "answer" (both text).`);
    }
    return { question: fill(entry.question), answer: fill(entry.answer) };
  });
}

export function faqHtml(faq) {
  if (!faq.length) return '';

  const items = faq.map((item) => `<details class="faq-item">
            <summary>${escapeHtml(item.question)}</summary>
            <p>${escapeHtml(item.answer)}</p>
          </details>`);

  return `<section class="mt-12" aria-labelledby="faq-heading">
          <h2 id="faq-heading" class="text-2xl font-black text-slate-900">Frequently asked questions</h2>
          <div class="mt-6 grid gap-3">
          ${items.join('\n          ')}
          </div>
        </section>`;
}

export function faqJsonLd(faq) {
  if (!faq.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
