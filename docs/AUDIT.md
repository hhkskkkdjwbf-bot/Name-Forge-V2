# NameForge — Audit and change report

**Scope.** The archive provided to the assistant was `nameforge-V2-main.zip` (a V2 snapshot). The GitHub repository
`tuhahahc0-boop/NameForge-V3` could not be reached (GitHub blocks automated access) and no V3 archive was supplied, so
**these changes were made on V2 and must be merged into V3**; `nameforge-changes.patch` (diff against the original V2
archive) is provided for that purpose.

**Environment limits.** No network: `npm install`, `vite build`, `tsc -p .` (React types missing), Playwright, Lighthouse
and browser screenshots could **not** be run. Everything below marked "verified" was executed with `tsx`, `node` or a
partial `tsc` run; React rendering was not exercised.

## Findings and status

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| 1 | High | Female-gender rule used a character class and truncated names ("Aurora" → "a") | Fixed, tested |
| 2 | High | Real-word vocabularies chopped into syllables ("Fabmon", "Drbear") | Fixed (whole-word detection, non-Latin scripts) |
| 3 | High | French grammar defects in phrase generators ("du la Plaine", "La Chope Boiteux") | Fixed in `combineParts` and data |
| 4 | High | 2.8 MB header logo shown at ≤ 56 px; 454 KB JPEG named `.png` used as favicon | Replaced (44 KB logo, real PNG icons, OG image) |
| 5 | Medium | Starship/planet joins, roman numeral "III" collapsed to "I" | Fixed |
| 6 | Medium | Duplicate-word filter ignored accented letters | Fixed |
| 7 | Medium | Baby-name origin/meaning French-only | Translated into 27 languages, tested |
| 8 | Medium | Phrase generators ignored the chosen generation language | 19 generators with native phrase banks (28 languages) |
| 9 | Medium | Static SEO pages English-only, no `lastmod` | 6552 localized pages, hreflang, canonical, RTL |
| 10 | Medium | Modals: no Escape on five of them, no focus management, note modal without dialog role / close name | Fixed (code reviewed, not browser-tested) |
| 11 | Medium | Reset of local data and "recent names" not guarded against blocked/corrupted storage | Fixed, tested |
| 12 | Medium | Contrast: dark `slate-500/600` text 2.4–4.2:1, light placeholder 3.5:1 | Fixed in CSS (measured ratios in ACCESSIBILITY.md) |
| 13 | Medium | Unicode styles dropped accent handling (É left unstyled) and decorative styles invented output for empty input | Fixed, tested |
| 14 | Medium | Auto generation language used French source data for interface languages without a profile; Home quick-forge ignored the interface language | Fixed (`resolveGenerationLanguage`) |
| 15 | Low | No web app manifest; fantasy generators repetitive | Manifest added; syllable families added |
| 16 | Low | Hard-coded "25 languages" / "82·25·57" counts in tests and language selector | Computed / updated to 28 |

## Languages

`uk`, `bn`, `nb` were added with full translations (list of layers in `docs/I18N.md`). `el`, `he`, `fi` and every existing
route, URL, translation and SEO entry are unchanged. Legacy code `no` is migrated to `nb`.
Translations are **unreviewed by native speakers**.

## Audit of collections, comparison, history and the typography workshop

- **Collections / favorites / notes / history / import-export** (`storage.ts`): reviewed and covered by behavioural tests
  (create, assign, delete, round trip, re-import without duplicates, six invalid imports leaving data untouched, history
  cap of 50, rating clamp). Behaviour to know: a saved name is keyed by its text, so saving it from a second generator
  toggles the same entry (by design; documented).
- **Comparison modal** (`CompareModal.tsx`): the 2–4 name limit and fallbacks are translated; logic reviewed by reading
  only (React, not executed).
- **Typography workshop** (`textStyler.ts`): 22 styles tested on accented Latin, Cyrillic, Bengali, Arabic, digits, emoji
  and empty input; no corrupted output. Limitation: styles cover Latin letters and digits only; other scripts pass
  through unchanged, and not every platform renders every Unicode block.

## Commands actually executed and results

| Command | Result |
|---------|--------|
| `npx tsx src/tests/comprehensiveSuite.ts` | **1370/1370 passed** |
| `npx tsx src/tests/regressionQuality.ts` | **11815 checks passed, 0 failed** (repeated runs) |
| `node scripts/siteMetadata.test.mjs` | passed (28 locales) |
| `npx tsx scripts/generate-seo-pages.ts` + `node scripts/generatedSeoPages.test.mjs` | 6552 pages / 6553 sitemap URLs, passed |
| `npx tsx scripts/localization-coverage-audit.ts` | 27 non-French locales checked, 0 missing or unverified |
| `tsc --strict` on services, i18n, data, types, tests | clean except `Cannot find namespace 'React'` (types not installed) |
| `tsc` syntax pass over all `.tsx` + `hooks.ts` | no syntax errors; only the known `unknown` errors caused by missing React types |
| `npm run build`, `npm run lint`, `npm run test:visual`, Playwright, Lighthouse | **not run** |

## Remaining limits and risks

- Build, React rendering, modal focus behaviour, responsive (320–1440 px) and RTL layouts, light/dark visuals and Core Web
  Vitals are unverified: run `npm install && npm test && npm run build && npm run test:visual`.
- The seed option is not exposed in the UI.
- Phrase banks have 10–20 entries per language, so repeated batches repeat names; about 130 phrase-style generators
  keep French vocabulary when the interface is French.
- Contrast of white text on `cyan-600` buttons (3.7:1) was not changed.
- No `LICENSE` file exists in the archive; none is declared.
- Merge into V3: apply `nameforge-changes.patch`; conflicts are likely in `generatorEngine.ts`, `settings.ts`,
  `i18n/index.ts` and the views if V3 changed them.
