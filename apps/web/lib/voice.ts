'use client';

import type { Language } from '@awaazform/core';

// Voice I/O: record → /api/stt, and speak via /api/tts with a speechSynthesis fallback.

export function voiceInputSupported(): boolean {
  return typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

export class VoiceError extends Error {
  constructor(message: string, public kind: 'permission' | 'unsupported' | 'ai' | 'empty') {
    super(message);
  }
}

/** Push-to-talk recorder. Call `stop()` to get the transcript. Audio is never stored (§9.4). */
export async function startRecording(language: Language): Promise<{ stop: () => Promise<string>; cancel: () => void }> {
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
            resolve(await transcribe(blob, language));
          } catch (e) {
            reject(e);
          }
        };
        rec.stop();
      }),
  };
}

export async function transcribe(audio: Blob, language: Language): Promise<string> {
  const body = new FormData();
  body.set('audio', audio);
  body.set('language', language);
  const res = await fetch('/api/stt', { method: 'POST', body });
  const json = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok) throw new VoiceError(json.error ?? 'Transcription failed', 'ai');
  if (!json.text) throw new VoiceError("I didn't catch that", 'empty');
  return json.text;
}

let current: HTMLAudioElement | null = null;
let ttsCheck: Promise<boolean> | null = null;
const groqTtsAvailable = () =>
  (ttsCheck ??= fetch('/api/tts').then((r) => r.json()).then((j: { available?: boolean }) => !!j.available).catch(() => false));
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
  stopSpeaking();
  speaking = true;
  try {
    await speakInner(text, opts);
  } finally {
    speaking = false;
  }
}

async function speakInner(text: string, opts: { language: Language; rate?: number; voiceURI?: string }): Promise<void> {
  // Groq's TTS models are English-only; Hindi always uses the device voice.
  if (opts.language === 'en' && (await groqTtsAvailable())) {
    try {
      const res = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }) });
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
  await new Promise<void>((resolve) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = opts.language === 'hi' ? 'hi-IN' : 'en-IN';
    u.rate = opts.rate ?? 1;
    const voice = speechSynthesis.getVoices().find((v) => (opts.voiceURI ? v.voiceURI === opts.voiceURI : v.lang.startsWith(u.lang.slice(0, 2))));
    if (voice) u.voice = voice;
    u.onend = u.onerror = () => resolve();
    speechSynthesis.speak(u);
  });
}

/** Speaks a reply one sentence at a time, so speech starts sooner and barge-in can stop it between sentences (FR-41). */
export async function speakSentences(text: string, opts: { language: Language; rate?: number; voiceURI?: string }, shouldStop: () => boolean) {
  const sentences = text.match(/[^.!?।]+[.!?।]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];
  for (const s of sentences) {
    if (shouldStop()) return;
    await speak(s, opts);
  }
}
