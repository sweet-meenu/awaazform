'use client';

import { createSession, DEMO_FORM, DEMO_FORM_TITLE, type Session } from '@awaazform/core';
import { useEffect, useRef, useState } from 'react';
import { ReplicaSurface } from '@/components/ReplicaSurface';
import { SessionWorkspace } from '@/components/SessionWorkspace';
import { DEMO_KEY, discardSession, loadSession } from '@/lib/session-store';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';

/** Demo form session, filled in the replica. Google Forms by link (/form) reuses this flow. */
export default function SessionPage() {
  const { settings } = useSettings();
  const surfaceRef = useRef<SurfaceHandle | null>(null);
  const [boot, setBoot] = useState<{ session: Session; resumed: boolean; jump?: number } | null>(null);

  useEffect(() => {
    const restored = loadSession(DEMO_KEY);
    const resumed = !!restored && Object.values(restored.answers).some((a) => a.status !== 'pending');
    const jump = Number(new URLSearchParams(window.location.search).get('q'));
    setBoot({
      session: restored ?? createSession({ id: crypto.randomUUID(), formTitle: DEMO_FORM_TITLE, questions: DEMO_FORM, language: settings.language }),
      resumed,
      jump: resumed && Number.isInteger(jump) && jump >= 0 && jump < DEMO_FORM.length ? jump : undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!boot) return null;
  return (
    <SessionWorkspace
      initial={boot.session}
      storageKey={DEMO_KEY}
      startImmediately={boot.resumed}
      jumpTo={boot.jump}
      sourceLabel="Demo form"
      surfaceLabel="Form"
      surfaceRef={surfaceRef}
      surface={<ReplicaSurface handleRef={surfaceRef} />}
      onDiscard={() => { discardSession(DEMO_KEY); window.location.assign('/session'); }}
    />
  );
}
