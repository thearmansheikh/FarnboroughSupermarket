import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { build } from '../scripts/build.mjs';
import { generatePhotos, validateManifest } from '../scripts/images.mjs';
import { loadConfig, rootDir } from '../scripts/lib/config.mjs';

// A throwaway project with a synthetic "phone photo": landscape pixels with EXIF orientation 6 (rotated)
// plus a GPS position, which must not survive into the generated files.
async function makeProject(manifest) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-photos-'));
  for (const dir of ['src', 'public']) fs.cpSync(path.join(rootDir, dir), path.join(root, dir), { recursive: true });
  fs.cpSync(path.join(rootDir, 'data'), path.join(root, 'data'), { recursive: true });
  fs.mkdirSync(path.join(root, 'assets', 'photos-source'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets', 'photos.json'), JSON.stringify(manifest));

  const photo = await sharp({ create: { width: 2400, height: 1600, channels: 3, background: '#3f8f5a' } })
    .withExif({ IFD0: { Make: 'TestPhone' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '51/1 17/1 0/1', GPSLongitudeRef: 'W', GPSLongitude: '0/1 45/1 0/1' } })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  assert.equal((await sharp(photo).metadata()).orientation, 6);
  fs.writeFileSync(path.join(root, 'assets', 'photos-source', 'Shop Front.JPG'), photo);
  return root;
}

const manifest = [
  { file: 'Shop Front.JPG', alt: 'The Farnborough Supermarket shopfront on Eastmead', slots: ['hero', 'tile-greens', 'cat-meat'], caption: 'Our shopfront' },
];

test('photos are resized, converted, rotated and stripped of metadata', async () => {
  const root = await makeProject(manifest);
  try {
    const index = await generatePhotos({ root, quiet: true });
    const out = path.join(root, 'assets', 'photos');

    assert.equal(index.length, 1);
    assert.match(index[0].name, /^shop-front-[0-9a-f]{8}$/);
    assert.deepEqual(index[0].widths, [480, 800, 1200, 1600]);
    // Orientation 6 means the stored landscape pixels display as portrait.
    assert.equal(index[0].width, 1600);
    assert.equal(index[0].height, 2400);

    for (const width of index[0].widths) {
      for (const format of ['avif', 'webp']) {
        const file = path.join(out, `${index[0].name}-${width}.${format}`);
        assert.ok(fs.existsSync(file), `${width}.${format}`);
        const meta = await sharp(file).metadata();
        assert.equal(meta.exif, undefined, `${width}.${format} has EXIF`);
        assert.equal(meta.width, width);
        assert.equal(meta.orientation, undefined);
      }
    }

    assert.ok(fs.statSync(path.join(out, `${index[0].name}-1200.webp`)).size < 200 * 1024, '1200w under 200 KB');
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test('small photos never get upscaled', async () => {
  const root = await makeProject(manifest);
  try {
    fs.writeFileSync(path.join(root, 'assets', 'photos-source', 'Shop Front.JPG'), await sharp({ create: { width: 900, height: 600, channels: 3, background: '#fff' } }).jpeg().toBuffer());
    const [photo] = await generatePhotos({ root, quiet: true });
    assert.deepEqual(photo.widths, [480, 800, 900]);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test('the manifest rejects missing alt text and unknown slots', () => {
  assert.throws(() => validateManifest([{ file: 'a.jpg', alt: 'short', slots: [] }]), /alt/);
  assert.throws(() => validateManifest([{ file: 'a.jpg', alt: 'A long enough description', slots: ['banner'] }]), /unknown slot/);
  assert.throws(() => validateManifest([{ file: '../a.jpg', alt: 'A long enough description' }]), /file/);
  assert.doesNotThrow(() => validateManifest(manifest));
});

test('pages use real photos, a preloaded hero and the gallery when photos exist', async () => {
  const root = await makeProject(manifest);
  const outDir = path.join(root, 'dist');
  try {
    const [photo] = await generatePhotos({ root, quiet: true });
    build({ rootDir: root, outDir, config: loadConfig({ env: {} }), css: false });
    const read = (file) => fs.readFileSync(path.join(outDir, file), 'utf8');
    const home = read('index.html');

    assert.match(home, /<picture><source type="image\/avif" srcset="[^"]*shop-front-[0-9a-f]{8}-480\.avif 480w/);
    assert.match(home, /<img src="\/images\/photos\/shop-front-[0-9a-f]{8}-800\.webp" width="800" height="1200" alt="The Farnborough Supermarket shopfront on Eastmead"[^>]*fetchpriority="high"/);
    assert.match(home, /<link rel="preload" as="image" type="image\/avif" imagesrcset="[^"]*shop-front-[0-9a-f]{8}-1600\.avif 1600w/);
    assert.doesNotMatch(home, /photo-stack/);
    assert.ok(fs.existsSync(path.join(outDir, 'images', 'photos', photo.name + '-1200.avif')));
    assert.ok(!fs.existsSync(path.join(outDir, 'images', 'photos', 'index.json')));

    assert.match(read('products.html'), /<picture>[\s\S]*alt="The Farnborough Supermarket shopfront on Eastmead"/);

    const gallery = read('gallery.html');
    assert.match(gallery, /<dialog id="lightbox"[^>]*aria-label="Photo viewer"/);
    assert.match(gallery, /data-gallery-open[^>]*data-alt="The Farnborough Supermarket shopfront on Eastmead"/);
    assert.match(gallery, /Our shopfront/);
    assert.doesNotMatch(gallery, /coming soon/);
    assert.doesNotMatch(gallery, /\/images\/[a-z]+\.svg/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }
});

test('without photos the pages fall back to the illustrations and say photos are coming', () => {
  // A project folder with the site's pages but no assets/photos, as the site was before real photos were added.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-nophotos-'));
  const outDir = path.join(root, 'dist');
  try {
    for (const dir of ['src', 'public', 'data']) fs.cpSync(path.join(rootDir, dir), path.join(root, dir), { recursive: true });
    build({ rootDir: root, outDir, config: loadConfig({ env: {} }), css: false });

    assert.match(fs.readFileSync(path.join(outDir, 'gallery.html'), 'utf8'), /Store photographs are coming soon/);
    assert.match(fs.readFileSync(path.join(outDir, 'products.html'), 'utf8'), /<img src="\/images\/meat\.svg" alt="Fresh halal meat"/);
    const home = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
    assert.doesNotMatch(home, /rel="preload"/);
    assert.doesNotMatch(home, /Step inside Farnborough Supermarket/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the real shop photos are all processed, described and used on the pages', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-realphotos-'));
  try {
    build({ outDir, config: loadConfig({ env: {} }), css: false });
    const index = JSON.parse(fs.readFileSync(path.join(rootDir, 'assets', 'photos', 'index.json'), 'utf8'));
    const read = (file) => fs.readFileSync(path.join(outDir, file), 'utf8');

    assert.equal(index.length, 10);
    for (const photo of index) {
      assert.ok(photo.alt.length >= 40, `${photo.name} has a proper description`);
      assert.deepEqual(photo.widths, [480, 800, 1200, 1600]);
      for (const width of photo.widths) {
        for (const format of ['avif', 'webp']) assert.ok(fs.existsSync(path.join(rootDir, 'assets', 'photos', `${photo.name}-${width}.${format}`)), `${photo.name} ${width} ${format}`);
      }
      assert.ok(fs.statSync(path.join(rootDir, 'assets', 'photos', `${photo.name}-1200.webp`)).size < 200 * 1024, `${photo.name} 1200w under 200 KB`);
    }

    const home = read('index.html');
    assert.match(home, /<link rel="preload" as="image" type="image\/avif"[^>]*shopfront/);
    assert.match(home, /fetchpriority="high"/);
    assert.match(home, /Step inside Farnborough Supermarket/);
    assert.doesNotMatch(read('gallery.html'), /coming soon/);
    assert.equal((read('gallery.html').match(/data-gallery-open /g) || []).length, 10);
    assert.doesNotMatch(read('products.html'), /<img src="\/images\/[a-z]+\.svg"/);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('the About page leads with a photo, and the offers empty state has call and directions buttons', () => {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'farnborough-polish-'));
  try {
    build({ outDir, config: loadConfig({ env: {} }), css: false });
    const about = fs.readFileSync(path.join(outDir, 'about.html'), 'utf8');
    const offers = fs.readFileSync(path.join(outDir, 'offers.html'), 'utf8');

    assert.match(about, /<link rel="preload" as="image" type="image\/avif"[^>]*shop-interior/);
    assert.match(about, /class="hero-photo"><picture>/);
    assert.match(about, /shop-floor-[0-9a-f]{8}-800\.webp/);
    assert.doesNotMatch(about, /Fresh produce<\/p><p class="mt-2 text-sm text-white\/75">/);
    assert.match(offers, /id="offers-empty"[\s\S]*href="tel:01252940815"[\s\S]*Get directions/);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});
