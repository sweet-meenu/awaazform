// Accessibility audit with axe-core (WCAG 2.0/2.1/2.2 A and AA rules) on every route, in both themes.
// Usage: BASE_URL=http://localhost:3000 node e2e/a11y.e2e.mjs
// Automated checks find only part of the problems: a manual keyboard and screen-reader pass is still needed.
import { chromium } from 'playwright-core';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE = require.resolve('axe-core/axe.min.js');
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const ROUTES = ['/', '/session', '/form', '/pdf', '/report', '/profiles', '/settings', '/privacy'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL ?? 'msedge', headless: true });
let failures = 0;

for (const contrast of ['normal', 'high']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, bypassCSP: true, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE);
  await page.evaluate((c) => localStorage.setItem('awaazform.settings', JSON.stringify({ contrast: c })), contrast);

  for (const route of ROUTES) {
    await page.goto(BASE + route);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(400);
    await page.addScriptTag({ path: AXE });
    const res = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
    const serious = res.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    failures += serious.length;
    const label = `${contrast.padEnd(6)} ${route.padEnd(10)}`;
    if (res.violations.length === 0) console.log(`${label} ✓ no violations`);
    for (const v of res.violations) {
      console.log(`${label} ${v.impact?.toUpperCase().padEnd(8)} ${v.id}: ${v.help} (${v.nodes.length})`);
      for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(' ')}  ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`);
    }
  }
  // Interactive states of the core session flow.
  const audit = async (label) => {
    await page.addScriptTag({ path: AXE });
    const res = await page.evaluate((tags) => window.axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
    const serious = res.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    failures += serious.length;
    console.log(`${contrast.padEnd(6)} ${label.padEnd(22)} ${res.violations.length === 0 ? '✓ no violations' : ''}`);
    for (const v of res.violations) console.log(`      ${v.impact?.toUpperCase()} ${v.id}: ${v.help} → ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`);
  };
  await page.goto(`${BASE}/session`);
  await page.evaluate(() => localStorage.removeItem('awaazform.session'));
  await page.reload();
  await page.getByRole('button', { name: 'Read aloud' }).click();
  await page.getByRole('button', { name: /^Start, filling for/ }).click();
  await audit('session: question');
  await page.getByLabel('Your answer').fill('Sunita Devi');
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.getByRole('button', { name: /Confirm/ }).waitFor();
  await audit('session: read-back');
  await page.getByRole('button', { name: /Live Mode/ }).click();
  await page.getByRole('dialog').waitFor();
  await audit('session: live dialog');
  await ctx.close();
}
await browser.close();
console.log(failures === 0 ? 'A11Y PASS: no critical or serious violations' : `A11Y: ${failures} critical/serious violation groups`);
process.exitCode = failures === 0 ? 0 : 1;
