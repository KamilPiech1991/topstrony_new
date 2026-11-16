# topstrony.pl – strona w Astro

Statyczna strona agencji **top.strony** (Qamitech Kamil Piech) zbudowana w [Astro](https://astro.build), z animacjami w czystym JavaScripcie (bez bibliotek).

## Start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # gotowa strona w dist/
npm run preview
```

## Strony

| Adres | Plik |
|---|---|
| `/` | `src/pages/index.astro` |
| `/uslugi/` | `src/pages/uslugi/index.astro` |
| `/uslugi/<slug>/` (6 usług) | `src/pages/uslugi/[slug].astro` |
| `/o-nas/` | `src/pages/o-nas.astro` |
| `/realizacje/` | `src/pages/realizacje.astro` |
| `/kontakt/` (+ `/kontakt/dziekujemy/`) | `src/pages/kontakt.astro` |
| 404 | `src/pages/404.astro` |

## Struktura

- `src/layouts/Base.astro` – `<head>` (SEO, Open Graph, JSON-LD), motyw jasny/ciemny, nagłówek i stopka.
- `src/components/gen/*.astro` – sekcje stron (nagłówek z mega menu, stopka, treści stron).
- `src/data/pages/*.json` – treści stron (teksty, listy, FAQ, usługi). Tu najłatwiej poprawiać copy.
- `src/data/site.ts` – dane firmy do schema.org (adres, telefon, godziny, oceny).
- `src/scripts/app.ts` – interakcje i animacje: motyw, mega menu, menu mobilne, akordeon usług, FAQ, kalkulator, szybki kontakt, formularz, odsłanianie przy przewijaniu, dzielenie nagłówków na linie, liczniki, kursor, przyciski magnetyczne, paralaksa.
- `src/styles/` – style globalne i fonty (Poppins, Inter, Great Vibes hostowane lokalnie, tylko latin + latin-ext).
- `public/img/` – obrazy zoptymalizowane do WebP.
- `public/robots.txt`, `public/llms.txt`, sitemap generowana automatycznie.

## Optymalizacja

- Zero frameworków JS w przeglądarce: jeden mały skrypt (~12 KB) i CSS (~97 KB, ~20 KB gzip).
- Obrazy WebP z `width`/`height`, `loading="lazy"` i `decoding="async"`.
- Fonty lokalnie, bez Google Fonts; `font-display: swap`.
- Animacje respektują `prefers-reduced-motion`.
- Prefetch linków po najechaniu, skompresowany HTML.

## Formularz kontaktowy

Formularz na `/kontakt/` jest przygotowany pod **Netlify Forms** (`data-netlify="true"`, pole-pułapka na spam). Po wdrożeniu na Netlify zgłoszenia trafią do panelu Netlify. Na innym hostingu skrypt otworzy klienta poczty z gotową wiadomością do biuro@topstrony.pl; można też podpiąć Formspree albo własny endpoint w `src/scripts/app.ts`.

## Wdrożenie

Netlify / Cloudflare Pages / Vercel: build command `npm run build`, katalog publikacji `dist`.

## Narzędzia projektu (`tools/`)

Strona powstała z projektu w Claude Design. Skrypty w `tools/` (`extract-data.cjs`, `generate.py`, `dc2astro.py`) przenoszą treści i szablony z plików projektu do komponentów Astro. Po wdrożeniu strona jest zwykłym projektem Astro i można edytować pliki w `src/` bezpośrednio.
