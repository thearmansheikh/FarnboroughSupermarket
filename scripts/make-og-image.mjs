// Creates the 1200x630 social-sharing image (public/images/og-image.jpg) from the shopfront photo.
// Needs a photo listed in assets/photos.json with the slot "og" (or "hero"). Run: npm run og
// The result is committed, so builds never need fonts or the original photo.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { loadConfig, rootDir } from './lib/config.mjs';
import { escapeHtml } from './lib/html.mjs';

const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'assets', 'photos.json'), 'utf8'));
const entry = manifest.find((photo) => (photo.slots || []).includes('og')) || manifest.find((photo) => (photo.slots || []).includes('hero'));
if (!entry) {
  console.error('Add a photo with slot "hero" or "og" to assets/photos.json first.');
  process.exit(1);
}

const source = path.join(rootDir, 'assets', 'photos-source', entry.file);
if (!fs.existsSync(source)) {
  console.error(`Photo not found: assets/photos-source/${entry.file}`);
  process.exit(1);
}

const { name } = loadConfig();
const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0.35" stop-color="#0d3b22" stop-opacity="0"/>
      <stop offset="1" stop-color="#0d3b22" stop-opacity="0.92"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#fade)"/>
  <text x="64" y="520" font-family="Georgia, 'Times New Roman', serif" font-size="76" fill="#ffffff">${escapeHtml(name)}</text>
  <text x="66" y="574" font-family="Arial, Helvetica, sans-serif" font-size="30" fill="#f4c767">Halal meat, fresh produce and world foods</text>
</svg>`);

await sharp(source)
  .rotate()
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .composite([{ input: overlay }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile(path.join(rootDir, 'public', 'images', 'og-image.jpg'));

console.log(`Wrote public/images/og-image.jpg from ${entry.file}`);
