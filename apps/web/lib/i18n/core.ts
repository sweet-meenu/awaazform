// Interface strings without React or locale loading, so the extension widget can bundle it.
import type { Language } from '@awaazform/core';
import { en, type Strings } from './en';

export { en, type Strings };


export interface LanguageMeta {
  /** Name in its own script, for the picker. */
  native: string;
  /** English name, for the AI prompt and for people helping someone else. */
  english: string;
  /** BCP 47 locale for dates and speech. */
  locale: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_META: Record<Language, LanguageMeta> = {
  en: { native: 'English', english: 'English', locale: 'en-IN', dir: 'ltr' },
  hi: { native: 'हिन्दी', english: 'Hindi', locale: 'hi-IN', dir: 'ltr' },
  mr: { native: 'मराठी', english: 'Marathi', locale: 'mr-IN', dir: 'ltr' },
};

/** Fills `{name}` placeholders. Unknown names are left as they are. */
export function fmt(s: string, params: Record<string, string | number> = {}): string {
  return s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m));
}

/** Plain text of a string with markup removed (for aria-labels, speech and titles). */
export const plain = (s: string, params?: Record<string, string | number>) =>
  (params ? fmt(s, params) : s).replace(/<br\s*\/?>/g, ' ').replace(/<\/?(b|code)>/g, '');

const PATTERNS: [RegExp, keyof Strings['msg_patterns'], string[]][] = [
  [/^Please choose one of: (.*)$/, 'choose_one', ['list']],
  [/^Please choose from: (.*)$/, 'choose_from', ['list']],
  [/^Didn't take \(field shows “(.*)”\)\. Retry or tell me$/, 'didnt_take_shows', ['actual']],
  [/^Couldn't fill “(.*)”: (.*)$/, 'couldnt_fill', ['label', 'reason']],
  [/^Option “(.*)” is not (?:on the page|in the list)$/, 'option_missing', ['value']],
  [/^This field allows at most (\d+) characters$/, 'max_chars', ['n']],
  [/^Google Forms returned an error \((\d+)\)\. Try again in a moment\.$/, 'google_error', ['status']],
  [/^Microsoft Forms returned an error \((\d+)\)\. Try again in a moment\.$/, 'ms_error', ['status']],
  [/^AI request failed \((\d+)\)$/, 'ai_failed', ['status']],
];

/** Translates a message produced in English by code (validation, parsers, servers). */
export function localizeMessage(t: Strings, msg: string | undefined | null): string {
  if (!msg) return '';
  if (msg === "Didn't take. Retry or tell me") return t.session.didnt_take;
  const exact = t.msgs[msg] ?? en.msgs[msg];
  if (exact) return exact;
  for (const [re, key, names] of PATTERNS) {
    const m = msg.match(re);
    if (!m) continue;
    const params = Object.fromEntries(names.map((n, i) => [n, n === 'reason' ? localizeMessage(t, m[i + 1]) : m[i + 1] ?? '']));
    return fmt(t.msg_patterns[key], params);
  }
  return msg;
}

