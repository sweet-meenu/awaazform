// Conversational Live Mode: answers in sentences are cleaned up, acknowledged, read back together at the
// end, and filled only after one “Fill all”. Uses a silent fake microphone so Live Mode can run headless.
// Usage: BASE_URL=http://localhost:3000 node e2e/conversation.e2e.mjs
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { startMockSession } from './mock-gform.mjs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const channel = process.env.BROWSER_CHANNEL ?? 'msedge';
const silence = fileURLToPath(new URL('./silence.wav', import.meta.url));
const browser = await chromium.launch({
  channel, headless: true,
  args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', `--use-file-for-fake-audio-capture=${silence}`],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, permissions: ['microphone'] });
const page = await ctx.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(e.message));
const replica = () => page.frameLocator('iframe');

try {
  await startMockSession(page, BASE);
  await page.evaluate(() => localStorage.setItem('awaazform.liveConsent', 'yes'));
  await page.getByRole('button', { name: /^Start, filling for/ }).click();
  await page.getByRole('button', { name: /Live Mode/ }).click();
  await page.getByText('Listening. Just speak.').first().waitFor({ timeout: 15_000 });

  // Q1, typed the way people talk.
  const box = page.getByRole('textbox', { name: 'Your answer' });
  await page.getByRole('heading', { name: 'Full name' }).waitFor();
  await box.fill('My name is Sunita Devi.');
  await box.press('Enter');
  await page.getByText('Got it: Sunita Devi.').first().waitFor({ timeout: 15_000 });
  // No per-answer confirm: it moves straight on.
  await page.getByRole('heading', { name: 'Email address' }).waitFor({ timeout: 15_000 });
  await box.fill('I use sunita dot devi at example dot com');
  await box.press('Enter');
  await page.getByText('Got it: sunita.devi@example.com.').first().waitFor({ timeout: 15_000 });
  await page.getByRole('heading', { name: 'Mobile number' }).waitFor({ timeout: 15_000 });

  // Nothing is on the form yet.
  assert.equal(await replica().locator('[data-qid="g1"] [data-input]').inputValue(), '', 'not filled before the summary');

  await page.getByRole('button', { name: /Review answers \(2\)/ }).click();
  await page.getByRole('heading', { name: 'Here’s what I have' }).waitFor();
  const review = page.locator('section[aria-labelledby="review-h"]');
  await review.getByText('Sunita Devi', { exact: true }).waitFor();
  await review.getByText('sunita.devi@example.com', { exact: true }).waitFor();
  await review.getByRole('button', { name: /Fill all \(2\)/ }).click();
  // Questions remain, so Bolu carries on instead of wrapping up (the screenshot bug).
  await page.getByText(/Let’s carry on/).first().waitFor({ timeout: 20_000 });
  await page.getByRole('heading', { name: 'Mobile number' }).waitFor({ timeout: 15_000 });
  assert.equal(await page.getByText(/press Submit yourself/).count() > 0 && await page.getByText(/I filled 2 answers/).count() > 0, false, 'does not wrap up early');
  assert.equal(await replica().locator('[data-qid="g1"] [data-input]').inputValue(), 'Sunita Devi');
  assert.equal(await replica().locator('[data-qid="g2"] [data-input]').inputValue(), 'sunita.devi@example.com');
  assert.deepEqual(problems, [], 'no page errors');
  console.log('CONVERSATION E2E PASS');
} catch (err) {
  console.error('CONVERSATION E2E FAIL:', err.message);
  if (problems.length) console.error(problems.join('\n'));
  process.exitCode = 1;
} finally {
  await browser.close();
}
