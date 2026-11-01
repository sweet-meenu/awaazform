// Opens the rendered MP4 in Edge, seeks to a few times, and saves frames to check playback.
import { chromium } from 'playwright-core';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const mp4 = pathToFileURL(path.join(here, 'out', 'awaazform-explainer.mp4')).href;
const b = await chromium.launch({ channel: 'msedge', headless: true });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
await p.goto(mp4);
const v = p.locator('video');
await v.waitFor();
console.log(await p.evaluate(async () => {
  const v = document.querySelector('video');
  await new Promise((r) => (v.readyState >= 1 ? r() : v.addEventListener('loadedmetadata', r, { once: true })));
  return { duration: v.duration, w: v.videoWidth, h: v.videoHeight };
}));
for (const t of [8, 47, 75]) {
  await p.evaluate((tt) => new Promise((r) => { const v = document.querySelector('video'); v.pause(); v.addEventListener('seeked', r, { once: true }); v.currentTime = tt; }), t);
  await p.waitForTimeout(300);
  await v.screenshot({ path: path.join(here, 'out', `verify-${t}.png`) });
}
await b.close();
