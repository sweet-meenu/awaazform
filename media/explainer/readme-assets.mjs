// Renders the README visuals from the explainer composition: caption-free stills, a transparent Bolu,
// and raw frames for the demo GIF (assembled by readme-gif.py).
// Usage (from media/): node explainer/readme-assets.mjs
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const OUT = path.resolve(root, '../docs/media');
const FRAMES = path.join(here, 'out/gif-frames');
fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(FRAMES, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });
const PORT = 4418;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = url === '/form6.pdf' ? path.resolve(root, '../example_forms/Form_6_English.pdf') : path.normalize(path.join(root, url));
  if (url !== '/form6.pdf' && !file.startsWith(root)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(data);
  });
}).listen(PORT);

// Scene stills: [file, time in seconds]
const STILLS = [
  ['loop', 31],
  ['readback', 48],
  ['verified', 53],
  ['activity', 60],
  ['pdf', 74],
  ['live', 84],
  ['safety', 95],
  ['access', 104],
];

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const page = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
page.on('pageerror', (e) => console.error('composition error:', e.message));
await page.goto(`http://localhost:${PORT}/explainer/composition.html`);
await page.evaluate(() => window.ready);
await page.addStyleTag({ content: '#cap { display: none !important; }' });

for (const [name, t] of STILLS) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('still', name);
}

// Demo GIF frames: read-back → confirm → verified.
const [from, to, fps] = [44, 55, 10];
for (let i = 0, t = from; t <= to; i++, t = from + i / fps) {
  await page.evaluate((tt) => window.renderFrame(tt), t);
  await page.screenshot({ path: path.join(FRAMES, `${String(i).padStart(4, '0')}.png`) });
}
console.log('gif frames', FRAMES);

// Bolu alone on a transparent background, at 2x.
const hi = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 })).newPage();
await hi.goto(`http://localhost:${PORT}/explainer/composition.html`);
await hi.evaluate(() => window.ready);
await hi.evaluate(() => window.renderFrame(3));
await hi.addStyleTag({ content: 'html, body, #stage { background: transparent !important; } #stage > :not(#bolu) { visibility: hidden !important; }' });
await hi.locator('#bolu').screenshot({ path: path.join(OUT, 'bolu.png'), omitBackground: true });
console.log('bolu');

await browser.close();
server.close();
