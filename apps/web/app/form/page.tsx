'use client';

import { createSession, googlePrefillUrl, microsoftFormUrl, microsoftPrefillUrl, parseMicrosoftFormUrl, type FormQuestion, type Session } from '@awaazform/core';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Dialog } from '@/components/Dialog';
import { Reveal, Wave } from '@/components/Motion';
import { ReplicaSurface } from '@/components/ReplicaSurface';
import { SessionWorkspace } from '@/components/SessionWorkspace';
import { discardSession, GFORM_KEY, loadSession } from '@/lib/session-store';
import { fmt, localizeMessage, Rich } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';
import { scanForm } from '@/lib/form-scan';

type Platform = 'google' | 'microsoft';
const platformOf = (s: Session): Platform => (s.questions.some((q) => q.source.kind === 'ms-form') ? 'microsoft' : 'google');
type Step =
  | { s: 'paste'; error?: string; url?: string }
  | { s: 'reading'; url: string }
  | { s: 'fill'; session: Session; resumed: boolean; jump?: number };

/** Google or Microsoft Forms by link: scan the public form, fill the replica, hand the answers back. */
export default function FormPage() {
  const { settings, t } = useSettings();
  const surfaceRef = useRef<SurfaceHandle | null>(null);
  const [step, setStep] = useState<Step | null>(null);

  const scan = async (url: string) => {
    setStep({ s: 'reading', url });
    try {
      const r = await scanForm(url);
      if ('error' in r) return setStep({ s: 'paste', url, error: r.error });
      const data = r.form;
      const session = createSession({ id: crypto.randomUUID(), formTitle: data.title, questions: data.questions, language: settings.language });
      discardSession(GFORM_KEY);
      setStep({ s: 'fill', session, resumed: false });
    } catch {
      setStep({ s: 'paste', url, error: t.form.offline });
    }
  };

  // FR-22: resume a stored session; a ?url= link starts a new one.
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get('shared');
    if (shared) return setStep({ s: 'paste', url: shared });
    const url = new URLSearchParams(window.location.search).get('url');
    if (url) return void scan(url);
    void loadSession(GFORM_KEY).then((saved) => {
      if (!saved) return setStep({ s: 'paste' });
      const resumed = Object.values(saved.answers).some((a) => a.status !== 'pending');
      const q = new URLSearchParams(window.location.search).get('q');
      const jump = q === null ? NaN : Number(q);
      setStep({ s: 'fill', session: saved, resumed, jump: resumed && Number.isInteger(jump) && jump >= 0 && jump < saved.questions.length ? jump : undefined });
    });
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
        jumpTo={step.jump}
        sourceLabel={platformOf(step.session) === 'microsoft' ? t.form.microsoft_form : t.form.google_form}
        surfaceLabel={t.form.surface}
        surfaceRef={surfaceRef}
        surface={<ReplicaSurface handleRef={surfaceRef} />}
        actions={(s) => (platformOf(s) === 'microsoft' ? <OpenInMicrosoft session={s} /> : <OpenInGoogle session={s} />)}
        intro={
          <p className="rounded-[var(--r-12)] px-3 py-2 text-sm" style={{ background: 'var(--violet-100)', color: 'var(--accent-text)' }}>
            <Rich text={platformOf(step.session) === 'microsoft'
              ? microsoftPrefillUrl(step.session) !== null ? t.form.intro_ms_prefill : t.form.intro_ms_copy
              : t.form.intro_google} />
          </p>
        }
        onDiscard={() => { discardSession(GFORM_KEY); window.history.replaceState(null, '', '/form'); setStep({ s: 'paste' }); }}
      />
    );
  }

  return <PasteView reading={step.s === 'reading'} initialUrl={step.url} error={step.s === 'paste' ? step.error : undefined} onSubmit={scan} />;
}

function OpenInGoogle({ session }: { session: Session }) {
  const { t } = useSettings();
  const ready = Object.values(session.answers).filter((a) => a.status === 'verified').length;
  const href = googlePrefillUrl(session);
  if (!href) return null;
  return (
    <a className={ready ? 'btn' : 'btn btn-ghost'} href={href} target="_blank" rel="noopener noreferrer">
      {t.form.open_google}
      <span className="chip !min-h-0 !px-2 !py-0 !text-xs"><span aria-hidden>{ready}</span><span className="sr-only">{fmt(t.form.confirmed_count, { n: ready })}</span></span>
      <span aria-hidden>↗</span><span className="sr-only"> {t.common.new_tab}</span>
    </a>
  );
}

function OpenInMicrosoft({ session }: { session: Session }) {
  const { t } = useSettings();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const verified = session.questions.filter((q) => session.answers[q.id]?.status === 'verified');
  const first = session.questions.find((q) => q.source.kind === 'ms-form');
  if (!first || first.source.kind !== 'ms-form') return null;
  const prefill = microsoftPrefillUrl(session);
  const formUrl = first.source.url || microsoftFormUrl(first.source.formId);
  const badge = <span className="chip !min-h-0 !px-2 !py-0 !text-xs"><span aria-hidden>{verified.length}</span><span className="sr-only">{fmt(t.form.confirmed_count, { n: verified.length })}</span></span>;
  if (prefill) {
    return (
      <a className={verified.length ? 'btn' : 'btn btn-ghost'} href={prefill} target="_blank" rel="noopener noreferrer">
        {t.form.open_ms} {badge}<span aria-hidden>↗</span><span className="sr-only"> {t.common.new_tab}</span>
      </a>
    );
  }
  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch { /* clipboard blocked: the value is on screen to copy by hand */ }
  };
  return (
    <>
      <button type="button" className={verified.length ? 'btn' : 'btn btn-ghost'} onClick={() => setOpen(true)}>{t.form.your_answers} {badge}</button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t.form.copy_title}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>{t.common.close}</button>
          <a className="btn" href={formUrl} target="_blank" rel="noopener noreferrer">{t.form.open_form} <span aria-hidden>↗</span><span className="sr-only"> {t.common.new_tab}</span></a>
        </>}>
        <p>{t.form.copy_body}</p>
        {verified.length === 0 ? <p className="text-muted">{t.form.copy_none}</p> : (
          <ol className="grid gap-2">
            {verified.map((q) => {
              const v = session.answers[q.id]!.normalized ?? '';
              return (
                <li key={q.id} className="flex items-center justify-between gap-3 rounded-[var(--r-12)] border border-line p-3">
                  <span className="min-w-0"><span className="block text-xs text-muted">{q.label}</span><span className="font-semibold break-words">{v}</span></span>
                  <button type="button" className="btn btn-ghost flex-none" onClick={() => void copy(q.id, v)} aria-label={fmt(t.form.copy_answer, { label: q.label })}>
                    {copied === q.id ? t.common.copied : t.common.copy}
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </Dialog>
    </>
  );
}

function PasteView({ reading, initialUrl, error, onSubmit }: { reading: boolean; initialUrl?: string; error?: string; onSubmit: (url: string) => void }) {
  const { t } = useSettings();
  const f = t.form;
  const [url, setUrl] = useState(initialUrl ?? '');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };
  return (
    <div className="container-x max-w-3xl py-12 md:py-16">
      <Reveal className="text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">{f.eyebrow}</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,2.75rem)]"><Rich text={f.title} /></h1>
        <p className="mx-auto mt-3 max-w-lg text-muted">{f.lead}</p>
      </Reveal>

      <Reveal delay={0.08}>
        <form onSubmit={submit} className="card mt-10 grid gap-4 p-6 md:p-8">
          <label htmlFor="form-url" className="font-semibold">{f.link_label}</label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input id="form-url" type="text" inputMode="url" className="field-input flex-1" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder={f.placeholder} dir="ltr" autoComplete="off" spellCheck={false} disabled={reading}
              aria-invalid={!!error} aria-describedby={error ? 'url-err' : 'url-hint'} />
            <button type="submit" className="btn btn-lg" disabled={reading || !url.trim()}>{reading ? f.reading : f.read}</button>
          </div>
          {reading ? (
            <p role="status" className="flex items-center gap-3 text-sm text-muted"><span style={{ color: 'var(--accent)' }}><Wave bars={6} /></span> {f.finding}</p>
          ) : (
            <p id="url-hint" className="text-sm text-muted">{f.hint}</p>
          )}
          {error && <p id="url-err" role="alert" className="rounded-[var(--r-12)] p-4 text-sm font-medium" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>{localizeMessage(t, error)}</p>}
        </form>
      </Reveal>

      <ol className="mt-10 grid gap-4 md:grid-cols-3">
        {[[f.s1_t, f.s1_b], [f.s2_t, f.s2_b], [f.s3_t, f.s3_b]].map(([title, b], i) => (
          <Reveal as="li" key={i} delay={0.1 + i * 0.06} className="card grid content-start gap-2 p-5">
            <span className="chip chip-accent w-fit">{i + 1}</span>
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted">{b}</p>
          </Reveal>
        ))}
      </ol>
      <p className="mt-6 text-center text-xs text-muted">{f.leftovers}</p>
    </div>
  );
}
