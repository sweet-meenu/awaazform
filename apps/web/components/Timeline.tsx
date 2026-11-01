'use client';

import { describeCall, type FormQuestion, type SessionEvent } from '@awaazform/core';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, type KeyboardEvent } from 'react';
import { useSettings } from '@/lib/settings';
import { EASE } from './Motion';

export type CardTone = 'info' | 'pending' | 'ok' | 'warn' | 'bad';
export interface TimelineCard {
  id: string;
  title: string;
  detail?: string;
  tone: CardTone;
  actor: 'ai' | 'you' | 'app';
  at: number;
}

/** Turns session events into plain-language cards (FR-24). Tool calls update in place by callId. */
export function applyEvent(cards: TimelineCard[], e: SessionEvent, questions: FormQuestion[]): TimelineCard[] {
  const label = (id: string) => questions.find((q) => q.id === id)?.label ?? id;
  const add = (c: Omit<TimelineCard, 'id' | 'at'>, id: string = crypto.randomUUID()) => [...cards, { ...c, id, at: Date.now() }];

  switch (e.type) {
    case 'question.presented':
      return add({ title: `Now on “${label(e.questionId)}”`, tone: 'info', actor: 'app' });
    case 'tool.called': {
      const args = (e.args ?? {}) as Record<string, unknown>;
      const q = typeof args.questionId === 'string' ? label(args.questionId) : undefined;
      return add({ title: describeCall(e.name, args, q), detail: `AI used ${e.name}`, tone: 'pending', actor: 'ai' }, e.callId);
    }
    case 'tool.result': {
      const existing = cards.find((c) => c.id === e.callId);
      if (existing) return cards.map((c) => (c.id === e.callId ? { ...c, tone: e.ok ? 'ok' : 'bad', detail: e.ok ? c.detail : `Refused: ${e.summary}` } : c));
      return add({ title: e.ok ? e.summary : `AI call refused (${e.name})`, detail: e.ok ? undefined : e.summary, tone: e.ok ? 'ok' : 'bad', actor: 'ai' }, e.callId);
    }
    case 'fill.proposed':
      return add({ title: `Waiting for your confirmation: “${e.value}”`, detail: `${label(e.questionId)} · from ${e.source}`, tone: 'pending', actor: e.source === 'profile' ? 'app' : 'you' });
    case 'fill.confirmed':
      return add({ title: `You confirmed “${e.value}”`, detail: label(e.questionId), tone: 'ok', actor: 'you' });
    case 'fill.written':
      return add({ title: 'Filled into the form', detail: label(e.questionId), tone: 'info', actor: 'app' });
    case 'fill.verified':
      return add(e.ok
        ? { title: 'Checked: the form shows your answer', detail: label(e.questionId), tone: 'ok', actor: 'app' }
        : { title: "Didn't take. Retry or tell me", detail: `${label(e.questionId)}${e.actual !== undefined ? ` · field shows “${e.actual}”` : ''}`, tone: 'warn', actor: 'app' });
    case 'profile.offered':
      return add({ title: `Offered your saved ${e.key.replace(/_/g, ' ')}`, tone: 'info', actor: 'app' });
    case 'profile.saved':
      return add({ title: `Saved your ${e.key.replace(/_/g, ' ')} for next time`, tone: 'ok', actor: 'you' });
    case 'error':
      return add({ title: e.message, tone: e.recoverable ? 'warn' : 'bad', actor: 'app' });
  }
}

const TONE: Record<CardTone, { dot: string; label: string }> = {
  info: { dot: 'var(--ink-400)', label: 'Info' },
  pending: { dot: 'var(--violet-500)', label: 'Pending' },
  ok: { dot: 'var(--green-600)', label: 'Done' },
  warn: { dot: 'var(--amber-700)', label: 'Needs attention' },
  bad: { dot: 'var(--red-600)', label: 'Refused' },
};

const ACTOR = { ai: 'AI', you: 'You', app: 'AwaazForm' } as const;

export function Timeline({ cards, title }: { cards: TimelineCard[]; title: string }) {
  const { reduceMotion } = useSettings();
  const listRef = useRef<HTMLOListElement>(null);
  const latest = cards[cards.length - 1];

  // FR-29: arrow keys move between cards; Home/End jump.
  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>('[data-card]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const go = (n: number) => { e.preventDefault(); items[Math.max(0, Math.min(items.length - 1, n))]?.focus(); };
    if (e.key === 'ArrowDown') go(i + 1);
    else if (e.key === 'ArrowUp') go(i - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(items.length - 1);
  };

  return (
    <section aria-labelledby="timeline-h" className="card flex min-h-0 flex-col p-0">
      <h2 id="timeline-h" className="border-b border-line px-5 py-4 text-base">{title}</h2>
      {/* Screen readers hear each new step once. */}
      <p className="sr-only" aria-live="polite" aria-atomic>{latest ? `${ACTOR[latest.actor]}: ${latest.title}` : ''}</p>
      {cards.length === 0 ? (
        <p className="px-5 py-6 text-sm text-muted">Every step will appear here as it happens.</p>
      ) : (
        <ol ref={listRef} onKeyDown={onKeyDown} className="flex max-h-[520px] flex-col overflow-y-auto px-3 py-2" aria-label="Timeline, newest first">
          <AnimatePresence initial={false}>
            {[...cards].reverse().map((c, i) => (
              <motion.li
                key={c.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE }}
              >
                <div
                  data-card
                  tabIndex={i === 0 ? 0 : -1}
                  className="flex gap-3 rounded-[var(--r-12)] px-2 py-2.5 text-sm"
                >
                  <span className="relative mt-1.5 h-2.5 w-2.5 flex-none rounded-full" style={{ background: TONE[c.tone].dot }} role="img" aria-label={TONE[c.tone].label}>
                    {c.tone === 'pending' && !reduceMotion && (
                      <span className="absolute inset-0 rounded-full" style={{ background: TONE[c.tone].dot, animation: 'ring 1.6s var(--ease-out) infinite' }} />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium break-words">{c.title}</span>
                    <span className="block text-xs text-muted">
                      {ACTOR[c.actor]}{c.detail ? ` · ${c.detail}` : ''}
                    </span>
                  </span>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
      )}
    </section>
  );
}
