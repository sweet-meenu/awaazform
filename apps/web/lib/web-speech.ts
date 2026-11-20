'use client';

import type { FormQuestion, Language } from '@awaazform/core';
import { LANGUAGE_META } from '@/lib/i18n/core';
import type { Listener } from '@/lib/vad';

// The browser's own speech recognition (Web Speech API; Google's service in Chrome and Edge). Faster than
// recording and uploading a clip, shows the words while you speak, and is tuned for Indian English,
// Hindi and Marathi. Brave and Firefox don't offer it, and it can fail offline: then Whisper is used.

type SR = {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  start(): void; stop(): void; abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string; confidence: number }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onspeechstart: (() => void) | null;
};

const Ctor = (): (new () => SR) | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => SR; webkitSpeechRecognition?: new () => SR };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Errors after which this browser's recognition is not tried again this visit. */
const FATAL = new Set(['network', 'service-not-allowed', 'language-not-supported', 'audio-capture']);
let broken = false;

/** Whether to use the browser's recognition. Brave exposes the API but it never works there. */
export function browserSttAvailable(): boolean {
  if (broken || !Ctor() || !window.isSecureContext) return false;
  return !(navigator as Navigator & { brave?: unknown }).brave;
}

/**
 * The recognition language for a question. Names, emails, phone numbers and numbers are heard as Indian
 * English, so a name comes back in English letters (“Ayush Shukla”), the way an English form needs it;
 * everything else in the user's language.
 */
export function recognitionLocale(q: FormQuestion | undefined, lang: Language): string {
  return LANGUAGE_META[sttLanguage(q, lang)]?.locale ?? 'en-IN';
}

/** The same choice for Whisper (the fallback): English for names, emails and numbers. */
export function sttLanguage(q: FormQuestion | undefined, lang: Language): Language {
  if (lang !== 'en' && q && (['email', 'phone', 'number'].includes(q.type) || /\bname\b|नाम|नाव/i.test(q.label))) return 'en';
  return lang;
}

export interface Heard {
  text: string;
  /** Other ways the recogniser heard it (best first, the chosen text excluded), for “did you mean…”. */
  alternatives: string[];
  /** 0–1, or 1 when the browser doesn't say. */
  confidence: number;
}

function heardFrom(alts: ArrayLike<{ transcript: string; confidence: number }>): Heard {
  const list = Array.from(alts).map((a) => ({ text: a.transcript.trim(), confidence: a.confidence })).filter((a) => a.text);
  const best = list[0] ?? { text: '', confidence: 0 };
  return {
    text: best.text,
    alternatives: [...new Set(list.slice(1).map((a) => a.text))].filter((t) => t.toLowerCase() !== best.text.toLowerCase()),
    confidence: best.confidence > 0 ? best.confidence : 1,
  };
}

export class BrowserSttError extends Error {
  constructor(public code: string) { super(code); }
}

/** Push-to-talk: listens until the user stops talking (or `stop()`), showing the words as they come. */
export function recognizeOnce(locale: string, onInterim?: (text: string) => void): { result: Promise<Heard>; stop: () => void; abort: () => void } {
  const C = Ctor();
  if (!C) throw new BrowserSttError('unsupported');
  const r = new C();
  r.lang = locale;
  r.continuous = false;
  r.interimResults = true;
  r.maxAlternatives = 3;
  let final: Heard | null = null;
  const result = new Promise<Heard>((resolve, reject) => {
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) final = heardFrom(res);
        else interim += res[0]?.transcript ?? '';
      }
      if (interim) onInterim?.(interim);
    };
    r.onerror = (e) => {
      if (FATAL.has(e.error)) broken = true;
      reject(new BrowserSttError(e.error));
    };
    r.onend = () => (final?.text ? resolve(final) : reject(new BrowserSttError('no-speech')));
  });
  r.start();
  return { result, stop: () => r.stop(), abort: () => r.abort() };
}

export interface BrowserLiveCallbacks {
  onSpeechStart: () => void;
  onText: (heard: Heard) => void;
  onInterim?: (text: string) => void;
  /** Recognition stopped working (offline, blocked): switch to the recorded-clip listener. */
  onFatal: (code: string) => void;
  /** Which language to listen in right now (it depends on the question). */
  locale: () => string;
}

/**
 * Live Mode with the browser's recognition. It is stopped while Bolu speaks or the answer is being
 * handled, so it never hears Bolu, and restarted afterwards (Chrome also ends sessions on its own after
 * a silence: those are restarted too).
 */
export class BrowserListener implements Listener {
  private r: SR | null = null;
  private active = false;
  private paused = false;
  private speaking = false;

  constructor(private cb: BrowserLiveCallbacks) {}

  async start() {
    if (!Ctor()) throw new BrowserSttError('unsupported');
    this.active = true;
    this.listen();
  }

  stop() {
    this.active = false;
    this.r?.abort();
    this.r = null;
  }

  setPaused(p: boolean) {
    this.paused = p;
    this.refresh();
  }

  /** Barge-in by voice isn't offered here: on speakers the recogniser would hear Bolu himself. */
  setSpeaking(on: boolean) {
    this.speaking = on;
    this.refresh();
  }

  private refresh() {
    if (this.paused || this.speaking) { this.r?.abort(); this.r = null; }
    else if (!this.r) this.listen();
  }

  private listen() {
    const C = Ctor();
    if (!C || !this.active || this.paused || this.speaking || this.r) return;
    const r = new C();
    this.r = r;
    r.lang = this.cb.locale();
    r.continuous = false; // one utterance per session: Chrome ends it when the user stops talking
    r.interimResults = true;
    r.maxAlternatives = 3;
    r.onspeechstart = () => this.cb.onSpeechStart();
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]!;
        if (res.isFinal) {
          const heard = heardFrom(res);
          if (heard.text) this.cb.onText(heard);
        } else interim += res[0]?.transcript ?? '';
      }
      if (interim) this.cb.onInterim?.(interim);
    };
    r.onerror = (e) => {
      if (FATAL.has(e.error) || e.error === 'not-allowed') {
        if (FATAL.has(e.error)) broken = true;
        this.active = false;
        this.cb.onFatal(e.error);
      }
    };
    r.onend = () => {
      if (this.r === r) this.r = null;
      // Ended by itself (silence, or after an answer): listen again unless paused or stopped.
      if (this.active) setTimeout(() => this.listen(), 120);
    };
    try { r.start(); } catch { this.r = null; }
  }
}
