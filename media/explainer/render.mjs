// Renders the explainer deterministically, frame by frame, and encodes MP4 in Edge (WebCodecs + mp4-muxer).
// Usage (from media/):
//   node explainer/render.mjs --stills 3,20,45      → out/still-<t>.png previews
//   node explainer/render.mjs                        → out/awaazform-explainer.mp4
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const OUT = path.join(here, 'out');
fs.mkdirSync(OUT, { recursive: true });
const PORT = 4417;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.wav': 'audio/wav', '.woff2': 'font/woff2', '.pdf': 'application/pdf' };

// Static server for media/ (fonts + muxer from node_modules); PUT writes only into explainer/out.
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // The example PDF lives in the repo's example_forms/.
  const file = url === '/form6.pdf' ? path.resolve(root, '../example_forms/Form_6_English.pdf') : path.normalize(path.join(root, url));
  if (url === '/form6.pdf') return fs.readFile(file, (e, d) => (e ? res.writeHead(404).end() : res.writeHead(200, { 'Content-Type': 'application/pdf' }).end(d)));
  if (!file.startsWith(root)) return res.writeHead(403).end();
  if (req.method === 'PUT') {
    if (!file.startsWith(OUT)) return res.writeHead(403).end();
    const ws = fs.createWriteStream(file, { flags: new URL(req.url, 'http://x').searchParams.has('append') ? 'a' : 'w' });
    req.pipe(ws);
    return ws.on('finish', () => res.writeHead(200).end('ok'));
  }
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream' }).end(data);
  });
}).listen(PORT);

const BASE = `http://localhost:${PORT}/explainer`;
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const comp = await (await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })).newPage();
comp.on('pageerror', (e) => console.error('composition error:', e.message));
await comp.goto(`${BASE}/composition.html`);
const { duration, fps } = await comp.evaluate(() => window.ready);

const stillsArg = process.argv.indexOf('--stills');
if (stillsArg > 0) {
  for (const t of process.argv[stillsArg + 1].split(',').map(Number)) {
    await comp.evaluate((tt) => window.renderFrame(tt), t);
    await comp.screenshot({ path: path.join(OUT, `still-${t}.png`) });
    console.log('still', t);
  }
} else {
  const enc = await (await browser.newContext()).newPage();
  await enc.goto(`${BASE}/encoder.html`);
  await enc.evaluate(([w, h, f]) => window.setup(w, h, f), [1920, 1080, fps]);
  const frames = Math.ceil(duration * fps);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    await comp.evaluate((tt) => window.renderFrame(tt), i / fps);
    const jpg = await comp.screenshot({ type: 'jpeg', quality: 93 });
    const err = await enc.evaluate(([b, n]) => window.addFrame(b, n), [jpg.toString('base64'), i]);
    if (err) throw new Error(err);
    if (i % 150 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`frame ${i}/${frames}  ${el.toFixed(0)}s elapsed, ~${((el / (i + 1)) * (frames - i)).toFixed(0)}s left`);
    }
  }
  await enc.evaluate((u) => window.addAudio(u), `${BASE}/audio/master.wav`);
  const res = await enc.evaluate((u) => window.finish(u), `${BASE}/out/awaazform-explainer.mp4`);
  console.log('done', res, `${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
