'use client';

import type { Session } from '@awaazform/core';
import { useEffect, useRef, type RefObject } from 'react';
import { ReplicaBridge } from '@/lib/replica-bridge';
import type { SurfaceHandle } from '@/lib/surface';

/** The replica iframe (D2) as a session surface. */
export function ReplicaSurface({ handleRef }: { handleRef: RefObject<SurfaceHandle | null> }) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const bridge = new ReplicaBridge(frameRef.current!);
    let last: { s: Session; reduce: boolean } | null = null;
    let ready = false;

    const init = () => {
      if (!last || !ready) return;
      const { s, reduce } = last;
      const values = Object.fromEntries(
        Object.values(s.answers).filter((a) => a.status === 'verified' && a.normalized).map((a) => [a.questionId, a.normalized!]),
      );
      bridge.send({ type: 'init', title: s.formTitle, questions: s.questions, values });
      bridge.send({ type: 'motion', reduce });
      const q = s.questions[s.currentIndex];
      if (q) bridge.send({ type: 'focus', questionId: q.id });
    };
    const offReady = bridge.onReady(() => { ready = true; init(); });

    handleRef.current = {
      write: (q, v) => bridge.write(q, v),
      read: (q) => bridge.read(q),
      onEvent: (event) => bridge.send({ type: 'event', event }),
      focus: (q) => bridge.send({ type: 'focus', questionId: q.id }),
      sync: (s, reduce) => { last = { s, reduce }; init(); },
      setReduceMotion: (reduce) => bridge.send({ type: 'motion', reduce }),
    };
    return () => {
      offReady();
      bridge.dispose();
      handleRef.current = null;
    };
  }, [handleRef]);

  return <iframe ref={frameRef} src="/replica" title="Replica of the form being filled" className="block h-[min(76vh,760px)] w-full border-0" />;
}
