// Responsible-AI rules enforced in code — PRD §9.1 and §9.3.
import type { CanonicalKey, FieldType, FormQuestion, SupportStatus } from './types';

/** Labels for fields AwaazForm must never fill (passwords, payments, auth). */
const NEVER_FILL = [
  /pass\s?word|passcode|\bpin\b(?! ?code)|\botp\b|one[- ]time|captcha|verification code|security code/i,
  /card number|credit card|debit card|\bcvv\b|\bcvc\b|expiry|upi\s?(pin|id)|net\s?banking/i,
  /पासवर्ड|पिन(?! ?कोड)|ओटीपी/,
];

/** Labels for data AwaazForm must never save to a profile (§9.3). */
const NEVER_SAVE = [
  ...NEVER_FILL,
  /bank account|account (no|number)|ifsc/i,
  /aadha+r|\bpan\b|pan card|passport|driving licen[cs]e|\bdl\b|voter\s?id|epic no|ssn|social security|national id/i,
  /health|medical|diagnos|disease|disabilit|blood group|medication|allerg/i,
  /religio|caste|sexual|orientation|political|party affiliation|immigration|visa status|citizenship status/i,
  /आधार|पैन|पासपोर्ट|धर्म|जाति|बीमारी|स्वास्थ्य|खाता संख्या/,
];

/** Submit-like controls the filler must never touch (§9.1). */
export const SUBMIT_TEXT = /^(submit|send|done|finish|प्रस्तुत करें|जमा करें|सबमिट करें?)$/i;

export function isNeverFill(label: string): boolean {
  return NEVER_FILL.some((r) => r.test(label));
}

export function isSensitive(label: string): boolean {
  return NEVER_SAVE.some((r) => r.test(label));
}

/** Raw control kinds a scanner may report, before mapping to FieldType. */
export type RawControl =
  | FieldType | 'grid' | 'checkbox-grid' | 'file' | 'signature' | 'password' | 'unknown';

/** Support classification (FR-02 – FR-04). */
export function classifySupport(label: string, control: RawControl): { support: SupportStatus; reason?: string } {
  if (control === 'password' || isNeverFill(label)) {
    return { support: 'unsupported', reason: 'Passwords, payments, OTPs and verification codes are never filled' };
  }
  if (control === 'file') return { support: 'unsupported', reason: 'File uploads must be done by hand' };
  if (control === 'signature') return { support: 'unsupported', reason: 'Signatures must be done by hand' };
  if (control === 'unknown') return { support: 'unsupported', reason: 'AwaazForm does not recognise this control' };
  if (control === 'grid' || control === 'checkbox-grid') {
    return { support: 'limited', reason: 'Grid questions are filled row by row and may need manual review' };
  }
  if (/aadha+r|\bpan\b|passport|voter\s?id|driving licen[cs]e|आधार|पैन/i.test(label)) {
    // Government IDs may be answered by the user, but the value is filled only, never saved or offered.
    return { support: 'manual', reason: 'Government ID numbers: please check this one yourself' };
  }
  return { support: 'supported' };
}

/** Suggests a canonical key for a question. The user confirms the mapping once (FR-32). */
export function suggestCanonicalKey(q: Pick<FormQuestion, 'label' | 'type'>): CanonicalKey | null {
  const l = q.label.toLowerCase();
  if (isSensitive(q.label)) return null;
  if (q.type === 'email' || /e-?mail|ईमेल/.test(l)) return 'email';
  if (q.type === 'phone' || /phone|mobile|contact number|फ़ोन|फोन|मोबाइल/.test(l)) return 'phone';
  if (/date of birth|\bdob\b|birth ?date|जन्म तिथि|जन्मतिथि/.test(l)) return 'date_of_birth';
  if (/(full )?name|नाम/.test(l) && !/father|mother|guardian|parent|spouse|company|school|college|पिता|माता/.test(l)) return 'full_name';
  if (/address line 2|address 2/.test(l)) return 'address_line2';
  if (/address|पता/.test(l)) return 'address_line1';
  if (/\bcity\b|town|शहर/.test(l)) return 'city';
  if (/\bstate\b|राज्य/.test(l)) return 'state';
  if (/pin ?code|postal|zip|पिन कोड/.test(l)) return 'postal_code';
  if (/country|देश/.test(l)) return 'country';
  return null;
}
