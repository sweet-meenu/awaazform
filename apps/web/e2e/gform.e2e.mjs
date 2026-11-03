// End-to-end test of Google Forms by link: paste → answer → open the pre-filled real form.
// It reads the real Google Form back but never submits it.
// Usage: BASE_URL=http://localhost:3000 SHOTS=./shots node e2e/gform.e2e.mjs
// GFORM_URL overrides the public test form; ANSWERS must then match its questions.
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const SHOTS = process.env.SHOTS;
const channel = process.env.BROWSER_CHANNEL ?? 'msedge';
// A public, multi-section "Customer Satisfaction Survey": email, paragraph, text, phone, choice, date, time and scale.
const FORM = process.env.GFORM_URL ?? 'https://docs.google.com/forms/d/e/1FAIpQLSd5pRDUpkOjWqXpEaYYLOLsJz2xYWbF8N1fDc2vyUmxW4RFyg/viewform';
const ANSWERS = [
  'sunita at the rate example dot com', 'Friendly and helpful teachers', 'Faster replies to emails', 'Sunita Devi', 'NA', 'NA', '98440 12345',
  'Concern', 'Parent', '12 March 2026', '10:30', 'Admissions', 'Automated test only, please ignore', '4',
];

const browser = await chromium.launch({ channel, headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const problems = [];
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()));
page.on('pageerror', (e) => problems.push(e.message));
const shot = async (p, name, full = false) => SHOTS && p.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: full });

try {
  await page.goto(`${BASE}/form`);
  await page.evaluate(() => { localStorage.clear(); indexedDB.deleteDatabase('awaazform'); });
  await page.reload();
  await page.getByRole('heading', { level: 1, name: /Fill a Google Form/ }).waitFor();
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'no horizontal overflow');

  // A link that isn't a Google Form is refused with a clear message.
  const link = page.getByLabel('Google Form link');
  await link.fill('https://example.com/form');
  await page.getByRole('button', { name: /Read the form/ }).click();
  await page.getByRole('alert').getByText(/doesn’t look like a Google Form link/).waitFor();
  await shot(page, 'gform-paste');

  // The real form is scanned.
  await link.fill(FORM);
  await page.getByRole('button', { name: /Read the form/ }).click();
  await page.getByRole('heading', { name: 'Ready when you are' }).waitFor({ timeout: 20_000 });
  await page.getByText('Open in Google Forms').first().waitFor();
  await shot(page, 'gform-scanned');

  await page.getByRole('button', { name: 'Read aloud' }).click();
  await page.getByRole('button', { name: /^Start, filling for/ }).click();

  // Nothing is carried before it is verified.
  const open = page.getByRole('link', { name: /Open in Google Forms/ });
  for (const [i, text] of ANSWERS.entries()) {
    await page.getByLabel('Your answer').fill(text);
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.getByText('Is this right?').first().waitFor();
    assert.ok(await page.getByRole('link', { name: new RegExp(`Open in Google Forms ${i} confirmed`) }).isVisible(), 'unconfirmed answers are not in the link');
    await page.getByRole('button', { name: /Confirm/ }).click();
    await page.getByRole('link', { name: new RegExp(`Open in Google Forms ${i + 1} confirmed`) }).waitFor({ timeout: 15_000 });
    await page.waitForTimeout(300);
    const remember = page.getByText(/Remember for next time/).first();
    if (await remember.isVisible().catch(() => false)) await page.getByRole('button', { name: 'No', exact: true }).click();
  }
  await shot(page, 'gform-done');

  // Open the real Google Form, pre-filled, in a new tab.
  const [google] = await Promise.all([context.waitForEvent('page'), open.click()]);
  await google.waitForLoadState('domcontentloaded');
  await google.locator('form').first().waitFor({ timeout: 20_000 });
  await google.waitForTimeout(1500);
  // Step through the form's sections with Next (never Submit), collecting what each one shows.
  const seen = { text: [], checked: [] };
  for (let section = 1; section <= 10; section++) {
    await google.waitForTimeout(1200);
    const here = await google.evaluate(() => ({
      text: [...document.querySelectorAll('input:not([type=hidden]), textarea')].map((e) => e.value).filter(Boolean),
      checked: [...document.querySelectorAll('[role=radio][aria-checked=true], [role=checkbox][aria-checked=true]')].map((e) => e.getAttribute('data-value') ?? e.getAttribute('aria-label')),
    }));
    seen.text.push(...here.text);
    seen.checked.push(...here.checked);
    await shot(google, `gform-google-section-${section}`, true);
    const next = google.getByRole('button', { name: 'Next', exact: true });
    if (!(await next.isVisible().catch(() => false))) break;
    await next.click();
  }
  assert.ok(await google.getByRole('button', { name: 'Submit', exact: true }).isVisible(), 'reached the last section');
  console.log('Google Form shows:', JSON.stringify(seen));

  for (const v of ['sunita@example.com', 'Friendly and helpful teachers', 'Faster replies to emails', 'Sunita Devi', '9844012345', 'Admissions', 'Automated test only, please ignore']) {
    assert.ok(seen.text.includes(v), `Google Form shows "${v}"`);
  }
  assert.ok(seen.text.some((v) => v === '2026-03-12' || v === '12/03/2026' || v === '03/12/2026'), 'date is pre-filled');
  assert.ok(seen.text.includes('10') && seen.text.includes('30'), 'time is pre-filled');
  for (const v of ['Concern', 'Parent', '4']) assert.ok(seen.checked.includes(v), `"${v}" is selected`);
  // AwaazForm never submits: Submit is still waiting for the user, and nothing was recorded.
  // (Google moves between sections via a formResponse URL, which is not a submission.)
  assert.ok(await google.getByRole('button', { name: 'Submit', exact: true }).isVisible(), 'Submit is left to the user');
  assert.equal(await google.getByText(/response has been recorded/i).count(), 0, 'the form was not submitted');

  const csp = problems.filter((p) => /Content Security Policy|Refused to/.test(p));
  // The one expected error is the 400 from the bad-link step.
  assert.deepEqual(csp, [], 'no CSP violations');
  console.log('GFORM E2E PASS');
  if (problems.length) console.log('Console errors (non-fatal):\n' + problems.join('\n'));
} catch (err) {
  await shot(page, 'gform-failure', true);
  console.error('GFORM E2E FAIL:', err.message);
  if (problems.length) console.error('Console errors:\n' + problems.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
