'use client';

import {
  canSave, cleanSpokenAnswer, commandWords, createShield, looksUnfinished, matchOption, parseVoiceCommand, quickValue, SessionController, suggestCanonicalKey, ToolRunner, validateAnswer,
  type CanonicalKey, type FieldWriter, type FormQuestion, type Language, type Profile, type Session, type ToolHost,
} from '@awaazform/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Bolu } from '@/components/Bolu';
import { Dialog } from '@/components/Dialog';
import { EASE, Wave } from '@/components/Motion';
import { applyEvent, Timeline, type TimelineCard } from '@/components/Timeline';
import { AiUnavailable, assistantTurn, explainQuestion, fallbackExplanation, type ChatMsg } from '@/lib/assistant';
import { db, ensureDefaultProfile, saveValue } from '@/lib/db';
import { SignaturePad } from '@/components/SignaturePad';
import { fmt, LANGUAGE_META, localizeMessage, Rich, type Strings } from '@/lib/i18n';
import { thinkingSound } from '@/lib/earcon';
import { createListener, type Listener } from '@/lib/vad';
import { inScript, translateQuestions, type QuestionTexts } from '@/lib/question-i18n';
import { saveSession } from '@/lib/session-store';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';
import { hasPasskey, isUnlocked, onVaultChange, readValues, unlock, unlockWithPasskey } from '@/lib/vault';
import { isSpeaking, speak, sttHint, voiceAvailable, voicesReady, speakSentences, startRecording, stopSpeaking, transcribe, VoiceError, voiceInputSupported } from '@/lib/voice';

type Offer =
  | { kind: 'use'; key: CanonicalKey; value: string; resolve?: (v: string | null) => void }
  | { kind: 'remember'; key: CanonicalKey; value: string; questionId: string; resolve?: (ok: boolean) => void };

type Busy = null | 'transcribing' | 'thinking' | 'filling';
type LiveState = 'off' | 'listening' | 'hearing' | 'thinking' | 'speaking';
type Turn = { who: 'you' | 'ai'; text: string; id: number };

const OPTION_TYPES: FormQuestion['type'][] = ['choice', 'dropdown', 'scale', 'yesno', 'checkbox', 'multichoice'];
const isMulti = (q: FormQuestion) => q.type === 'checkbox' || q.type === 'multichoice';
/** Options to show and read out; yes/no questions without their own options get Yes / No. */
const optionsOf = (q: FormQuestion) => (q.options?.length ? q.options : q.type === 'yesno' ? ['Yes', 'No'] : []);

import { useWakeLock } from '@/lib/use-wake-lock';

const LIVE_CONSENT = 'awaazform.liveConsent';
const keyLabel = (t: Strings, k: CanonicalKey) => t.keys[k] ?? k.replace(/_/g, ' ');
const optionsIntro = (t: Strings, opts: string[]) =>
  opts.length > 8 ? fmt(t.session.options_many, { n: opts.length }) : fmt(t.session.options_intro, { list: opts.map((o, i) => `${i + 1}, ${o}`).join('; ') });

export function displayValue(q: FormQuestion, v: string, lang: Language): string {
  // A drawn signature is an image (shown with <Answer>), never read out or printed as text.
  if (q.type === 'signature') return '';
  if (q.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
    return new Date(`${v}T00:00:00`).toLocaleDateString(LANGUAGE_META[lang]?.locale ?? 'en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
  return v;
}

/** An answer as shown on screen: a drawn signature as its picture, everything else as text. */
function Answer({ q, v, lang, alt }: { q: FormQuestion; v: string; lang: Language; alt: string }) {
  if (q.type === 'signature' && v.startsWith('data:image/png')) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={v} alt={alt} className="inline-block max-h-16 max-w-full rounded bg-white p-1 align-middle" />;
  }
  return <>{displayValue(q, v, lang)}</>;
}

/** An answer as the user should hear it: option answers in their language, everything else as filled. */
function shownAnswer(q: FormQuestion, v: string, lang: Language, texts: QuestionTexts): string {
  const tr = texts[q.id]?.options;
  if (tr && q.options?.length) {
    const parts = v.split(', ').map((x) => { const i = q.options!.indexOf(x); return i >= 0 ? tr[i] ?? x : x; });
    return parts.join(', ');
  }
  return displayValue(q, v, lang);
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
  /** Extra controls in the top bar, e.g. “Download PDF”; a function gets the live session. */
  actions?: ReactNode | ((s: Session) => ReactNode);
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
  useWakeLock(recording || live !== 'off');
  const [level, setLevel] = useState(0);
  const [liveDialog, setLiveDialog] = useState(false);
  const [unlockDialog, setUnlockDialog] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  /** The form's questions in the interface language (shown and spoken; the form keeps its own words). */
  const [qt, setQt] = useState<QuestionTexts>({});
  /** Spoken answers written in the user's script for the read-back (“value” → “आयुश शुक्ला”). */
  const [scripted, setScripted] = useState<Record<string, string>>({});
  const scriptedRef = useRef(scripted);
  scriptedRef.current = scripted;
  const qtRef = useRef(qt);
  qtRef.current = qt;
  /** Conversational mode: all proposed answers are read back together, then filled on one yes. */
  const [reviewing, setReviewing] = useState(false);
  const reviewingRef = useRef(false);
  reviewingRef.current = reviewing;
  const turnId = useRef(0);
  const addTurn = useCallback((who: Turn['who'], text: string) => {
    setTurns((ts) => [...ts.slice(-7), { who, text, id: ++turnId.current }]);
  }, []);
  const [, setVaultTick] = useState(0);

  const ctlRef = useRef<SessionController | null>(null);
  const runnerRef = useRef<ToolRunner | null>(null);
  const recRef = useRef<Awaited<ReturnType<typeof startRecording>> | null>(null);
  const liveRef = useRef<Listener | null>(null);
  /** Each spoken or typed turn's number; a newer turn or a new question makes older ones stale. */
  const turnRef = useRef(0);
  const sttFailures = useRef(0);
  /** The start of a sentence the user hasn't finished yet (“my email is…”), waiting for the rest. */
  const pendingText = useRef<{ text: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  const historyRef = useRef<ChatMsg[]>([]);
  /** One privacy shield per session, so a value keeps its placeholder across turns. */
  const shieldRef = useRef(createShield());
  /** Pending auto-advance; cancelled by any manual navigation so it can't yank the user away. */
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** `advance` is defined after `present`, which needs it for questions it can't fill. */
  const advanceRef = useRef<() => void>(() => {});
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
      addTurn('ai', text);
      setLive('speaking');
      bargedIn.current = false;
      liveRef.current?.setSpeaking(true, latest.current.settings.bargeIn);
      await speakSentences(text, voiceOpts(), () => bargedIn.current);
      liveRef.current?.setSpeaking(false);
      setLive((s) => (s === 'off' ? 'off' : 'listening'));
      return;
    }
    await speak(text, voiceOpts());
  }, [addTurn]);

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
    // Preserve the prepared session even if the app closes before the first answer.
    void saveSession(initial, storageKey);

    const host: ToolHost = {
      ask: async (_q, text) => void (await say(text, true)),
      readBack: async (q, v) => void (await say(`${displayValue(q, v, latest.current.settings.language)}. ${latest.current.t.session.is_this_right}`)),
      explain: async (q) => fallbackExplanation(q, latest.current.t),
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
      setCards((c) => applyEvent(c, e, ctl.session.questions, latest.current.t));
      surfaceRef.current?.onEvent(e);
    });
    const offState = ctl.onState((s) => {
      setSession(s);
      void saveSession(s, storageKey);
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

  // Ask the form's questions in the user's language: translate them once per form and language.
  const questionKey = session.questions.map((x) => x.id).join('|');
  useEffect(() => {
    if (lang === 'en') return setQt({});
    let live = true;
    translateQuestions(session.questions, lang).then((m) => live && setQt(m)).catch(() => live && setQt({}));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionKey, lang]);

  // Say so once if this device can't read the chosen language aloud; everything is still on screen.
  useEffect(() => {
    if (!started || typeof speechSynthesis === 'undefined') return;
    let live = true;
    void voicesReady().then(() => {
      if (live && !voiceAvailable(lang)) setNotice(fmt(t.session.no_voice_lang, { language: LANGUAGE_META[lang].native }));
    });
    return () => { live = false; };
  }, [started, lang, t]);

  const ctl = ctlRef.current;
  const q = session.questions[session.currentIndex];
  const answer = q ? session.answers[q.id] : undefined;

  // ---- Presenting a question ----
  const present = useCallback(async (index: number) => {
    turnRef.current++; // a new question: anything an older turn still wants to say is stale
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
    const tq = qtRef.current[cq.id];
    const parts = [tq?.label ?? cq.label, cq.required ? '' : `(${tt.common.optional})`];
    // An answer already proposed (e.g. given earlier in one breath with others) is read back, not asked again.
    if (a.status === 'proposed' && a.normalized) {
      parts.push(`${displayValue(cq, a.normalized, latest.current.settings.language)}. ${tt.session.is_this_right}`);
      setTimeout(() => inputRef.current?.focus(), 60);
      return void say(parts.filter(Boolean).join(' '));
    }
    if (cq.options?.length && cq.type !== 'yesno') parts.push(optionsIntro(tt, tq?.options ?? cq.options), isMulti(cq) ? tt.session.multi_hint : '');
    if (cq.type === 'signature' && a.status !== 'proposed') parts.push(tt.session.sign_prompt);
    if (cq.support === 'unsupported') {
      parts.push(tt.session.not_supported, localizeMessage(tt, cq.supportReason));
      // Live Mode never waits on a question AwaazForm can't fill (a file upload, say): it says so and moves on.
      if (latest.current.live !== 'off') {
        await say([...parts, tt.session.moving_on].filter(Boolean).join(' '));
        return advanceRef.current();
      }
    }
    setTimeout(() => inputRef.current?.focus(), 60);

    const key = suggestCanonicalKey(cq);
    const fresh = a.status === 'pending' || a.status === 'invalid';
    const found = key && fresh && cq.support !== 'unsupported' ? await savedValue(key) : null;
    // Offer a saved detail only if it is a valid answer here (a saved name never goes into a date field).
    const saved = found && validateAnswer(cq, found).ok ? found : null;
    if (key && saved) {
      c.emit({ type: 'profile.offered', key });
      setOffer({ kind: 'use', key, value: saved });
      parts.push(fmt(tt.session.use_saved, { key: keyLabel(tt, key), value: displayValue(cq, saved, latest.current.settings.language) }));
    }
    void say(parts.filter(Boolean).join(' '));
  }, [say, savedValue]);

  const start = () => {
    setStarted(true);
    void present(ctlRef.current?.session.currentIndex ?? 0);
  };

  /** Live Mode in conversational mode: answers are acknowledged and checked together at the end. */
  const endMode = () => latest.current.live !== 'off' && latest.current.settings.confirmMode === 'end';
  const proposedList = () => {
    const c = ctlRef.current;
    return c ? c.session.questions.filter((x) => c.session.answers[x.id]?.status === 'proposed') : [];
  };

  /**
   * A spoken text answer in the user's own script, for reading back (the form keeps the original).
   * Waits at most `wait` ms, so speech is never held up for long.
   */
  const toScript = useCallback(async (q: FormQuestion, wait = 1500): Promise<string | null> => {
    const lang = latest.current.settings.language;
    const a = ctlRef.current?.session.answers[q.id];
    const v = a?.normalized;
    if (!v || lang === 'en' || a.source !== 'spoken' || (q.type !== 'text' && q.type !== 'paragraph') || !/[A-Za-z]/.test(v)) return null;
    const key = `${lang}\u0000${v}`;
    if (scriptedRef.current[key]) return scriptedRef.current[key]!;
    const p = inScript(v, lang).then((s) => { if (s) setScripted((m) => ({ ...m, [key]: s })); return s; });
    return Promise.race([p, new Promise<null>((r) => setTimeout(() => r(null), wait))]);
  }, []);

  /** Reads back everything noted so far and asks for one yes. Nothing is filled until then. */
  const startReview = useCallback(async () => {
    const tt = latest.current.t, langNow = latest.current.settings.language;
    const list = proposedList();
    if (!list.length) return void say(tt.session.nothing_to_fill, true);
    setReviewing(true);
    const c = ctlRef.current!;
    // Spoken answers in the user's script where ready (names read properly by the voice).
    await Promise.all(list.map((x) => toScript(x, 1200)));
    const said = (x: FormQuestion) => {
      const v = c.session.answers[x.id]!.normalized ?? '';
      return scriptedRef.current[`${langNow}\u0000${v}`] ?? shownAnswer(x, v, langNow, qtRef.current);
    };
    const items = list.map((x) => `${(qtRef.current[x.id]?.label ?? x.label).replace(/[\s:：-]+$/u, '')}: ${said(x)}`).join('. ');
    await say(`${tt.session.review_intro} ${items}. ${fmt(tt.session.review_ask, commandWords(langNow))}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say]);

  /** The user said yes to the summary (or pressed Fill all): confirm each noted answer through the gate. */
  const fillAll = useCallback(async () => {
    const c = ctlRef.current;
    if (!c) return;
    const list = proposedList();
    setBusy('filling');
    let ok = 0;
    for (const x of list) {
      await c.confirm(x.id);
      if (c.session.answers[x.id]?.status === 'verified') ok++;
    }
    setBusy(null);
    setReviewing(false);
    const tt = latest.current.t;
    if (ok < list.length) return void say(fmt(tt.session.filled_some, { n: ok, failed: list.length - ok }), true);
    // Questions still to answer: carry on with the conversation rather than wrapping up.
    const qs = c.session.questions;
    const next = qs.findIndex((x) => x.support !== 'unsupported' && !['verified', 'skipped', 'written', 'proposed'].includes(c.session.answers[x.id]?.status ?? ''));
    if (next >= 0) {
      await say(tt.session.filled_continue, true);
      return void present(next);
    }
    await say(ok === 1 ? tt.session.filled_one : fmt(tt.session.filled_all, { n: ok }), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say]);

  const advance = useCallback(() => {
    const c = ctlRef.current;
    if (!c) return;
    const i = c.session.currentIndex;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    // Next question that still needs the user: after this one first, then any skipped over earlier.
    const qs = c.session.questions;
    const open = (j: number) => {
      const st = c.session.answers[qs[j]!.id]?.status;
      return qs[j]!.support !== 'unsupported' && st !== 'verified' && st !== 'skipped' && st !== 'written' && !(endMode() && st === 'proposed');
    };
    const after = qs.findIndex((_, j) => j > i && open(j));
    const target = after >= 0 ? after : qs.findIndex((_, j) => j < i && open(j));
    if (target >= 0) {
      advanceTimer.current = setTimeout(() => {
        // Only advance if the user is still on the question they just finished.
        if (ctlRef.current?.session.currentIndex === i) void present(target);
      }, reduceMotion ? 0 : 700);
    }
    else if (endMode() && proposedList().length) void startReview();
    else void say(`${latest.current.t.session.all_done} ${latest.current.t.session.never_submit}`, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [present, reduceMotion, say, startReview]);

  advanceRef.current = advance;

  // ---- Answering ----

  // The card shows the answer in the user's script as soon as it's ready, however it was proposed.
  const curQ = session.questions[session.currentIndex];
  const curA = curQ ? session.answers[curQ.id] : undefined;
  useEffect(() => {
    if (curQ && curA?.normalized && (curA.status === 'proposed' || curA.status === 'verified')) void toScript(curQ, 0);
  }, [curQ, curA?.normalized, curA?.status, settings.language, toScript]);

  const readBackProposal = useCallback(async (question: FormQuestion) => {
    const a = ctlRef.current?.session.answers[question.id];
    const script = await toScript(question);
    const shown = (v: string) => (script ?? displayValue(question, v, latest.current.settings.language)).replace(/[.!?।]+$/u, '');
    if (a?.status === 'proposed' && a.normalized && endMode()) {
      // Conversational: a short acknowledgement and on to the next question; the check comes at the end.
      await say(fmt(latest.current.t.session.got_it, { value: shown(shownAnswer(question, a.normalized, latest.current.settings.language, qtRef.current)) }));
      return advance();
    }
    if (a?.status === 'proposed' && a.normalized) {
      await say(`${shown(shownAnswer(question, a.normalized, latest.current.settings.language, qtRef.current))}. ${latest.current.t.session.is_this_right}`);
    } else if (a?.status === 'invalid' && a.error) {
      await say(localizeMessage(latest.current.t, a.error));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [say, advance]);

  const submit = useCallback(async (raw: string, source: 'typed' | 'spoken') => {
    const turn = ++turnRef.current;
    const c = ctlRef.current, runner = runnerRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !runner || !cq || !raw.trim()) return;
    if (cq.support === 'unsupported') return setNotice(latest.current.t.session.not_supported);
    setOffer(null);
    setBubble(null);

    // An option said or typed in the user's language ("छात्र") stands for the form's own option ("Student").
    const trOpts = qtRef.current[cq.id]?.options;
    if (trOpts && cq.options?.length) {
      const hit = matchOption(raw, trOpts);
      if (hit) raw = cq.options[trOpts.indexOf(hit)] ?? raw;
    }
    // Fast path: a short answer that clearly picks an option needs no AI round trip.
    const short = raw.trim().split(/\s+/).length <= 4;
    const quick = source === 'spoken' && short && OPTION_TYPES.includes(cq.type) && validateAnswer(cq, raw).ok;

    // Typed answers are taken literally. The exception: a typed answer to an option question that matches
    // no option ("I study in college") goes to the AI to map onto one, still with read-back and confirm.
    // Clear short answers (an email, phone, number, date, or a short name in Latin letters) also skip it.
    const instant = source === 'spoken' && !OPTION_TYPES.includes(cq.type) ? quickValue(cq.type, raw, latest.current.settings.language) : null;
    if (instant) raw = instant;
    const needsAi = source === 'spoken' ? !quick && !instant : OPTION_TYPES.includes(cq.type) && !validateAnswer(cq, raw).ok;
    if (latest.current.aiOn && needsAi) {
      setBusy('thinking');
      // FR-43: a spoken holding line if the AI takes a while.
      const isLive = latest.current.live !== 'off';
      // A soft "hmm" if it takes a moment, and words only if it takes much longer.
      const hum = isLive ? setTimeout(() => { if (latest.current.readAloud || isLive) thinkingSound(); }, 350) : null;
      const hold = isLive ? setTimeout(() => void speak(latest.current.t.session.one_moment, voiceOpts()), 4000) : null;
      const startIndex = c.session.currentIndex;
      // Live Mode speaks the reply sentence by sentence as it streams in.
      let speech = Promise.resolve();
      const onSentence = isLive ? (s: string) => {
        if (turn !== turnRef.current) return; // the conversation has moved on: don't say this late
        if (hum) clearTimeout(hum);
        if (hold) clearTimeout(hold);
        speech = speech.then(() => say(s));
      } : undefined;
      try {
        const { reply, history, proposed, streamed } = await assistantTurn(
          { ctl: c, runner, profileLabel: latest.current.profile?.label ?? 'Me', language: latest.current.settings.language, shield: latest.current.settings.privacyShield ? shieldRef.current : undefined },
          historyRef.current, raw, onSentence,
        );
        historyRef.current = history;
        if (hum) clearTimeout(hum);
        if (hold) clearTimeout(hold);
        await speech;
        setBusy(null);
        // Superseded (the user spoke again, or Bolu moved to another question meanwhile): its proposals
        // stay in the list for review, but it doesn't steer the conversation any more.
        if (turn !== turnRef.current) return;
        const pending = proposed.filter((id) => c.session.answers[id]?.status === 'proposed');
        const others = pending.filter((id) => id !== cq.id).length;
        if (c.session.answers[cq.id]?.status === 'proposed') {
          if (others) void say(fmt(latest.current.t.session.next_proposed, { n: others }), true);
          return void (await readBackProposal(cq));
        }
        if (pending.length) {
          // The answer was for another question (a correction, or several at once): go there to confirm it.
          return void (await present(c.session.questions.findIndex((x) => x.id === pending[0])));
        }
        if (c.session.currentIndex !== startIndex) return void (await present(c.session.currentIndex));
        if (reply && streamed) return void setBubble(reply);
        if (reply) return void (await say(reply, true));
      } catch (err) {
        if (hum) clearTimeout(hum);
        if (hold) clearTimeout(hold);
        if (err instanceof AiUnavailable) {
          setAiOn(false);
          setNotice(`${latest.current.t.session.ai_unavailable} (${localizeMessage(latest.current.t, err.message)})`);
        }
      } finally {
        setBusy(null);
      }
    }
    // Deterministic path: typed answers, or AI unavailable. Take the value out of a sentence
    // ("My name is Ayush Shukla" → "Ayush Shukla"); option questions do their own matching.
    c.propose(cq.id, OPTION_TYPES.includes(cq.type) ? raw : cleanSpokenAnswer(cq.type, raw), source);
    await readBackProposal(cq);
  }, [present, readBackProposal, say]);

  const confirm = useCallback(async () => {
    const c = ctlRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !cq) return;
    setBusy('filling');
    await c.confirm(cq.id);
    setBusy(null);
    const a = c.session.answers[cq.id];
    if (a?.status !== 'verified') return void say(localizeMessage(latest.current.t, a?.error) || latest.current.t.session.didnt_take, true);

    const key = suggestCanonicalKey(cq);
    const p = latest.current.profile;
    const current = key ? await savedValue(key) : null;
    if (key && a.normalized && current !== a.normalized && canSave(key, cq.label) && p && isUnlocked(p)) {
      setOffer({ kind: 'remember', key, value: a.normalized, questionId: cq.id });
      void say(latest.current.t.session.remember);
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
        setNotice(localizeMessage(latest.current.t, (err as Error).message));
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
      : fallbackExplanation(cq, latest.current.t);
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
        setNotice(e.kind === 'ai' ? `${t.session.ai_unavailable} (${localizeMessage(t, e.message)})` : localizeMessage(t, e.message));
      }
      return;
    }
    stopSpeaking();
    try {
      recRef.current = await startRecording(lang, sttHint(q, lang, q && qtRef.current[q.id]));
      if (q) ctl?.listening(q.id);
      setRecording(true);
      setNotice(null);
    } catch (err) {
      setNotice(`${t.session.voice_unavailable} (${localizeMessage(t, (err as Error).message)})`);
    }
  };

  // ---- Live Mode (FR-39 – FR-45) ----
  const handleLiveText = useCallback(async (text: string) => {
    const c = ctlRef.current;
    const cq = c?.session.questions[c.session.currentIndex];
    if (!c || !cq) return;
    setInput(text);
    addTurn('you', text);
    const cmd = parseVoiceCommand(text);
    const a = c.session.answers[cq.id];
    const o = offerRef.current;

    // The end-of-form summary: “yes” fills everything, “no” asks what to change, anything else is a change.
    if (reviewingRef.current) {
      if (cmd === 'confirm') return fillAll();
      if (cmd === 'reject') return void say(latest.current.t.session.review_change, true);
      if (cmd === 'finish' || cmd === 'repeat') return startReview();
      if (cmd === 'stop') return stopLive();
      return submit(text, 'spoken');
    }
    if (cmd === 'finish') return startReview();
    // Spoken yes/no answers an open prompt first. The decision is made here in code, not by the model.
    if (o && (cmd === 'confirm' || cmd === 'reject')) return decideOffer(cmd === 'confirm');
    if (a?.status === 'proposed' && cmd === 'confirm') return confirm();
    if (a?.status === 'proposed' && cmd === 'reject') { c.edit(cq.id); return void say(latest.current.t.session.say_again, true); }
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
  }, [addTurn, advance, confirm, decideOffer, explain, fillAll, present, readBackProposal, say, startReview, submit]);

  const startLive = async () => {
    sttFailures.current = 0;
    if (!aiOn) return setNotice(t.session.ai_unavailable);
    if (!voiceInputSupported()) return setNotice(t.session.voice_unavailable);
    stopSpeaking();
    // Waits briefly for the rest of an unfinished sentence (“my email is…”) before answering.
    const handleText = (text: string) => {
      const prev = pendingText.current;
      if (prev) { clearTimeout(prev.timer); pendingText.current = null; }
      const full = prev ? `${prev.text} ${text}` : text;
      if (looksUnfinished(full)) {
        pendingText.current = { text: full, timer: setTimeout(() => { pendingText.current = null; void handleLiveRef.current(full); }, 2500) };
        return Promise.resolve();
      }
      return handleLiveRef.current(full);
    };
    const callbacks = {
      onSpeechStart: () => {
        if (isSpeaking()) {
          bargedIn.current = true; // FR-42 barge-in
          stopSpeaking();
        }
        setLive('hearing');
      },
      onUtterance: async (blob: Blob) => {
        liveRef.current?.setPaused(true);
        setLive('thinking');
        try {
          const c0 = ctlRef.current;
          const q0 = c0?.session.questions[c0.session.currentIndex];
          const text = await transcribe(blob, latest.current.settings.language, sttHint(q0, latest.current.settings.language, q0 && qtRef.current[q0.id]));
          sttFailures.current = 0;
          await handleText(text);
        } catch (err) {
          const e = err as VoiceError;
          if (e.kind === 'ai') {
            setNotice(`${t.session.ai_unavailable} (${localizeMessage(latest.current.t, e.message)})`);
            // A busy moment (rate limit, network) passes: keep listening. End the call only when retrying
            // can't help (no key, rejected key) or it keeps failing.
            sttFailures.current += 1;
            if ([401, 403, 503].includes(e.status) || sttFailures.current >= 3) { stopLive(); return; }
          }
        } finally {
          liveRef.current?.setPaused(false);
          setLive((s) => (s === 'off' ? 'off' : 'listening'));
        }
      },
      onLevel: setLevel,
    };
    let listener: Listener;
    try {
      listener = await createListener(callbacks);
    } catch {
      return setNotice(t.session.voice_unavailable);
    }
    liveRef.current = listener;
    setLive('listening');
    if (!started) start();
    else void present(session.currentIndex);
  };
  const handleLiveRef = useRef(handleLiveText);
  handleLiveRef.current = handleLiveText;

  /** Tap Bolu or press Space: stop talking and listen. Works on speakers, unlike voice barge-in. */
  const interrupt = useCallback(() => {
    if (!isSpeaking()) return;
    bargedIn.current = true;
    stopSpeaking();
  }, []);
  useEffect(() => {
    if (live === 'off') return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.code !== 'Space' || el?.closest('input, textarea, select, button, [contenteditable="true"]')) return;
      if (!isSpeaking()) return;
      e.preventDefault();
      interrupt();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [live, interrupt]);

  const stopLive = () => {
    if (pendingText.current) { clearTimeout(pendingText.current.timer); pendingText.current = null; }
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

  const proposedCount = Object.values(session.answers).filter((a) => a.status === 'proposed').length;
  const pct = counts.fillable ? Math.round((counts.verified / counts.fillable) * 100) : 0;
  /** The answer box is showing (not a read-back, offer, or finished answer). */
  const answering = !!q && !!answer && q.support !== 'unsupported' && !offer && answer.status !== 'proposed' && answer.status !== 'verified' && !(answer.status === 'confirmed' && answer.error);

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
              <span className="text-muted">{t.session.filling_for}</span>
              <select className="min-h-11 rounded-lg bg-transparent px-2 font-semibold" value={session.profileId} disabled={started}
                onChange={(e) => ctl?.setProfile(e.target.value)} aria-describedby="owner-hint">
                {profiles.map((p) => <option key={p.id} value={p.id}>{p.label}{p.encrypted ? ' 🔒' : ''}</option>)}
              </select>
            </label>
            <span id="owner-hint" className="sr-only">{started ? t.session.owner_locked : ''}</span>
            {locked && (
              <button type="button" className="btn btn-ghost" onClick={() => setUnlockDialog(true)}>{t.session.unlock_saved}</button>
            )}
            <button type="button" className="btn-quiet" aria-pressed={readAloud} onClick={() => { setReadAloud(!readAloud); if (readAloud) stopSpeaking(); }} title={t.session.read_aloud}>
              <SpeakerIcon muted={!readAloud} /> <span className="hidden lg:inline">{t.session.read_aloud}</span>
            </button>
            <button type="button" className={live !== 'off' ? 'btn' : 'btn btn-ghost'} aria-pressed={live !== 'off'} onClick={toggleLive}>
              {live !== 'off' ? <Wave bars={4} /> : <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: 'var(--red-600)' }} />}
              {t.live.mode}{live !== 'off' ? ': on' : ''}
            </button>
            {typeof props.actions === 'function' ? props.actions(session) : props.actions}
            <details className="menu">
              <summary className="btn-quiet" aria-label={t.session.more}>•••</summary>
              <div className="menu-panel">
                <Link href="/report" className="btn-quiet">{t.session.readiness}</Link>
                <Link href="/profiles" className="btn-quiet">{t.session.manage_profiles}</Link>
                <button type="button" className="btn-quiet" style={{ color: 'var(--red-600)' }}
                  onClick={() => window.confirm(t.session.discard_confirm) && props.onDiscard()}>
                  {t.session.discard}
                </button>
              </div>
            </details>
          </div>
        </div>

        {/* Progress + stepper (replaces the long “still needed” list) */}
        <div className="grid gap-3">
          <div className="flex items-center gap-3 text-sm">
            <div className="progress flex-1" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t.session.answers_verified}><i style={{ width: `${pct}%` }} /></div>
            <span className="font-medium whitespace-nowrap">{fmt(t.session.verified_of, { n: counts.verified, total: counts.fillable })}</span>
          </div>
          {started && (
            <nav aria-label={t.session.questions_nav}>
              <ol className="flex flex-wrap gap-3">
                {session.questions.map((x, i) => (
                  <li key={x.id}>
                    <button type="button" className="step-dot" data-state={stepState(x)} aria-current={i === session.currentIndex ? 'step' : undefined}
                      aria-label={fmt(t.session.step_label, { n: i + 1, label: x.label, state: stepState(x) === 'todo' ? (x.required ? t.session.st_todo_req : t.session.st_todo) : t.session[`st_${stepState(x)}` as 'st_verified'] })}
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
          <button type="button" className="btn-quiet !min-h-0 !p-0 underline" onClick={() => setNotice(null)}>{t.common.dismiss}</button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ---- Conversation ---- */}
        <div className="grid min-w-0 gap-4 lg:sticky lg:top-24">
          {!started ? (
            <ScanSummary counts={counts} questions={session.questions} profileLabel={profile?.label ?? 'Me'} onStart={start} intro={props.intro} />
          ) : reviewing ? (
            <section aria-labelledby="review-h" className="card grid gap-5 p-6 md:p-7">
              <div>
                <h2 id="review-h" className="text-2xl">{t.session.review_title}</h2>
                <p className="mt-1 text-sm text-muted">{t.session.review_hint}</p>
              </div>
              {live !== 'off' && <LivePanel state={live} level={level} t={t} turns={turns} words={commandWords(lang)} onInterrupt={interrupt} />}
              <ol className="grid gap-2">
                {session.questions.map((x, i) => {
                  const a = session.answers[x.id];
                  if (a?.status !== 'proposed') return null;
                  return (
                    <li key={x.id} className="flex items-center justify-between gap-3 rounded-[var(--r-12)] border border-line bg-surface p-3">
                      <span className="min-w-0">
                        <span className="block text-xs text-muted">{i + 1}. {qt[x.id]?.label ?? x.label}</span>
                        <span className="block font-semibold break-words">
                          {scripted[`${lang}\u0000${a.normalized}`] ?? <Answer q={x} v={a.normalized ?? ''} lang={lang} alt={t.session.signature_drawn} />}
                          {scripted[`${lang}\u0000${a.normalized}`] && <span className="ms-2 text-sm font-normal text-muted" lang="en">{a.normalized}</span>}
                        </span>
                      </span>
                      <button type="button" className="btn btn-ghost flex-none" onClick={() => { setReviewing(false); void present(i); }}>{t.common.edit}</button>
                    </li>
                  );
                })}
              </ol>
              <button type="button" className="btn btn-success btn-lg" disabled={busy === 'filling'} onClick={() => void fillAll()}>
                ✓ {fmt(t.session.fill_all, { n: Object.values(session.answers).filter((a) => a.status === 'proposed').length })}
              </button>
              {bubble && <div className="bubble" role="status"><span className="mb-1 block text-xs font-medium text-muted">AwaazForm</span>{bubble}</div>}
            </section>
          ) : q && answer ? (
            <section aria-labelledby="q-label" className="card grid gap-5 p-6 md:p-7">
              <div className="flex items-center justify-between gap-2 text-sm text-muted">
                <span>{fmt(t.session.question_of, { n: session.currentIndex + 1, total: session.questions.length })}</span>
                <span className="flex gap-1.5">
                  <span className={`chip ${q.required ? 'chip-accent' : ''}`}>{q.required ? t.common.required : t.common.optional}</span>
                  {q.support !== 'supported' && <span className="chip chip-warn">{q.support === 'unsupported' ? t.session.fill_yourself : t.session.check_yourself}</span>}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={q.id} initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }} className="grid gap-2">
                  <h2 id="q-label" className="text-[1.75rem] leading-tight">{qt[q.id]?.label ?? q.label}</h2>
                  {qt[q.id] && qt[q.id]!.label !== q.label && <p className="text-xs text-muted" lang="und"><span className="sr-only">{t.session.original}: </span>{q.label}</p>}
                  {q.helpText && <p className="text-muted">{qt[q.id]?.helpText ?? q.helpText}</p>}
                  {q.options && q.type !== 'yesno' && !answering && (
                    <ul className="mt-1 flex flex-wrap gap-1.5" aria-label={t.session.options}>
                      {q.options.map((o, i) => <li key={o} className="chip !py-1 !text-sm">{qt[q.id]?.options?.[i] ?? o}</li>)}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Live Mode's conversation stays on screen through every step: the read-back, Confirm/Edit,
                  saved-detail offers and errors appear under it instead of replacing it. */}
              {live !== 'off' && <LivePanel state={live} level={level} t={t} turns={turns} words={commandWords(lang)} onInterrupt={interrupt} />}
              {q.support === 'unsupported' ? (
                <p className="rounded-[var(--r-12)] p-4 text-sm" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
                  {t.session.not_supported} {localizeMessage(t, q.supportReason)}
                </p>
              ) : offer ? (
                <OfferCard offer={offer} q={q} lang={lang} profileLabel={profile?.label ?? 'Me'} t={t} onDecide={decideOffer} reduceMotion={reduceMotion} />
              ) : answer.status === 'proposed' && answer.normalized ? (
                // Read-back + confirm gate (FR-15, FR-16)
                <motion.div role="group" aria-labelledby="rb-h" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="grid gap-4 rounded-[var(--r-16)] border-2 p-5" style={{ borderColor: 'var(--violet-300)', background: 'var(--violet-100)' }}>
                  <div>
                    <p id="rb-h" className="text-sm font-medium" style={{ color: 'var(--accent-text)' }}>{t.session.is_this_right}</p>
                    {scripted[`${lang}\u0000${answer.normalized}`] ? (
                      <>
                        <p className="mt-1 text-2xl font-semibold break-words" aria-live="polite" lang={lang}>{scripted[`${lang}\u0000${answer.normalized}`]}</p>
                        <p className="mt-1 text-sm text-muted break-words" lang="en">{fmt(t.session.form_gets, { value: answer.normalized })}</p>
                      </>
                    ) : (
                      <p className="mt-1 text-2xl font-semibold break-words" aria-live="polite"><Answer q={q} v={answer.normalized} lang={lang} alt={t.session.signature_drawn} /></p>
                    )}
                    {answer.translated && <p className="mt-1 text-xs text-muted">You said: “{answer.raw}”</p>}
                    {answer.source === 'profile' && <p className="mt-1 text-xs text-muted">{t.session.from_saved}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-success btn-lg flex-1" onClick={confirm} disabled={busy === 'filling'}>✓ {t.session.confirm}</button>
                    <button type="button" className="btn btn-ghost btn-lg" onClick={() => { ctl?.edit(q.id); setInput(answer.raw); setTimeout(() => inputRef.current?.focus(), 30); }}>{t.common.edit}</button>
                  </div>
                </motion.div>
              ) : answer.status === 'verified' ? (
                <div className="flex items-center justify-between gap-3 rounded-[var(--r-16)] p-4" style={{ background: 'var(--green-100)', color: 'var(--green-600)' }}>
                  <span className="font-semibold break-words">✓ {scripted[`${lang}\u0000${answer.normalized}`] ?? <Answer q={q} v={answer.normalized ?? ''} lang={lang} alt={t.session.signature_drawn} />}
                    {scripted[`${lang}\u0000${answer.normalized}`] && <span className="ms-2 text-sm font-normal opacity-80" lang="en">{answer.normalized}</span>}</span>
                  <button type="button" className="btn-quiet !text-current underline" onClick={() => ctl?.edit(q.id)}>{t.common.edit}</button>
                </div>
              ) : answer.status === 'confirmed' && answer.error ? (
                <div className="grid gap-3 rounded-[var(--r-16)] p-4 text-sm" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
                  <span>{localizeMessage(t, answer.error)}</span>
                  <span className="flex gap-2">
                    <button type="button" className="btn" onClick={() => void ctl?.retry(q.id)}>{t.common.retry}</button>
                    <button type="button" className="btn btn-ghost" onClick={() => ctl?.edit(q.id)}>{t.common.edit}</button>
                  </span>
                </div>
              ) : q.type === 'signature' ? (
                <SignaturePad key={q.id} t={t} disabled={!!busy} onDone={(png) => void submit(png, 'typed')} />
              ) : (
                <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); void submit(input, 'typed'); }}>
                  <label htmlFor="answer" className="sr-only">{t.session.your_answer}</label>
                  {OPTION_TYPES.includes(q.type) && optionsOf(q).length > 0 && (
                    <OptionPicker key={q.id} q={q} t={t} shown={qt[q.id]?.options} disabled={!!busy} onPick={(v) => void submit(v, 'typed')} />
                  )}
                  <div className="composer" data-invalid={answer.status === 'invalid'}>
                    <input id="answer" ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder={live !== 'off' ? t.session.or_type : t.session.type_answer}
                      autoComplete="off" maxLength={2000} aria-invalid={answer.status === 'invalid'} aria-describedby={answer.error ? 'answer-err' : undefined} />
                    {live === 'off' && (
                      <MicButton recording={recording} disabled={!voiceInputSupported() || (!!busy && !recording)} onClick={toggleRecording} label={recording ? t.session.stop : t.session.speak} />
                    )}
                    <button type="submit" className="grid h-11 w-11 flex-none place-items-center rounded-[var(--r-12)] disabled:opacity-40" style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
                      disabled={!input.trim() || !!busy} aria-label={t.session.send} title={t.session.send}>
                      <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </button>
                  </div>
                  {answer.status === 'invalid' && answer.error && <p id="answer-err" className="text-sm font-medium" style={{ color: 'var(--red-600)' }}>{localizeMessage(t, answer.error)}</p>}
                  <p className="min-h-5 text-sm text-muted" aria-live="polite">
                    {recording ? <b style={{ color: 'var(--accent-text)' }}>{t.live.hearing} Press the mic again when you finish.</b>
                      : busy === 'transcribing' ? t.session.transcribing : busy === 'thinking' ? t.session.thinking : busy === 'filling' ? t.session.filling
                      : live === 'off' ? t.session.idle_hint : ''}
                  </p>
                </form>
              )}

              {bubble && (
                <div className="bubble" role="status">
                  <span className="mb-1 block text-xs font-medium text-muted">AwaazForm</span>{bubble}
                </div>
              )}

              {/* One quiet toolbar instead of a wall of buttons */}
              {live !== 'off' && settings.confirmMode === 'end' && proposedCount > 0 && (
                <button type="button" className="btn btn-success" onClick={() => void startReview()}>
                  ✓ {fmt(t.session.review_now, { n: proposedCount })}
                </button>
              )}
              <div role="toolbar" aria-label={t.session.controls} className="-mx-2 flex flex-wrap items-center justify-between gap-1 border-t border-line pt-3">
                <button type="button" className="btn-quiet" onClick={() => void present(session.currentIndex - 1)} disabled={session.currentIndex === 0}>← {t.session.prev}</button>
                <span className="flex gap-1">
                  <button type="button" className="btn-quiet" aria-label={t.session.repeat} onClick={() => (answer.status === 'proposed' ? void readBackProposal(q) : void present(session.currentIndex))}>↻ {t.session.repeat_short}</button>
                  <button type="button" className="btn-quiet" onClick={explain}>? {t.session.explain}</button>
                  {!q.required && answer.status !== 'verified' && answer.status !== 'skipped' && (
                    <button type="button" className="btn-quiet" onClick={() => { ctl?.skip(q.id); advance(); }}>{t.session.skip}</button>
                  )}
                </span>
                <button type="button" className="btn-quiet" onClick={() => void present(session.currentIndex + 1)} disabled={session.currentIndex >= session.questions.length - 1}>{t.session.next} →</button>
              </div>
            </section>
          ) : null}
        </div>

        {/* ---- Form / Activity ---- */}
        <section aria-label={t.session.form_and_activity} className="grid min-w-0 gap-3">
          <div role="tablist" aria-label={t.session.view} className="tabbar">
            <button role="tab" id="tab-form" aria-controls="panel-form" aria-selected={tab === 'form'} onClick={() => setTab('form')}>{props.surfaceLabel}</button>
            <button role="tab" id="tab-activity" aria-controls="panel-activity" aria-selected={tab === 'activity'} onClick={() => setTab('activity')}>
              {t.session.activity} {cards.length > 0 && <span className="chip ms-1 !px-2 !py-0">{cards.length}</span>}
            </button>
          </div>
          {/* The surface stays mounted when hidden, so writes and verification keep working. */}
          <div id="panel-form" role="tabpanel" aria-labelledby="tab-form" hidden={tab !== 'form'} className="card overflow-hidden p-0">
            {props.surface}
          </div>
          <div id="panel-activity" role="tabpanel" aria-labelledby="tab-activity" hidden={tab !== 'activity'}>
            <Timeline cards={cards} title={t.timeline.title} />
          </div>
          <p className="px-1 text-xs text-muted">{t.session.never_submit}</p>
        </section>
      </div>

      {/* Live Mode disclosure (§9.2) */}
      <Dialog open={liveDialog} onClose={() => setLiveDialog(false)} title={t.live.dialog_title}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={() => setLiveDialog(false)}>{t.live.not_now}</button>
          <button type="button" className="btn" onClick={() => { localStorage.setItem(LIVE_CONSENT, 'yes'); setLiveDialog(false); void startLive(); }}>{t.live.turn_on}</button>
        </>}>
        <p><Rich text={t.live.d1} params={commandWords(lang)} /></p>
        <p>{t.live.d2}</p>
        <p>{t.live.d3}</p>
      </Dialog>

      {profile && <UnlockDialog open={unlockDialog} onClose={() => setUnlockDialog(false)} profile={profile} />}
    </div>
  );
}

// ---------------------------------------------------------------------------

function OfferCard({ offer, q, lang, profileLabel, t, onDecide, reduceMotion }: {
  offer: Offer; q: FormQuestion; lang: Language; profileLabel: string; t: Strings; onDecide: (yes: boolean) => void; reduceMotion: boolean;
}) {
  return (
    <motion.div role="group" aria-labelledby="offer-h" initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 rounded-[var(--r-16)] border p-5" style={{ borderColor: 'var(--violet-300)', background: 'var(--violet-100)' }}>
      <div>
        <p className="text-xs font-medium tracking-wide uppercase" style={{ color: 'var(--accent-text)' }}>
          {offer.kind === 'use' ? fmt(t.session.saved_for, { name: profileLabel }) : t.session.remember}
        </p>
        <p id="offer-h" className="mt-1 text-lg font-semibold break-words">
          {offer.kind === 'use'
            ? fmt(t.session.use_saved, { key: keyLabel(t, offer.key), value: displayValue(q, offer.value, lang) })
            : fmt(profileLabel === 'Me' ? t.session.save_as_me : t.session.save_as, { value: displayValue(q, offer.value, lang), name: profileLabel, key: keyLabel(t, offer.key) })}
        </p>
        {offer.kind === 'remember' && <p className="mt-1 text-xs text-muted">{t.session.stored_here}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-lg flex-1" onClick={() => onDecide(true)}>{t.common.yes}</button>
        <button type="button" className="btn btn-ghost btn-lg flex-1" onClick={() => onDecide(false)}>{t.common.no}</button>
      </div>
    </motion.div>
  );
}

function LivePanel({ state, level, t, turns, words, onInterrupt }: { state: LiveState; level: number; t: Strings; turns: Turn[]; words: Record<string, string>; onInterrupt: () => void }) {
  const label: Record<LiveState, string> = { off: '', listening: t.live.listening, hearing: t.live.hearing, thinking: t.live.thinking, speaking: t.live.speaking };
  const logRef = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);
  return (
    <div className="grid gap-3 rounded-[var(--r-16)] p-4" style={{ background: 'var(--ink-950)', color: 'var(--white)' }}>
      <div className="flex items-center gap-4" aria-live="polite">
        <button type="button" onClick={onInterrupt} disabled={state !== 'speaking'} aria-label={t.live.interrupt} title={state === 'speaking' ? t.live.interrupt : undefined}
          className="relative grid h-14 w-14 flex-none place-items-center rounded-full disabled:cursor-default" style={{ background: 'var(--ink-700)' }}>
          <Bolu size={48} head state={state === 'thinking' ? 'thinking' : state === 'speaking' ? 'speaking' : 'listening'} level={level} />
        </button>
        <span className="text-sm font-medium">{label[state]}</span>
      </div>
      {turns.length > 0 ? (
        <ol ref={logRef} aria-label={t.session.conversation} className="grid max-h-48 gap-1.5 overflow-y-auto text-sm" style={{ scrollbarWidth: 'thin' }}>
          {turns.map((x) => (
            <li key={x.id} className={x.who === 'you' ? 'justify-self-end' : 'justify-self-start'}>
              <span className={`live-turn ${x.who === 'you' ? 'live-turn-you' : 'live-turn-ai'}`}>
                <span className="sr-only">{x.who === 'you' ? t.session.you : 'AwaazForm'}: </span>{x.text}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="live-tip text-xs">{fmt(t.live.tips, words)}</p>
      )}
    </div>
  );
}

/** Tap targets for option questions. One tap proposes a single choice; multi-select collects, then proposes. */
function OptionPicker({ q, t, shown, disabled, onPick }: { q: FormQuestion; t: Strings; shown?: string[]; disabled: boolean; onPick: (value: string) => void }) {
  const options = optionsOf(q);
  const multi = isMulti(q);
  const [picked, setPicked] = useState<string[]>([]);
  // Shown in the user's language; the form still gets its own option text.
  const label = (o: string) => (q.type === 'yesno' && !q.options?.length ? (o === 'Yes' ? t.common.yes : t.common.no) : shown?.[q.options?.indexOf(o) ?? -1] ?? o);
  const numbered = options.length <= 9 && q.type !== 'yesno' && q.type !== 'scale';
  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="mb-1 text-xs font-medium text-muted">{multi ? t.session.choose_many : t.session.choose_one}</legend>
      <div className={`grid gap-2 ${q.type === 'scale' || q.type === 'yesno' ? 'grid-flow-col auto-cols-fr' : options.length > 4 ? 'sm:grid-cols-2' : ''}`}>
        {options.map((o, i) => {
          const on = picked.includes(o);
          return (
            <button key={o} type="button" className="option-btn" aria-pressed={multi ? on : undefined}
              onClick={() => (multi ? setPicked((p) => (on ? p.filter((x) => x !== o) : [...p, o])) : onPick(o))}>
              {numbered && <span aria-hidden className="option-num">{i + 1}</span>}
              {multi && <span aria-hidden className="option-box">{on ? '✓' : ''}</span>}
              <span className="min-w-0 break-words text-left">{label(o)}</span>
            </button>
          );
        })}
      </div>
      {multi && (
        <button type="button" className="btn w-fit" disabled={!picked.length} onClick={() => onPick(options.filter((o) => picked.includes(o)).join(', '))}>
          {t.session.use_selected}{picked.length ? ` (${picked.length})` : ''}
        </button>
      )}
    </fieldset>
  );
}

function ScanSummary({ counts, questions, profileLabel, onStart, intro }: {
  counts: { total: number; supported: number; review: number; unsupported: number; required: number };
  questions: FormQuestion[]; profileLabel: string; onStart: () => void; intro?: ReactNode;
}) {
  // FR-09: Compatibility Scanner
  const { t } = useSettings();
  const ss = t.session;
  return (
    <section aria-labelledby="scan-h" className="card grid gap-5 p-6 md:p-7">
      <div>
        <h2 id="scan-h" className="text-2xl">{ss.ready_title}</h2>
        <p className="mt-1 text-muted">{fmt(ss.ready_body, { n: counts.total })}</p>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        {([[ss.can_fill, counts.supported, 'var(--green-600)'], [ss.check_yourself, counts.review, 'var(--amber-700)'], [ss.fill_yourself, counts.unsupported, 'var(--text-muted)']] as const).map(([l, n, c]) => (
          <div key={l} className="rounded-[var(--r-16)] border border-line bg-surface p-3">
            <dd className="font-display text-2xl font-semibold" style={{ color: c }}>{n}</dd>
            <dt className="text-xs text-muted">{l}</dt>
          </div>
        ))}
      </dl>
      <details className="text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-medium">{fmt(ss.see_all, { n: counts.total })}</summary>
        <ol className="grid gap-1.5 pt-1">
          {questions.map((q, i) => (
            <li key={q.id} className="flex items-start justify-between gap-2">
              <span>{i + 1}. {q.label}{q.required && <span aria-label={t.common.required}> *</span>}</span>
              <span className={`chip flex-none ${q.support === 'supported' ? 'chip-ok' : q.support === 'unsupported' ? '' : 'chip-warn'}`}>
                {q.support === 'supported' ? ss.can_fill_chip : q.support === 'unsupported' ? ss.fill_yourself_chip : ss.check_yourself_chip}
              </span>
            </li>
          ))}
        </ol>
      </details>
      {intro}
      <div className="grid gap-2">
        <button type="button" className="btn btn-lg" onClick={onStart}>{fmt(ss.start, { name: profileLabel })}</button>
        <p className="text-center text-xs text-muted">{ss.change_owner}</p>
      </div>
    </section>
  );
}

function UnlockDialog({ open, onClose, profile }: { open: boolean; onClose: () => void; profile: Profile }) {
  const { t } = useSettings();
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (await unlock(profile, pass)) { setPass(''); setError(null); onClose(); }
    else setError(t.profiles.wrong);
  };
  return (
    <Dialog open={open} onClose={onClose} title={fmt(t.session.unlock_title, { name: profile.label })}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={onClose}>{t.common.cancel}</button>
        <button type="button" className="btn" onClick={submit} disabled={!pass}>{t.session.unlock}</button>
      </>}>
      {hasPasskey(profile) && (
        <button type="button" className="btn btn-lg w-full" onClick={async () => {
          try { if (await unlockWithPasskey(profile)) { setError(null); onClose(); } else setError(t.profiles.passkey_failed); } catch { setError(t.profiles.passkey_failed); }
        }}>{t.profiles.passkey_unlock}</button>
      )}
      <p>{t.session.unlock_body}</p>
      <label className="grid gap-1.5">
        <span className="font-medium">{t.profiles.passphrase}</span>
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
