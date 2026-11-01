'use client';

import type { Session } from '@awaazform/core';

// FR-22: sessions survive reload via localStorage, and can be discarded.
// Each source (demo form, a PDF, a Google Form) has its own key; the report shows the most recent one.
export const DEMO_KEY = 'awaazform.session';
export const PDF_KEY = 'awaazform.session.pdf';
export const GFORM_KEY = 'awaazform.session.gform';
const LAST = 'awaazform.session.last';

export function loadSession(key: string = DEMO_KEY): Session | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const s = JSON.parse(raw) as Session;
    // A reload mid-recording should not leave an answer stuck in "listening".
    for (const a of Object.values(s.answers)) if (a.status === 'listening') a.status = 'pending';
    return s;
  } catch {
    return null;
  }
}

export function saveSession(s: Session, key: string = DEMO_KEY) {
  localStorage.setItem(key, JSON.stringify(s));
  localStorage.setItem(LAST, key);
}

export function loadLastSession(): Session | null {
  return loadSession(localStorage.getItem(LAST) ?? DEMO_KEY);
}

export function discardSession(key: string = DEMO_KEY) {
  localStorage.removeItem(key);
}
