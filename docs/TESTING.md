# Tests and QA

| Command | What it does | Needs |
|---------|--------------|-------|
| `npm test` | `comprehensiveSuite.ts` (1370 checks) → `regressionQuality.ts` (11815 checks) → `siteMetadata.test.mjs` | `npm install` |
| `npm run lint` | `tsc --noEmit` over the whole project | `npm install` |
| `npm run build` | `tsc`, Vite build, SEO page generation | `npm install` |
| `node scripts/generatedSeoPages.test.mjs` | validates generated pages and sitemap (run after a build) | a `dist/` folder |
| `npm run audit:i18n` | localization coverage audit | `npm install` |
| `npm run test:visual` | Playwright visual QA (`scripts/visual-qa.mjs`) | Chromium: `npx playwright install chromium` |

`regressionQuality.ts` covers: assembly defects over every generator and style, native phrase banks in 28 languages,
attested-name translations, seeded reproducibility, Unicode style safety (accents, non-Latin scripts, emoji), storage
behaviour (favorites, notes, collections, import/export, invalid imports, history cap) and language resolution.

The CI workflow `.github/workflows/validate.yml` installs Chromium, runs `npm test`, `npm run build` and the generated-pages check on every push and pull request; `deploy-pages.yml` also runs `npm run test:visual` before publishing.

## Not covered by automated tests

React rendering, modals and keyboard behaviour in a real browser, responsive layouts (320–1440 px), RTL layout,
light/dark visual checks and Core Web Vitals. `scripts/visual-qa.mjs` is the entry point for the browser checks.
