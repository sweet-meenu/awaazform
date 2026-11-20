'use client';

import { apiUrl } from './api';
import type { Language } from '@awaazform/core';
import { LANGUAGE_META } from '@/lib/i18n/core';

// Voice I/O: record → /api/stt, and speak via /api/tts with a speechSynthesis fallback.

export function voiceInputSupported(): boolean {
  return typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

export class VoiceError extends Error {
  /** `status`: the API's HTTP status for 'ai' errors (429 = busy, try again; 401/503 = not set up). */
  constructor(message: string, public kind: 'permission' | 'unsupported' | 'ai' | 'empty', public status = 0) {
    super(message);
  }
}

/** Push-to-talk recorder. Call `stop()` to get the transcript. Audio is never stored (§9.4). */
export async function startRecording(language: Language, hint?: string): Promise<{ stop: () => Promise<string>; cancel: () => void }> {
  if (!voiceInputSupported()) throw new VoiceError('Voice input is not supported in this browser', 'unsupported');
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
  } catch {
    throw new VoiceError('Microphone permission was denied', 'permission');
  }
  const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.start();

  const release = () => stream.getTracks().forEach((t) => t.stop());

  return {
    cancel: () => {
      if (rec.state !== 'inactive') rec.stop();
      release();
    },
    stop: () =>
      new Promise<string>((resolve, reject) => {
        rec.onstop = async () => {
          release();
          const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
          chunks.length = 0;
          if (blob.size < 1000) return reject(new VoiceError("I didn't hear anything", 'empty'));
          try {
            resolve(await transcribe(blob, language, hint));
          } catch (e) {
            reject(e);
          }
        };
        rec.stop();
      }),
  };
}

/**
 * Speech-to-text. `hint` tells Whisper what it is listening for (the question, its options, an example
 * format), which noticeably improves names, emails and option words. It holds no personal data.
 */
export async function transcribe(audio: Blob, language: Language, hint?: string): Promise<string> {
  const body = new FormData();
  body.set('audio', audio);
  body.set('language', language);
  if (hint) body.set('prompt', hint.slice(0, 600));
  const res = await fetch(apiUrl('/api/stt'), { method: 'POST', body });
  const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new VoiceError(json.error ?? 'Transcription failed', 'ai', res.status);
  if (!json.text) throw new VoiceError("I didn't catch that", 'empty');
  return json.text;
}

let current: HTMLAudioElement | null = null;
let ttsCheck: Promise<string[]> | null = null;
/** Languages the server can speak (local Kokoro / MMS-TTS voices, or Groq's English one). */
// Fetched on first use (the extension sets the API address first); a failed check is retried next time.
const serverVoices = () =>
  (ttsCheck ??= fetch(apiUrl('/api/tts'))
    .then((r) => r.json())
    .then((j: { languages?: string[] }) => (serverLangs = j.languages ?? []))
    .catch(() => { ttsCheck = null; return [] as string[]; }));
let serverLangs: string[] = [];

/** Asks the server to load a language's voice now, so the first sentence in it isn't slow. */
export function prepareVoice(language: Language) {
  void serverVoices().then((langs) => {
    if (langs.includes(language)) void fetch(apiUrl(`/api/tts?warm=${encodeURIComponent(language)}`)).catch(() => {});
  });
}
let speaking = false;
export const isSpeaking = () => speaking;

let finishCurrent: (() => void) | null = null;

export function stopSpeaking() {
  current?.pause();
  current = null;
  // A paused <audio> never fires `ended`; resolve its promise so callers don't hang (barge-in).
  finishCurrent?.();
  finishCurrent = null;
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}

/** Speaks text; resolves when finished. Tries Groq TTS once, then uses the browser voice. */
export async function speak(text: string, opts: { language: Language; rate?: number; voiceURI?: string }): Promise<void> {
  const busy = typeof speechSynthesis !== 'undefined' && (speechSynthesis.speaking || speechSynthesis.pending);
  stopSpeaking();
  // Chrome can silently drop an utterance queued in the same tick as cancel(); give it a moment.
  if (busy) await new Promise((r) => setTimeout(r, 60));
  speaking = true;
  try {
    await speakInner(text, opts);
  } finally {
    speaking = false;
  }
}

async function speakInner(text: string, opts: { language: Language; rate?: number; voiceURI?: string }): Promise<void> {
  // The server's voice when it has one for this language (the same voice on every device); otherwise
  // the device's own voice.
  if ((await serverVoices()).includes(opts.language)) {
    try {
      const res = await fetch(apiUrl('/api/tts'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language: opts.language }) });
      if (res.ok) {
        const url = URL.createObjectURL(await res.blob());
        const audio = new Audio(url);
        audio.playbackRate = opts.rate ?? 1;
        current = audio;
        await new Promise<void>((resolve) => {
          finishCurrent = resolve;
          audio.onended = audio.onerror = () => resolve();
          audio.play().catch(() => resolve());
        });
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // fall through to speechSynthesis
    }
  }
  if (typeof speechSynthesis === 'undefined') return;
  // Browsers fill the voice list asynchronously; asking too early finds nothing and Live Mode went silent.
  await deviceVoicesReady();
  const voice = pickVoice(opts.language, opts.voiceURI);
  // Still no voice for this language once the list has loaded: stay silent rather than read it with a
  // wrong-language voice. The words are on screen, and the session shows a notice about installing one.
  if (!voice && opts.language !== 'en') return;
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANGUAGE_META[opts.language]?.locale ?? 'en-IN';
    u.rate = opts.rate ?? 1;
    if (voice) u.voice = voice;
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

/** Resolves once the server's voice list and the browser's voices are known (browser: or after 1.5 s). */
export async function voicesReady(): Promise<void> {
  await serverVoices();
  await deviceVoicesReady();
}

let voicesPromise: Promise<void> | null = null;
function deviceVoicesReady(): Promise<void> {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve();
  if (speechSynthesis.getVoices().length) return Promise.resolve();
  return (voicesPromise ??= new Promise<void>((resolve) => {
    const done = () => { speechSynthesis.removeEventListener('voiceschanged', done); resolve(); };
    speechSynthesis.addEventListener('voiceschanged', done);
    setTimeout(done, 1500);
  }).finally(() => { voicesPromise = null; }));
}

/** Languages without their own voice can borrow one that reads the same script. */
const BORROW: Partial<Record<Language, string>> = { mr: 'hi', ne: 'hi', as: 'bn' };

function pickVoice(lang: Language, voiceURI?: string): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices();
  if (voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === voiceURI);
    if (chosen && chosen.lang.toLowerCase().startsWith(lang)) return chosen;
  }
  const by = (code: string) => voices.find((v) => v.lang.toLowerCase().startsWith(code) && /IN|NP|PK/i.test(v.lang)) ?? voices.find((v) => v.lang.toLowerCase().startsWith(code));
  return by(lang) ?? (BORROW[lang] ? by(BORROW[lang]!) : undefined);
}

/** Whether this device can read the language aloud (the server's voice, its own, or a borrowed one). */
export function voiceAvailable(lang: Language): boolean {
  if (serverLangs.includes(lang)) return true;
  if (typeof speechSynthesis === 'undefined') return false;
  return lang === 'en' || !!pickVoice(lang);
}

/** Speaks a reply one sentence at a time, so speech starts sooner and barge-in can stop it between sentences (FR-41). */
export async function speakSentences(text: string, opts: { language: Language; rate?: number; voiceURI?: string }, shouldStop: () => boolean) {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  for (const s of sentences) {
    if (shouldStop()) return;
    await speak(s, opts);
  }
}

/** What Whisper should expect for a question: its wording, options, and the shape of the answer. */
export function sttHint(q: { label: string; type: string; options?: string[] } | undefined): string | undefined {
  if (!q) return undefined;
  const shape: Record<string, string> = {
    email: 'Email address, spoken like: ayush dot shukla at gmail dot com → ayush.shukla@gmail.com.',
    phone: 'Phone number: 98440 12345.',
    number: 'A number.',
    date: 'A date, like 12 March 2001.',
    text: /name/i.test(q.label) ? 'A person’s name, like Ayush Shukla, Priya Patil, Sunita Devi.' : '',
  };
  // No trailing command words: Whisper can echo its prompt on near-silent audio.
  return [q.label, q.options?.length ? `Options: ${q.options.join(', ')}.` : '', shape[q.type] ?? ''].filter(Boolean).join(' ');
}
