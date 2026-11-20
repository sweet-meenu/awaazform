'use client';

import { createSession, type Session } from '@awaazform/core';
import { useEffect, useRef, useState } from 'react';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { ShareDocument } from '@/components/documents/ShareDocument';
import { BoxEditor } from '@/components/pdf/BoxEditor';
import { PdfSurface } from '@/components/pdf/PdfSurface';
import { SessionWorkspace } from '@/components/SessionWorkspace';
import { db } from '@/lib/db';
import {
  aiCandidates, analyzePdf, flatPlan, heuristicCandidates, MAX_PDF_BYTES, PdfFiller, placeBoxes, splitCaptioned, tableTicks, addSignatures,
  type Candidate, type PageSize, type PdfLayout, type PdfPlan, type TextItem,
} from '@/lib/pdf';
import { discardSession, loadSession, PDF_KEY } from '@/lib/session-store';
import { fmt, localizeMessage, Rich } from '@/lib/i18n';
import { getFile, putFile } from '@/lib/secure-store';
import { useSettings } from '@/lib/settings';
import type { SurfaceHandle } from '@/lib/surface';

const FILE_ID = 'current-pdf';

type Step =
  | { s: 'upload'; error?: string }
  | { s: 'reading'; name: string }
  | { s: 'review'; bytes: ArrayBuffer; fileName: string; title: string; pages: PageSize[]; items: TextItem[]; candidates: Candidate[]; boxes: PdfLayout['boxes']; via: 'ai' | 'heuristic'; aiError?: string }
  | { s: 'fill'; bytes: ArrayBuffer; plan: PdfPlan; filler: PdfFiller; session: Session; resumed: boolean };

/** One document flow (upload → review → fill). `file` starts it; otherwise it resumes a stored session. */
export function PdfFlow({ file, onPick }: { file?: File; onPick: (f: File) => void }) {
  const { settings, t } = useSettings();
  const D = t.pdf;
  const [step, setStep] = useState<Step>({ s: 'upload' });
  const surfaceRef = useRef<SurfaceHandle | null>(null);

  // FR-22: resume a PDF session stored in this browser.
  useEffect(() => {
    if (file) return void onFile(file);
    (async () => {
      const stored = await getFile(FILE_ID);
      const saved = await loadSession(PDF_KEY);
      if (!stored || !saved) return;
      const plan = stored.plan as PdfPlan;
      const filler = await PdfFiller.create(stored.bytes, plan);
      setStep({ s: 'fill', bytes: stored.bytes, plan, filler, session: saved, resumed: Object.values(saved.answers).some((a) => a.status !== 'pending') });
    })().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startFill = async (bytes: ArrayBuffer, plan: PdfPlan) => {
    const filler = await PdfFiller.create(bytes, plan);
    const session = createSession({ id: crypto.randomUUID(), formTitle: plan.title, questions: plan.questions, language: settings.language });
    discardSession(PDF_KEY);
    await putFile({ id: FILE_ID, name: plan.fileName, bytes, plan, createdAt: new Date().toISOString() });
    setStep({ s: 'fill', bytes, plan, filler, session, resumed: false });
  };

  const onFile = async (file: File) => {
    if (file.type && file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) return setStep({ s: 'upload', error: D.not_pdf });
    if (file.size > MAX_PDF_BYTES) return setStep({ s: 'upload', error: localizeMessage(t, 'This PDF is larger than 10 MB.') });
    setStep({ s: 'reading', name: file.name });
    const bytes = await file.arrayBuffer();
    const a = await analyzePdf(bytes, file.name);
    if (a.kind === 'unsupported') return setStep({ s: 'upload', error: localizeMessage(t, a.reason) });
    if (a.kind === 'acroform') return startFill(bytes, a.plan);

    // Flat PDF: ask AI to find questions; fall back to a simple heuristic.
    let candidates: Candidate[];
    let via: 'ai' | 'heuristic' = 'ai';
    let aiError: string | undefined;
    try {
      const r = await aiCandidates(a.items, a.pages);
      candidates = r.candidates;
      // Some pages may have used the simple rules; say so, but keep what the AI found.
      if (r.fallbackPages.length) aiError = r.error;
      if (candidates.length === 0) throw new Error('AI found no questions');
    } catch (err) {
      candidates = heuristicCandidates(a.items);
      via = 'heuristic';
      aiError = (err as Error).message;
    }
    candidates = tableTicks(addSignatures(splitCaptioned(candidates, a.items, a.rules), a.items), a.items, a.rects);
    setStep({ s: 'review', bytes, fileName: a.fileName, title: a.title, pages: a.pages, items: a.items, candidates, boxes: placeBoxes(candidates, a.items, a.pages, a.rules, a.rects), via, aiError });
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
        sourceLabel={step.plan.kind === 'acroform' ? D.fillable : D.printed}
        surfaceLabel={D.surface}
        surfaceRef={surfaceRef}
        surface={<PdfSurface handleRef={surfaceRef} bytes={step.bytes} plan={step.plan} filler={step.filler} />}
        actions={() => <><button type="button" className="btn" onClick={download}>{D.download}</button>
          <ShareDocument makeFile={async () => new File([await step.filler.export() as BlobPart], step.plan.fileName.replace(/\.pdf$/i, '') + '-filled.pdf', { type: 'application/pdf' })} />
        </>}
        intro={step.plan.kind === 'flat' ? (
          <p className="rounded-[var(--r-12)] px-3 py-2 text-sm" style={{ background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
            {D.printed_note}
          </p>
        ) : undefined}
        onDiscard={async () => { discardSession(PDF_KEY); await db.files.delete(FILE_ID); setStep({ s: 'upload' }); }}
      />
    );
  }

  if (step.s === 'review') {
    const included = step.candidates.filter((c) => c.include).length;
    return (
      <div className="container-wide py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{D.review_eyebrow}</p>
            <h1 className="text-[clamp(1.5rem,3vw,2rem)]">{D.review_title}</h1>
            <p className="mt-1 max-w-2xl text-muted">
              {fmt(step.via === 'ai' ? D.review_ai : step.aiError ? D.review_rules_err : D.review_rules,
                { n: step.candidates.length, title: step.title, error: localizeMessage(t, step.aiError) })}
            {step.via === 'ai' && step.aiError && <span className="mt-1 block text-sm" style={{ color: 'var(--amber-700)' }}>{D.review_partial}</span>}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost" onClick={() => setStep({ s: 'upload' })}>{t.common.choose_another}</button>
            <button type="button" className="btn" disabled={included === 0}
              onClick={() => startFill(step.bytes, flatPlan(step.fileName, step.title, step.pages, step.candidates, step.boxes, step.items))}>
              {fmt(D.start, { n: included })}
            </button>
          </div>
        </div>
        <BoxEditor bytes={step.bytes} pages={step.pages} candidates={step.candidates} boxes={step.boxes}
          onChange={(candidates) => setStep({ ...step, candidates })} onBoxes={(boxes) => setStep({ ...step, boxes })} />
      </div>
    );
  }

  return <DocumentUpload reading={step.s === 'reading' ? step.name : null} error={step.s === 'upload' ? step.error : undefined} onFile={onPick} />;
}
