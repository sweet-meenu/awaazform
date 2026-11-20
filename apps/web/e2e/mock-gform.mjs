// A Google Form response for /api/gform, so session tests run offline and deterministically.
// Use: await mockGoogleForm(page); then paste MOCK_FORM_URL on /form.
export const MOCK_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSd_mock_form_for_tests_000000/viewform';
const formId = '1FAIpQLSd_mock_form_for_tests_000000';
const src = (n) => ({ kind: 'google-form', url: `https://docs.google.com/forms/d/e/${formId}/viewform`, formId, entryId: String(1000 + n) });
const q = (n, label, type, extra = {}) => ({ id: `q${n}`, label, type, required: false, support: 'supported', source: src(n), ...extra });

export const MOCK_FORM = {
  formId,
  title: 'Community Health Camp Registration',
  description: '',
  questions: [
    q(1, 'Full name', 'text', { required: true }),
    q(2, 'Email address', 'email', { required: true }),
    q(3, 'Mobile number', 'phone', { required: true }),
    q(4, 'Date of birth', 'date', { required: true, helpText: 'As written on any ID you have.' }),
    q(5, 'Number of family members attending', 'number', { required: true }),
    q(6, 'Preferred camp day', 'choice', { required: true, options: ['Saturday', 'Sunday'] }),
    q(7, 'Which check-ups would you like?', 'checkbox', { options: ['Eye check-up', 'Blood pressure', 'Dental', 'General physician'] }),
    q(8, 'Preferred language for the doctor', 'dropdown', { options: ['English', 'Hindi', 'Marathi', 'Tamil'] }),
    q(9, 'How easy was it to find this form?', 'scale', { options: ['1', '2', '3', '4', '5'], helpText: '1 = very hard, 5 = very easy' }),
    q(10, 'Preferred arrival time', 'time'),
    q(11, 'Do you need wheelchair access?', 'yesno', { required: true, options: ['Yes', 'No'] }),
    q(12, 'Anything else we should know?', 'paragraph'),
    q(13, 'Upload a photo ID (optional)', 'text', { support: 'unsupported', supportReason: 'File uploads must be done by hand' }),
  ],
};

// Google's raw page data (FB_PUBLIC_LOAD_DATA_) for the questions above. The API returns the form's page
// and the browser parses it with packages/core, so the mock is a page too: the real parser runs.
// Question ids come out as g1…g13 (core prefixes Google item ids with "g").
const T = { short: 0, paragraph: 1, choice: 2, dropdown: 3, checkbox: 4, scale: 5, date: 9, time: 10, file: 13 };
const code = { text: T.short, email: T.short, phone: T.short, number: T.short, paragraph: T.paragraph, choice: T.choice, yesno: T.choice,
  dropdown: T.dropdown, checkbox: T.checkbox, scale: T.scale, date: T.date, time: T.time };
function rawItem(q, n) {
  const opts = (q.options ?? []).map((o) => [o]);
  const input = [1000 + n, opts.length ? opts : null, q.required ? 1 : 0];
  if (q.type === 'number') input[4] = [[1, 7]];
  if (q.type === 'scale') input[3] = ['very hard', 'very easy'];
  if (q.type === 'date') input[7] = [0, 1];
  if (q.type === 'time') input[6] = [0];
  const type = q.support === 'unsupported' ? T.file : code[q.type];
  return [n, q.label, q.type === 'scale' ? null : q.helpText ?? null, type, [input]];
}
const RAW = [null, [null, MOCK_FORM.questions.map((q, i) => rawItem(q, i + 1)), null, null, null, null, null, null, MOCK_FORM.title], null, MOCK_FORM.title];
const HTML = `<html><body><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(RAW)};</script></body></html>`;

export async function mockGoogleForm(page) {
  await page.route('**/api/gform', (route) => route.fulfill({ json: { html: HTML, finalUrl: MOCK_FORM_URL } }));
}

/** Opens /form with a clean slate (keeping only `settings`) and scans the mock form. */
export async function startMockSession(page, base, settings) {
  await mockGoogleForm(page);
  await page.goto(`${base}/form`);
  await page.evaluate((s) => {
    localStorage.clear();
    indexedDB.deleteDatabase('awaazform');
    if (s) localStorage.setItem('awaazform.settings', JSON.stringify(s));
  }, settings);
  await page.reload();
  // Language-independent selectors, so sessions can be tested in any interface language.
  await page.locator('#form-url').fill(MOCK_FORM_URL);
  await page.locator('form button[type="submit"]').click();
  await page.locator('#scan-h').waitFor();
}
