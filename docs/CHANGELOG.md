# Changelog

## Unreleased

### Languages (28)
- Added full translations for Ukrainian (`uk`), Bengali (`bn`) and Norwegian Bokmål (`nb`); legacy `no` is an alias of `nb`.
  Greek, Hebrew and Finnish and all existing routes/URLs are unchanged.
- Dictionaries, shell, modals, studio, style labels, 234 generator titles, 60 generator descriptions, editorial copy,
  SEO descriptions, FAQ, baby-name meanings/origins, 19 native phrase banks, phonetic profiles and group words.
- Language-count sentence in the language selector is computed instead of hard-coded.
- First-visit interface language is detected from the browser; `resolveGenerationLanguage` keeps interface language and
  name language independent.

### Engine and features
- Seeded, reproducible generation (`seed` option).
- Non-Latin scripts and whole-word vocabularies are never cut into syllables.
- Unicode styles keep accents (base letter styled + combining mark) and return nothing for empty input.

### Accessibility
- Focus trap and focus restoration in modals; AA contrast fixes for secondary text (see `ACCESSIBILITY.md`).

### SEO
- Static pages for 28 languages (6552 pages) with 29 hreflang alternates.

### Docs
- Added ARCHITECTURE, GENERATORS, I18N, ACCESSIBILITY, SEO, TESTING and DEPLOYMENT documents.

### Engine
- Fixed gender rule truncating names; never reduces a name below 4 letters.
- Whole-word vocabularies are no longer split into syllables.
- `combineParts`: roman numerals / all-caps tags, `USS`-style prefixes, hyphenated toponyms, French article merging
  (`du` + `la X` → `de la X`), feminine adjective agreement.
- Duplicate-word detection is Unicode-aware; titles are no longer appended to multi-word names.
- Generation language: group words in 25 languages; name generators use the chosen language's roots;
  19 generators use native curated phrase banks (`src/data/phraseBanks.ts`).
- New syllable families for fantasy-style generators (`src/data/syllableEnrichment.ts`).

### Localization
- Attested baby names: meanings and origins in 24 languages (`src/i18n/attestedNameTranslations.ts`).
- Static SEO landing pages for every generator in 25 languages with hreflang and canonical URLs.

### Performance / assets
- Header logo 2.8 MB → 44 KB; real PNG favicon / touch icons; 1200×630 OG image; manifest.
- Name-details modal lazy loaded; large i18n tables split into their own chunk.

### Accessibility / robustness
- Escape closes all modals; note modal has dialog semantics and a named close button.
- Storage reset and recent-names reading are resilient to blocked or corrupted storage.

### Tests
- `src/tests/regressionQuality.ts` (grammar/assembly scan of every generator and style, translation coverage).
