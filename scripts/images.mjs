// Turns the original store photos into small, metadata-free responsive images.
//
//   assets/photos-source/   originals (git-ignored; may contain GPS data, never commit them)
//   assets/photos.json      alt text and where each photo is used (committed, edited by hand)
//   assets/photos/          generated AVIF + WebP files and index.json (committed, safe to publish)
//
// Run: npm run photos
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { rootDir } from './lib/config.mjs';

export const WIDTHS = [480, 800, 1200, 1600];
const QUALITY = { avif: 50, webp: 72 };

export const SLOTS = [
  'hero', 'tile-greens', 'tile-tea', 'tile-pantry',
  'cat-meat', 'cat-rice', 'cat-tea', 'cat-olives', 'cat-produce', 'cat-world',
  'about', 'og',
];

export function validateManifest(entries) {
  if (!Array.isArray(entries)) throw new Error('assets/photos.json must be a list');

  entries.forEach((entry, index) => {
    const label = `assets/photos.json item #${index + 1}${entry && entry.file ? ` (${entry.file})` : ''}`;
    if (!entry || typeof entry.file !== 'string' || !/^[\w .-]+\.(jpe?g|png|webp)$/i.test(entry.file)) {
      throw new Error(`${label}: "file" must be a JPG, PNG or WebP file name inside assets/photos-source/`);
    }
    if (typeof entry.alt !== 'string' || entry.alt.trim().length < 10) {
      throw new Error(`${label}: "alt" must describe the photo (at least 10 characters), e.g. "Halal meat counter with fresh lamb and chicken cuts"`);
    }
    for (const slot of entry.slots || []) {
      if (!SLOTS.includes(slot)) throw new Error(`${label}: unknown slot "${slot}". Valid slots: ${SLOTS.join(', ')}`);
    }
  });
}

const slugify = (file) => path.basename(file, path.extname(file)).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Processes every photo listed in assets/photos.json. Returns the generated index.
export async function generatePhotos({ root = rootDir, quiet = false } = {}) {
  sharp.cache(false); // do not keep files open (Windows cannot delete open files)
  const manifestFile = path.join(root, 'assets', 'photos.json');
  const sourceDir = path.join(root, 'assets', 'photos-source');
  const outDir = path.join(root, 'assets', 'photos');
  const entries = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, 'utf8')) : [];
  validateManifest(entries);

  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const index = [];
  for (const entry of entries) {
    const source = path.join(sourceDir, entry.file);
    if (!fs.existsSync(source)) {
      if (!quiet) console.warn(`Skipping ${entry.file}: not found in assets/photos-source/`);
      continue;
    }

    const name = slugify(entry.file);
    // .rotate() applies the EXIF orientation; sharp drops all metadata (EXIF, GPS) from the outputs by default.
    const base = sharp(source).rotate();
    const meta = await sharp(source).metadata();
    const rotated = (meta.orientation || 1) >= 5;
    const fullWidth = rotated ? meta.height : meta.width;
    const fullHeight = rotated ? meta.width : meta.height;
    const unique = [...new Set([...WIDTHS.filter((w) => w <= fullWidth), ...(fullWidth < WIDTHS[WIDTHS.length - 1] ? [fullWidth] : [])])].sort((x, y) => x - y);

    for (const width of unique) {
      for (const format of ['avif', 'webp']) {
        await base.clone().resize({ width, withoutEnlargement: true })[format]({ quality: QUALITY[format] }).toFile(path.join(outDir, `${name}-${width}.${format}`));
      }
    }

    index.push({
      name,
      alt: entry.alt.trim(),
      slots: entry.slots || [],
      gallery: entry.gallery !== false,
      caption: entry.caption || '',
      width: fullWidth,
      height: fullHeight,
      widths: unique,
    });
    if (!quiet) console.log(`${entry.file} -> ${unique.map((w) => `${w}w`).join(', ')} (AVIF + WebP)`);
  }

  fs.writeFileSync(path.join(outDir, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  return index;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const index = await generatePhotos();
  console.log(`${index.length} photo(s) ready in assets/photos/. Rebuild the site to use them.`);
}
