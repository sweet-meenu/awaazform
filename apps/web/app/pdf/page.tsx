'use client';

import { createSession, type Session } from '@awaazform/core';
import { useEffect, useRef, useState, type DragEvent } from 'react';
import { Reveal, Wave } from '@/components/Motion';
import { BoxEditor } from '@/components/pdf/BoxEditor';
import { PdfSurface } from '@/components/pdf/PdfSurface';
import { SessionWorkspace } from '@/components/SessionWorkspace';
import { db } from '@/lib/db';
import {
  aiCandidates, analyzePdf, flatPlan, heuristicCandidates, MAX_PDF_BYTES, PdfFiller, placeBoxes,
  type Candidate, type PageSize, type PdfLayout, type PdfPlan, type TextItem,
} from '@/lib/pdf';
import { discardSession, loadSession, PDF_KEY } from '@/lib/session-store';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';

const FILE_ID = 'current-pdf';

type Step =
  | { s: 'upload'; error?: string }
  | { s: 'reading'; name: string }
  | { s: 'review'; bytes: ArrayBuffer; fileName: string; title: string; pages: PageSize[]; items: TextItem[]; candidates: Candidate[]; boxes: PdfLayout['boxes']; via: 'ai' | 'heuristic'; aiError?: string }
  | { s: 'fill'; bytes: ArrayBuffer; plan: PdfPlan; filler: PdfFiller; session: Session; resumed: boolean };

export default function PdfPage() {
  const { settings } = useSettings();
  const [step, setStep] = useState<Step>({ s: 'upload' });
  const surfaceRef = useRef<SurfaceHandle | null>(null);

  // FR-22: resume a PDF session stored in this browser.
  useEffect(() => {
    (async () => {
      const stored = await db.files.get(FILE_ID);
      const saved = loadSession(PDF_KEY);
      if (!stored || !saved) return;
      const plan = stored.plan as PdfPlan;
      const filler = await PdfFiller.create(stored.bytes, plan);
      setStep({ s: 'fill', bytes: stored.bytes, plan, filler, session: saved, resumed: Object.values(saved.answers).some((a) => a.status !== 'pending') });
    })().catch(() => {});
  }, []);

  const startFill = async (bytes: ArrayBuffer, plan: PdfPlan) => {
    const filler = await PdfFiller.create(bytes, plan);
    const session = createSession({ id: crypto.randomUUID(), formTitle: plan.title, questions: plan.questions, language: settings.language });
    discardSession(PDF_KEY);
    await db.files.put({ id: FILE_ID, name: plan.fileName, bytes, plan, createdAt: new Date().toISOString() });
    setStep({ s: 'fill', bytes, plan, filler, session, resumed: false });
  };

  const onFile = async (file: File) => {
    if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return setStep({ s: 'upload', error: 'Please choose a PDF file.' });
    if (file.size > MAX_PDF_BYTES) return setStep({ s: 'upload', error: 'This PDF is larger than 10 MB.' });
    setStep({ s: 'reading', name: file.name });
    const bytes = await file.arrayBuffer();
    const a = await analyzePdf(bytes, file.name);
    if (a.kind === 'unsupported') return setStep({ s: 'upload', error: a.reason });
    if (a.kind === 'acroform') return startFill(bytes, a.plan);

    // Flat PDF: ask AI to find questions; fall back to a simple heuristic.
    let candidates: Candidate[];
    let via: 'ai' | 'heuristic' = 'ai';
    let aiError: string | undefined;
    try {
      candidates = await aiCandidates(a.items, a.pages);
      if (candidates.length === 0) throw new Error('AI found no questions');
    } catch (err) {
      candidates = heuristicCandidates(a.items);
      via = 'heuristic';
      aiError = (err as Error).message;
    }
    setStep({ s: 'review', bytes, fileName: a.fileName, title: a.title, pages: a.pages, items: a.items, candidates, boxes: placeBoxes(candidates, a.items, a.pages), via, aiError });
  };

  if (step.s === 'fill') {
    const download = async () => {
      const out = await step.filler.export();
      const url = URL.createObjectURL(new Blob([out as BlobPart], { type: 'application/pdf' }));
      const a = Object.assign(document.createElement('a'), { href: url, download: step.plan.fileName.replace(/\.pdf$/i, '') + '-filled.pdf' });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return (
      <SessionWorkspace
        key={step.session.id}
        initial={step.session}
        storageKey={PDF_KEY}
        startImmediately={step.resumed}
        sourceLabel={step.plan.kind === 'acroform' ? 'Fillable PDF' : 'Printed PDF · approximate placement'}
        surfaceLabel="PDF"
        surfaceRef={surfaceRef}
        surface={<PdfSurface handleRef={surfaceRef} bytes={step.bytes} plan={step.plan} filler={step.filler} />}
        actions={<button type="button" className="btn" onClick={download}>Download PDF</button>}
        intro={step.plan.kind === 'flat' ? (
          <p className="rounded-[var(--r-12)] px-3 py-2 text-sm" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
            Printed PDF: answers are drawn at the boxes you placed, so check the downloaded file before you submit it. Answers in Hindi script can&apos;t be drawn yet.
          </p>
        ) : undefined}
        onDiscard={async () => { discardSession(PDF_KEY); await db.files.delete(FILE_ID); setStep({ s: 'upload' }); }}
      />
    );
  }

  if (step.s === 'review') {
    const included = step.candidates.filter((c) => c.include).length;
    return (
      <div className="container-x py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">Printed PDF · step 2 of 3</p>
            <h1 className="text-[clamp(1.5rem,3vw,2rem)]">Check the questions and boxes</h1>
            <p className="mt-1 max-w-2xl text-muted">
              {step.via === 'ai'
                ? `AI found ${step.candidates.length} places to fill in “${step.title}”. Fix anything that looks wrong; placement is approximate.`
                : `Found ${step.candidates.length} likely questions in “${step.title}” using simple rules${step.aiError ? ` (AI unavailable: ${step.aiError})` : ''}. Please review them carefully.`}
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setStep({ s: 'upload' })}>Choose another file</button>
            <button type="button" className="btn" disabled={included === 0}
              onClick={() => startFill(step.bytes, flatPlan(step.fileName, step.title, step.pages, step.candidates, step.boxes, step.items))}>
              Start filling ({included}) →
            </button>
          </div>
        </div>
        <BoxEditor bytes={step.bytes} pages={step.pages} candidates={step.candidates} boxes={step.boxes}
          onChange={(candidates) => setStep({ ...step, candidates })} onBoxes={(boxes) => setStep({ ...step, boxes })} />
      </div>
    );
  }

  return <UploadView reading={step.s === 'reading' ? step.name : null} error={step.s === 'upload' ? step.error : undefined} onFile={onFile} />;
}

function UploadView({ reading, error, onFile }: { reading: string | null; error?: string; onFile: (f: File) => void }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };
  return (
    <div className="container-x max-w-3xl py-12 md:py-16">
      <Reveal className="text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">PDF forms</p>
        <h1 className="mt-2 text-[clamp(2rem,4vw,2.75rem)]">Fill a PDF by voice</h1>
        <p className="mx-auto mt-3 max-w-lg text-muted">Your PDF stays in this browser. AwaazForm fills it, and you download it and submit it yourself.</p>
      </Reveal>

      <Reveal delay={0.08}>
        <div
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)} onDrop={onDrop}
          className="mt-10 grid justify-items-center gap-4 rounded-[var(--r-24)] border-2 border-dashed p-10 text-center transition-colors"
          style={{ borderColor: over ? 'var(--violet-500)' : 'var(--border)', background: over ? 'var(--violet-100)' : 'var(--gradient-panel)' }}>
          {reading ? (
            <div className="grid justify-items-center gap-3" role="status">
              <span style={{ color: 'var(--accent)' }}><Wave bars={10} /></span>
              <p className="font-medium">Reading “{reading}”…</p>
              <p className="text-sm text-muted">Finding the questions. This takes a few seconds.</p>
            </div>
          ) : (
            <>
              <span aria-hidden className="grid h-14 w-14 place-items-center rounded-[var(--r-16)] text-2xl" style={{ background: 'var(--violet-100)', color: 'var(--accent-text)' }}>⇪</span>
              <div>
                <p className="text-lg font-semibold">Drop a PDF here</p>
                <p className="text-sm text-muted">or</p>
              </div>
              <button type="button" className="btn btn-lg" onClick={() => inputRef.current?.click()}>Choose a PDF</button>
              <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" aria-label="Choose a PDF" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }} />
              <p className="text-xs text-muted">Up to 10 MB</p>
            </>
          )}
        </div>
      </Reveal>

      {error && <p role="alert" className="mt-4 rounded-[var(--r-12)] p-4 text-sm font-medium" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>{error}</p>}

      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ['Fillable PDFs', 'PDFs with form fields are filled directly, field by field.', 'chip-ok'],
          ['Printed PDFs', 'You check where each answer goes; placement is approximate.', 'chip-warn'],
          ['Not supported', 'Scanned pages, XFA forms and password-protected PDFs.', ''],
        ].map(([t, b, c], i) => (
          <Reveal as="li" key={t} delay={0.1 + i * 0.06} className="card grid content-start gap-2 p-5">
            <span className={`chip w-fit ${c}`}>{t}</span>
            <p className="text-sm text-muted">{b}</p>
          </Reveal>
        ))}
      </ul>
      <p className="mt-6 text-center text-xs text-muted">For printed PDFs, the page text (not your answers) is sent to Groq to find the questions.</p>
    </div>
  );
}
