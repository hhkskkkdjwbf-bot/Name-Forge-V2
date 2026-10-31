import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';

const baseUrl = process.env.LIGHTHOUSE_BASE_URL || 'http://127.0.0.1:4173/';
const outputDir = 'artifacts/lighthouse';
await mkdir(outputDir, { recursive: true });

const server = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  stdio: 'ignore',
  shell: process.platform === 'win32',
});

let ready = false;
try {
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
  const args = [
    '--yes', 'lighthouse', baseUrl,
    '--chrome-path=' + chromePath,
    '--chrome-flags=--headless --no-sandbox',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    '--output-path=' + outputDir + '/report.json',
    '--quiet',
  ];
  const result = await new Promise((resolve, reject) => {
    const child = spawn('npx', args, { stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve(code) : reject(new Error('Lighthouse exited with code ' + code)));
  });
  process.exitCode = result === 0 ? 0 : 1;
} finally {
  server.kill('SIGTERM');
}
