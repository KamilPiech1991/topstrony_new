// Converts the design's source images to optimized WebP (+ keeps SVG), writes src/data/img-map.json
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const blobmap = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const items = JSON.parse(fs.readFileSync(process.argv[3], 'utf8')); // realizacje thumbs -> titles
const out = 'public/img';
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const byFile = Object.fromEntries(items.map((i) => [i.file, i.title]));
const map = {};
for (const [id, src] of Object.entries(blobmap)) {
  if (id.startsWith('pending')) continue;
  const base = path.basename(src);
  const ext = path.extname(base).toLowerCase();
  let name = slug(byFile[base] ? 'realizacja-' + byFile[base] : base.replace(ext, ''));
  if (src.includes('/qlogo/')) name = 'logo-klienta-' + name;
  if (src.includes('/ecoic/')) name = 'ikona-' + name;
  if (src.includes('/svcimg/')) name = 'usluga-' + name;
  if (src.includes('/kp/')) name = 'kamil-piech-' + name;
  if (src.includes('/tslogo/')) name = 'top-strony-' + name;
  if (ext === '.svg') {
    fs.copyFileSync(src, path.join(out, name + '.svg'));
    map[id] = { src: '/img/' + name + '.svg' };
    continue;
  }
  const img = sharp(src);
  const meta = await img.metadata();
  const maxW = src.includes('/qlogo/') || src.includes('/tslogo/') ? 600 : 1600;
  const w = Math.min(meta.width, maxW);
  const file = name + '.webp';
  const info = await img.resize({ width: w, withoutEnlargement: true }).webp({ quality: src.includes('logo') ? 90 : 78, effort: 6, alphaQuality: 90 }).toFile(path.join(out, file));
  map[id] = { src: '/img/' + file, w: info.width, h: info.height };
}
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/img-map.json', JSON.stringify(map, null, 1));
console.log(Object.keys(map).length, 'images');
