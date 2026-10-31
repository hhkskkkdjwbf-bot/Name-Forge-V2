import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const dist = new URL('../dist/', import.meta.url);
const distPath = decodeURIComponent(dist.pathname);
const sitemapPath = join(distPath, 'sitemap.xml');
const sitemap = readFileSync(sitemapPath, 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);

assert.ok(sitemap.includes('<urlset'), 'generated sitemap should contain a urlset root');
assert.ok(sitemap.includes('</urlset>'), 'generated sitemap should close its urlset root');
assert.ok(urls.includes('https://jjspa4830-hue.github.io/nameforge-V2/'), 'generated sitemap should include the homepage');
assert.ok(urls.length > 6500, 'generated sitemap should include every generator in all 28 languages');
assert.equal(new Set(urls).size, urls.length, 'generated sitemap URLs should be unique');
assert.ok(urls.every((url) => !url.includes('#')), 'sitemap URLs must not contain fragments');

function countHtmlFiles(directory) {
  return readdirSync(directory).reduce((count, name) => {
    const path = join(directory, name);
    return count + (statSync(path).isDirectory()
      ? countHtmlFiles(path)
      : (name === 'index.html' ? 1 : 0));
  }, 0);
}

const pagesRoot = join(distPath, 'seo');
const pageCount = countHtmlFiles(pagesRoot);
assert.ok(pageCount > 6500, 'build should generate localized static HTML landing pages for the generator catalogue');
assert.equal(pageCount, urls.length - 1, 'every generated landing page should have one sitemap entry');

for (const id of ['fantasy', 'brand', 'sci-fi']) {
  const pagePath = join(pagesRoot, 'generators', id, 'index.html');
  const html = readFileSync(pagePath, 'utf8');
  assert.equal((html.match(/hreflang="/g) || []).length, 29, `${id} page should declare 28 languages plus x-default`);
  assert.match(html, /<title>.+NameForge<\/title>/, `${id} page should have a page-specific title`);
  assert.match(html, /<meta name="description" content="[^"]+"/, `${id} page should have a meta description`);
  assert.match(html, new RegExp(`<link rel="canonical" href="https://jjspa4830-hue\\.github\\.io/nameforge-V2/seo/generators/${id}/">`), `${id} page should have a canonical URL`);
  assert.ok(html.includes(`#/generator/${id}`), `${id} page should link to the matching interactive generator`);
  const structuredDataMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(structuredDataMatch, `${id} page should include structured data`);
  assert.doesNotThrow(() => JSON.parse(structuredDataMatch[1]), `${id} structured data should be valid JSON`);
}

for (const [lang, dir] of [['ar', 'rtl'], ['ja', 'ltr'], ['fr', 'ltr']]) {
  const html = readFileSync(join(pagesRoot, lang, 'generators', 'fantasy', 'index.html'), 'utf8');
  assert.ok(html.includes(`<html lang="${lang}" dir="${dir}">`), `${lang} page should declare its language and direction`);
  assert.ok(html.includes(`/seo/${lang}/generators/fantasy/`), `${lang} page should use its own canonical URL`);
}

console.log(`Generated SEO checks passed: ${pageCount} static landing pages and ${urls.length} sitemap URLs.`);
