'use client';

import type { FormQuestion, Language } from '@awaazform/core';
import { apiUrl } from './api';

// The form's own wording in the user's language. The form still gets its original text: these are
// for showing and speaking only. Cached per form and language in this browser.

export interface QuestionText { label: string; helpText?: string; options?: string[] }
export type QuestionTexts = Record<string, QuestionText>;

const KEY = 'awaazform.qtext.';

async function hash(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d).slice(0, 12), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function translateQuestions(questions: FormQuestion[], lang: Language): Promise<QuestionTexts> {
  if (lang === 'en' || !questions.length) return {};
  // Every distinct string once: labels, help text and options.
  const strings: string[] = [];
  const at = new Map<string, number>();
  const add = (s?: string) => {
    if (!s || at.has(s) || !/[A-Za-z]/.test(s)) return; // already in another script: nothing to translate
    at.set(s, strings.length);
    strings.push(s);
  };
  for (const q of questions) { add(q.label); add(q.helpText); q.options?.forEach(add); }

  const cacheKey = KEY + (await hash(`${lang}\n${strings.join('\n')}`));
  let done: string[] | null = null;
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) done = JSON.parse(cached) as string[];
  } catch { /* no cache */ }

  if (!done) {
    done = [...strings];
    for (let i = 0; i < strings.length; i += 60) {
      const items = strings.slice(i, i + 60);
      const res = await fetch(apiUrl('/api/translate'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: lang, items }) });
      if (!res.ok) throw new Error('Translation is unavailable right now');
      const json = (await res.json()) as { translations?: string[] };
      json.translations?.forEach((t, j) => { done![i + j] = t; });
    }
    try { localStorage.setItem(cacheKey, JSON.stringify(done)); } catch { /* storage full: fine */ }
  }

  const tr = (s?: string) => (s && at.has(s) ? done![at.get(s)!] : s);
  return Object.fromEntries(questions.map((q) => [q.id, { label: tr(q.label)!, helpText: tr(q.helpText), options: q.options?.map((o) => tr(o)!) }]));
}

// ---- Answers in the user's script (read-back only) ----
// “Ayush Shukla” shown and spoken as “आयुश शुक्ला” when the user speaks Hindi; the form still gets the
// original. Only for answers the user spoke, and kept in memory only (never stored).
const scripts = new Map<string, Promise<string | null>>();

export function inScript(value: string, lang: Language): Promise<string | null> {
  const key = `${lang}\u0000${value}`;
  let p = scripts.get(key);
  if (!p) {
    p = fetch(apiUrl('/api/translate'), {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: lang, mode: 'transliterate', items: [value.slice(0, 600)] }),
    })
      .then((r) => (r.ok ? (r.json() as Promise<{ translations?: string[] }>) : null))
      .then((j) => {
        const out = j?.translations?.[0]?.trim();
        return out && out !== value && !/^[\x00-\x7F]*$/.test(out) ? out : null;
      })
      .catch(() => null);
    p.then((v) => { if (v === null) scripts.delete(key); }); // retry next time if it failed
    scripts.set(key, p);
  }
  return p;
}
