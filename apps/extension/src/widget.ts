// The AwaazForm widget: Bolu in the corner of a form page. Runs the same session loop as the website
// (read back, confirm, fill, verify) with the same core and assistant code. Fills land on the real page
// through the content script; the model can only propose, and only the Yes button or a spoken “yes”
// (matched in code) confirms. Nothing is ever submitted.
import {
  cleanSpokenAnswer, commandWords, createSession, createShield, looksUnfinished, matchOption, quickValue, LANGUAGES, parseVoiceCommand, SessionController, ToolRunner, validateAnswer,
  type FieldWriter, type FormQuestion, type Language, type Session, type ToolHost,
} from '@awaazform/core';
import { setApiBase } from '@/lib/api';
import { AiUnavailable, assistantTurn, fallbackExplanation, type ChatMsg } from '@/lib/assistant';
import { mountBolu, type BoluState } from '@/lib/bolu';
import { en, fmt, LANGUAGE_META, localizeMessage, type Strings } from '@/lib/i18n/core';
import { thinkingSound } from '@/lib/earcon';
import { createListener, type Listener } from '@/lib/vad';
import { sttLanguage } from '@/lib/web-speech';
import { formKey, toQuestions, type ScanResult } from '@/lib/page-questions';
import { translateQuestions, type QuestionTexts } from '@/lib/question-i18n';
import { isSpeaking, speakSentences, sttHint, stopSpeaking, transcribe, VoiceError, voiceInputSupported } from '@/lib/voice';

declare const __AWAAZ_SERVER__: string;

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const OPTION_TYPES: FormQuestion['type'][] = ['choice', 'dropdown', 'scale', 'yesno', 'checkbox', 'multichoice'];
const isMulti = (q: FormQuestion) => q.type === 'checkbox' || q.type === 'multichoice';

// ---------------------------------------------------------------------------------------------
// Settings, strings and the page

let t: Strings = en;
let lang: Language = 'en';
let server = __AWAAZ_SERVER__;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

type Deep = Record<string, unknown>;
function merge(base: Deep, over: Deep | undefined): Deep {
  if (!over) return base;
  const out: Deep = { ...base };
  for (const [k, v] of Object.entries(base)) {
    const o = over[k];
    if (o === undefined || o === null) continue;
    if (Array.isArray(v)) out[k] = Array.isArray(o) && o.length === v.length ? o : v;
    else if (v && typeof v === 'object') out[k] = k === 'msgs' ? { ...(v as Deep), ...(o as Deep) } : merge(v as Deep, o as Deep);
    else if (typeof o === 'string' && o.trim()) out[k] = o;
  }
  return out;
}

async function loadLanguage(l: Language) {
  lang = l;
  t = en;
  if (l !== 'en') {
    try {
      const res = await fetch(chrome.runtime.getURL(`locales/${l}.json`));
      if (res.ok) t = merge(en as unknown as Deep, (await res.json()) as Deep) as unknown as Strings;
    } catch { /* English it is */ }
  }
  document.documentElement.lang = l;
  document.documentElement.dir = LANGUAGE_META[l].dir;
  applyStrings();
}

/** Fills elements marked data-t (text) and data-label (aria-label and title) from the current strings. */
function applyStrings() {
  const get = (path: string) => path.split('.').reduce<unknown>((o, k) => (o as Deep)?.[k], t) as string | undefined;
  document.querySelectorAll<HTMLElement>('[data-t]').forEach((el) => { el.textContent = get(el.dataset.t!) ?? ''; });
  document.querySelectorAll<HTMLElement>('[data-label]').forEach((el) => {
    const v = get(el.dataset.label!) ?? '';
    el.setAttribute('aria-label', v);
    el.title = v;
  });
  render();
}

/** One request to the content script in this tab, relayed by the background worker. */
function toPage<T = unknown>(type: string, extra: Record<string, unknown> = {}): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ awaazform: 'tab', type, ...extra }, (r: { ok: boolean; result?: T; error?: string } | undefined) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!r?.ok) return reject(new Error(r?.error || 'The form did not respond'));
      resolve(r.result as T);
    });
  });
}

// ---------------------------------------------------------------------------------------------
// State

type Phase = 'loading' | 'none' | 'ready' | 'live' | 'paused';
let phase: Phase = 'loading';
let open = location.hash === '#open';
let transcriptOpen = false;
let typing = false;
let muted = false;
let busy = false;
let note: { text: string; tone?: 'warn' | 'ok' } | null = null;
let ctl: SessionController | null = null;
let runner: ToolRunner | null = null;
let history: ChatMsg[] = [];
const shield = createShield();
let storeKey = '';
let liveListener: Listener | null = null;
/** The start of a sentence the user hasn't finished (“my email is…”), waiting briefly for the rest. */
let pending: { text: string; timer: ReturnType<typeof setTimeout> } | null = null;
let liveState: 'listening' | 'hearing' | 'thinking' | 'speaking' = 'listening';
let bargedIn = false;
let picked: string[] = [];
let elapsed = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const turns: { who: 'you' | 'ai'; text: string }[] = [];
/** Files the user picked for file questions, kept in memory only until they are attached. */
const files = new Map<string, File>();
/** The form's questions in the user's language, for showing and speaking (the form keeps its words). */
let qt: QuestionTexts = {};
async function refreshTexts() {
  const s = session();
  qt = s && lang !== 'en' ? await translateQuestions(s.questions, lang).catch(() => ({})) : {};
  render();
}
const MAX_FILE = 20 * 1024 * 1024;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/** Opens the file picker for a file question; the pick is read back and attached only after a yes. */
function chooseFile(q: FormQuestion) {
  const input = document.createElement('input');
  input.type = 'file';
  input.onchange = () => {
    const f = input.files?.[0];
    if (!f || !ctl) return;
    if (f.size > MAX_FILE) { note = { text: t.widget.file_too_big, tone: 'warn' }; return render(); }
    files.set(q.id, f);
    addTurn('you', f.name);
    ctl.propose(q.id, f.name, 'typed');
    void readBack(q);
  };
  input.click();
}
/** Conversational: answers are noted as you talk and read back together before anything is filled. */
let confirmMode: 'end' | 'each' = 'end';
/** Let the user interrupt Bolu by talking (headphones). Off: on speakers he would hear himself. */
let bargeIn = false;
let reviewing = false;
const endMode = () => phase === 'live' && confirmMode === 'end';
const proposedList = () => { const s = session(); return s ? s.questions.filter((q) => s.answers[q.id]?.status === 'proposed') : []; };

const bolu = mountBolu($('bolu'), { reduceMotion });
const avatar = mountBolu($('avatar'), { head: true, reduceMotion });
const fabBolu = mountBolu($('fab-bolu'), { head: true, reduceMotion });

const session = () => ctl?.session;
const current = () => { const s = session(); return s ? s.questions[s.currentIndex] : undefined; };
const answerOf = (q: FormQuestion) => session()?.answers[q.id];

// ---------------------------------------------------------------------------------------------
// Rendering

function size() {
  // The page decides how much room there is; with little, the transcript covers the panel (see CSS).
  const roomy = window.top === window ? true : (window.screen.availWidth ?? 1280) > 720;
  $('app').dataset.narrow = String(!roomy);
  const w = !open ? 84 : transcriptOpen && roomy ? 664 : 352;
  const panel = $('panel');
  const h = !open ? 84 : Math.min(window.screen.height, Math.max(panel.scrollHeight + 80, transcriptOpen ? 540 : 0));
  void toPage('resize', { w, h }).catch(() => {});
}

function setBolu(s: BoluState) {
  bolu.setState(s);
  avatar.setState(s === 'happy' ? 'happy' : s === 'speaking' ? 'speaking' : 'idle');
  $('orb').dataset.state = s;
}

function render() {
  const app = $('app');
  app.dataset.open = String(open);
  $('panel').hidden = !open;
  $('fab').setAttribute('aria-expanded', String(open));
  $('fab').setAttribute('aria-label', open ? t.widget.close : t.widget.open);
  $('fab').title = open ? t.widget.close : t.widget.open;
  $('transcript').hidden = !(open && transcriptOpen);
  $('tr-toggle').setAttribute('aria-expanded', String(transcriptOpen));
  $('tr-count').hidden = turns.length === 0;
  $('tr-count').textContent = String(turns.length);
  $('typer').hidden = !typing;
  $('kbd').setAttribute('aria-expanded', String(typing));
  $('mute').setAttribute('aria-pressed', String(muted));
  $('mute').setAttribute('aria-label', muted ? t.widget.unmute : t.widget.mute);
  $('form-title').textContent = session()?.formTitle ?? '';

  const talk = $('talk');
  talk.dataset.live = String(phase === 'live');
  talk.textContent = phase === 'live' ? t.widget.end : t.widget.start;
  talk.toggleAttribute('disabled', phase === 'loading' || phase === 'none');

  // Status line under Bolu.
  const status = phase === 'loading' ? t.widget.reading
    : phase === 'none' ? ''
    : phase === 'live' ? (muted ? t.widget.muted : { listening: t.live.listening, hearing: t.live.hearing, thinking: t.live.thinking, speaking: t.live.speaking }[liveState])
    : busy ? t.live.thinking : '';
  $('status').textContent = status;

  // The question card.
  const q = current();
  const s = session();
  const a = q ? answerOf(q) : undefined;
  if (phase === 'none') {
    $('q-meta').textContent = '';
    $('q-label').textContent = t.widget.none;
  } else if (!q || !s || phase === 'loading') {
    $('q-meta').textContent = '';
    $('q-label').textContent = phase === 'loading' ? '' : t.widget.hello;
  } else if (phase === 'ready') {
    $('q-meta').textContent = fmt(t.widget.found, { n: s.questions.length });
    $('q-label').textContent = t.widget.hello;
  } else {
    $('q-meta').textContent = fmt(t.widget.question, { n: s.currentIndex + 1, total: s.questions.length });
    $('q-label').textContent = qt[q.id]?.label ?? q.label;
  }

  const opts = $('opts');
  opts.replaceChildren();
  const asking = q && (phase === 'live' || phase === 'paused') && q.support !== 'unsupported' && a?.status !== 'proposed';
  if (asking && q.type === 'file') {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = `📎 ${t.widget.choose_file}`;
    b.onclick = () => chooseFile(q);
    opts.append(b);
  }
  if (asking && OPTION_TYPES.includes(q.type)) {
    const list = q.options?.length ? q.options : q.type === 'yesno' ? ['Yes', 'No'] : [];
    list.forEach((o, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      if (isMulti(q)) b.setAttribute('aria-pressed', String(picked.includes(o)));
      const label = q.type === 'yesno' && !q.options?.length ? (o === 'Yes' ? t.common.yes : t.common.no) : qt[q.id]?.options?.[i] ?? o;
      b.innerHTML = list.length <= 9 && q.type !== 'yesno' && q.type !== 'scale' ? `<span class="n">${i + 1}</span>` : '';
      b.append(label);
      b.onclick = () => {
        if (!isMulti(q)) return void submit(o, 'typed');
        picked = picked.includes(o) ? picked.filter((x) => x !== o) : [...picked, o];
        render();
      };
      opts.append(b);
    });
    if (isMulti(q) && picked.length) {
      const use = document.createElement('button');
      use.type = 'button';
      use.className = 'btn small';
      use.textContent = `${t.session.use_selected} (${picked.length})`;
      use.onclick = () => { const v = list.filter((o) => picked.includes(o)).join(', '); picked = []; void submit(v, 'typed'); };
      opts.append(use);
    }
  }
  opts.setAttribute('aria-label', t.session.options);

  if (reviewing && s) {
    $('q-meta').textContent = t.session.review_title;
    $('q-label').textContent = t.session.review_hint;
    opts.replaceChildren();
    const list = document.createElement('ol');
    list.className = 'review';
    for (const x of proposedList()) {
      const li = document.createElement('li');
      const label = document.createElement('span');
      label.className = 'rv-label';
      label.textContent = x.label;
      const value = document.createElement('span');
      value.className = 'rv-value';
      value.textContent = s.answers[x.id]!.normalized ?? '';
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'chip-btn';
      edit.textContent = t.common.edit;
      edit.onclick = () => { reviewing = false; void present(s.questions.indexOf(x)); };
      li.append(label, value, edit);
      list.append(li);
    }
    const fill = document.createElement('button');
    fill.type = 'button';
    fill.className = 'btn yes';
    fill.textContent = `✓ ${fmt(t.session.fill_all, { n: proposedList().length })}`;
    fill.onclick = () => void fillAll();
    opts.append(list, fill);
  }
  const rb = $('readback');
  rb.hidden = reviewing || !(q && a?.status === 'proposed' && a.normalized);
  if (!rb.hidden) {
    $('rb-value').textContent = a!.normalized!;
    $('yes').textContent = `✓ ${t.widget.yes_fill}`;
  }
  const n = $('note');
  const msg = note?.text ?? (q && q.support === 'unsupported' && (phase === 'live' || phase === 'paused') ? t.widget.fill_yourself : a?.status === 'invalid' ? localizeMessage(t, a.error) : '');
  n.textContent = msg;
  n.className = `note ${note?.tone ?? (a?.status === 'invalid' || q?.support === 'unsupported' ? 'warn' : '')}`;

  // Transcript.
  const list = $('tr-list');
  if (list.childElementCount !== turns.length) {
    list.replaceChildren(...turns.map((x) => {
      const li = document.createElement('li');
      li.className = x.who;
      li.textContent = x.text;
      return li;
    }));
    list.scrollTop = list.scrollHeight;
  }
  requestAnimationFrame(size);
}

function addTurn(who: 'you' | 'ai', text: string) {
  turns.push({ who, text });
  if (turns.length > 200) turns.shift();
  render();
}

// ---------------------------------------------------------------------------------------------
// Speaking

const voiceOpts = () => ({ language: lang, rate: 1 });

async function say(text: string) {
  addTurn('ai', text);
  if (phase !== 'live' && !isSpeaking()) {
    // Not in a conversation: still read aloud, as a reply to a tap.
  }
  liveState = 'speaking';
  setBolu('speaking');
  render();
  bargedIn = false;
  liveListener?.setSpeaking(true, bargeIn);
  await speakSentences(text, voiceOpts(), () => bargedIn);
  liveListener?.setSpeaking(false);
  if (liveState === 'speaking') liveState = 'listening';
  setBolu(phase === 'live' ? 'listening' : 'idle');
  render();
}

// ---------------------------------------------------------------------------------------------
// The session

async function persist(s: Session) {
  if (storeKey) await chrome.storage.session.set({ [storeKey]: { session: s, turns: turns.slice(-60) } }).catch(() => {});
}

async function scanPage() {
  phase = 'loading';
  setBolu('thinking');
  render();
  let result: ScanResult;
  try {
    result = await toPage<ScanResult>('scan');
  } catch {
    phase = 'none';
    setBolu('idle');
    return render();
  }
  const questions = toQuestions(result);
  if (!questions.length) {
    phase = 'none';
    setBolu('idle');
    return render();
  }
  storeKey = `session:${formKey(result.url)}`;
  const saved = (await chrome.storage.session.get(storeKey).catch(() => ({})))[storeKey] as { session: Session; turns: typeof turns } | undefined;
  let s: Session;
  if (saved?.session) {
    // Same form again (its next page, or a reload): keep answers, add what's new on this page.
    const known = new Set(saved.session.questions.map((q) => q.id));
    const added = questions.filter((q) => !known.has(q.id));
    s = {
      ...saved.session,
      questions: [...saved.session.questions, ...added],
      answers: { ...saved.session.answers, ...Object.fromEntries(added.map((q) => [q.id, { questionId: q.id, raw: '', status: 'pending' as const, updatedAt: new Date().toISOString() }])) },
      currentIndex: added.length ? saved.session.questions.length : saved.session.currentIndex,
    };
    turns.splice(0, turns.length, ...(saved.turns ?? []));
  } else {
    s = createSession({ id: crypto.randomUUID(), formTitle: result.title || 'Form', questions, language: lang });
  }
  startController(s);
  void refreshTexts();
  phase = Object.values(s.answers).some((a) => a.status !== 'pending') ? 'paused' : 'ready';
  setBolu('idle');
  render();
}

function startController(s: Session) {
  const writer: FieldWriter = {
    write: async (q, v) => {
      if (q.type !== 'file') return void (await toPage('write', { question: q, value: v }));
      const f = files.get(q.id);
      if (!f) throw new Error('Please choose a file');
      await toPage('write', { question: q, value: v, file: { name: f.name, type: f.type, data: toBase64(await f.arrayBuffer()) } });
    },
    read: async (q) => (await toPage<string | null>('read', { question: q })) ?? null,
  };
  ctl = new SessionController(s, writer);
  const host: ToolHost = {
    ask: async (_q, text) => void (await say(text)),
    readBack: async (q, v) => void (await say(`${v}. ${t.session.is_this_right}`)),
    explain: async (q) => fallbackExplanation(q, t),
    highlight: async (q) => void (await toPage('focus', { question: q }).catch(() => {})),
    // Saved profiles live on the website; the widget never reads them.
    requestProfileUse: async () => null,
    offerSave: async () => false,
  };
  runner = new ToolRunner(ctl, host);
  ctl.onState((next) => { void persist(next); render(); });
  ctl.onEvent((e) => {
    if (e.type === 'question.presented') void toPage('focus', { question: ctl!.session.questions.find((q) => q.id === e.questionId) }).catch(() => {});
  });
}

async function present(index: number) {
  const c = ctl;
  if (!c) return;
  stopSpeaking();
  history = [];
  picked = [];
  note = null;
  c.goto(index);
  const q = current()!;
  const a = answerOf(q)!;
  render();
  const parts = [qt[q.id]?.label ?? q.label, q.required ? '' : `(${t.common.optional})`];
  if (a.status === 'proposed' && a.normalized) {
    parts.push(`${a.normalized}. ${t.session.is_this_right}`);
  } else if (q.support === 'unsupported') {
    parts.push(t.widget.fill_yourself, localizeMessage(t, q.supportReason));
  } else if (q.type === 'file') {
    parts.push(t.widget.file_ask);
  } else if (q.options?.length && q.type !== 'yesno') {
    const said = qt[q.id]?.options ?? q.options;
    parts.push(said.length > 8 ? fmt(t.session.options_many, { n: said.length }) : fmt(t.session.options_intro, { list: said.map((o, i) => `${i + 1}, ${o}`).join('; ') }));
    if (isMulti(q)) parts.push(t.session.multi_hint);
  }
  if (q.support === 'unsupported' && phase === 'live') {
    // Never wait on a question AwaazForm can't fill: say so and move on.
    await say([...parts, t.session.moving_on].filter(Boolean).join(' '));
    return advance();
  }
  await say(parts.filter(Boolean).join(' '));
}

function nextOpen(from: number): number {
  const s = session()!;
  const isOpen = (j: number) => {
    const st = s.answers[s.questions[j]!.id]?.status;
    return s.questions[j]!.support !== 'unsupported' && st !== 'verified' && st !== 'skipped' && st !== 'written' && !(endMode() && st === 'proposed');
  };
  const after = s.questions.findIndex((_, j) => j > from && isOpen(j));
  return after >= 0 ? after : s.questions.findIndex((_, j) => j < from && isOpen(j));
}

async function advance() {
  const s = session();
  if (!s) return;
  const target = nextOpen(s.currentIndex);
  if (target >= 0) return present(target);
  if (endMode() && proposedList().length) return startReview();
  setBolu('happy');
  await say(`${t.session.all_done} ${t.session.never_submit}`);
}

async function submit(raw: string, source: 'typed' | 'spoken') {
  const c = ctl, r = runner, q = current();
  if (!c || !r || !q || !raw.trim()) return;
  if (q.support === 'unsupported') { note = { text: t.widget.fill_yourself, tone: 'warn' }; return render(); }
  note = null;
  if (source === 'typed') addTurn('you', raw);
  // An option in the user's language ("छात्र") stands for the form's own option ("Student").
  const trOpts = qt[q.id]?.options;
  if (trOpts && q.options?.length) {
    const hit = matchOption(raw, trOpts);
    if (hit) raw = q.options[trOpts.indexOf(hit)] ?? raw;
  }
  const quick = raw.trim().split(/\s+/).length <= 4 && OPTION_TYPES.includes(q.type) && validateAnswer(q, raw).ok;
  // Clear short answers (email, phone, number, date, a short Latin-letter name) skip the AI too.
  const instant = source === 'spoken' && !OPTION_TYPES.includes(q.type) ? quickValue(q.type, raw, lang, q.label) : null;
  if (instant) raw = instant;
  const needsAi = source === 'spoken' ? !quick && !instant : OPTION_TYPES.includes(q.type) && !validateAnswer(q, raw).ok;
  if (needsAi) {
    busy = true;
    liveState = 'thinking';
    setBolu('thinking');
    render();
    const start = c.session.currentIndex;
    const hum = phase === 'live' ? setTimeout(() => thinkingSound(), 350) : null;
    // Speak the reply sentence by sentence as it streams in.
    let speech = Promise.resolve();
    const onSentence = phase === 'live' ? (s: string) => { if (hum) clearTimeout(hum); speech = speech.then(() => say(s)); } : undefined;
    try {
      const { reply, history: h, proposed, streamed } = await assistantTurn({ ctl: c, runner: r, profileLabel: 'Me', language: lang, shield }, history, raw, onSentence);
      if (hum) clearTimeout(hum);
      await speech;
      history = h;
      busy = false;
      const pending = proposed.filter((id) => c.session.answers[id]?.status === 'proposed');
      if (c.session.answers[q.id]?.status === 'proposed') {
        const others = pending.filter((id) => id !== q.id).length;
        if (others) await say(fmt(t.session.next_proposed, { n: others }));
        return readBack(q);
      }
      if (pending.length) return present(c.session.questions.findIndex((x) => x.id === pending[0]));
      if (c.session.currentIndex !== start) return present(c.session.currentIndex);
      if (reply && !streamed) return void (await say(reply));
      if (reply) return;
    } catch (err) {
      if (hum) clearTimeout(hum);
      busy = false;
      if (err instanceof AiUnavailable) note = { text: `${t.session.ai_unavailable} (${localizeMessage(t, err.message)})`, tone: 'warn' };
    }
  }
  c.propose(q.id, OPTION_TYPES.includes(q.type) ? raw : cleanSpokenAnswer(q.type, raw), source);
  await readBack(q);
}

async function startReview() {
  const s = session();
  const list = proposedList();
  if (!s || !list.length) return void (await say(t.session.nothing_to_fill));
  reviewing = true;
  setBolu('idle');
  render();
  const items = list.map((x) => `${x.label.replace(/[\s:：-]+$/u, '')}: ${s.answers[x.id]!.normalized}`).join('. ');
  await say(`${t.session.review_intro} ${items}. ${fmt(t.session.review_ask, commandWords(lang))}`);
}

/** One yes for the summary: every noted answer still goes through the confirm gate, one by one. */
async function fillAll() {
  const c = ctl;
  if (!c) return;
  const list = proposedList();
  busy = true;
  render();
  let ok = 0;
  for (const x of list) {
    await c.confirm(x.id);
    if (c.session.answers[x.id]?.status === 'verified') ok++;
  }
  busy = false;
  reviewing = false;
  setBolu('happy');
  note = { text: t.widget.filled, tone: 'ok' };
  render();
  if (ok < list.length) return void (await say(fmt(t.session.filled_some, { n: ok, failed: list.length - ok })));
  // Questions still to answer: carry on talking rather than wrapping up.
  const next = nextOpen(-1);
  if (next >= 0) {
    await say(t.session.filled_continue);
    return present(next);
  }
  await say(ok === 1 ? t.session.filled_one : fmt(t.session.filled_all, { n: ok }));
}

async function readBack(q: FormQuestion) {
  const a = answerOf(q);
  setBolu('idle');
  render();
  const shown = (v: string) => v.replace(/[.!?।]+$/u, '');
  if (a?.status === 'proposed' && a.normalized && endMode()) {
    await say(fmt(t.session.got_it, { value: shown(a.normalized) }));
    return advance();
  }
  if (a?.status === 'proposed' && a.normalized) await say(`${shown(a.normalized)}. ${t.session.is_this_right}`);
  else if (a?.status === 'invalid' && a.error) await say(localizeMessage(t, a.error));
}

async function confirm() {
  const c = ctl, q = current();
  if (!c || !q || answerOf(q)?.status !== 'proposed') return;
  busy = true;
  render();
  await c.confirm(q.id);
  busy = false;
  const a = answerOf(q);
  if (a?.status !== 'verified') {
    note = { text: localizeMessage(t, a?.error) || t.session.didnt_take, tone: 'warn' };
    render();
    return void (await say(note.text));
  }
  note = { text: t.widget.filled, tone: 'ok' };
  setBolu('happy');
  render();
  setTimeout(() => void advance(), reduceMotion ? 0 : 600);
}

function change() {
  const q = current();
  if (!ctl || !q) return;
  ctl.edit(q.id);
  void say(t.session.say_again);
}

async function handleSpoken(text: string) {
  const c = ctl, q = current();
  if (!c || !q) return;
  addTurn('you', text);
  const cmd = parseVoiceCommand(text);
  const a = answerOf(q);
  if (reviewing) {
    if (cmd === 'confirm') return fillAll();
    if (cmd === 'reject') return void (await say(t.session.review_change));
    if (cmd === 'finish' || cmd === 'repeat') return startReview();
    if (cmd === 'stop') return endLive();
    return submit(text, 'spoken');
  }
  if (cmd === 'finish') return startReview();
  if (a?.status === 'proposed' && cmd === 'confirm') return confirm();
  if (a?.status === 'proposed' && cmd === 'reject') return change();
  if (a?.status === 'confirmed' && a.error && cmd === 'confirm') return c.retry(q.id);
  switch (cmd) {
    case 'repeat': return a?.status === 'proposed' ? readBack(q) : present(c.session.currentIndex);
    case 'next': return present(Math.min(c.session.currentIndex + 1, c.session.questions.length - 1));
    case 'previous': return present(Math.max(c.session.currentIndex - 1, 0));
    case 'skip': if (!q.required && c.skip(q.id)) return advance(); return;
    case 'explain': return say(fallbackExplanation(q, t));
    case 'stop': return endLive();
  }
  // A file can only come from the user's own pick, never from speech.
  if (q.type === 'file') return void (await say(t.widget.file_ask));
  return submit(text, 'spoken');
}

// ---------------------------------------------------------------------------------------------
// Live conversation

async function startLive() {
  if (!ctl) return;
  if (!voiceInputSupported()) { note = { text: t.session.voice_unavailable, tone: 'warn' }; typing = true; return render(); }
  const handleText = (text: string) => {
    const prev = pending;
    if (prev) { clearTimeout(prev.timer); pending = null; }
    const full = prev ? `${prev.text} ${text}` : text;
    if (looksUnfinished(full)) {
      pending = { text: full, timer: setTimeout(() => { pending = null; void handleSpoken(full); }, 2500) };
      return Promise.resolve();
    }
    return handleSpoken(full);
  };
  const callbacks = {
    onSpeechStart: () => {
      if (isSpeaking()) { bargedIn = true; stopSpeaking(); }
      liveState = 'hearing';
      render();
    },
    onUtterance: async (blob: Blob) => {
      liveListener?.setPaused(true);
      liveState = 'thinking';
      setBolu('thinking');
      render();
      try {
        const q0 = current();
        const sl = sttLanguage(q0, lang); // names and emails are heard as English
        await handleText(await transcribe(blob, sl, sttHint(q0, sl, q0 && qt[q0.id])));
      } catch (err) {
        const e = err as VoiceError;
        if (e.kind === 'ai') note = { text: `${t.session.ai_unavailable} (${localizeMessage(t, e.message)})`, tone: 'warn' };
      } finally {
        liveListener?.setPaused(muted);
        if (liveState !== 'speaking') { liveState = 'listening'; setBolu(phase === 'live' ? 'listening' : 'idle'); }
        render();
      }
    },
    onLevel: (l: number) => bolu.setLevel(l),
  };
  let listener: Listener;
  try {
    listener = await createListener(callbacks, chrome.runtime.getURL('vad/'));
  } catch {
    note = { text: t.widget.mic_blocked, tone: 'warn' };
    typing = true;
    phase = 'paused';
    render();
    return;
  }
  liveListener = listener;
  phase = 'live';
  liveState = 'listening';
  setBolu('listening');
  timer ??= setInterval(() => { elapsed++; $('timer').textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`; }, 1000);
  render();
  const s = session()!;
  const first = nextOpen(s.currentIndex - 1);
  await present(first >= 0 ? first : s.currentIndex);
}

/** Tap Bolu or press Space: he stops talking and listens. Works on speakers, unlike voice barge-in. */
function interrupt() {
  if (!isSpeaking()) return;
  bargedIn = true;
  stopSpeaking();
}

function endLive() {
  if (pending) { clearTimeout(pending.timer); pending = null; }
  liveListener?.stop();
  liveListener = null;
  stopSpeaking();
  if (timer) clearInterval(timer);
  timer = null;
  phase = ctl ? 'paused' : phase;
  setBolu('idle');
  render();
}

// ---------------------------------------------------------------------------------------------
// Wiring

async function init() {
  const stored = await chrome.storage.local.get(['server', 'language', 'confirmMode', 'bargeIn']).catch(() => ({} as Record<string, unknown>));
  if (stored.confirmMode === 'each') confirmMode = 'each';
  bargeIn = stored.bargeIn === true;
  if (typeof stored.server === 'string' && stored.server) server = stored.server;
  setApiBase(server);
  const nav = navigator.language.slice(0, 2) as Language;
  const l = (LANGUAGES as readonly string[]).includes(stored.language as string) ? (stored.language as Language) : LANGUAGES.includes(nav) ? nav : 'en';

  const select = $<HTMLSelectElement>('lang');
  select.replaceChildren(...LANGUAGES.map((x) => {
    const o = document.createElement('option');
    o.value = x;
    o.textContent = LANGUAGE_META[x].native;
    o.lang = x;
    return o;
  }));
  select.value = l;
  select.onchange = async () => {
    await chrome.storage.local.set({ language: select.value });
    await loadLanguage(select.value as Language);
    await refreshTexts();
  };
  $<HTMLInputElement>('server').value = server;

  await loadLanguage(l);
  await scanPage();

  // Keyboard and screen-reader users land in the panel when it opens, and back on Bolu when it closes.
  const orb = $('orb');
  orb.setAttribute('role', 'button');
  orb.tabIndex = 0;
  orb.onclick = interrupt;
  window.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null;
    if (e.code === 'Space' && isSpeaking() && !el?.closest('input, textarea, select, button')) { e.preventDefault(); interrupt(); }
  });
  $('fab').onclick = () => {
    open = !open;
    if (!open) { transcriptOpen = false; endLive(); }
    render();
    requestAnimationFrame(() => (open ? ($('talk') as HTMLButtonElement).disabled ? $('lang') : $('talk') : $('fab')).focus());
  };
  $('talk').onclick = () => {
    if (phase === 'live') return endLive();
    void startLive();
  };
  $('mute').onclick = () => { muted = !muted; liveListener?.setPaused(muted); if (muted) stopSpeaking(); render(); };
  $('tr-toggle').onclick = () => { transcriptOpen = !transcriptOpen; render(); };
  $('tr-close').onclick = () => { transcriptOpen = false; render(); };
  $('tr-copy').onclick = () => void navigator.clipboard.writeText(turns.map((x) => `${x.who === 'you' ? t.session.you : 'AwaazForm'}: ${x.text}`).join('\n')).catch(() => {});
  $('kbd').onclick = () => { typing = !typing; render(); if (typing) $('type-in').focus(); };
  $('typer').onsubmit = (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>('type-in');
    const v = input.value.trim();
    input.value = '';
    if (!v) return;
    if (phase === 'ready') { phase = 'paused'; void present(Math.max(0, nextOpen(-1))).then(() => submit(v, 'typed')); return; }
    void submit(v, 'typed');
  };
  $('yes').onclick = () => void confirm();
  $('change').onclick = () => change();
  $('gear').onclick = () => {
    const s = $('settings');
    s.hidden = !s.hidden;
    $('gear').setAttribute('aria-expanded', String(!s.hidden));
    render();
  };
  $('server-save').onclick = async () => {
    try {
      const u = new URL($<HTMLInputElement>('server').value.trim());
      if (!/^https?:$/.test(u.protocol)) throw new Error('bad');
      server = u.origin;
      await chrome.storage.local.set({ server });
      setApiBase(server);
      note = { text: '✓', tone: 'ok' };
    } catch {
      note = { text: 'http://localhost:3000', tone: 'warn' };
    }
    render();
  };
  $('mic-allow').onclick = () => void chrome.tabs.create({ url: chrome.runtime.getURL('permission.html') });
  $('rescan').onclick = () => void scanPage();
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || !open) return;
    if (transcriptOpen) { transcriptOpen = false; render(); return $('tr-toggle').focus(); }
    open = false; endLive(); render(); $('fab').focus();
  });
}

void init();
