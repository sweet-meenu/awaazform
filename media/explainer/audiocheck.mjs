// Decodes the MP4's audio track in Edge and measures its loudness.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const mp4 = fs.readFileSync(path.join(here, 'out', 'awaazform-explainer.mp4'));
const srv = http.createServer((q, r) => { if (q.url === '/v.mp4') r.writeHead(200, { 'Content-Type': 'video/mp4' }).end(mp4); else r.writeHead(200, { 'Content-Type': 'text/html' }).end('<p>x</p>'); }).listen(4418);
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage();
await p.goto('http://localhost:4418/');
console.log(await p.evaluate(async () => {
  const buf = await (await fetch('/v.mp4')).arrayBuffer();
  const ctx = new OfflineAudioContext(2, 48000, 48000);
  const a = await ctx.decodeAudioData(buf);
  const ch = a.getChannelData(0);
  let peak = 0, sum = 0;
  for (const v of ch) { peak = Math.max(peak, Math.abs(v)); sum += v * v; }
  return { seconds: a.duration.toFixed(1), channels: a.numberOfChannels, peak: peak.toFixed(3), rms: Math.sqrt(sum / ch.length).toFixed(4) };
}));
await b.close(); srv.close();
