# Architecture

NameForge is a client-side React 18 + TypeScript + Vite + Tailwind application. There is no backend: all user data
(saved names, notes, collections, history, settings) lives in the browser's `localStorage`.

```
src/
  App.tsx                 hash router (#/, #/generators, #/generator/<id>, #/my-names, #/style-studio)
  views/                  pages (lazy loaded): Home, GeneratorsList, GeneratorDetail, MyNames, StyleStudio
  components/             Navbar, Footer, NameCard, GeneratorControl and the modals
  hooks.ts                useEscapeKey, useModalFocus (dialog accessibility)
  services/
    generatorEngine.ts    naming engine (see GENERATORS.md)
    storage.ts            favorites, notes, ratings, collections, history, import/export
    settings.ts           app settings, language list, browser-language detection
    textStyler.ts         Unicode styles and visual effects for the typography workshop
  data/                   generator metadata and vocabularies, phrase banks, syllable enrichment
  i18n/                   dictionaries and localized content (see I18N.md)
  tests/                  comprehensiveSuite.ts, regressionQuality.ts
scripts/                  SEO page generator, localization audit, visual QA (Playwright)
```

## Data and source of truth

| Data | Source of truth | Notes |
|------|-----------------|-------|
| Generator list, categories | `src/data/generators.ts` | ids are stable and used in URLs |
| Style definitions and vocabularies | `src/data/subcategories.ts` (+ `syllableEnrichment.ts`) | enrichment is merged at load |
| Saved names / collections / notes / history | `localStorage` (`storage.ts`) | all reads/writes are guarded by try/catch |
| Settings | `localStorage` key `nameforge_settings` (`settings.ts`) | legacy language `no` migrates to `nb` |

A saved name is identified by its text (case-insensitive); saving the same text from another generator toggles the same
entry. There is no remote synchronization: data never leaves the device and is not shared between devices.

## Build

`npm run build` runs `tsc`, `vite build`, then `scripts/generate-seo-pages.ts`, which writes localized static landing
pages and `sitemap.xml` into `dist/`. Large i18n tables are split into their own chunks (`vite.config.ts`).
