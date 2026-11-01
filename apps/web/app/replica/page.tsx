'use client';

import type { FormQuestion, SessionEvent } from '@awaazform/core';
import { formatDate } from '@awaazform/core';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { FromReplica, ToReplica } from '@/lib/replica-bridge';
import { EASE } from '@/components/Motion';

type Visual = 'idle' | 'typing' | 'proposed' | 'written' | 'verified' | 'failed';

/**
 * Replica form (D2). Mirrors the scanned form's structure. Real DOM inputs receive writes and are
 * read back for verification. Animation: cursor glide → typing → read-back bubble → check.
 */
export default function ReplicaPage() {
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [visual, setVisual] = useState<Record<string, Visual>>({});
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [active, setActive] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ x: number; y: number; show: boolean }>({ x: 24, y: 24, show: false });
  const [reduce, setReduce] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const reply = (m: FromReplica) => window.parent.postMessage(m, window.location.origin);

  const fieldEl = (qid: string) => rootRef.current?.querySelector<HTMLElement>(`[data-qid="${CSS.escape(qid)}"]`) ?? null;

  const glideTo = useCallback((qid: string) => {
    const el = fieldEl(qid);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    const target = el.querySelector<HTMLElement>('[data-input]') ?? el;
    // Wait a frame for scroll to settle before measuring.
    setTimeout(() => {
      const r = target.getBoundingClientRect();
      setCursor({ x: Math.min(r.left + Math.min(r.width - 20, 40), window.innerWidth - 32), y: r.top + r.height / 2, show: true });
    }, reduce ? 0 : 250);
  }, [reduce]);

  const typeDelay = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Cancels any typing animation, so it can't overwrite a write that already landed. */
  const stopTyping = () => {
    if (typeDelay.current) clearTimeout(typeDelay.current);
    if (typingTimer.current) clearInterval(typingTimer.current);
    typeDelay.current = typingTimer.current = null;
  };

  const typeIn = useCallback((qid: string, text: string) => {
    stopTyping();
    if (reduce) {
      setPreview((p) => ({ ...p, [qid]: text }));
      setVisual((v) => ({ ...v, [qid]: 'proposed' }));
      return;
    }
    setVisual((v) => ({ ...v, [qid]: 'typing' }));
    let i = 0;
    const step = Math.max(1, Math.ceil(text.length / 40)); // long answers type faster
    typingTimer.current = setInterval(() => {
      i = Math.min(text.length, i + step);
      setPreview((p) => ({ ...p, [qid]: text.slice(0, i) }));
      if (i >= text.length) {
        clearInterval(typingTimer.current!);
        setVisual((v) => ({ ...v, [qid]: 'proposed' }));
      }
    }, 35);
  }, [reduce]);

  const onEvent = useCallback((e: SessionEvent) => {
    switch (e.type) {
      case 'question.presented':
        setActive(e.questionId);
        glideTo(e.questionId);
        break;
      case 'fill.proposed':
        setActive(e.questionId);
        glideTo(e.questionId);
        stopTyping();
        typeDelay.current = setTimeout(() => typeIn(e.questionId, e.value), reduce ? 0 : 450);
        break;
      case 'fill.verified':
        setPreview((p) => ({ ...p, [e.questionId]: '' }));
        setVisual((v) => ({ ...v, [e.questionId]: e.ok ? 'verified' : 'failed' }));
        break;
    }
  }, [glideTo, typeIn, reduce]);

  /** Writes into the real DOM controls. */
  const write = useCallback((qid: string, value: string): { ok: boolean; error?: string } => {
    const q = questions.find((x) => x.id === qid);
    if (!q || !fieldEl(qid)) return { ok: false, error: "Couldn't find this field" };
    if (q.support === 'unsupported') return { ok: false, error: 'This field is not filled by AwaazForm' };
    stopTyping();
    setValues((v) => ({ ...v, [qid]: value }));
    setPreview((p) => ({ ...p, [qid]: '' }));
    setVisual((v) => ({ ...v, [qid]: 'written' }));
    return { ok: true };
  }, [questions]);

  /** Reads back from the DOM, not from React state, so verification checks what is really shown. */
  const read = (qid: string): string | null => {
    const el = fieldEl(qid);
    const q = questions.find((x) => x.id === qid);
    if (!el || !q) return null;
    if (['choice', 'scale', 'yesno'].includes(q.type)) {
      return el.querySelector<HTMLInputElement>('input[type=radio]:checked')?.value ?? '';
    }
    if (q.type === 'checkbox' || q.type === 'multichoice') {
      return [...el.querySelectorAll<HTMLInputElement>('input[type=checkbox]:checked')].map((i) => i.value).join(', ');
    }
    return el.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>('[data-input]')?.value ?? '';
  };

  // The listener is registered once and announces `ready` once. Handlers are read through a ref,
  // because re-announcing `ready` makes the session re-send `init`, which would wipe fresh writes.
  const handleRef = useRef<(m: ToReplica) => void>(() => {});
  handleRef.current = (m: ToReplica) => {
      switch (m.type) {
        case 'init':
          setTitle(m.title);
          setQuestions(m.questions);
          setValues(m.values);
          setVisual(Object.fromEntries(Object.keys(m.values).map((k) => [k, 'verified' as Visual])));
          break;
        case 'motion':
          setReduce(m.reduce);
          break;
        case 'event':
          onEvent(m.event);
          break;
        case 'focus':
          setActive(m.questionId);
          glideTo(m.questionId);
          break;
        case 'write': {
          const r = write(m.questionId, m.value);
          // Let React commit the DOM before acknowledging, so a following read sees the value.
          requestAnimationFrame(() => requestAnimationFrame(() => reply({ type: 'written', id: m.id, ...r })));
          break;
        }
        case 'read':
          reply({ type: 'readResult', id: m.id, value: read(m.questionId) });
          break;
      }
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      handleRef.current(e.data as ToReplica);
    };
    window.addEventListener('message', onMessage);
    reply({ type: 'ready' });
    return () => window.removeEventListener('message', onMessage);
  }, []);

  return (
    <div ref={rootRef} className="min-h-screen overflow-x-hidden px-4 py-6 md:px-6" style={{ background: 'var(--bg-subtle)' }} aria-label="Replica of the form being filled">
      <style>{'html{scrollbar-width:thin;overflow-x:hidden}'}</style>
      <div className="mx-auto grid max-w-xl gap-3">
        <header className="rounded-[var(--r-16)] border border-line bg-surface p-5" style={{ borderTop: '8px solid var(--violet-500)' }}>
          <h1 className="text-xl">{title || 'Loading form…'}</h1>
          <p className="mt-1 text-xs text-muted">Replica: AwaazForm fills this copy so you can watch. * Required</p>
        </header>

        {questions.map((q, i) => {
          const vis = visual[q.id] ?? 'idle';
          const committed = values[q.id] ?? '';
          const pv = preview[q.id] ?? '';
          const isActive = active === q.id;
          return (
            <section
              key={q.id}
              data-qid={q.id}
              className="relative rounded-[var(--r-16)] border bg-surface p-5 transition-[box-shadow,border-color] duration-[400ms]"
              style={{
                borderColor: vis === 'failed' ? 'var(--amber-700)' : isActive ? 'var(--violet-500)' : 'var(--border)',
                boxShadow: isActive ? '0 0 0 3px var(--violet-100)' : 'none',
                opacity: q.support === 'unsupported' ? 0.65 : 1,
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <label htmlFor={`f-${q.id}`} className="text-sm font-medium">
                  {i + 1}. {q.label} {q.required && <span aria-label="required" style={{ color: 'var(--red-600)' }}>*</span>}
                </label>
                <StatusMark vis={vis} />
              </div>
              {q.helpText && <p className="-mt-2 mb-3 text-xs text-muted">{q.helpText}</p>}

              <Control q={q} value={committed} />

              {/* Ghost preview while typing / awaiting confirmation */}
              <AnimatePresence>
                {(vis === 'typing' || vis === 'proposed') && pv && (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="mt-3 rounded-[var(--r-12)] border border-dashed px-3 py-2 text-sm"
                    style={{ borderColor: 'var(--violet-500)', background: 'var(--violet-100)' }}
                  >
                    <span className="text-xs text-muted">Proposed: </span>
                    <span className="font-medium">{q.type === 'date' && vis === 'proposed' ? formatDate(pv) : pv}</span>
                    {vis === 'typing' && <span aria-hidden className="ml-0.5 animate-pulse">▍</span>}
                    {vis === 'proposed' && (
                      <motion.span
                        initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="chip chip-accent ml-2"
                      >
                        Is this right?
                      </motion.span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {vis === 'failed' && <p className="mt-2 text-xs font-medium" style={{ color: 'var(--amber-700)' }}>Didn&apos;t take. Retry or tell me.</p>}
              {q.support === 'unsupported' && <p className="mt-2 text-xs text-muted">Not filled by AwaazForm: {q.supportReason}</p>}
            </section>
          );
        })}

        <div className="flex justify-between rounded-[var(--r-16)] border border-line bg-surface p-4">
          {/* Present for realism; AwaazForm never activates it (§9.1). */}
          <button type="button" className="btn" disabled aria-disabled title="You submit the real form yourself">Submit</button>
          <span className="self-center text-xs text-muted">You press Submit on the real form yourself.</span>
        </div>
      </div>

      {/* Animated cursor */}
      {cursor.show && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 z-50"
          animate={{ x: cursor.x, y: cursor.y }}
          transition={reduce ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.3))' }}>
            <path d="M4 2l16 9-7 2-3 7z" fill="var(--violet-500)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}

function StatusMark({ vis }: { vis: Visual }) {
  if (vis === 'verified') return <span className="chip chip-ok" role="img" aria-label="Verified">✓ Verified</span>;
  if (vis === 'written') return <span className="chip">Checking…</span>;
  if (vis === 'failed') return <span className="chip chip-warn">Didn&apos;t take</span>;
  return null;
}

/** Real DOM controls. Read-only to the user here; this is a mirror, the user answers in the session panel. */
function Control({ q, value }: { q: FormQuestion; value: string }) {
  const id = `f-${q.id}`;
  if (q.support === 'unsupported') {
    return <input id={id} data-input type="file" disabled className="text-sm" />;
  }
  switch (q.type) {
    case 'paragraph':
      return <textarea id={id} data-input readOnly value={value} rows={3} className="field-input" />;
    case 'date':
      return <input id={id} data-input readOnly type="date" value={value} className="field-input" />;
    case 'time':
      return <input id={id} data-input readOnly type="time" value={value} className="field-input" />;
    case 'dropdown':
      return (
        <select id={id} data-input disabled value={value} className="field-input">
          <option value="">Choose</option>
          {q.options?.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'choice':
    case 'scale':
    case 'yesno':
      return (
        <div role="radiogroup" aria-labelledby={id} className={q.type === 'scale' ? 'flex gap-4' : 'grid gap-2'}>
          {(q.options ?? ['Yes', 'No']).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input type="radio" name={q.id} value={o} checked={value === o} onChange={() => {}} tabIndex={-1} /> {o}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
    case 'multichoice': {
      const selected = value ? value.split(', ') : [];
      return (
        <div className="grid gap-2">
          {q.options?.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input type="checkbox" value={o} checked={selected.includes(o)} onChange={() => {}} tabIndex={-1} /> {o}
            </label>
          ))}
        </div>
      );
    }
    default:
      return <input id={id} data-input readOnly value={value} type={q.type === 'email' ? 'email' : q.type === 'phone' ? 'tel' : 'text'} className="field-input" />;
  }
}
