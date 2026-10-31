# Generators and the naming engine

234 generators are declared in `src/data/generators.ts`; their vocabularies are in `src/data/subcategories.ts`
(351 styles). `generateNames(options)` in `src/services/generatorEngine.ts` is the single entry point.

## Options

`generator`, `style`, `length`, `format`, `gender`, `genLanguage`, `quantity`, `keyword` and `seed`.

- `genLanguage` is the language of the *names*; it is independent from the interface language. `auto` follows the
  interface language (`resolveGenerationLanguage` in `settings.ts`) and falls back to English for languages without a
  phonetic profile. An explicit choice always wins.
- `seed` (string or number) makes a batch reproducible: the same seed and options always return the same names. While
  seeded, the recent-names history is ignored so output does not depend on previous batches. The UI does not expose a
  seed field yet; the option is available to code and tests.

## Strategies

| Case | Behaviour |
|------|-----------|
| Syllable vocabularies (fantasy, elf, dragon…) | phonetic harmony, neologism, portmanteau, punchy and epic-compound strategies |
| Whole-word vocabularies (surnames, places, weapons, handles, non-Latin scripts) | never cut into syllables: `isWholeWordVocabulary` |
| Sentence-like and venue generators (19 of them) | curated native phrase banks per language (`src/data/phraseBanks.ts`) |
| Other generators with a chosen language | built from that language's roots (`LANGUAGE_PHONETICS`) |
| `baby_name` | attested names; meanings and origins are translated (`attestedNameTranslations.ts`) |

Assembly rules live in `combineParts` (roman numerals, `USS`-style prefixes, hyphenated toponyms, French
article/preposition merging, adjective agreement). Candidates are scored and de-duplicated; recent names are filtered
through a 100-name sliding window stored locally.

## Limits

- Invented names are phonetic creations, not documented etymologies. The details modal says so explicitly; only the
  attested baby names carry an origin and meaning.
- Availability of names, domains or trademarks is never checked by the engine.
- Phrase banks hold 10 phrases per language (20 for restaurants, taverns and video games), so large batches repeat.
- About 130 phrase-style generators still use French source vocabulary when the interface language is French; with any
  other language they are built from that language's roots.

## Adding a generator or phrase bank

1. Add the metadata to `generators.ts` and vocabularies to `subcategories.ts`.
2. Add its subject word per language in `i18n/generatorTitles.ts` (and `i18n/addedGeneratorTitles.ts` for uk/bn/nb).
3. For a sentence-like generator, add a bank to `RAW_BANKS` in `phraseBanks.ts` (28 languages, equal size) and its id to
   `isSentenceLikeGenerator` in the engine.
4. Run `npm test`; the regression suite scans every generator and style for assembly defects.
