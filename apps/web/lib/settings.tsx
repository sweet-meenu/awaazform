'use client';

import type { Language } from '@awaazform/core';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { strings, type Strings } from './i18n';

export interface Settings {
  language: Language;
  contrast: 'normal' | 'high';
  text: 'normal' | 'large';
  motion: 'system' | 'reduce';
  speechRate: number;
  voiceURI: string;
}

const DEFAULTS: Settings = { language: 'en', contrast: 'normal', text: 'normal', motion: 'system', speechRate: 1, voiceURI: '' };
const KEY = 'awaazform.settings';

export function loadSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return DEFAULTS;
  }
}

/** Inline script applied before paint, so saved themes don't flash (FR-47 persistence). */
export const settingsBootScript = `try{var s=JSON.parse(localStorage.getItem('${KEY}')||'{}'),d=document.documentElement;if(s.contrast)d.dataset.contrast=s.contrast;if(s.text)d.dataset.text=s.text;if(s.motion)d.dataset.motion=s.motion;if(s.language)d.lang=s.language}catch(e){}`;

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
  }, [settings]);

  const update = (patch: Partial<Settings>) =>
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });

  return (
    <SettingsContext.Provider
      value={{ settings, update, t: strings[settings.language], reduceMotion: settings.motion === 'reduce' || systemReduce }}
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
