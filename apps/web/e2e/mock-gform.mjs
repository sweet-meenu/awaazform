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

export async function mockGoogleForm(page) {
  await page.route('**/api/gform', (route) => route.fulfill({ json: MOCK_FORM }));
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
  await page.getByLabel('Google Form link').fill(MOCK_FORM_URL);
  await page.getByRole('button', { name: /Read the form/ }).click();
  await page.getByRole('heading', { name: 'Ready when you are' }).waitFor();
}
