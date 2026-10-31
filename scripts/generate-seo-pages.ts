import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL_GENERATORS_LIST } from '../src/data/generators';
import { TRANSLATIONS } from '../src/i18n';
import { getLocalizedGeneratorTitle } from '../src/i18n/generatorTitles';
import { getOpenGraphLocale, getSeoDescription } from '../src/i18n/seoMetadata';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = join(ROOT, '..', 'dist');
const SITE_URL = 'https://jjspa4830-hue.github.io/nameforge-V2';
const APP_URL = `${SITE_URL}/`;

/** The 28 fully translated interface languages (25 original + uk, bn, nb). English keeps the historical /seo/generators/<id>/ URLs. */
const LANGUAGES = [
  'en', 'fr', 'es', 'de', 'it', 'pt', 'ar', 'tr', 'ja', 'ko', 'zh', 'ru', 'hi',
  'nl', 'pl', 'sv', 'vi', 'id', 'th', 'el', 'he', 'cs', 'ro', 'da', 'fi', 'uk', 'bn', 'nb',
] as const;
type Lang = (typeof LANGUAGES)[number];
const RTL_LANGUAGES = new Set<string>(['ar', 'he']);

const SEO_CSS = `:root { color-scheme: dark; font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #080817; color: #f8fafc; }
body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; }
main { width: min(100%, 760px); padding: clamp(24px, 5vw, 48px); border: 1px solid #29334d; border-radius: 24px; background: linear-gradient(145deg, #13172c, #0b1020); box-shadow: 0 24px 80px rgba(0, 0, 0, .45); }
.brand { color: #67e8f9; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; font-size: .8rem; }
.category { color: #c4b5fd; font-size: .9rem; }
h1 { font-size: clamp(2rem, 5vw, 3.4rem); line-height: 1.12; margin: 16px 0; }
p { color: #cbd5e1; line-height: 1.7; }
a.button { display: inline-block; margin-top: 16px; padding: 13px 18px; border-radius: 12px; background: #7c3aed; color: white; text-decoration: none; font-weight: 700; }
a.secondary { display: inline-block; margin: 18px 0 0 16px; color: #a5f3fc; }
[dir="rtl"] a.secondary { margin: 18px 16px 0 0; }
footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #29334d; color: #94a3b8; font-size: .85rem; }
a:focus-visible { outline: 3px solid #a5f3fc; outline-offset: 3px; }
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeXml(value: string): string {
  return escapeHtml(value);
}

function pageUrlFor(lang: Lang, id: string): string {
  const encoded = encodeURIComponent(id);
  return lang === 'en'
    ? `${SITE_URL}/seo/generators/${encoded}/`
    : `${SITE_URL}/seo/${lang}/generators/${encoded}/`;
}

function outputPathFor(lang: Lang, id: string): string {
  const encoded = encodeURIComponent(id);
  return lang === 'en'
    ? join(DIST, 'seo', 'generators', encoded, 'index.html')
    : join(DIST, 'seo', lang, 'generators', encoded, 'index.html');
}

function getLabel(lang: Lang, path: string, fallback: string): string {
  const parts = path.split('.');
  let node: any = (TRANSLATIONS as any)[lang] || (TRANSLATIONS as any).en;
  for (const part of parts) node = node?.[part];
  return typeof node === 'string' && node.trim() ? node : fallback;
}

function alternateLinks(id: string): string {
  const links = LANGUAGES.map(
    (lang) => `  <link rel="alternate" hreflang="${lang}" href="${escapeHtml(pageUrlFor(lang, id))}">`
  );
  links.push(`  <link rel="alternate" hreflang="x-default" href="${escapeHtml(pageUrlFor('en', id))}">`);
  return links.join('\n');
}

function renderPage(generator: (typeof ALL_GENERATORS_LIST)[number], lang: Lang): string {
  const id = encodeURIComponent(generator.id);
  const title = getLocalizedGeneratorTitle(generator.id, lang, generator.title);
  const pageTitle = `${title} | NameForge`;
  const description = getSeoDescription('generator-detail', lang, title);
  const pageUrl = pageUrlFor(lang, generator.id);
  const appUrl = `${APP_URL}#/generator/${id}`;
  const categoryLabels: Record<string, string> = {
    fantasy: getLabel(lang, 'footer.exploreTitle', 'Fantasy & lore'),
    business: getLabel(lang, 'footer.businessTitle', 'Business & projects'),
    creative: getLabel(lang, 'footer.creativeTitle', 'Creative & media'),
    innovation: getLabel(lang, 'footer.toolsTitle', 'Tools & workspace'),
  };
  const category = categoryLabels[generator.category] || categoryLabels.creative;
  const openLabel = getLabel(lang, 'categories.openGenerator', 'Open generator');
  const browseLabel = getLabel(lang, 'nav.allGenerators', 'All generators');
  const tagline = getLabel(lang, 'tagline', 'Professional identity & name forge for all worlds');
  const dir = RTL_LANGUAGES.has(lang) ? 'rtl' : 'ltr';
  const cssHref = lang === 'en' ? '../../seo.css' : '../../../seo.css';

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: pageTitle,
    description,
    url: pageUrl,
    inLanguage: lang,
    isPartOf: { '@type': 'WebSite', name: 'NameForge', url: APP_URL },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: title,
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'Any',
      isAccessibleForFree: true,
      url: appUrl,
    },
  }).replace(/</g, '\\u003c');

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#080817">
  <link rel="canonical" href="${escapeHtml(pageUrl)}">
${alternateLinks(generator.id)}
  <link rel="stylesheet" href="${cssHref}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="NameForge">
  <meta property="og:url" content="${escapeHtml(pageUrl)}">
  <meta property="og:title" content="${escapeHtml(pageTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:locale" content="${escapeHtml(getOpenGraphLocale(lang))}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${escapeHtml(pageTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <script type="application/ld+json">${structuredData}</script>
</head>
<body>
  <main>
    <div class="brand">NameForge</div>
    <div class="category">${escapeHtml(category)}</div>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(description)}</p>
    <p>${escapeHtml(tagline)}</p>
    <a class="button" href="${escapeHtml(appUrl)}">${escapeHtml(openLabel)}</a>
    <a class="secondary" href="${escapeHtml(`${APP_URL}#/generators`)}">${escapeHtml(browseLabel)}</a>
    <footer>NameForge · ${escapeHtml(getLabel(lang, 'footer.rights', 'All rights reserved.'))}</footer>
  </main>
</body>
</html>
`;
}

async function main(): Promise<void> {
  if (ALL_GENERATORS_LIST.length === 0) {
    throw new Error('No generator metadata found; refusing to publish an empty SEO sitemap.');
  }

  await mkdir(join(DIST, 'seo'), { recursive: true });
  await writeFile(join(DIST, 'seo', 'seo.css'), SEO_CSS, 'utf8');

  const lastmod = new Date().toISOString().slice(0, 10);
  const entries: string[] = [
    `  <url><loc>${escapeXml(APP_URL)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
  ];
  let pages = 0;

  for (const generator of ALL_GENERATORS_LIST) {
    for (const lang of LANGUAGES) {
      const outputPath = outputPathFor(lang, generator.id);
      await mkdir(dirname(outputPath), { recursive: true });
      await writeFile(outputPath, renderPage(generator, lang), 'utf8');
      entries.push(
        `  <url><loc>${escapeXml(pageUrlFor(lang, generator.id))}</loc><lastmod>${lastmod}</lastmod></url>`
      );
      pages++;
    }
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>
`;
  await writeFile(join(DIST, 'sitemap.xml'), sitemap, 'utf8');
  console.log(
    `Generated ${pages} static landing pages (${ALL_GENERATORS_LIST.length} generators × ${LANGUAGES.length} languages) and a sitemap with ${entries.length} URLs.`
  );
}

main().catch((error: unknown) => {
  console.error('Failed to generate static SEO pages:', error);
  process.exitCode = 1;
});
