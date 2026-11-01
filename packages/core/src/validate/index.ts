import { z } from 'zod';
import type { FormQuestion } from '../types';
import {
  matchOption, normalizeDate, normalizeEmail, normalizeNumber,
  normalizePhone, normalizeTime, normalizeYesNo,
} from '../normalize';

export type ValidationResult =
  | { ok: true; normalized: string }
  | { ok: false; error: string };

const MAX_TEXT = 500;
const MAX_PARAGRAPH = 4000;

const schemas = {
  text: z.string().trim().min(1, 'Answer is empty').max(MAX_TEXT, 'Answer is too long'),
  paragraph: z.string().trim().min(1, 'Answer is empty').max(MAX_PARAGRAPH, 'Answer is too long'),
  email: z.email('That does not look like an email address'),
  isoDate: z.iso.date(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
};

function fail(error: string): ValidationResult {
  return { ok: false, error };
}

/**
 * Normalize, then validate (D6: the LLM may propose, Zod decides).
 * Multi-select answers are separated by commas or "and"/"और".
 */
export function validateAnswer(q: FormQuestion, raw: string): ValidationResult {
  const input = raw.trim();
  if (!input) return fail('Answer is empty');

  switch (q.type) {
    case 'text':
    case 'paragraph': {
      const r = schemas[q.type].safeParse(input);
      return r.success ? { ok: true, normalized: r.data } : fail(r.error.issues[0]!.message);
    }
    case 'email': {
      const v = normalizeEmail(input);
      return schemas.email.safeParse(v).success ? { ok: true, normalized: v } : fail('That does not look like an email address');
    }
    case 'phone': {
      const v = normalizePhone(input);
      return v ? { ok: true, normalized: v } : fail('Phone number should be 10 digits, or start with + and a country code');
    }
    case 'number': {
      const v = normalizeNumber(input);
      return v ? { ok: true, normalized: v } : fail('Please say or type a number');
    }
    case 'date': {
      const v = normalizeDate(input);
      return v && schemas.isoDate.safeParse(v).success ? { ok: true, normalized: v } : fail("I couldn't read that date. Try “12 March 2001” or 12/03/2001");
    }
    case 'time': {
      const v = normalizeTime(input);
      return v ? { ok: true, normalized: v } : fail("I couldn't read that time. Try “10:30 am”");
    }
    case 'yesno': {
      const v = normalizeYesNo(input);
      return v ? { ok: true, normalized: v } : fail('Please answer yes or no');
    }
    case 'choice':
    case 'dropdown':
    case 'scale': {
      const opts = q.options ?? [];
      const v = matchOption(input, opts);
      return v ? { ok: true, normalized: v } : fail(`Please choose one of: ${opts.join(', ')}`);
    }
    case 'multichoice':
    case 'checkbox': {
      const opts = q.options ?? [];
      const parts = input.split(/\s*(?:,|;| and | और )\s*/).filter(Boolean);
      const matched = parts.map((p) => matchOption(p, opts));
      if (matched.some((m) => m === null)) return fail(`Please choose from: ${opts.join(', ')}`);
      const unique = [...new Set(matched as string[])];
      return { ok: true, normalized: unique.join(', ') };
    }
  }
}
