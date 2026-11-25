// Generuje mniejsze warianty obrazów przed buildem (PageSpeed: właściwy rozmiar obrazów).
// Uruchamiane automatycznie w `npm run build`. Pliki wynikowe trafiają do public/img/.
import sharp from 'sharp';
import fs from 'node:fs';

const jobs = [
  // logo w nagłówku (wyświetlane ok. 104–124 px) i w stopce (ok. 143 px)
  { src: 'public/img/top-strony-logo-white.webp', out: 'public/img/top-strony-logo-white-300.webp', width: 300, quality: 90 },
  { src: 'public/img/top-strony-logo-ink.webp', out: 'public/img/top-strony-logo-ink-300.webp', width: 300, quality: 90 },
  // zdjęcie doradczyni w banerze CTA (wyświetlane ok. 372 px)
  { src: 'public/img/konsultantka-telefon.webp', out: 'public/img/konsultantka-telefon-380.webp', width: 380, quality: 74 },
  { src: 'public/img/konsultantka-telefon.webp', out: 'public/img/konsultantka-telefon-560.webp', width: 560, quality: 74 },
];

for (const j of jobs) {
  if (!fs.existsSync(j.src)) { console.warn('brak pliku', j.src); continue; }
  const info = await sharp(j.src)
    .resize({ width: j.width, withoutEnlargement: true })
    .webp({ quality: j.quality, effort: 6, alphaQuality: 90 })
    .toFile(j.out);
  console.log('img-variants:', j.out, info.width + 'x' + info.height, Math.round(info.size / 1024) + ' KiB');
}
