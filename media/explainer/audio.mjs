// Builds the soundtrack and the shared timeline for the explainer.
// - Places each narration line, estimates phrase times (for animation cues), and computes a mouth envelope (lip sync).
// - Synthesizes a soft music bed (ducked under speech) and small UI sound effects.
// Output: audio/master.wav (48 kHz stereo) and timeline.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = JSON.parse(fs.readFileSync(path.join(here, 'script.json'), 'utf8').replace(/^﻿/, '')); // PowerShell 5 writes a BOM
const SR = 48000, FPS = 30;

// ---------- WAV I/O ----------
function readWav(file) {
  const b = fs.readFileSync(file);
  let off = 12, fmt, data;
  while (off < b.length) {
    const id = b.toString('ascii', off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(off + 10), sr: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    if (id === 'data') data = b.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  if (!fmt || !data || fmt.bits !== 16) throw new Error(`Unsupported WAV ${file}`);
  const n = data.length / 2 / fmt.ch, mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let c = 0; c < fmt.ch; c++) s += data.readInt16LE((i * fmt.ch + c) * 2);
    mono[i] = s / fmt.ch / 32768;
  }
  // Linear resample to 48 kHz.
  const ratio = fmt.sr / SR, out = new Float32Array(Math.floor(n / ratio));
  for (let i = 0; i < out.length; i++) {
    const x = i * ratio, i0 = Math.floor(x), f = x - i0;
    out[i] = (mono[i0] ?? 0) * (1 - f) + (mono[i0 + 1] ?? 0) * f;
  }
  // Trim leading/trailing silence so gaps are under our control.
  const thr = 0.006;
  let a = 0, z = out.length - 1;
  while (a < z && Math.abs(out[a]) < thr) a++;
  while (z > a && Math.abs(out[z]) < thr) z--;
  return out.subarray(Math.max(0, a - 480), Math.min(out.length, z + 2400));
}

function writeWav(file, L, R) {
  const n = L.length, buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

// ---------- Timeline ----------
// Extra time after a line so the visuals can finish (seconds).
const HOLD = { intro: 0.35, problem: 0.4, idea: 0.7, loop: 0.9, ask: 0.3, answer: 0.4, readback: 1.6, timeline: 0.6, pdf: 1.5, live: 0.8, safety: 0.7, access: 0.9, outro: 2.4 };
const SCENE_OF = { intro: 'intro', problem: 'problem', idea: 'idea', loop: 'loop', ask: 'demo', answer: 'demo', readback: 'demo', timeline: 'timeline', pdf: 'pdf', live: 'live', safety: 'safety', access: 'access', outro: 'outro' };

let t = 1.4; // robot pops in first
const lines = [];
for (const l of script.lines) {
  const pcm = readWav(path.join(here, 'audio', `${l.id}.wav`));
  const dur = pcm.length / SR;
  lines.push({ ...l, start: t, end: t + dur, pcm });
  t += dur + (HOLD[l.id] ?? 0.6);
}
const total = t;

const scenes = [];
for (const l of lines) {
  const id = SCENE_OF[l.id];
  const last = scenes[scenes.length - 1];
  if (last?.id === id) last.lineEnd = l.end;
  else scenes.push({ id, start: l.start - (scenes.length ? 0.45 : 1.4), lineStart: l.start, lineEnd: l.end });
}
scenes.forEach((s, i) => { s.end = scenes[i + 1]?.start ?? total; });

/** Estimated time a phrase is spoken: proportional to its character offset in the line. */
function at(id, phrase) {
  const l = lines.find((x) => x.id === id);
  const idx = l.text.indexOf(phrase);
  if (idx < 0) throw new Error(`Phrase not found: ${phrase}`);
  return +(l.start + (l.end - l.start) * (idx / l.text.length)).toFixed(3);
}

const cues = {
  problem: { tiny: at('problem', 'tiny boxes'), words: at('problem', 'confusing words'), typing: at('problem', 'lots of typing'), see: at('problem', "can't see"), type: at('problem', "can't type"), hindi: at('problem', 'Hindi') },
  idea: { talking: at('idea', 'just by talking'), voice: at('idea', 'Your voice'), form: at('idea', 'Your form'), access: at('idea', 'Your access') },
  loop: { listen: at('loop', 'I listen'), write: at('loop', 'I write down'), check: at('loop', 'I check'), read: at('loop', 'I read it back'), yes: at('loop', 'Nothing is filled') },
  demo: {
    ask: lines.find((l) => l.id === 'ask').start, answer: lines.find((l) => l.id === 'answer').start, answerEnd: lines.find((l) => l.id === 'answer').end,
    readback: lines.find((l) => l.id === 'readback').start, isRight: at('readback', 'is this right'),
    confirm: at('readback', 'When you confirm'), type: at('readback', 'watch me type'), verify: at('readback', 'double check'),
  },
  pdf: { upload: at('pdf', 'Upload it'), local: at('pdf', 'It never leaves'), find: at('pdf', 'I find the questions'), nudge: at('pdf', 'you nudge'), fill: at('pdf', 'I fill it in'), tick: at('pdf', 'I even tick') },
  live: { on: at('live', 'Turn on Live Mode'), yes: at('live', 'Say yes'), next: at('live', 'next to move on'), interrupt: at('live', 'interrupt me') },
  safety: { device: at('safety', 'stay on your device'), lock: at('safety', 'locked with'), passwords: at('safety', 'I never fill passwords'), submit: at('safety', 'I never press submit'), yours: at('safety', 'That choice') },
  access: { big: at('access', 'Big buttons'), contrast: at('access', 'high contrast'), large: at('access', 'large text'), hindi: at('access', 'Hindi'), keyboard: at('access', 'full keyboard'), everyone: at('access', 'Built for everyone') },
  outro: { voice: at('outro', 'Your voice'), form: at('outro', 'Your form'), access: at('outro', 'Your access'), bye: at('outro', 'Bye') },
};

// ---------- Mix ----------
const N = Math.ceil(total * SR);
const L = new Float32Array(N), R = new Float32Array(N), voice = new Float32Array(N);
for (const l of lines) {
  const o = Math.floor(l.start * SR);
  for (let i = 0; i < l.pcm.length && o + i < N; i++) voice[o + i] += l.pcm[i] * (l.voice === 'user' ? 0.95 : 1);
}

// Voice envelope (for ducking and lip sync).
const env = new Float32Array(N);
let e = 0;
for (let i = 0; i < N; i++) {
  const v = Math.abs(voice[i]);
  e = v > e ? e + (v - e) * 0.02 : e + (v - e) * 0.0004;
  env[i] = e;
}

// Music bed: Cmaj9 – Am9 – Fmaj9 – G6 pads with a gentle plucked arpeggio. Quiet, ducked under speech.
const midi = (m) => 440 * 2 ** ((m - 69) / 12);
const CHORDS = [[48, 55, 59, 62, 64], [45, 52, 55, 59, 60], [41, 48, 52, 55, 57], [43, 50, 55, 57, 59]];
const BAR = 4.0;
for (let i = 0; i < N; i++) {
  const ts = i / SR;
  const ci = Math.floor(ts / BAR) % CHORDS.length, local = ts % BAR;
  const chord = CHORDS[ci];
  const fadeIn = Math.min(1, ts / 2.5), fadeOut = Math.min(1, (total - ts) / 3);
  const swell = Math.min(1, local / 0.8) * (0.85 + 0.15 * Math.cos((local / BAR) * Math.PI * 2));
  let pad = 0;
  chord.forEach((m, k) => {
    const f = midi(m);
    pad += Math.sin(2 * Math.PI * f * ts + k) * 0.5 + Math.sin(2 * Math.PI * f * 2.003 * ts) * 0.08;
  });
  pad *= 0.016 * swell;
  // Arpeggio: 8th notes at 100 bpm.
  const step = 0.3, si = Math.floor(ts / step), sl = ts - si * step;
  const note = chord[(si * 3) % chord.length] + 12;
  const pluck = Math.sin(2 * Math.PI * midi(note) * ts) * Math.exp(-sl * 9) * 0.022;
  const duck = 1 - Math.min(0.62, env[i] * 9);
  const m = (pad + pluck) * fadeIn * fadeOut * duck;
  const pan = Math.sin(ts * 0.7) * 0.25;
  L[i] = voice[i] * 0.92 + m * (1 - pan);
  R[i] = voice[i] * 0.92 + m * (1 + pan);
}

// Sound effects.
function sfx(time, kind) {
  const o = Math.floor(time * SR);
  const len = Math.floor(SR * (kind === 'whoosh' ? 0.45 : 0.25));
  let seed = 7;
  for (let i = 0; i < len && o + i < N; i++) {
    const s = i / SR;
    let v = 0;
    if (kind === 'pop') v = Math.sin(2 * Math.PI * (500 + 900 * s * 4) * s) * Math.exp(-s * 28) * 0.18;
    if (kind === 'click') v = Math.sin(2 * Math.PI * 1800 * s) * Math.exp(-s * 90) * 0.2;
    if (kind === 'ding') v = (Math.sin(2 * Math.PI * 1318.5 * s) + 0.5 * Math.sin(2 * Math.PI * 1975.5 * s)) * Math.exp(-s * 9) * 0.1;
    if (kind === 'whoosh') {
      seed = (seed * 16807) % 2147483647;
      const noise = (seed / 2147483647) * 2 - 1;
      v = noise * Math.sin((Math.PI * s) / 0.45) ** 2 * 0.05;
    }
    L[o + i] += v; R[o + i] += v;
  }
}
const sfxList = [];
const add = (time, kind) => { sfx(time, kind); sfxList.push({ t: +time.toFixed(3), kind }); };
add(0.35, 'pop');
scenes.slice(1).forEach((s) => add(s.start + 0.05, 'whoosh'));
Object.values(cues.loop).forEach((x) => add(x, 'pop'));
add(cues.demo.confirm + 0.15, 'click');
add(cues.demo.verify + 0.2, 'ding');
add(cues.pdf.tick + 0.3, 'click');
add(cues.safety.lock, 'click');
add(cues.outro.bye, 'pop');

// Gentle limiter.
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const g = peak > 0.95 ? 0.95 / peak : 1;
if (g !== 1) for (let i = 0; i < N; i++) { L[i] *= g; R[i] *= g; }
writeWav(path.join(here, 'audio', 'master.wav'), L, R);

// Mouth openness per video frame, only while Bolu is speaking.
const frames = Math.ceil(total * FPS);
const mouth = [];
for (let f = 0; f < frames; f++) {
  const tt = f / FPS;
  const speaking = lines.find((l) => l.voice === 'bolu' && tt >= l.start && tt <= l.end);
  const i = Math.min(N - 1, Math.floor(tt * SR));
  mouth.push(speaking ? +Math.min(1, env[i] * 14).toFixed(3) : 0);
}

const timeline = {
  fps: FPS, duration: +total.toFixed(3),
  lines: lines.map(({ id, voice: v, text, start, end }) => ({ id, voice: v, text, start: +start.toFixed(3), end: +end.toFixed(3) })),
  scenes: scenes.map((s) => ({ ...s, start: +s.start.toFixed(3), end: +s.end.toFixed(3), lineStart: +s.lineStart.toFixed(3), lineEnd: +s.lineEnd.toFixed(3) })),
  cues, sfx: sfxList, mouth,
};
fs.writeFileSync(path.join(here, 'timeline.json'), JSON.stringify(timeline));
console.log(`Duration ${total.toFixed(1)}s, ${frames} frames, peak gain ${g.toFixed(2)}`);
for (const s of timeline.scenes) console.log(`  ${s.id.padEnd(9)} ${s.start.toFixed(1).padStart(6)} → ${s.end.toFixed(1)}`);
