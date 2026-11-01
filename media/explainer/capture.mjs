// Captures real AwaazForm screens (2x) plus the positions of elements the video zooms into.
// Usage: BASE_URL=http://localhost:3000 node explainer/capture.mjs   (needs a running app with AI configured)
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'shots');
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const FORM = path.resolve(here, '../../example_forms/Form_6_English.pdf');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge', headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'],
});
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, permissions: ['microphone'] });
const page = await ctx.newPage();
const regions = {};

const shot = async (name) => {
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log('shot', name);
};
/** Records an element's box (CSS px within the 1600x1000 viewport). */
const box = async (name, locator) => {
  const b = await locator.first().boundingBox();
  if (b) regions[name] = { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) };
};
const replica = () => page.frameLocator('iframe[title="Replica of the form being filled"]');
async function replicaBox(name, sel) {
  const frame = await page.locator('iframe[title="Replica of the form being filled"]').boundingBox();
  const inner = await replica().locator(sel).first().boundingBox();
  if (frame && inner) regions[name] = { x: Math.round(inner.x), y: Math.round(inner.y), w: Math.round(inner.width), h: Math.round(inner.height) };
}
const answerQ = async (value, remember = false) => {
  await page.getByLabel('Your answer').fill(value);
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: /Confirm/ }).click();
  const choice = page.getByRole('button', { name: remember ? 'Yes' : 'No', exact: true });
  await choice.waitFor({ timeout: 5000 }).then(() => choice.click()).catch(() => {});
  await page.waitForTimeout(900);
};

// ---- Landing ----
await page.goto(BASE);
await page.evaluate(async () => { localStorage.clear(); await new Promise((r) => { const d = indexedDB.deleteDatabase('awaazform'); d.onsuccess = d.onerror = d.onblocked = r; }); });
await page.goto(BASE);
await page.waitForTimeout(1500);
await shot('landing');
await box('landing_hero', page.getByRole('heading', { level: 1 }));

// ---- Session ----
await page.goto(`${BASE}/session`);
await page.getByRole('heading', { name: 'Ready when you are' }).waitFor();
await page.waitForTimeout(1200);
await shot('session-start');
await box('scan_card', page.locator('section[aria-labelledby="scan-h"]'));

await page.getByRole('button', { name: 'Read aloud' }).click();
await page.getByRole('button', { name: /^Start, filling for/ }).click();
await answerQ('Sunita Devi', true);
await answerQ('sunita at the rate example dot com');
await answerQ('98440 12345');
await page.getByRole('heading', { name: 'Date of birth' }).waitFor();
await page.waitForTimeout(900);
await shot('session-question');
await box('question_card', page.locator('section[aria-labelledby="q-label"]'));
await box('composer', page.locator('.composer'));
await box('stepper', page.getByRole('navigation', { name: 'Questions' }));
await box('form_panel', page.locator('#panel-form'));
await replicaBox('replica_dob', '[data-qid="q4"]');

await page.getByLabel('Your answer').fill('12 March 1978');
await page.getByRole('button', { name: 'Check answer' }).click();
await page.getByRole('button', { name: /Confirm/ }).waitFor();
await page.waitForTimeout(2600); // typing animation in the replica
await shot('session-proposed');
await box('readback', page.getByRole('group', { name: /Is this right/ }));
await box('confirm_btn', page.getByRole('button', { name: /Confirm/ }));
await replicaBox('replica_dob_p', '[data-qid="q4"]');

await page.getByRole('button', { name: /Confirm/ }).click();
await replica().locator('[data-qid="q4"]').getByText('Verified').waitFor();
await page.getByRole('button', { name: 'No', exact: true }).click().catch(() => {});
await page.waitForTimeout(1200);
await page.getByRole('navigation', { name: 'Questions' }).getByRole('button', { name: /^Question 4:/ }).click();
await page.waitForTimeout(1600);
await shot('session-verified');
await box('verified_row', page.locator('section[aria-labelledby="q-label"] >> text=12 March 1978'));
await replicaBox('replica_dob_v', '[data-qid="q4"]');

await page.getByRole('tab', { name: /Activity/ }).click();
await page.waitForTimeout(600);
await shot('session-activity');
await box('activity', page.locator('#panel-activity'));
await page.getByRole('tab', { name: /Form/ }).click();

// Live Mode (fake microphone), on an unanswered question so the listening panel shows.
await page.getByRole('navigation', { name: 'Questions' }).getByRole('button', { name: /^Question 5:/ }).click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /Live Mode/ }).click();
await page.getByRole('dialog').waitFor();
await page.waitForTimeout(500);
await shot('live-dialog');
await box('live_dialog', page.getByRole('dialog'));
await page.getByRole('button', { name: 'Turn on' }).click();
await page.waitForTimeout(2200);
await shot('live-on');
await box('live_panel', page.locator('section[aria-labelledby="q-label"]'));
await box('live_btn', page.getByRole('button', { name: /Live Mode/ }));
await page.getByRole('button', { name: /Live Mode/ }).click();

// Hindi interface.
await page.getByRole('button', { name: 'हिन्दी में बदलें' }).click();
await page.waitForTimeout(900);
await shot('session-hindi');
await box('hindi_card', page.locator('section[aria-labelledby="q-label"]'));
await page.getByRole('button', { name: 'Switch to English' }).click();

// High contrast + large text.
await page.evaluate(() => localStorage.setItem('awaazform.settings', JSON.stringify({ contrast: 'high', text: 'large' })));
await page.reload();
await page.waitForTimeout(1500);
await shot('session-contrast');
await page.evaluate(() => localStorage.setItem('awaazform.settings', JSON.stringify({})));

// ---- Profiles & report ----
await page.goto(`${BASE}/profiles`);
await page.waitForTimeout(1200);
await shot('profiles');
await page.getByRole('button', { name: /Add passphrase/ }).first().click();
await page.getByRole('dialog').waitFor();
await page.locator('dialog input[type=password]').nth(0).fill('my secret phrase');
await page.locator('dialog input[type=password]').nth(1).fill('my secret phrase');
await page.waitForTimeout(400);
await shot('profiles-lock');
await box('lock_dialog', page.getByRole('dialog'));
await page.getByRole('button', { name: 'Protect' }).click();
await page.waitForTimeout(800);
await shot('profiles-locked');

await page.goto(`${BASE}/report`);
await page.waitForTimeout(1200);
await shot('report');

// ---- PDF: the example voter registration form ----
await page.goto(`${BASE}/pdf`);
await page.waitForTimeout(1200);
await shot('pdf-upload');
await box('dropzone', page.locator('text=Drop a PDF here').locator('xpath=ancestor::div[contains(@class,"border-dashed")]'));
await page.getByLabel('Choose a PDF').setInputFiles(FORM);
await page.getByRole('heading', { name: 'Check the questions and boxes' }).waitFor({ timeout: 120_000 });
await page.waitForTimeout(2500);
// Select the gender question so its tick boxes are highlighted.
const gender = page.locator('input[id^="lbl-"]').filter({ hasText: '' });
const labels = await page.locator('input[id^="lbl-"]').evaluateAll((els) => els.map((e) => e.value));
const gi = labels.findIndex((l) => /gender/i.test(l));
if (gi >= 0) await page.locator('input[id^="lbl-"]').nth(gi).click();
await page.waitForTimeout(800);
await shot('pdf-review');
await box('review_list', page.locator('section[aria-labelledby="qs-h"]'));
await box('review_preview', page.locator('section[aria-label="Page preview with answer boxes"]'));
void gender;

await page.getByRole('button', { name: /Start filling/ }).click();
await page.getByRole('button', { name: 'Read aloud' }).click();
await page.getByRole('button', { name: /^Start, filling for/ }).click();
const goto = async (re) => page.getByRole('navigation', { name: 'Questions' }).getByRole('button', { name: re }).first().click();
for (const [re, v] of [[/first.*name|name.*english/i, 'Sunita'], [/town|village/i, 'Rampur'], [/district/i, 'Pune'], [/pin/i, '411001'], [/gender/i, 'female'], [/date of birth|\bdob\b/i, '12/03/1978']]) {
  try { await goto(re); await answerQ(v); } catch { console.log('skip', re); }
}
await page.waitForTimeout(800);
// Scroll the PDF so the filled area is centred.
await page.locator('#panel-form [data-qid]').filter({ hasText: 'Rampur' }).first().scrollIntoViewIfNeeded().catch(() => {});
await page.evaluate(() => { const s = document.querySelector('#panel-form > div'); if (s) s.scrollBy(0, -120); });
await page.waitForTimeout(800);
await shot('pdf-filled');
await box('pdf_panel', page.locator('#panel-form'));
const filledBoxes = await page.locator('#panel-form [data-qid]').evaluateAll((els) => els.filter((e) => e.textContent?.trim()).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, text: e.textContent.trim() }; }));
regions.pdf_filled = filledBoxes.filter((b) => b.y > 0 && b.y < 1000).map((b) => ({ ...b, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.w), h: Math.round(b.h) }));

fs.writeFileSync(path.join(OUT, 'regions.json'), JSON.stringify(regions, null, 2));
console.log('regions', Object.keys(regions).join(', '));
await browser.close();
