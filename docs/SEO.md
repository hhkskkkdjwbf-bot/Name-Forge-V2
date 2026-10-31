# SEO and static pages

`npm run build` ends with `scripts/generate-seo-pages.ts`, which writes into `dist/`:

- `seo/seo.css` (shared stylesheet);
- one landing page per generator and language: English keeps `/seo/generators/<id>/`, every other language uses
  `/seo/<lang>/generators/<id>/` (28 languages × 234 generators = 6552 pages);
- `sitemap.xml` with `lastmod` (6553 URLs, including the home page).

Each page has a localized title and description, `<html lang dir>` (RTL for `ar`/`he`), a canonical URL, 29 `hreflang`
alternates (28 languages + `x-default` → English), Open Graph locale and JSON-LD. Page text is localized from the same
dictionaries as the app; the pages are short landing pages that link to `#/generator/<id>` in the app.

Existing URLs (English pages and the 24 other previous languages) are unchanged. Chinese keeps the code `zh` used by the
existing pages and the dictionaries.

`public/robots.txt` allows crawling; `public/404.html` is served for unknown paths. `scripts/generatedSeoPages.test.mjs`
checks page counts, hreflang counts and language/direction attributes after a build.

Limits: the app itself is a hash-routed SPA, so only the static landing pages are individually indexable; the sitemap
host (`SITE_URL` in the script) must match the deployment URL.
