// End-to-end smoke test of the typed Confidence Loop on /form, with a mocked Google Form.
// Usage: BASE_URL=http://localhost:3000 SHOTS=./shots node e2e/session.e2e.mjs
// Uses an installed Chrome/Edge through playwright-core (no browser download).
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { startMockSession } from './mock-gform.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;
const channel = process.env.BROWSER_CHANNEL ?? 'msedge';

const browser = await chromium.launch({ channel, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const problems = [];
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
page.on('pageerror', (e) => problems.push(e.message));

const shot = async (name, full = false) => SHOTS && page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });

try {
  await page.goto(BASE);
  await page.getByRole('heading', { level: 1 }).waitFor();
  // Scroll through so on-scroll reveals run before the full-page capture.
  for (let y = 0; y < 5000; y += 400) { await page.mouse.wheel(0, 400); await page.waitForTimeout(120); }
  await page.waitForTimeout(600);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal overflow');
  await shot('landing', true);

  await startMockSession(page, BASE);
  await shot('scanner');

  // Mute speech for the test run.
  await page.getByRole('button', { name: 'Read aloud' }).click();
  await page.getByRole('button', { name: /^Start, filling for/ }).click();

  const replica = page.frameLocator('iframe[title="Replica of the form being filled"]');
  const q1 = replica.locator('[data-qid="q1"] [data-input]');

  // Q1: propose, then prove nothing is written before confirm (AC-03).
  await page.getByLabel('Your answer').fill('Sunita Devi');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByText('Is this right?').first().waitFor();
  await page.waitForTimeout(1500); // allow the typing animation to finish
  assert.equal(await q1.inputValue(), '', 'replica field must stay empty before confirmation');
  await shot('proposed');

  await page.getByRole('button', { name: /Confirm/ }).click();
  await replica.locator('[data-qid="q1"]').getByText('Verified').waitFor();
  assert.equal(await q1.inputValue(), 'Sunita Devi');

  // Remember prompt (J2) → yes.
  await page.getByText(/Remember for next time/).first().waitFor();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();

  // Q2: invalid email is rejected by validation, then corrected via spoken-style text.
  await page.getByRole('heading', { name: 'Email address' }).waitFor();
  await page.getByLabel('Your answer').fill('not an email');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByText('That does not look like an email address').first().waitFor();
  await page.getByLabel('Your answer').fill('sunita at the rate example dot com');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByText('sunita@example.com').first().waitFor();
  await page.getByRole('button', { name: /Confirm/ }).click();
  await replica.locator('[data-qid="q2"]').getByText('Verified').waitFor();
  await page.getByRole('button', { name: 'No', exact: true }).click(); // decline remembering (AC-08)

  // Q3 phone, Q4 Hindi date.
  await page.getByRole('heading', { name: 'Mobile number' }).waitFor();
  await page.getByLabel('Your answer').fill('98440 12345');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: /Confirm/ }).click();
  await replica.locator('[data-qid="q3"]').getByText('Verified').waitFor();
  const remember = page.getByRole('button', { name: 'No', exact: true });
  if (await remember.isVisible().catch(() => false)) await remember.click();

  await page.getByRole('heading', { name: 'Date of birth' }).waitFor();
  await page.getByLabel('Your answer').fill('१२ मार्च १९७८');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByText('12 March 1978').first().waitFor();
  await page.getByRole('button', { name: /Confirm/ }).click();
  await replica.locator('[data-qid="q4"]').getByText('Verified').waitFor();
  assert.equal(await replica.locator('[data-qid="q4"] [data-input]').inputValue(), '1978-03-12');
  await page.waitForTimeout(600);
  await shot('session-progress');

  // Saved profile: only full_name, not the declined email.
  const saved = await page.evaluate(() => new Promise((res) => {
    const r = indexedDB.open('awaazform');
    r.onsuccess = () => {
      const tx = r.result.transaction('profiles').objectStore('profiles').get('me');
      tx.onsuccess = () => res(Object.keys(tx.result?.fields ?? {}));
    };
  }));
  assert.deepEqual(saved, ['full_name'], 'only the accepted value is saved');

  // Report lists missing required questions (AC-06).
  await page.goto(`${BASE}/report`);
  await page.getByRole('heading', { name: /Missing/ }).waitFor();
  await page.getByText('Q5. Number of family members attending').waitFor();
  await shot('report', true);

  // Submit is never activated: replica's Submit is disabled (AC-05 for the replica).
  await page.goto(`${BASE}/form`);
  assert.equal(await page.frameLocator('iframe').getByRole('button', { name: 'Submit' }).isDisabled(), true);

  const csp = problems.filter((p) => /Content Security Policy|Refused to/.test(p));
  assert.deepEqual(csp, [], 'no CSP violations');
  console.log('E2E PASS');
  if (problems.length) console.log('Console errors (non-fatal):\n' + problems.join('\n'));
} catch (err) {
  await shot('failure', true);
  console.error('E2E FAIL:', err.message);
  if (problems.length) console.error('Console errors:\n' + problems.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
