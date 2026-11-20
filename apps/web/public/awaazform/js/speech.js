// Browser speech wrappers. Speech-to-text uses the Web Speech API (Chrome / Edge).
// The spec's Whisper backend can replace listen() later without touching the UI.

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;

export const speechInputSupported = !!SR;
export const speechOutputSupported = 'speechSynthesis' in window;

// Resolves with { text, confidence } (confidence 0..1) or rejects with { code }.
export function listen(lang) {
  return new Promise((resolve, reject) => {
    if (!SR) return reject({ code: 'unsupported' });
    recognizer = new SR();
    recognizer.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognizer.continuous = false;

    let finished = false;
    recognizer.onresult = (e) => {
      finished = true;
      const alt = e.results[0][0];
      resolve({
        text: alt.transcript.trim(),
        confidence: typeof alt.confidence === 'number' && alt.confidence > 0 ? alt.confidence : 1,
      });
    };
    recognizer.onerror = (e) => {
      finished = true;
      reject({ code: e.error });
    };
    recognizer.onend = () => {
      recognizer = null;
      if (!finished) reject({ code: 'no-speech' });
    };
    recognizer.start();
  });
}

export function stopListening() {
  try { recognizer?.stop(); } catch { /* already stopped */ }
}

// Returns true if a voice for the language exists on this computer.
export function speak(text, lang, { onStart, onEnd } = {}) {
  if (!speechOutputSupported) { onEnd?.(); return false; }
  window.speechSynthesis.cancel();

  const tag = lang === 'hi' ? 'hi-IN' : 'en-IN';
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang.replace('_', '-').toLowerCase() === tag.toLowerCase()) ||
    voices.find((v) => v.lang.toLowerCase().startsWith(lang));

  const u = new SpeechSynthesisUtterance(text);
  u.lang = tag;
  if (voice) u.voice = voice;
  u.rate = 0.92;
  u.pitch = 1.05;
  u.onstart = () => onStart?.();
  u.onend = () => onEnd?.();
  u.onerror = () => onEnd?.();
  window.speechSynthesis.speak(u);
  return !!voice;
}
