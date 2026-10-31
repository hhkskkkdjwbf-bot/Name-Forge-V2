import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'http://127.0.0.1:4173/';
const outputDir = 'artifacts/lighthouse';
await mkdir(outputDir, { recursive: true });

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

const routes = [
  { name: 'home', path: '' },
  { name: 'catalog', path: '#/generators' },
  { name: 'generator-detail', path: '#/generator/fantasy' },
  { name: 'my-names', path: '#/my-names' },
  { name: 'style-studio', path: '#/style-studio' },
];

function runLighthouse(url, reportPath, chromePath) {
  const args = [
    '--yes', 'lighthouse', url,
    '--chrome-path=' + chromePath,
    '--chrome-flags=--headless --no-sandbox',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    '--output-path=' + reportPath,
    '--quiet',
  ];
  return new Promise((resolve, reject) => {
    const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error('Lighthouse exited with code ' + code + ' for ' + url)));
  });
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Vite preview did not become available at ' + baseUrl);

  const chromePath = chromium.executablePath();
  const summaries = [];
  for (const route of routes) {
    const url = new URL(route.path, baseUrl).toString();
    const reportPath = outputDir + '/report-' + route.name + '.json';
    await runLighthouse(url, reportPath, chromePath);
    const report = JSON.parse(await readFile(reportPath, 'utf8'));
    const categories = Object.fromEntries(
      ['performance', 'accessibility', 'best-practices', 'seo'].map((key) => [
        key,
        report.categories?.[key]?.score == null ? null : Math.round(report.categories[key].score * 100),
      ])
    );
    summaries.push({ route: route.name, url, categories, report: reportPath });
  }

  await writeFile(outputDir + '/summary.json', JSON.stringify({ baseUrl, routes: summaries }, null, 2));
  console.log(JSON.stringify(summaries, null, 2));
} finally {
  server.kill('SIGTERM');
}
