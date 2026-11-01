// Demo form mirroring the §12 test Google Form, used by the web demo and tests.
import { classifySupport, type RawControl } from './safety';
import type { FormQuestion } from './types';

const src = { kind: 'fixture', name: 'demo' } as const;

function q(id: string, label: string, control: RawControl, extra: Partial<FormQuestion> = {}): FormQuestion {
  const { support, reason } = classifySupport(label, control);
  const type = (['grid', 'checkbox-grid', 'file', 'signature', 'password', 'unknown'] as string[]).includes(control)
    ? 'text'
    : (control as FormQuestion['type']);
  return { id, label, type, required: false, support, supportReason: reason, source: src, ...extra };
}

export const DEMO_FORM_TITLE = 'Community Health Camp Registration';

export const DEMO_FORM: FormQuestion[] = [
  q('q1', 'Full name', 'text', { required: true }),
  q('q2', 'Email address', 'email', { required: true }),
  q('q3', 'Mobile number', 'phone', { required: true }),
  q('q4', 'Date of birth', 'date', { required: true, helpText: 'As written on any ID you have.' }),
  q('q5', 'Number of family members attending', 'number', { required: true }),
  q('q6', 'Preferred camp day', 'choice', { required: true, options: ['Saturday', 'Sunday'] }),
  q('q7', 'Which check-ups would you like?', 'checkbox', { options: ['Eye check-up', 'Blood pressure', 'Dental', 'General physician'] }),
  q('q8', 'Preferred language for the doctor', 'dropdown', { options: ['English', 'Hindi', 'Marathi', 'Tamil'] }),
  q('q9', 'How easy was it to find this form?', 'scale', { options: ['1', '2', '3', '4', '5'], helpText: '1 = very hard, 5 = very easy' }),
  q('q10', 'Preferred arrival time', 'time'),
  q('q11', 'Do you need wheelchair access?', 'yesno', { required: true, options: ['Yes', 'No'] }),
  q('q12', 'Anything else we should know?', 'paragraph'),
  q('q13', 'Upload a photo ID (optional)', 'file'),
];
