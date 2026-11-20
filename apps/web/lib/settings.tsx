'use client';

import { LANGUAGES, type Language } from '@awaazform/core';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { en, LANGUAGE_META, loadStrings, type Strings } from './i18n';
import { prepareVoice } from './voice';

export interface Settings {
  language: Language;
  contrast: 'normal' | 'high';
  text: 'normal' | 'large';
  motion: 'system' | 'reduce';
  speechRate: number;
  voiceURI: string;
  /** Hide emails, phone and ID numbers from the AI (restored locally). */
  privacyShield: boolean;
  /** Live Mode: confirm all answers in one summary at the end, or each one as it comes. */
  confirmMode: 'end' | 'each';
  /** Interrupt Bolu by talking. Off by default: on speakers the microphone hears him. */
  bargeIn: boolean;
}

const DEFAULTS: Settings = { language: 'en', contrast: 'normal', text: 'normal', motion: 'system', speechRate: 1, voiceURI: '', privacyShield: true, confirmMode: 'end', bargeIn: false };
const KEY = 'awaazform.settings';

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const s = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } as Settings;
    if (!LANGUAGES.includes(s.language)) s.language = 'en';
    return s;
  } catch {
    return DEFAULTS;
  }
}

/** Inline script applied before paint, so saved themes don't flash (FR-47 persistence). */
export const settingsBootScript = `try{var s=JSON.parse(localStorage.getItem('${KEY}')||'{}'),d=document.documentElement;if(s.contrast)d.dataset.contrast=s.contrast;if(s.text)d.dataset.text=s.text;if(s.motion)d.dataset.motion=s.motion;if(s.language){d.lang=s.language}}catch(e){}`;

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
  t: Strings;
  reduceMotion: boolean;
}

const SettingsContext = createContext<Ctx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [systemReduce, setSystemReduce] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setSystemReduce(mq.matches);
    const on = (e: MediaQueryListEvent) => setSystemReduce(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const d = document.documentElement;
    d.dataset.contrast = settings.contrast;
    d.dataset.text = settings.text;
    d.dataset.motion = settings.motion;
    d.lang = settings.language;
    d.dir = LANGUAGE_META[settings.language]?.dir ?? 'ltr';
  }, [settings]);

  // Each language's strings load as their own chunk; English shows until they arrive.
  const [t, setT] = useState<Strings>(en);
  useEffect(() => {
    let live = true;
    void loadStrings(settings.language).then((s) => live && setT(s));
    prepareVoice(settings.language);
    return () => { live = false; };
  }, [settings.language]);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });

  return (
    <SettingsContext.Provider
      value={{ settings, update, t, reduceMotion: settings.motion === 'reduce' || systemReduce }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
