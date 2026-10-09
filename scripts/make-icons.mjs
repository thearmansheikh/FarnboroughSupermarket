// Creates the PNG icons from public/favicon.svg. Run once (npm run icons) and commit the results.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { rootDir } from './lib/config.mjs';

const publicDir = path.join(rootDir, 'public');
const svg = fs.readFileSync(path.join(publicDir, 'favicon.svg'));

const icons = [
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

for (const { file, size } of icons) {
  await sharp(svg, { density: Math.round((72 * size) / 64) * 2 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(publicDir, file));
  console.log(`public/${file} (${size}x${size})`);
}

// Maskable icon: the artwork sits inside the central 80% "safe zone" on a solid background.
const safe = Math.round(512 * 0.8);
const inner = await sharp(svg, { density: 576 }).resize(safe, safe).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#165a35' } })
  .composite([{ input: inner, gravity: 'center' }])
  .png({ compressionLevel: 9 })
  .toFile(path.join(publicDir, 'icon-maskable-512.png'));
console.log('public/icon-maskable-512.png (512x512)');
