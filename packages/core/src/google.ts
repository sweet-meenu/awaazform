// Google Forms by link: read a public form's questions, and hand answers back as a pre-filled link.
// The user opens the link, reviews the real form and presses Submit themselves (§9.1).
import { classifySupport, type RawControl } from './safety';
import type { FieldType, FormQuestion, Session } from './types';

export type GoogleFormLink =
  | { kind: 'form'; formId: string }
  | { kind: 'short'; url: string }
  /** /forms/d/<id>/…: a document link. Public forms answer it too, so the server tries before giving up. */
  | { kind: 'doc'; docId: string; edit: boolean };

/**
 * Finds a Google Form link in what the user pasted: the responder link (docs.google.com/forms/d/e/<id>/viewform),
 * the document link (docs.google.com/forms/d/<id>/…), or a forms.gle short link. The scheme may be missing
 * or http, and the link may sit inside other text (“Fill this: https://…”).
 */
export function parseGoogleFormUrl(input: string): GoogleFormLink | null {
  const found = input.trim().match(/(?:https?:\/\/)?(?:forms\.gle|docs\.google\.com)\/[^\s<>"'`]+/i);
  if (!found) return null;
  let u: URL;
  try {
    u = new URL(/^https?:\/\//i.test(found[0]) ? found[0].replace(/^http:/i, 'https:') : `https://${found[0]}`);
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
  const host = u.hostname.toLowerCase();
  if (host === 'forms.gle') return /^\/[\w-]+\/?$/.test(u.pathname) ? { kind: 'short', url: `https://forms.gle${u.pathname.replace(/\/$/, '')}` } : null;
  if (host !== 'docs.google.com') return null;
  const m = u.pathname.match(/^\/forms(?:\/u\/\d+)?\/d\/e\/([\w-]{20,})(?:\/|$)/);
  if (m) return { kind: 'form', formId: m[1]! };
  const d = u.pathname.match(/^\/forms(?:\/u\/\d+)?\/d\/([\w-]{20,})(?:\/([\w-]*))?/);
  if (d) return { kind: 'doc', docId: d[1]!, edit: /^edit/.test(d[2] ?? '') };
  return null;
}

/** A responder URL. `formId` is a published id, or `d/<docId>` for a form only known by its document id. */
export const googleFormUrl = (formId: string) =>
  formId.startsWith('d/') ? `https://docs.google.com/forms/${formId}/viewform` : `https://docs.google.com/forms/d/e/${formId}/viewform`;

/** The published form id a responder page reports about itself (`e/<id>` in FB_PUBLIC_LOAD_DATA_). */
export function canonicalFormId(data: unknown[]): string | null {
  const v = data[14];
  const m = typeof v === 'string' ? v.match(/^e\/([\w-]{20,})$/) : null;
  return m ? m[1]! : null;
}

/** Pulls the FB_PUBLIC_LOAD_DATA_ array out of a responder page's HTML. */
export function extractGoogleFormData(html: string): unknown[] | null {
  const m = html.match(/FB_PUBLIC_LOAD_DATA_\s*=\s*([\s\S]*?);\s*<\/script>/);
  if (!m) return null;
  try {
    const data = JSON.parse(m[1]!);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// Item type codes in FB_PUBLIC_LOAD_DATA_.
const T = { short: 0, paragraph: 1, choice: 2, dropdown: 3, checkbox: 4, scale: 5, text: 6, grid: 7, section: 8, date: 9, time: 10, image: 11, video: 12, file: 13, rating: 18 } as const;
const NOT_QUESTIONS: number[] = [T.text, T.section, T.image, T.video];

type Arr = unknown[];
const arr = (v: unknown): Arr => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : '');

export interface GoogleForm {
  title: string;
  description: string;
  questions: FormQuestion[];
}

/** Pseudo entry for the form's own "collect email" field, pre-filled as `emailAddress=`. */
export const GOOGLE_EMAIL_ENTRY = 'emailAddress';

export function parseGoogleForm(data: unknown[], formId: string): GoogleForm {
  const body = arr(data[1]);
  const title = str(body[8]) || str(data[3]) || 'Google Form';
  const url = googleFormUrl(formId);
  const questions: FormQuestion[] = [];
  // body[10][6]: 1 = no email, 2 = verified by Google sign-in, 3 = typed by the responder.
  if (arr(body[10])[6] === 3) {
    questions.push({ id: 'gemail', label: 'Email address', helpText: 'This form records your email address.', type: 'email', required: true,
      support: 'supported', source: { kind: 'google-form', url, formId, entryId: GOOGLE_EMAIL_ENTRY } });
  }

  for (const raw of arr(body[1])) {
    const item = arr(raw);
    const code = item[3];
    if (typeof code !== 'number' || NOT_QUESTIONS.includes(code)) continue;
    const label = str(item[1]) || 'Untitled question';
    const helpText = str(item[2]) || undefined;
    const inputs = arr(item[4]);
    const first = arr(inputs[0]);
    const entryId = first[0] != null ? String(first[0]) : '';
    const id = `g${String(item[0] ?? questions.length)}`;
    const required = first[2] === 1;
    const options = arr(first[1]).map((o) => arr(o)).filter((o) => o[4] !== 1).map((o) => str(o[0])).filter(Boolean);
    const hasOther = arr(first[1]).some((o) => arr(o)[4] === 1);
    const src = { kind: 'google-form', url, formId, entryId } as const;

    const push = (control: RawControl, extra: Partial<FormQuestion> = {}) => {
      const { support, reason } = classifySupport(label, control);
      const type: FieldType = (['grid', 'checkbox-grid', 'file', 'signature', 'password', 'unknown'] as string[]).includes(control) ? 'text' : (control as FieldType);
      questions.push({ id, label, helpText, type, required, support, supportReason: reason, source: src, ...extra });
    };
    const manual = (reason: string) => questions.push({ id, label, helpText, type: 'text', required, support: 'unsupported', supportReason: reason, source: src });

    switch (code) {
      case T.short: {
        // Response validation: [[kind, subkind, …]]; 1 = number, 2/102 = email.
        const rule = arr(arr(first[4])[0]);
        // Label hints only on short labels; long ones often just mention email or phone in passing.
        const l = label.length <= 60 ? label.toLowerCase() : '';
        if (rule[0] === 1) push('number');
        else if ((rule[0] === 2 && rule[1] === 102) || /e-?mail|ईमेल/.test(l)) push('email');
        else if (/phone|mobile|whatsapp|contact (no|number)|फ़ोन|फोन|मोबाइल/.test(l)) push('phone');
        else push('text');
        break;
      }
      case T.paragraph: push('paragraph'); break;
      case T.choice: push(isYesNo(options) ? 'yesno' : 'choice', { options, ...otherNote(hasOther) }); break;
      case T.dropdown: push('dropdown', { options }); break;
      case T.checkbox: push('checkbox', { options, ...otherNote(hasOther) }); break;
      case T.scale: {
        const ends = arr(first[3]).map(str);
        const hint = ends[0] || ends[1] ? `${options[0]} = ${ends[0] || 'lowest'}, ${options.at(-1)} = ${ends[1] || 'highest'}` : undefined;
        push('scale', { options, helpText: [helpText, hint].filter(Boolean).join(' · ') || undefined });
        break;
      }
      case T.rating: {
        const n = typeof first[1] === 'number' ? first[1] : options.length;
        n > 0 ? push('scale', { options: options.length ? options : Array.from({ length: n }, (_, i) => String(i + 1)) }) : manual('Answer this rating on the form itself');
        break;
      }
      case T.date: {
        // first[7] = [includeTime, includeYear]
        const [withTime, withYear] = arr(first[7]);
        withTime === 1 || withYear === 0 ? manual('Answer this date on the form itself') : push('date');
        break;
      }
      case T.time: {
        arr(first[6])[0] === 1 ? manual('Durations must be answered on the form itself') : push('time');
        break;
      }
      case T.grid: manual('Answer grid questions on the form itself'); break;
      case T.file: push('file'); break;
      default: manual('AwaazForm does not recognise this question type');
    }
    if (!entryId) {
      const q = questions.at(-1);
      if (q?.id === id) Object.assign(q, { support: 'unsupported', supportReason: 'This question has no field AwaazForm can fill' });
    }
  }

  return { title, description: str(body[0]), questions };
}

const isYesNo = (o: string[]) => o.length === 2 && /^(yes|हाँ|हां)$/i.test(o[0]!) && /^(no|नहीं)$/i.test(o[1]!);
const otherNote = (hasOther: boolean) => (hasOther ? { supportReason: 'Choose "Other" on the form itself if none of these fit' } : {});

/** Splits a normalized multi-value answer ("A, B") back into options, even when options contain commas. */
export function splitOptions(value: string, options: string[]): string[] {
  const out: string[] = [];
  let rest = value;
  const byLength = [...options].sort((a, b) => b.length - a.length);
  while (rest) {
    const hit = byLength.find((o) => rest === o || rest.startsWith(`${o}, `));
    if (!hit) return value.split(', ');
    out.push(hit);
    rest = rest.slice(hit.length).replace(/^, /, '');
  }
  return out;
}

/** A pre-filled responder link carrying every verified answer. Unverified answers are left out. */
/**
 * The form's link with verified answers filled in. `embedded`: for showing the live form inside
 * AwaazForm (Google's embed view), refreshed after each confirmed answer; government ID numbers
 * (Aadhaar, PAN: support 'manual') are left out there, so they never sit in a URL that reloads by itself.
 */
export function googlePrefillUrl(s: Session, opts: { embedded?: boolean } = {}): string | null {
  const first = s.questions.find((q) => q.source.kind === 'google-form');
  if (!first || first.source.kind !== 'google-form') return null;
  const params = new URLSearchParams({ usp: 'pp_url' });
  if (opts.embedded) params.set('embedded', 'true');
  for (const q of s.questions) {
    const a = s.answers[q.id];
    if (q.source.kind !== 'google-form' || !q.source.entryId || a?.status !== 'verified' || !a.normalized) continue;
    if (opts.embedded && q.support === 'manual') continue;
    const key = q.source.entryId === GOOGLE_EMAIL_ENTRY ? GOOGLE_EMAIL_ENTRY : `entry.${q.source.entryId}`;
    if (q.type === 'checkbox' || q.type === 'multichoice') {
      for (const v of splitOptions(a.normalized, q.options ?? [])) params.append(key, v);
    } else {
      params.append(key, a.normalized);
    }
  }
  return `${googleFormUrl(first.source.formId)}?${params.toString()}`;
}
