'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useSettings } from '@/lib/settings';

// Specify's Framer "appear" effect: fade + rise, 0.4s tween, cubic-bezier(.44,0,.56,1).
export const EASE = [0.44, 0, 0.56, 1] as const;

export function Reveal({
  children, y = 20, delay = 0, className, as = 'div',
}: { children: ReactNode; y?: number; delay?: number; className?: string; as?: 'div' | 'li' | 'section' }) {
  const { reduceMotion } = useSettings();
  const Comp = motion[as];
  // Always animate *to* visible: reduce-motion can turn on after first render (it is read in an effect),
  // and an element that started hidden must still end up fully visible.
  return (
    <Comp
      className={className}
      initial={reduceMotion ? false : { opacity: 0.001, y, transformPerspective: 1200 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.4, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/** Animated waveform — the AwaazForm motif. */
export function Wave({ bars = 12, active = true, className = '' }: { bars?: number; active?: boolean; className?: string }) {
  return (
    <span aria-hidden className={`wave ${active ? '' : 'wave-idle'} ${className}`}>
      {Array.from({ length: bars }, (_, i) => <i key={i} />)}
    </span>
  );
}
