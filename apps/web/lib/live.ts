'use client';

// Live Mode listener (FR-40, FR-42): energy-based voice activity detection on the Web Audio API.
// No model download and nothing leaves the browser until an utterance ends. It adapts to background
// noise, so it works in ordinary rooms; in very noisy places, push-to-talk is more reliable.

export interface LiveCallbacks {
  onSpeechStart: () => void;
  onUtterance: (audio: Blob) => void;
  onLevel?: (level: number) => void;
}

const FRAME_MS = 30;
const START_MS = 150;     // sustained speech needed to count as speech (ignores clicks)
const END_SILENCE_MS = 800;
const MIN_UTTERANCE_MS = 400;
const MAX_UTTERANCE_MS = 15_000;

export class LiveListener {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private floor = 0.01;
  private speechMs = 0;
  private silenceMs = 0;
  private inSpeech = false;
  private startedAt = 0;
  private paused = false;
  private boost = 1;

  constructor(private cb: LiveCallbacks) {}

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    this.ctx = new AudioContext();
    const src = this.ctx.createMediaStreamSource(this.stream);
    const analyser = this.ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    this.timer = setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += v * v;
      const rms = Math.sqrt(sum / buf.length);
      this.cb.onLevel?.(Math.min(1, rms / 0.1));
      this.frame(rms);
    }, FRAME_MS);
  }

  /** While paused (e.g. waiting for the AI), speech is ignored but levels still update. */
  setPaused(p: boolean) {
    this.paused = p;
    if (p) this.abortUtterance();
  }

  /** While AwaazForm is speaking, need louder speech to count as barge-in (reduces echo self-triggers). */
  setBoost(b: number) {
    this.boost = b;
  }

  private frame(rms: number) {
    const threshold = Math.max(this.floor * 3, 0.015) * this.boost;
    const loud = rms > threshold;
    if (!this.inSpeech && !loud) this.floor = this.floor * 0.95 + rms * 0.05; // track background noise
    if (this.paused) return;

    if (loud) {
      this.silenceMs = 0;
      this.speechMs += FRAME_MS;
      // Start recording on the first loud frame so the onset isn't lost; confirm it after START_MS.
      if (!this.rec) this.beginRecording();
      if (!this.inSpeech && this.speechMs >= START_MS) {
        this.inSpeech = true;
        this.startedAt = Date.now() - this.speechMs;
        this.cb.onSpeechStart();
      }
    } else if (this.inSpeech) {
      this.silenceMs += FRAME_MS;
      if (this.silenceMs >= END_SILENCE_MS) this.endUtterance();
    } else {
      this.speechMs = 0;
      if (this.rec && this.silenceMs === 0) this.abortUtterance(); // a blip, not speech
    }
    if (this.inSpeech && Date.now() - this.startedAt > MAX_UTTERANCE_MS) this.endUtterance();
  }

  private beginRecording() {
    if (!this.stream) return;
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
    this.rec = new MediaRecorder(this.stream, mime ? { mimeType: mime } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start();
  }

  private endUtterance() {
    const rec = this.rec;
    const duration = Date.now() - this.startedAt;
    this.reset();
    if (!rec) return;
    rec.onstop = () => {
      const blob = new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' });
      this.chunks = [];
      if (duration >= MIN_UTTERANCE_MS) this.cb.onUtterance(blob);
    };
    rec.stop();
  }

  private abortUtterance() {
    if (this.rec && this.rec.state !== 'inactive') {
      this.rec.onstop = null;
      this.rec.stop();
    }
    this.chunks = [];
    this.reset();
  }

  private reset() {
    this.rec = null;
    this.inSpeech = false;
    this.speechMs = 0;
    this.silenceMs = 0;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.abortUtterance();
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.ctx = null;
    this.stream = null;
  }
}
