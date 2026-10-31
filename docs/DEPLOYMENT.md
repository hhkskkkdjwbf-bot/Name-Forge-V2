# Deployment

GitHub Pages: `.github/workflows/deploy-pages.yml` builds and publishes `dist/`. For a manual build:

```bash
npm install
npm test
npm run build:gh-pages    # relative base, for GitHub Pages
```

Set `SITE_URL` in `scripts/generate-seo-pages.ts` and the absolute URLs in `index.html` (canonical, Open Graph) to the
real public address before publishing. No environment variables or secrets are required; the app makes no network calls
besides loading its own assets.

Generated output is about 38–45 MB (6552 static pages). If your host limits site size, restrict `LANGUAGES` in the SEO
script.
