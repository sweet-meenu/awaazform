// Option questions: tap to choose, multi-select, spoken-style answers, and the Marathi interface.
// Usage: BASE_URL=http://localhost:3000 node e2e/options.e2e.mjs
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { startMockSession } from './mock-gform.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const channel = process.env.BROWSER_CHANNEL ?? 'msedge';
const browser = await chromium.launch({ channel, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));

const step = (n) => page.getByRole('navigation', { name: 'Questions' }).getByRole('button', { name: new RegExp(`^Question ${n}:`) }).click();
const confirm = async (value) => {
  await page.getByRole('group').getByText(value, { exact: true }).waitFor();
  await page.getByRole('button', { name: /Confirm/ }).click();
};
const replica = () => page.frameLocator('iframe');

try {
  await startMockSession(page, BASE);
  await page.getByRole('button', { name: 'Read aloud' }).click();
  await page.getByRole('button', { name: /^Start, filling for/ }).click();

  // Single choice: one tap proposes, then the usual confirm gate.
  await step(6);
  await page.getByRole('heading', { name: 'Preferred camp day' }).waitFor();
  await page.getByRole('button', { name: /Sunday/ }).click();
  await confirm('Sunday');
  await page.waitForTimeout(300);
  assert.equal(await replica().locator('[data-qid="g6"] input[value="Sunday"]').isChecked(), true, 'Sunday chosen on the form');

  // Multi-select: collect, then propose once.
  await step(7);
  await page.getByRole('button', { name: /Eye check-up/ }).click();
  await page.getByRole('button', { name: /Dental/ }).click();
  assert.equal(await page.getByRole('button', { name: /Dental/ }).getAttribute('aria-pressed'), 'true');
  await page.getByRole('button', { name: /Use these \(2\)/ }).click();
  await confirm('Eye check-up, Dental');

  // A typed Marathi word maps onto the English option without the AI.
  await step(8);
  await page.getByLabel('Your answer').fill('मराठी');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await confirm('Marathi');

  // A number word on a scale.
  await step(9);
  await page.getByLabel('Your answer').fill('four');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await confirm('4');

  // Yes / No as buttons.
  await step(11);
  await page.getByRole('button', { name: /^Yes$/ }).click();
  await confirm('Yes');

  // Marathi interface.
  await startMockSession(page, BASE, { language: 'mr' });
  await page.locator('section[aria-labelledby=scan-h] button.btn-lg').click();
  // Text comes from the generated Marathi strings; check the place, not exact wording.
  await page.getByText(/प्रश्न 1\b.*13/).first().waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.lang), 'mr');
  assert.match(await page.getByRole('toolbar').innerText(), /[\u0900-\u097F]/, 'controls are in Marathi');

  assert.deepEqual(problems, [], 'no page errors');
  console.log('OPTIONS E2E PASS');
} catch (err) {
  console.error('OPTIONS E2E FAIL:', err.message);
  if (problems.length) console.error(problems.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
