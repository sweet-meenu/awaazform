// End-to-end: fill the example Form 6 (flat PDF) and check the downloaded file really contains the answers.
// Usage: BASE_URL=http://localhost:3000 SHOTS=./shots node e2e/pdf.e2e.mjs
import { chromium } from 'playwright-core';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;
const FORM = fileURLToPath(new URL('../../../example_forms/Form_6_English.pdf', import.meta.url));

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
const shot = async (n, full = false) => SHOTS && page.screenshot({ path: `${SHOTS}/${n}.png`, fullPage: full });

/** Answers the question whose label matches `label`, then confirms and waits for verification. */
async function answer(label, value) {
  await page.getByRole('navigation', { name: 'Questions' }).getByRole('button', { name: label }).first().click();
  await page.getByLabel('Your answer').fill(value);
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: /Confirm/ }).click();
  // Decline "remember" prompts if they appear, then wait for the verified state.
  const no = page.getByRole('button', { name: 'No', exact: true });
  await Promise.race([no.waitFor({ timeout: 4000 }).then(() => no.click()).catch(() => {}), page.waitForTimeout(1500)]);
}

try {
  await page.goto(`${BASE}/pdf`);
  await page.evaluate(async () => { localStorage.clear(); await new Promise((r) => { const d = indexedDB.deleteDatabase('awaazform'); d.onsuccess = d.onerror = d.onblocked = r; }); });
  await page.reload();
  await page.getByRole('heading', { name: 'Fill a PDF by voice' }).waitFor();
  await shot('pdf-upload');

  await page.getByLabel('Choose a PDF').setInputFiles(FORM);
  await page.getByRole('heading', { name: 'Check the questions and boxes' }).waitFor({ timeout: 90_000 });
  const how = await page.locator('h1 + p').innerText();
  console.log('Review:', how.slice(0, 140));
  await page.waitForTimeout(1500); // page render
  await shot('pdf-review');

  await page.getByRole('button', { name: /Start filling/ }).click();
  await page.getByRole('button', { name: 'Read aloud' }).click();
  await page.getByRole('button', { name: /^Start, filling for/ }).click();
  await page.getByRole('navigation', { name: 'Questions' }).waitFor();

  // AI labels vary between runs, so match loosely.
  await answer(/town|village/i, 'Rampur');
  await answer(/gender/i, 'female');
  await answer(/date of birth|\bdob\b/i, '12/03/1978');
  await page.waitForTimeout(800);
  await shot('pdf-session');

  // Download and read the real file back.
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download PDF' }).click()]);
  const path = await dl.path();
  const out = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(path)) }).promise;
  let text = '';
  for (let p = 1; p <= out.numPages; p++) text += (await (await out.getPage(p)).getTextContent()).items.map((i) => i.str).join(' ') + ' ';
  assert.match(text, /Rampur/i, 'town written into the PDF');
  assert.match(text, /12\/03\/1978/, 'date written as DD/MM/YYYY');
  assert.match(text, /\bX\b/, 'a tick drawn for gender');
  console.log('PDF E2E PASS');
  if (problems.length) console.log('Console errors (non-fatal):\n' + [...new Set(problems)].join('\n'));
} catch (err) {
  await shot('pdf-failure', true);
  console.error('PDF E2E FAIL:', err.message);
  if (problems.length) console.error([...new Set(problems)].join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
