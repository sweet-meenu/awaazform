import { describe, expect, it } from 'vitest';
import {
  createSession, extractGoogleFormData, googlePrefillUrl, parseGoogleForm, parseGoogleFormUrl, sessionReducer, type Session,
} from '../src';

// Item shapes copied from real FB_PUBLIC_LOAD_DATA_ payloads (Nov 2026), with made-up content.
const item = (id: number, title: string, code: number, inputs: unknown[] | null, help: string | null = null) =>
  [id, title, help, code, inputs, null, null, null, null, null, null, [null, title]];
const opts = (...labels: string[]) => labels.map((l) => [l, null, null, null, 0]);
const OTHER = ['', null, null, null, 1];

const DATA = [
  null,
  [
    'Register for the  health camp.',
    [
      item(1, 'Full name', 0, [[101, null, 1]]),
      item(2, 'Email', 0, [[102, null, 1, null, [[2, 102, ['x']]]]]),
      item(3, 'Mobile number', 0, [[103, null, 0]]),
      item(4, 'Family members attending', 0, [[104, null, 1, null, [[1, 7, ['x']]]]]),
      item(5, 'Section two', 8, null),
      item(6, 'Preferred day', 2, [[106, [...opts('Saturday', 'Sunday'), OTHER], 1]]),
      item(7, 'Check-ups', 4, [[107, opts('Eye check-up', 'Blood pressure, sugar', 'Dental'), 0]]),
      item(8, 'Language', 3, [[108, opts('English', 'Hindi'), 0]]),
      item(9, 'How easy was this?', 5, [[109, [['1'], ['2'], ['3']], 0, ['Hard', 'Easy']]]),
      item(10, 'Date of birth', 9, [[110, null, 1, null, null, null, null, [0, 1]]]),
      item(11, 'Appointment', 9, [[111, null, 0, null, null, null, null, [1, 1]]]),
      item(12, 'Arrival time', 10, [[112, null, 0, null, null, null, [0]]]),
      item(13, 'How long can you stay?', 10, [[113, null, 0, null, null, null, [1]]]),
      item(14, 'Rate each', 7, [[114, opts('Good', 'Bad'), 0, ['Food']]]),
      item(15, 'Photo ID', 13, [[115, null, 0]]),
      item(16, 'Wheelchair access?', 2, [[116, opts('Yes', 'No'), 1]]),
      item(17, 'UPI PIN', 0, [[117, null, 0]]),
      item(18, 'Welcome image', 11, null),
    ],
    null, null, null, null, null, null,
    'Health  Camp\n Registration',
    null,
    [null, null, null, 2, null, null, 3],
  ],
  null,
  'Health camp (doc name)',
];

const FORM_ID = '1FAIpQLSd_test_form_id_0123456789';

describe('parseGoogleFormUrl', () => {
  it('accepts responder and short links', () => {
    expect(parseGoogleFormUrl(`https://docs.google.com/forms/d/e/${FORM_ID}/viewform?usp=sharing`)).toEqual({ kind: 'form', formId: FORM_ID });
    expect(parseGoogleFormUrl(`https://docs.google.com/forms/u/0/d/e/${FORM_ID}/formResponse`)).toEqual({ kind: 'form', formId: FORM_ID });
    expect(parseGoogleFormUrl(' https://forms.gle/AbC123xyz ')).toEqual({ kind: 'short', url: 'https://forms.gle/AbC123xyz' });
  });
  it('flags editor links and rejects everything else', () => {
    expect(parseGoogleFormUrl('https://docs.google.com/forms/d/1abcdefghijklmnopqrstuvwxyz/edit')).toEqual({ kind: 'edit' });
    for (const bad of ['http://docs.google.com/forms/d/e/x/viewform', 'https://evil.com/forms/d/e/1FAIpQLSd_aaaaaaaaaaaaaaa/viewform',
      'https://docs.google.com.evil.com/forms/d/e/1FAIpQLSd_aaaaaaaaaaaaaaa/viewform', 'https://forms.gle/a/b', 'not a url', 'file:///etc/passwd']) {
      expect(parseGoogleFormUrl(bad), bad).toBeNull();
    }
  });
});

describe('extractGoogleFormData', () => {
  it('pulls the payload out of the page script', () => {
    const html = `<script>var x=1;</script><script>var FB_PUBLIC_LOAD_DATA_ = ${JSON.stringify(DATA)};\n</script>`;
    expect(extractGoogleFormData(html)).toEqual(DATA);
    expect(extractGoogleFormData('<html>closed</html>')).toBeNull();
  });
});

describe('parseGoogleForm', () => {
  const form = parseGoogleForm(DATA, FORM_ID);
  const by = (label: string) => form.questions.find((q) => q.label === label)!;

  it('reads title and description', () => {
    expect(form.title).toBe('Health Camp Registration');
    expect(form.description).toBe('Register for the health camp.');
  });

  it('asks for the email the form collects, first', () => {
    expect(form.questions[0]).toMatchObject({ label: 'Email address', type: 'email', required: true, source: { entryId: 'emailAddress' } });
    const signedIn = structuredClone(DATA) as unknown[];
    ((signedIn[1] as unknown[])[10] as unknown[])[6] = 2;
    expect(parseGoogleForm(signedIn, FORM_ID).questions[0]!.label).toBe('Full name');
  });

  it('skips sections and media, keeps questions in order', () => {
    expect(form.questions.map((q) => q.label)).not.toContain('Section two');
    expect(form.questions.map((q) => q.label)).not.toContain('Welcome image');
    expect(form.questions[1]!.label).toBe('Full name');
    expect(form.questions).toHaveLength(17);
  });

  it('maps question types and entry ids', () => {
    expect(by('Full name')).toMatchObject({ type: 'text', required: true, support: 'supported', source: { kind: 'google-form', formId: FORM_ID, entryId: '101' } });
    expect(by('Email').type).toBe('email');
    expect(by('Mobile number')).toMatchObject({ type: 'phone', required: false });
    expect(by('Family members attending').type).toBe('number');
    expect(by('Preferred day')).toMatchObject({ type: 'choice', options: ['Saturday', 'Sunday'] });
    expect(by('Check-ups')).toMatchObject({ type: 'checkbox', options: ['Eye check-up', 'Blood pressure, sugar', 'Dental'] });
    expect(by('Language').type).toBe('dropdown');
    expect(by('How easy was this?')).toMatchObject({ type: 'scale', options: ['1', '2', '3'], helpText: '1 = Hard, 3 = Easy' });
    expect(by('Date of birth').type).toBe('date');
    expect(by('Arrival time').type).toBe('time');
    expect(by('Wheelchair access?')).toMatchObject({ type: 'yesno', options: ['Yes', 'No'] });
  });

  it('leaves what it cannot pre-fill to the user', () => {
    for (const label of ['Appointment', 'How long can you stay?', 'Rate each', 'Photo ID', 'UPI PIN']) {
      expect(by(label).support, label).toBe('unsupported');
    }
    expect(by('Preferred day').supportReason).toMatch(/Other/);
  });
});

describe('googlePrefillUrl', () => {
  const form = parseGoogleForm(DATA, FORM_ID);
  const answer = (s: Session, label: string, normalized: string, verify = true) => {
    const q = form.questions.find((x) => x.label === label)!;
    s = sessionReducer(s, { type: 'propose', questionId: q.id, raw: normalized, normalized, source: 'typed' });
    if (!verify) return s;
    s = sessionReducer(s, { type: 'confirm', questionId: q.id });
    s = sessionReducer(s, { type: 'written', questionId: q.id });
    return sessionReducer(s, { type: 'verified', questionId: q.id, ok: true });
  };

  it('carries only verified answers, in Google’s formats', () => {
    let s = createSession({ id: 's', formTitle: form.title, questions: form.questions });
    s = answer(s, 'Email address', 'sunita@example.com');
    s = answer(s, 'Full name', 'Sunita Devi');
    s = answer(s, 'Check-ups', 'Blood pressure, sugar, Dental');
    s = answer(s, 'Date of birth', '1978-03-12');
    s = answer(s, 'Arrival time', '09:30');
    s = answer(s, 'Mobile number', '9844012345', false); // proposed only

    const url = new URL(googlePrefillUrl(s)!);
    expect(url.origin + url.pathname).toBe(`https://docs.google.com/forms/d/e/${FORM_ID}/viewform`);
    expect(url.searchParams.get('usp')).toBe('pp_url');
    expect(url.searchParams.get('emailAddress')).toBe('sunita@example.com');
    expect(url.searchParams.get('entry.101')).toBe('Sunita Devi');
    expect(url.searchParams.getAll('entry.107')).toEqual(['Blood pressure, sugar', 'Dental']);
    expect(url.searchParams.get('entry.110')).toBe('1978-03-12');
    expect(url.searchParams.get('entry.112')).toBe('09:30');
    expect(url.searchParams.has('entry.103')).toBe(false);
  });

  it('returns null for sessions that are not Google Forms', () => {
    expect(googlePrefillUrl(createSession({ id: 's', formTitle: 'x', questions: [] }))).toBeNull();
  });
});
