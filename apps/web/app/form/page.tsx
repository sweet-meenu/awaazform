'use client';

import { createSession, googlePrefillUrl, type FormQuestion, type Session } from '@awaazform/core';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Reveal, Wave } from '@/components/Motion';
import { ReplicaSurface } from '@/components/ReplicaSurface';
import { SessionWorkspace } from '@/components/SessionWorkspace';
import { discardSession, GFORM_KEY, loadSession } from '@/lib/session-store';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';

interface ScannedForm { formId: string; title: string; description: string; questions: FormQuestion[] }
type Step =
  | { s: 'paste'; error?: string; url?: string }
  | { s: 'reading'; url: string }
  | { s: 'fill'; session: Session; resumed: boolean };

/** Google Forms by link: scan the public form, fill the replica, hand back a pre-filled link. */
export default function FormPage() {
  const { settings } = useSettings();
  const surfaceRef = useRef<SurfaceHandle | null>(null);
  const [step, setStep] = useState<Step | null>(null);

  const scan = async (url: string) => {
    setStep({ s: 'reading', url });
    try {
      const res = await fetch('/api/gform', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) });
      const data = (await res.json()) as ScannedForm & { error?: string };
      if (!res.ok) return setStep({ s: 'paste', url, error: data.error ?? 'AwaazForm couldn’t read this form.' });
      const session = createSession({ id: crypto.randomUUID(), formTitle: data.title, questions: data.questions, language: settings.language });
      discardSession(GFORM_KEY);
      setStep({ s: 'fill', session, resumed: false });
    } catch {
      setStep({ s: 'paste', url, error: 'AwaazForm couldn’t reach the server. Check your connection and try again.' });
    }
  };

  // FR-22: resume a stored session; a ?url= link starts a new one.
  useEffect(() => {
    const url = new URLSearchParams(window.location.search).get('url');
    if (url) return void scan(url);
    const saved = loadSession(GFORM_KEY);
    if (!saved) return setStep({ s: 'paste' });
    setStep({ s: 'fill', session: saved, resumed: Object.values(saved.answers).some((a) => a.status !== 'pending') });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!step) return null;

  if (step.s === 'fill') {
    return (
      <SessionWorkspace
        key={step.session.id}
        initial={step.session}
        storageKey={GFORM_KEY}
        startImmediately={step.resumed}
        sourceLabel="Google Form"
        surfaceLabel="Form"
        surfaceRef={surfaceRef}
        surface={<ReplicaSurface handleRef={surfaceRef} />}
        actions={(s) => <OpenInGoogle session={s} />}
        intro={
          <p className="rounded-[var(--r-12)] px-3 py-2 text-sm" style={{ background: 'var(--violet-100)', color: 'var(--accent-text)' }}>
            When you’re done, choose <b>Open in Google Forms</b>. Your confirmed answers will be filled in there; check them and press Submit yourself.
          </p>
        }
        onDiscard={() => { discardSession(GFORM_KEY); window.history.replaceState(null, '', '/form'); setStep({ s: 'paste' }); }}
      />
    );
  }

  return <PasteView reading={step.s === 'reading'} initialUrl={step.url} error={step.s === 'paste' ? step.error : undefined} onSubmit={scan} />;
}

function OpenInGoogle({ session }: { session: Session }) {
  const ready = Object.values(session.answers).filter((a) => a.status === 'verified').length;
  const href = googlePrefillUrl(session);
  if (!href) return null;
  return (
    <a className={ready ? 'btn' : 'btn btn-ghost'} href={href} target="_blank" rel="noopener noreferrer"
      aria-label={`Open in Google Forms with ${ready} confirmed answer${ready === 1 ? '' : 's'} (opens in a new tab)`}>
      Open in Google Forms <span className="chip !min-h-0 !px-2 !py-0 !text-xs">{ready}</span> <span aria-hidden>↗</span>
    </a>
  );
}

function PasteView({ reading, initialUrl, error, onSubmit }: { reading: boolean; initialUrl?: string; error?: string; onSubmit: (url: string) => void }) {
  const [url, setUrl] = useState(initialUrl ?? '');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };
  return (
    <div className="container-x max-w-3xl py-12 md:py-16">
      <Reveal className="text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Google Forms</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,2.75rem)]">Fill a Google Form<br />by voice</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted">Paste the form’s link. Answer each question by voice or text, then open the real form with your answers filled in and press Submit yourself.</p>
      </Reveal>

      <Reveal delay={0.08}>
        <form onSubmit={submit} className="card mt-10 grid gap-4 p-6 md:p-8">
          <label htmlFor="form-url" className="font-semibold">Google Form link</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="form-url" type="url" inputMode="url" className="field-input flex-1" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://forms.gle/… or docs.google.com/forms/…" autoComplete="off" spellCheck={false} disabled={reading}
              aria-invalid={!!error} aria-describedby={error ? 'url-err' : 'url-hint'} />
            <button type="submit" className="btn btn-lg" disabled={reading || !url.trim()}>{reading ? 'Reading…' : 'Read the form →'}</button>
          </div>
          {reading ? (
            <p role="status" className="flex items-center gap-3 text-sm text-muted"><span style={{ color: 'var(--accent)' }}><Wave bars={6} /></span> Finding the questions…</p>
          ) : (
            <p id="url-hint" className="text-sm text-muted">Use the link you’d share with people filling the form. Forms that need a Google sign-in can’t be read.</p>
          )}
          {error && <p id="url-err" role="alert" className="rounded-[var(--r-12)] p-4 text-sm font-medium" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>{error}</p>}
        </form>
      </Reveal>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ['1', 'Paste the link', 'AwaazForm reads the form’s questions. Nothing about you is sent.'],
          ['2', 'Answer and confirm', 'Each answer is read back and filled only after you say yes.'],
          ['3', 'Open and submit', 'The real Google Form opens with your answers. You check it and press Submit.'],
        ].map(([n, t, b], i) => (
          <Reveal as="li" key={n} delay={0.1 + i * 0.06} className="card grid content-start gap-2 p-5">
            <span className="chip chip-accent w-fit">{n}</span>
            <p className="font-semibold">{t}</p>
            <p className="text-sm text-muted">{b}</p>
          </Reveal>
        ))}
      </ol>
      <p className="mt-6 text-center text-xs text-muted">File uploads, grids and “Other” answers stay on the Google Form for you to complete.</p>
    </div>
  );
}
