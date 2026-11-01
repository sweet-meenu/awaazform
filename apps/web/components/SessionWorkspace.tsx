'use client';

import {
  canSave, parseVoiceCommand, SessionController, suggestCanonicalKey, ToolRunner,
  type CanonicalKey, type FieldWriter, type FormQuestion, type Profile, type Session, type ToolHost,
} from '@awaazform/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Dialog } from '@/components/Dialog';
import { EASE, Wave } from '@/components/Motion';
import { applyEvent, Timeline, type TimelineCard } from '@/components/Timeline';
import { AiUnavailable, assistantTurn, explainQuestion, fallbackExplanation, type ChatMsg } from '@/lib/assistant';
import { db, ensureDefaultProfile, saveValue } from '@/lib/db';
import { strings as i18n } from '@/lib/i18n';
import { LiveListener } from '@/lib/live';
import { saveSession } from '@/lib/session-store';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';
import { isUnlocked, onVaultChange, readValues, unlock } from '@/lib/vault';
import { isSpeaking, speak, speakSentences, startRecording, stopSpeaking, transcribe, VoiceError, voiceInputSupported } from '@/lib/voice';

type Offer =
  | { kind: 'use'; key: CanonicalKey; value: string; resolve?: (v: string | null) => void }
  | { kind: 'remember'; key: CanonicalKey; value: string; questionId: string; resolve?: (ok: boolean) => void };

type Busy = null | 'transcribing' | 'thinking' | 'filling';
type LiveState = 'off' | 'listening' | 'hearing' | 'thinking' | 'speaking';

const LIVE_CONSENT = 'awaazform.liveConsent';
const keyLabel = (k: CanonicalKey) => k.replace(/_/g, ' ');

export function displayValue(q: FormQuestion, v: string, lang: 'en' | 'hi'): string {
  if (q.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T00:00:00`).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return v;
}

export interface WorkspaceProps {
  initial: Session;
  storageKey: string;
  /** Resume straight into questions (e.g. a restored session). */
  startImmediately?: boolean;
  jumpTo?: number;
  sourceLabel: string;
  surfaceLabel: string;
  surface: ReactNode;
  surfaceRef: RefObject<SurfaceHandle | null>;
  /** Extra controls in the top bar, e.g. “Download PDF”. */
  actions?: ReactNode;
  /** Shown before the session starts, under the scan summary. */
  intro?: ReactNode;
  onDiscard: () => void;
}

export function SessionWorkspace(props: WorkspaceProps) {
  const { initial, storageKey, surfaceRef } = props;
  const { t, settings, reduceMotion } = useSettings();
  const lang = settings.language;

  const [session, setSession] = useState<Session>(initial);
  const [started, setStarted] = useState(!!props.startImmediately);
  const [cards, setCards] = useState<TimelineCard[]>([]);
  const [tab, setTab] = useState<'form' | 'activity'>('form');
  const [input, setInput] = useState('');
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [aiOn, setAiOn] = useState(true);
  const [readAloud, setReadAloud] = useState(true);
  const [live, setLive] = useState<LiveState>('off');
  const [level, setLevel] = useState(0);
  const [liveDialog, setLiveDialog] = useState(false);
  const [unlockDialog, setUnlockDialog] = useState(false);
  const [, setVaultTick] = useState(0);

  const ctlRef = useRef<SessionController | null>(null);
  const runnerRef = useRef<ToolRunner | null>(null);
  const recRef = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const liveRef = useRef<LiveListener | null>(null);
  const historyRef = useRef<ChatMsg[]>([]);
  /** Pending auto-advance; cancelled by any manual navigation so it can't yank the user away. */
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set when the user starts talking over AwaazForm, so the rest of a reply is dropped. */
  const bargedIn = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => void ensureDefaultProfile(), []);
  useEffect(() => onVaultChange(() => setVaultTick((n) => n + 1)), []);
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []) ?? [];
  const profile: Profile | undefined = profiles.find((p) => p.id === session.profileId) ?? profiles[0];
  const locked = !!profile && !isUnlocked(profile);

  // Latest values for callbacks created once (controller host, live listener).
  const latest = useRef({ settings, readAloud, profile, aiOn, t, live });
  latest.current = { settings, readAloud, profile, aiOn, t, live };

  const voiceOpts = () => ({ language: latest.current.settings.language, rate: latest.current.settings.speechRate, voiceURI: latest.current.settings.voiceURI });

  /** Speaks (if read-aloud is on). `show` puts the words in the assistant bubble. */
  const say = useCallback(async (text: string, show = false) => {
    if (show) setBubble(text);
    if (!latest.current.readAloud && latest.current.live === 'off') return;
    if (latest.current.live !== 'off') {
      setLive('speaking');
      bargedIn.current = false;
      liveRef.current?.setBoost(2.5);
      await speakSentences(text, voiceOpts(), () => bargedIn.current);
      liveRef.current?.setBoost(1);
      setLive((s) => (s === 'off' ? 'off' : 'listening'));
      return;
    }
    await speak(text, voiceOpts());
  }, []);

  const savedValue = useCallback(async (key: CanonicalKey): Promise<string | null> => {
    const p = latest.current.profile;
    if (!p?.fields[key]) return null;
    const values = await readValues(p);
    return values?.[key] ?? null;
  }, []);

  // ---- Controller, runner and surface wiring (once) ----
  useEffect(() => {
    // Writes go to whatever surface is mounted, looked up at call time.
    const writer: FieldWriter = {
      write: (q, v) => (surfaceRef.current ? surfaceRef.current.write(q, v) : Promise.reject(new Error('The form is not ready'))),
      read: (q) => (surfaceRef.current ? surfaceRef.current.read(q) : Promise.resolve(null)),
    };
    const ctl = new SessionController(initial, writer);
    ctlRef.current = ctl;

    const host: ToolHost = {
      ask: async (_q, text) => void (await say(text, true)),
      readBack: async (q, v) => void (await say(`${displayValue(q, v, latest.current.settings.language)}. ${i18n[latest.current.settings.language].is_this_right}`)),
      explain: async (q) => fallbackExplanation(q),
      highlight: async (q) => surfaceRef.current?.focus(q),
      requestProfileUse: async (key) => {
        const v = await savedValue(key);
        if (!v) return null;
        ctl.emit({ type: 'profile.offered', key });
        return new Promise((resolve) => setOffer({ kind: 'use', key, value: v, resolve }));
      },
      offerSave: (key, value, q) =>
        new Promise((resolve) => {
          if (!canSave(key, q.label)) return resolve(false);
          setOffer({ kind: 'remember', key, value, questionId: q.id, resolve });
        }),
    };
    runnerRef.current = new ToolRunner(ctl, host);

    const offEvent = ctl.onEvent((e) => {
      setCards((c) => applyEvent(c, e, ctl.session.questions));
      surfaceRef.current?.onEvent(e);
    });
    const offState = ctl.onState((s) => {
      setSession(s);
      saveSession(s, storageKey);
    });
    surfaceRef.current?.sync(ctl.session, reduceMotion);
    if (props.jumpTo !== undefined) ctl.goto(props.jumpTo);

    return () => {
      offEvent();
      offState();
      recRef.current?.cancel();
      liveRef.current?.stop();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => surfaceRef.current?.setReduceMotion(reduceMotion), [reduceMotion, surfaceRef]);

  const ctl = ctlRef.current;
  const q = session.questions[session.currentIndex];
  const answer = q ? session.answers[q.id] : undefined;

  // ---- Presenting a question ----
  const present = useCallback(async (index: number) => {
    const c = ctlRef.current;
    if (!c) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    stopSpeaking();
    historyRef.current = [];
    setOffer(null);
    setInput('');
    setNotice(null);
    setBubble(null);
    c.goto(index);
    const cq = c.session.questions[c.session.currentIndex]!;
    const a = c.session.answers[cq.id]!;
    const tt = latest.current.t;
    const parts = [cq.label, cq.required ? '' : `(${tt.optional})`];
    if (cq.options?.length && cq.type !== 'yesno') parts.push(`${cq.options.join(', ')}.`);
    if (cq.support === 'unsupported') parts.push(tt.not_supported);
    setTimeout(() => inputRef.current?.focus(), 60);

    const key = suggestCanonicalKey(cq);
    const fresh = a.status === 'pending' || a.status === 'invalid';
    const saved = key && fresh && cq.support !== 'unsupported' ? await savedValue(key) : null;
    if (key && saved) {
      c.emit({ type: 'profile.offered', key });
      setOffer({ kind: 'use', key, value: saved });
      parts.push(tt.use_saved(keyLabel(key), displayValue(cq, saved, latest.current.settings.language)));
    }
    void say(parts.filter(Boolean).join(' '));
  }, [say, savedValue]);

  const start = () => {
    setStarted(true);
    void present(ctlRef.current?.session.currentIndex ?? 0);
  };

  const advance = useCallback(() => {
    const c = ctlRef.current;
    if (!c) return;
    const i = c.session.currentIndex;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    if (i < c.session.questions.length - 1) {
      advanceTimer.current = setTimeout(() => {
        // Only advance if the user is still on the question they just finished.
        if (ctlRef.current?.session.currentIndex === i) void present(i + 1);
      }, reduceMotion ? 0 : 700);
    }
    else void say(`${latest.current.t.readiness}. ${latest.current.t.never_submit}`, true);
  }, [present, reduceMotion, say]);

  // ---- Answering ----
  const readBackProposal = useCallback(async (question: FormQuestion) => {
    const a = ctlRef.current?.session.answers[question.id];
    if (a?.status === 'proposed' && a.normalized) {
      await say(`${displayValue(question, a.normalized, latest.current.settings.language)}. ${latest.current.t.is_this_right}`);
    } else if (a?.status === 'invalid' && a.error) {
      await say(a.error);
    }
  }, [say]);

  const submit = useCallback(async (raw: string, source: 'typed' | 'spoken') => {
    const c = ctlRef.current, runner = runnerRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !runner || !cq || !raw.trim()) return;
    if (cq.support === 'unsupported') return setNotice(latest.current.t.not_supported);
    setOffer(null);
    setBubble(null);

    if (source === 'spoken' && latest.current.aiOn) {
      setBusy('thinking');
      // FR-43: a spoken holding line if the AI takes a while.
      const hold = latest.current.live !== 'off' ? setTimeout(() => void speak(latest.current.settings.language === 'hi' ? 'एक पल' : 'One moment', voiceOpts()), 1500) : null;
      try {
        const { reply, history } = await assistantTurn(
          { ctl: c, runner, profileLabel: latest.current.profile?.label ?? 'Me', language: latest.current.settings.language },
          historyRef.current, raw,
        );
        historyRef.current = history;
        if (hold) clearTimeout(hold);
        setBusy(null);
        if (c.session.answers[cq.id]?.status === 'proposed') return void (await readBackProposal(cq));
        if (reply) return void (await say(reply, true));
      } catch (err) {
        if (hold) clearTimeout(hold);
        if (err instanceof AiUnavailable) {
          setAiOn(false);
          setNotice(`${latest.current.t.ai_unavailable} (${err.message})`);
        }
      } finally {
        setBusy(null);
      }
    }
    // Deterministic path: typed answers, or AI unavailable.
    c.propose(cq.id, raw, source);
    await readBackProposal(cq);
  }, [readBackProposal, say]);

  const confirm = useCallback(async () => {
    const c = ctlRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !cq) return;
    setBusy('filling');
    await c.confirm(cq.id);
    setBusy(null);
    const a = c.session.answers[cq.id];
    if (a?.status !== 'verified') return void say(a?.error ?? "Didn't take. Retry or tell me", true);

    const key = suggestCanonicalKey(cq);
    const p = latest.current.profile;
    const current = key ? await savedValue(key) : null;
    if (key && a.normalized && current !== a.normalized && canSave(key, cq.label) && p && isUnlocked(p)) {
      setOffer({ kind: 'remember', key, value: a.normalized, questionId: cq.id });
      void say(latest.current.t.remember);
      return;
    }
    advance();
  }, [advance, say, savedValue]);

  const decideOffer = useCallback(async (yes: boolean) => {
    const c = ctlRef.current;
    const o = offerRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!o || !c || !cq) return;
    setOffer(null);
    if (o.kind === 'use') {
      if (o.resolve) return o.resolve(yes ? o.value : null); // AI asked: the runner proposes next
      if (yes) {
        c.propose(cq.id, o.value, 'profile');
        await readBackProposal(cq);
      }
      return;
    }
    let ok = false;
    const p = latest.current.profile;
    if (yes && p) {
      try {
        const qq = c.session.questions.find((x) => x.id === o.questionId)!;
        await saveValue(p.id, o.key, o.value, qq.label, c.session.formTitle);
        c.emit({ type: 'profile.saved', key: o.key });
        ok = true;
      } catch (err) {
        setNotice((err as Error).message);
      }
    }
    o.resolve?.(ok);
    if (!o.resolve) advance();
  }, [advance, readBackProposal]);
  const offerRef = useRef(offer);
  offerRef.current = offer;

  const explain = useCallback(async () => {
    const c = ctlRef.current, runner = runnerRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !runner || !cq) return;
    setBusy('thinking');
    const text = latest.current.aiOn
      ? await explainQuestion({ ctl: c, runner, profileLabel: latest.current.profile?.label ?? 'Me', language: latest.current.settings.language }, cq)
      : fallbackExplanation(cq);
    setBusy(null);
    void say(text, true);
  }, [say]);

  // ---- Push-to-talk ----
  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      setBusy('transcribing');
      try {
        const text = await recRef.current!.stop();
        setInput(text);
        setBusy(null);
        await submit(text, 'spoken');
      } catch (err) {
        setBusy(null);
        const e = err as VoiceError;
        setNotice(e.kind === 'ai' ? `${t.ai_unavailable} (${e.message})` : e.message);
      }
      return;
    }
    stopSpeaking();
    try {
      recRef.current = await startRecording(lang);
      if (q) ctl?.listening(q.id);
      setRecording(true);
      setNotice(null);
    } catch (err) {
      setNotice(`${t.voice_unavailable} (${(err as Error).message})`);
    }
  };

  // ---- Live Mode (FR-39 – FR-45) ----
  const handleLiveText = useCallback(async (text: string) => {
    const c = ctlRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !cq) return;
    setInput(text);
    const cmd = parseVoiceCommand(text);
    const a = c.session.answers[cq.id];
    const o = offerRef.current;

    // Spoken yes/no answers an open prompt first. The decision is made here in code, not by the model.
    if (o && (cmd === 'confirm' || cmd === 'reject')) return decideOffer(cmd === 'confirm');
    if (a?.status === 'proposed' && cmd === 'confirm') return confirm();
    if (a?.status === 'proposed' && cmd === 'reject') { c.edit(cq.id); return void say(latest.current.settings.language === 'hi' ? 'ठीक है, फिर से बताइए।' : 'Okay, please say it again.', true); }
    if (a?.status === 'confirmed' && a.error && cmd === 'confirm') return c.retry(cq.id);
    switch (cmd) {
      case 'repeat': return a?.status === 'proposed' ? readBackProposal(cq) : present(c.session.currentIndex);
      case 'next': return present(c.session.currentIndex + 1);
      case 'previous': return present(c.session.currentIndex - 1);
      case 'skip': if (!cq.required && c.skip(cq.id)) advance(); return;
      case 'explain': return explain();
      case 'stop': return stopLive();
    }
    // A plain "yes"/"no" to a yes/no question is an answer, not a confirmation.
    return submit(text, 'spoken');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advance, confirm, decideOffer, explain, present, readBackProposal, say, submit]);

  const startLive = async () => {
    if (!aiOn) return setNotice(t.ai_unavailable);
    if (!voiceInputSupported()) return setNotice(t.voice_unavailable);
    stopSpeaking();
    const listener = new LiveListener({
      onSpeechStart: () => {
        if (isSpeaking()) {
          bargedIn.current = true; // FR-42 barge-in
          stopSpeaking();
        }
        setLive('hearing');
      },
      onUtterance: async (blob) => {
        listener.setPaused(true);
        setLive('thinking');
        try {
          const text = await transcribe(blob, latest.current.settings.language);
          await handleLiveRef.current(text);
        } catch (err) {
          const e = err as VoiceError;
          if (e.kind === 'ai') { setNotice(`${t.ai_unavailable} (${e.message})`); stopLive(); return; }
        } finally {
          listener.setPaused(false);
          setLive((s) => (s === 'off' ? 'off' : 'listening'));
        }
      },
      onLevel: setLevel,
    });
    try {
      await listener.start();
    } catch {
      return setNotice(t.voice_unavailable);
    }
    liveRef.current = listener;
    setLive('listening');
    if (!started) start();
    else void present(session.currentIndex);
  };
  const handleLiveRef = useRef(handleLiveText);
  handleLiveRef.current = handleLiveText;

  const stopLive = () => {
    liveRef.current?.stop();
    liveRef.current = null;
    stopSpeaking();
    setLive('off');
    setLevel(0);
  };

  const toggleLive = () => {
    if (live !== 'off') return stopLive();
    if (localStorage.getItem(LIVE_CONSENT) === 'yes') void startLive();
    else setLiveDialog(true);
  };

  // ---- Derived UI state ----
  const counts = useMemo(() => {
    const qs = session.questions;
    const verified = Object.values(session.answers).filter((a) => a.status === 'verified').length;
    return {
      total: qs.length,
      fillable: qs.filter((x) => x.support !== 'unsupported').length,
      supported: qs.filter((x) => x.support === 'supported').length,
      review: qs.filter((x) => x.support === 'limited' || x.support === 'manual').length,
      unsupported: qs.filter((x) => x.support === 'unsupported').length,
      required: qs.filter((x) => x.required).length,
      verified,
    };
  }, [session]);

  const stepState = (x: FormQuestion) => {
    const a = session.answers[x.id];
    if (x.support === 'unsupported') return 'unsupported';
    if (a?.status === 'verified') return 'verified';
    if (a?.status === 'proposed') return 'proposed';
    if (a?.status === 'invalid' || (a?.status === 'confirmed' && a.error)) return 'problem';
    return 'todo';
  };

  const pct = counts.fillable ? Math.round((counts.verified / counts.fillable) * 100) : 0;

  return (
    <div className="container-x py-6">
      {/* ---- Top bar ---- */}
      <div className="card mb-6 grid gap-4 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{props.sourceLabel}</p>
            <h1 className="truncate text-xl md:text-2xl">{session.formTitle}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* FR-37: whose details these are, always visible */}
            <label className="flex items-center gap-2 rounded-[var(--r-12)] border border-line bg-surface py-1 pr-1 pl-3 text-sm">
              <span className="text-muted">{t.filling_for}</span>
              <select className="min-h-11 rounded-lg bg-transparent px-2 font-semibold" value={session.profileId} disabled={started}
                onChange={(e) => ctl?.setProfile(e.target.value)} aria-describedby="owner-hint">
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.label}{p.encrypted ? ' 🔒' : ''}</option>)}
              </select>
            </label>
            <span id="owner-hint" className="sr-only">{started ? 'The profile cannot be changed after the session starts.' : ''}</span>
            {locked && (
              <button type="button" className="btn btn-ghost" onClick={() => setUnlockDialog(true)}>🔒 Unlock saved details</button>
            )}
            <button type="button" className="btn-quiet" aria-pressed={readAloud} onClick={() => { setReadAloud(!readAloud); if (readAloud) stopSpeaking(); }} title="Read aloud">
              <SpeakerIcon muted={!readAloud} /> <span className="hidden lg:inline">Read aloud</span>
            </button>
            <button type="button" className={live !== 'off' ? 'btn' : 'btn btn-ghost'} aria-pressed={live !== 'off'} onClick={toggleLive}>
              {live !== 'off' ? <Wave bars={4} /> : <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--red-600)' }} />}
              {t.live_mode}{live !== 'off' ? ': on' : ''}
            </button>
            {props.actions}
            <details className="menu">
              <summary className="btn-quiet" aria-label="More options">•••</summary>
              <div className="menu-panel">
                <Link href="/report" className="btn-quiet">{t.readiness}</Link>
                <Link href="/profiles" className="btn-quiet">Manage profiles</Link>
                <button type="button" className="btn-quiet" style={{ color: 'var(--red-600)' }}
                  onClick={() => window.confirm('Discard this session? Answers in this browser will be cleared. Saved profile details are kept.') && props.onDiscard()}>
                  {t.discard}
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Progress + stepper (replaces the long “still needed” list) */}
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="progress flex-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Answers verified"><i style={{ width: `${pct}%` }} /></div>
            <span className="font-medium whitespace-nowrap">{counts.verified} / {counts.fillable} verified</span>
          </div>
          {started && (
            <nav aria-label="Questions">
              <ol className="flex flex-wrap gap-3">
                {session.questions.map((x, i) => (
                  <li key={x.id}>
                    <button type="button" className="step-dot" data-state={stepState(x)} aria-current={i === session.currentIndex ? 'step' : undefined}
                      aria-label={`Question ${i + 1}: ${x.label}. ${stepState(x) === 'todo' ? (x.required ? 'required, not answered' : 'not answered') : stepState(x)}`}
                      title={x.label} onClick={() => void present(i)}>
                      {stepState(x) === 'verified' ? '✓' : i + 1}
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          )}
        </div>
      </div>

      {notice && (
        <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-[var(--r-12)] border px-4 py-3 text-sm" style={{ borderColor: 'var(--amber-700)', background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
          <span>{notice}</span>
          <button type="button" className="btn-quiet !min-h-0 !p-0 underline" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---- Conversation ---- */}
        <div className="grid gap-4 lg:sticky lg:top-24">
          {!started ? (
            <ScanSummary counts={counts} questions={session.questions} profileLabel={profile?.label ?? 'Me'} onStart={start} intro={props.intro} />
          ) : q && answer ? (
            <section aria-labelledby="q-label" className="card grid gap-5 p-6 md:p-7">
              <div className="flex items-center justify-between gap-2 text-sm text-muted">
                <span>{t.question_of(session.currentIndex + 1, session.questions.length)}</span>
                <span className="flex gap-1.5">
                  <span className={`chip ${q.required ? 'chip-accent' : ''}`}>{q.required ? t.required : t.optional}</span>
                  {q.support !== 'supported' && <span className="chip chip-warn">{q.support === 'unsupported' ? 'Fill yourself' : 'Check yourself'}</span>}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} className="grid gap-2">
                  <h2 id="q-label" className="text-[1.75rem] leading-tight">{q.label}</h2>
                  {q.helpText && <p className="text-muted">{q.helpText}</p>}
                  {q.options && q.type !== 'yesno' && (
                    <ul className="mt-1 flex flex-wrap gap-1.5" aria-label="Options">
                      {q.options.map((o) => <li key={o} className="chip !py-1 !text-sm">{o}</li>)}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>

              {q.support === 'unsupported' ? (
                <p className="rounded-[var(--r-12)] p-4 text-sm" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
                  {t.not_supported} {q.supportReason}
                </p>
              ) : offer ? (
                <OfferCard offer={offer} q={q} lang={lang} profileLabel={profile?.label ?? 'Me'} t={t} onDecide={decideOffer} reduceMotion={reduceMotion} />
              ) : answer.status === 'proposed' && answer.normalized ? (
                // Read-back + confirm gate (FR-15, FR-16)
                <motion.div role="group" aria-labelledby="rb-h" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="grid gap-4 rounded-[var(--r-16)] border-2 p-5" style={{ borderColor: 'var(--violet-300)', background: 'var(--violet-100)' }}>
                  <div>
                    <p id="rb-h" className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>{t.is_this_right}</p>
                    <p className="mt-1 text-2xl font-semibold break-words" aria-live="polite">{displayValue(q, answer.normalized, lang)}</p>
                    {answer.translated && <p className="mt-1 text-xs text-muted">You said: “{answer.raw}”</p>}
                    {answer.source === 'profile' && <p className="mt-1 text-xs text-muted">From your saved details</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-success btn-lg flex-1" onClick={confirm} disabled={busy === 'filling'}>✓ {t.confirm}</button>
                    <button type="button" className="btn btn-ghost btn-lg" onClick={() => { ctl?.edit(q.id); setInput(answer.raw); setTimeout(() => inputRef.current?.focus(), 30); }}>{t.edit}</button>
                  </div>
                </motion.div>
              ) : answer.status === 'verified' ? (
                <div className="flex items-center justify-between gap-3 rounded-[var(--r-16)] p-4" style={{ background: 'var(--green-100)', color: 'var(--green-600)' }}>
                  <span className="font-semibold break-words">✓ {displayValue(q, answer.normalized ?? '', lang)}</span>
                  <button type="button" className="btn-quiet !text-current underline" onClick={() => ctl?.edit(q.id)}>{t.edit}</button>
                </div>
              ) : answer.status === 'confirmed' && answer.error ? (
                <div className="grid gap-3 rounded-[var(--r-16)] p-4 text-sm" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
                  <span>{answer.error}</span>
                  <span className="flex gap-2">
                    <button type="button" className="btn" onClick={() => void ctl?.retry(q.id)}>{t.retry}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => ctl?.edit(q.id)}>{t.edit}</button>
                  </span>
                </div>
              ) : (
                <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); void submit(input, 'typed'); }}>
                  <label htmlFor="answer" className="sr-only">{t.your_answer}</label>
                  {live !== 'off' ? (
                    <LivePanel state={live} level={level} lang={lang} />
                  ) : null}
                  <div className="composer" data-invalid={answer.status === 'invalid'}>
                    <input id="answer" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={live !== 'off' ? 'Or type here' : t.type_answer}
                      autoComplete="off" maxLength={2000} aria-invalid={answer.status === 'invalid'} aria-describedby={answer.error ? 'answer-err' : undefined} />
                    {live === 'off' && (
                      <MicButton recording={recording} disabled={!voiceInputSupported() || (!!busy && !recording)} onClick={toggleRecording} label={recording ? t.stop : t.speak} />
                    )}
                    <button type="submit" className="grid h-11 w-11 flex-none place-items-center rounded-[var(--r-12)] disabled:opacity-40" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                      disabled={!input.trim() || !!busy} aria-label={t.send} title={t.send}>
                      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                  </div>
                  {answer.status === 'invalid' && answer.error && <p id="answer-err" className="text-sm font-medium" style={{ color: 'var(--red-600)' }}>{answer.error}</p>}
                  <p className="min-h-5 text-sm text-muted" aria-live="polite">
                    {recording ? <b style={{ color: 'var(--accent-text)' }}>{t.listening} Press the mic again when you finish.</b>
                      : busy === 'transcribing' ? t.transcribing : busy === 'thinking' ? 'Thinking…' : busy === 'filling' ? 'Filling…'
                      : live === 'off' ? 'Type, or press the mic and speak.' : ''}
                  </p>
                </form>
              )}

              {bubble && (
                <div className="bubble" role="status">
                  <span className="mb-1 block text-xs font-medium text-muted">AwaazForm</span>{bubble}
                </div>
              )}

              {/* One quiet toolbar instead of a wall of buttons */}
              <div role="toolbar" aria-label="Question controls" className="-mx-2 flex items-center justify-between gap-1 border-t border-line pt-3">
                <button type="button" className="btn-quiet" onClick={() => void present(session.currentIndex - 1)} disabled={session.currentIndex === 0}>← {t.prev}</button>
                <span className="flex gap-1">
                  <button type="button" className="btn-quiet" aria-label={t.repeat} onClick={() => (answer.status === 'proposed' ? void readBackProposal(q) : void present(session.currentIndex))}>↻ {t.repeat_short}</button>
                  <button type="button" className="btn-quiet" onClick={explain}>? {t.explain}</button>
                  {!q.required && answer.status !== 'verified' && answer.status !== 'skipped' && (
                    <button type="button" className="btn-quiet" onClick={() => { ctl?.skip(q.id); advance(); }}>{t.skip_q}</button>
                  )}
                </span>
                <button type="button" className="btn-quiet" onClick={() => void present(session.currentIndex + 1)} disabled={session.currentIndex >= session.questions.length - 1}>{t.next} →</button>
              </div>
            </section>
          ) : null}
        </div>

        {/* ---- Form / Activity ---- */}
        <section aria-label="Form and activity" className="grid gap-3">
          <div role="tablist" aria-label="View" className="tabbar">
            <button role="tab" id="tab-form" aria-controls="panel-form" aria-selected={tab === 'form'} onClick={() => setTab('form')}>{props.surfaceLabel}</button>
            <button role="tab" id="tab-activity" aria-controls="panel-activity" aria-selected={tab === 'activity'} onClick={() => setTab('activity')}>
              Activity {cards.length > 0 && <span className="chip ml-1 !px-2 !py-0">{cards.length}</span>}
            </button>
          </div>
          {/* The surface stays mounted when hidden, so writes and verification keep working. */}
          <div id="panel-form" role="tabpanel" aria-labelledby="tab-form" hidden={tab !== 'form'} className="card overflow-hidden p-0">
            {props.surface}
          </div>
          <div id="panel-activity" role="tabpanel" aria-labelledby="tab-activity" hidden={tab !== 'activity'}>
            <Timeline cards={cards} title={t.timeline} />
          </div>
          <p className="px-1 text-xs text-muted">{t.never_submit}</p>
        </section>
      </div>

      {/* Live Mode disclosure (§9.2) */}
      <Dialog open={liveDialog} onClose={() => setLiveDialog(false)} title="Turn on Live Mode?"
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={() => setLiveDialog(false)}>Not now</button>
          <button type="button" className="btn" onClick={() => { localStorage.setItem(LIVE_CONSENT, 'yes'); setLiveDialog(false); void startLive(); }}>Turn on</button>
        </>}>
        <p>Live Mode listens all the time, so you can just talk: answer, say <b>“yes”</b> to confirm, <b>“no”</b> to change it, or <b>“next”</b>, <b>“repeat”</b>, <b>“explain”</b>.</p>
        <p>It sends your voice to Groq to be transcribed, and your spoken messages and the current question to Groq to respond. Groq&apos;s retention rules apply. Audio is not stored by AwaazForm.</p>
        <p>You can turn it off at any time. Headphones help it not hear itself.</p>
      </Dialog>

      {profile && <UnlockDialog open={unlockDialog} onClose={() => setUnlockDialog(false)} profile={profile} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function OfferCard({ offer, q, lang, profileLabel, t, onDecide, reduceMotion }: {
  offer: Offer; q: FormQuestion; lang: 'en' | 'hi'; profileLabel: string; t: (typeof i18n)['en']; onDecide: (yes: boolean) => void; reduceMotion: boolean;
}) {
  return (
    <motion.div role="group" aria-labelledby="offer-h" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 rounded-[var(--r-16)] border p-5" style={{ borderColor: 'var(--violet-300)', background: 'var(--violet-100)' }}>
      <div>
        <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--accent-text)' }}>
          {offer.kind === 'use' ? `Saved for ${profileLabel}` : 'Remember for next time?'}
        </p>
        <p id="offer-h" className="mt-1 text-lg font-semibold break-words">
          {offer.kind === 'use'
            ? t.use_saved(keyLabel(offer.key), displayValue(q, offer.value, lang))
            : `Save “${displayValue(q, offer.value, lang)}” as ${profileLabel === 'Me' ? 'your' : `${profileLabel}'s`} ${keyLabel(offer.key)}?`}
        </p>
        {offer.kind === 'remember' && <p className="mt-1 text-xs text-muted">Stored in this browser only. You can delete it any time.</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-lg flex-1" onClick={() => onDecide(true)}>{t.yes}</button>
        <button type="button" className="btn btn-ghost btn-lg flex-1" onClick={() => onDecide(false)}>{t.no}</button>
      </div>
    </motion.div>
  );
}

function LivePanel({ state, level, lang }: { state: LiveState; level: number; lang: 'en' | 'hi' }) {
  const label: Record<LiveState, string> = lang === 'hi'
    ? { off: '', listening: 'सुन रहे हैं, बस बोलिए', hearing: 'सुन रहे हैं…', thinking: 'समझ रहे हैं…', speaking: 'बोल रहे हैं (बीच में बोल सकते हैं)' }
    : { off: '', listening: 'Listening. Just speak.', hearing: 'Hearing you…', thinking: 'Working on it…', speaking: 'Speaking (you can interrupt)' };
  return (
    <div className="flex items-center gap-4 rounded-[var(--r-16)] p-4" style={{ background: 'var(--ink-950)', color: '#fff' }} aria-live="polite">
      <span className="relative grid h-12 w-12 flex-none place-items-center rounded-full" style={{ background: 'var(--violet-500)' }}>
        <span aria-hidden className="absolute inset-0 rounded-full" style={{ transform: `scale(${1 + level * 0.6})`, background: 'rgba(171,159,244,0.35)', transition: 'transform 90ms linear' }} />
        <span className="relative"><Wave bars={4} active={state !== 'listening'} /></span>
      </span>
      <span className="text-sm font-medium">{label[state]}</span>
    </div>
  );
}

function ScanSummary({ counts, questions, profileLabel, onStart, intro }: {
  counts: { total: number; supported: number; review: number; unsupported: number; required: number };
  questions: FormQuestion[]; profileLabel: string; onStart: () => void; intro?: ReactNode;
}) {
  // FR-09: Compatibility Scanner
  return (
    <section aria-labelledby="scan-h" className="card grid gap-5 p-6 md:p-7">
      <div>
        <h2 id="scan-h" className="text-2xl">Ready when you are</h2>
        <p className="mt-1 text-muted">{counts.total} questions found. Here is what AwaazForm can fill.</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {([['Can fill', counts.supported, 'var(--green-600)'], ['Check yourself', counts.review, 'var(--amber-700)'], ['Fill yourself', counts.unsupported, 'var(--text-muted)']] as const).map(([l, n, c]) => (
          <div key={l} className="rounded-[var(--r-16)] border border-line bg-surface p-3">
            <dd className="font-display text-2xl font-semibold" style={{ color: c }}>{n}</dd>
            <dt className="text-xs text-muted">{l}</dt>
          </div>
        ))}
      </dl>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-medium">See all {counts.total} questions</summary>
        <ol className="grid gap-1.5 pt-1">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start justify-between gap-2">
              <span>{i + 1}. {q.label}{q.required && <span aria-label="required"> *</span>}</span>
              <span className={`chip flex-none ${q.support === 'supported' ? 'chip-ok' : q.support === 'unsupported' ? '' : 'chip-warn'}`}>
                {q.support === 'supported' ? 'can fill' : q.support === 'unsupported' ? 'fill yourself' : 'check yourself'}
              </span>
            </li>
          ))}
        </ol>
      </details>
      {intro}
      <div className="grid gap-2">
        <button type="button" className="btn btn-lg" onClick={onStart}>Start, filling for {profileLabel}</button>
        <p className="text-center text-xs text-muted">You can change who you are filling for at the top.</p>
      </div>
    </section>
  );
}

function UnlockDialog({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: Profile }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (await unlock(profile, pass)) { setPass(''); setError(null); onClose(); }
    else setError('That passphrase is not right.');
  };
  return (
    <Dialog open={open} onClose={onClose} title={`Unlock ${profile.label}'s saved details`}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="button" className="btn" onClick={submit} disabled={!pass}>Unlock</button>
      </>}>
      <p>Saved details stay locked until you enter the passphrase. They lock again when you reload the page.</p>
      <label className="grid gap-1.5">
        <span className="font-medium">Passphrase</span>
        <input type="password" className="field-input" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void submit()} autoComplete="current-password" aria-invalid={!!error} aria-describedby={error ? 'unlock-err' : undefined} />
      </label>
      {error && <p id="unlock-err" role="alert" className="font-medium" style={{ color: 'var(--red-600)' }}>{error}</p>}
    </Dialog>
  );
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
    </svg>
  );
}

function MicButton({ recording, disabled, onClick, label }: { recording: boolean; disabled: boolean; onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-pressed={recording} aria-label={label} title={label}
      className="relative grid h-11 w-11 flex-none place-items-center rounded-[var(--r-12)] transition-colors disabled:opacity-40"
      style={recording ? { background: 'var(--red-600)', color: 'var(--on-danger)' } : { background: 'var(--violet-100)', color: 'var(--accent-text)' }}>
      {recording && <span aria-hidden className="absolute inset-0 rounded-[var(--r-12)] border-2" style={{ borderColor: 'var(--red-600)', animation: 'ring 1.6s var(--ease-out) infinite' }} />}
      {recording ? <Wave bars={4} /> : (
        <svg aria-hidden width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
      )}
    </button>
  );
}
