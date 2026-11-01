'use client';

import type { FormQuestion, Session, SessionEvent } from '@awaazform/core';
import { formatDate } from '@awaazform/core';
import { motion } from 'motion/react';
import { useEffect, useRef, useState, type RefObject } from 'react';
import type { PdfFiller, PdfPlan } from '@/lib/pdf';
import type { SurfaceHandle } from '@/lib/surface';
import { boxStyle, PdfPages } from './PdfPages';

type Visual = 'idle' | 'typing' | 'proposed' | 'written' | 'verified' | 'failed';

/** PDF preview as a session surface: cursor glide, typing ghost, then the written value with a check. */
export function PdfSurface({ handleRef, bytes, plan, filler }: {
  handleRef: RefObject<SurfaceHandle | null>; bytes: ArrayBuffer; plan: PdfPlan; filler: PdfFiller;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [visual, setVisual] = useState<Record<string, Visual>>({});
  const [ghost, setGhost] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<Record<string, string>>({});
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const reduceRef = useRef(false);
  const timers = useRef<{ delay?: ReturnType<typeof setTimeout>; tick?: ReturnType<typeof setInterval> }>({});

  const qById = (id: string) => plan.questions.find((q) => q.id === id);
  const display = (q: FormQuestion, v: string) => (q.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v) : v);

  const stopTyping = () => {
    clearTimeout(timers.current.delay);
    clearInterval(timers.current.tick);
  };

  const glide = (qid: string) => {
    const el = scrollRef.current?.querySelector<HTMLElement>(`[data-qid="${CSS.escape(qid)}"]`);
    const sc = scrollRef.current;
    if (!el || !sc) return;
    el.scrollIntoView({ block: 'center', behavior: reduceRef.current ? 'auto' : 'smooth' });
    setTimeout(() => {
      const r = el.getBoundingClientRect(), s = sc.getBoundingClientRect();
      setCursor({ x: r.left - s.left + sc.scrollLeft + Math.min(24, r.width / 2), y: r.top - s.top + sc.scrollTop + r.height / 2 });
    }, reduceRef.current ? 0 : 300);
  };

  const typeIn = (qid: string, text: string) => {
    stopTyping();
    if (reduceRef.current) {
      setGhost((g) => ({ ...g, [qid]: text }));
      setVisual((v) => ({ ...v, [qid]: 'proposed' }));
      return;
    }
    setVisual((v) => ({ ...v, [qid]: 'typing' }));
    let i = 0;
    const step = Math.max(1, Math.ceil(text.length / 30));
    timers.current.tick = setInterval(() => {
      i = Math.min(text.length, i + step);
      setGhost((g) => ({ ...g, [qid]: text.slice(0, i) }));
      if (i >= text.length) {
        clearInterval(timers.current.tick);
        setVisual((v) => ({ ...v, [qid]: 'proposed' }));
      }
    }, 35);
  };

  const shownValue = async (q: FormQuestion) => filler.shown(q) ?? (await filler.read(q)) ?? '';

  useEffect(() => {
    handleRef.current = {
      write: async (q, v) => {
        stopTyping();
        await filler.write(q, v);
        const s = await shownValue(q);
        setShown((m) => ({ ...m, [q.id]: display(q, s) }));
        setGhost((g) => ({ ...g, [q.id]: '' }));
        setVisual((m) => ({ ...m, [q.id]: 'written' }));
      },
      read: (q) => filler.read(q),
      onEvent: (e: SessionEvent) => {
        if (e.type === 'question.presented') { setActive(e.questionId); glide(e.questionId); }
        if (e.type === 'fill.proposed') {
          setActive(e.questionId);
          glide(e.questionId);
          const q = qById(e.questionId);
          stopTyping();
          timers.current.delay = setTimeout(() => typeIn(e.questionId, q ? display(q, e.value) : e.value), reduceRef.current ? 0 : 400);
        }
        if (e.type === 'fill.verified') {
          setGhost((g) => ({ ...g, [e.questionId]: '' }));
          setVisual((m) => ({ ...m, [e.questionId]: e.ok ? 'verified' : 'failed' }));
        }
      },
      focus: (q) => { setActive(q.id); glide(q.id); },
      sync: async (s: Session, reduce: boolean) => {
        reduceRef.current = reduce;
        // Restore verified answers into the PDF (e.g. after reload).
        for (const a of Object.values(s.answers)) {
          const q = qById(a.questionId);
          if (q && a.status === 'verified' && a.normalized) {
            try {
              await filler.write(q, a.normalized);
              const sv = await shownValue(q);
              setShown((m) => ({ ...m, [q.id]: display(q, sv) }));
              setVisual((m) => ({ ...m, [q.id]: 'verified' }));
            } catch { /* leave it for the user to redo */ }
          }
        }
      },
      setReduceMotion: (r) => { reduceRef.current = r; },
    };
    return () => { stopTyping(); handleRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filler, plan]);

  return (
    <div ref={scrollRef} className="relative h-[min(76vh,760px)] overflow-auto p-4" style={{ background: 'var(--bg-subtle)', scrollbarWidth: 'thin' }}>
      <PdfPages bytes={bytes} pages={plan.layout.pages} overlay={(page, scale) =>
        plan.questions.map((q) => {
          const b = plan.layout.boxes[q.id];
          if (!b || b.page !== page) return null;
          const vis = visual[q.id] ?? 'idle';
          const isActive = active === q.id;
          const value = vis === 'typing' || vis === 'proposed' ? ghost[q.id] : shown[q.id];
          const chosen = (vis === 'written' || vis === 'verified') && b.optionBoxes ? (shown[q.id] ?? '').split(', ') : [];
          return (
            <div key={q.id}>
              <div data-qid={q.id} title={q.label}
                className="absolute flex items-center overflow-hidden rounded-[3px] px-0.5 transition-[box-shadow,background] duration-300"
                style={{
                  ...boxStyle(b.box, plan.layout.pages[page]!, scale),
                  background: isActive ? 'rgba(98,77,227,0.10)' : vis === 'failed' ? 'rgba(255,212,0,0.25)' : 'transparent',
                  boxShadow: isActive ? '0 0 0 2px var(--violet-500)' : vis === 'verified' ? '0 0 0 1px rgba(0,135,58,0.5)' : 'none',
                  fontSize: Math.max(8, Math.min(13, b.box.h * scale * 0.62)),
                  color: vis === 'typing' || vis === 'proposed' ? 'var(--violet-600)' : '#0d1a73',
                  fontStyle: vis === 'typing' || vis === 'proposed' ? 'italic' : 'normal',
                  fontFamily: 'Helvetica, Arial, sans-serif',
                }}>
                {!b.optionBoxes && <span className="truncate">{value}</span>}
                {vis === 'verified' && <span aria-label="verified" className="absolute -top-2 -right-2 grid h-4 w-4 place-items-center rounded-full text-[9px] text-white" style={{ background: 'var(--green-600)' }}>✓</span>}
              </div>
              {b.optionBoxes && Object.entries(b.optionBoxes).map(([opt, ob]) => (
                <div key={opt} className="absolute grid place-items-center rounded-[2px] font-bold" aria-hidden
                  style={{ ...boxStyle(ob, plan.layout.pages[page]!, scale), color: '#0d1a73', fontSize: ob.h * scale * 0.9,
                    boxShadow: isActive ? '0 0 0 1.5px var(--violet-300)' : 'none' }}>
                  {chosen.includes(opt) ? 'X' : (vis === 'proposed' && (ghost[q.id] ?? '').split(', ').includes(opt) ? <span style={{ color: 'var(--violet-500)' }}>X</span> : '')}
                </div>
              ))}
            </div>
          );
        })
      } />
      {cursor && (
        <motion.div aria-hidden className="pointer-events-none absolute top-0 left-0 z-10" animate={{ x: cursor.x, y: cursor.y }}
          transition={reduceRef.current ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <svg width="22" height="22" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.3))' }}>
            <path d="M4 2l16 9-7 2-3 7z" fill="var(--violet-500)" stroke="white" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}
