'use client';

import { buildReport, reportToMarkdown, type ReadinessReport, type ReportItem } from '@awaazform/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Reveal } from '@/components/Motion';
import { loadLastSession } from '@/lib/session-store';

// FR-20 / FR-21: Submission Readiness Report with export, copy and print.
export default function ReportPage() {
  const [report, setReport] = useState<ReadinessReport | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  const [base, setBase] = useState('/session');

  useEffect(() => {
    const s = loadLastSession();
    setReport(s ? buildReport(s) : null);
    if (s?.questions[0]?.source.kind.startsWith('pdf')) setBase('/pdf');
  }, []);

  if (report === undefined) return null;
  if (report === null) {
    return (
      <div className="container-x py-16 text-center">
        <h1 className="text-3xl">No session yet</h1>
        <p className="mt-2 text-muted">Start a session to see what is ready and what still needs attention.</p>
        <Link href="/session" className="btn mt-6">Start a session</Link>
      </div>
    );
  }

  const md = reportToMarkdown(report);
  const download = () => {
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'awaazform-report.md' });
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container-x max-w-3xl py-12">
      <Reveal>
        <p className="text-sm text-muted">Readiness report</p>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)]">{report.formTitle}</h1>
      </Reveal>
      <Reveal delay={0.08}>
        <p role="status" className="mt-4 rounded-[var(--r-16)] border p-4 font-medium"
          style={report.ready
            ? { borderColor: 'var(--green-600)', background: 'var(--green-100)', color: 'var(--green-600)' }
            : { borderColor: 'var(--amber-700)', background: 'var(--amber-100)', color: 'var(--amber-700)' }}>
          {report.ready
            ? 'Ready for you to review and submit. AwaazForm never submits forms for you.'
            : 'Not ready yet. Fix the items below, then review and submit the form yourself.'}
        </p>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2 print:hidden">
        <button type="button" className="btn" onClick={download}>Export Markdown</button>
        <button type="button" className="btn btn-ghost" onClick={async () => { await navigator.clipboard.writeText(md); setCopied(true); }}>
          {copied ? 'Copied' : 'Copy to clipboard'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => window.print()}>Print</button>
        <Link href={base} className="btn btn-ghost">Back to session</Link>
      </div>

      <div className="mt-10 grid gap-8">
        <Group title="Missing" items={report.missing} tone="warn" base={base} />
        <Group title="Invalid" items={report.invalid} tone="warn" base={base} />
        <Group title="Manual review" items={report.manualReview} tone="warn" base={base} />
        <Group title="Not supported (fill these yourself)" items={report.unsupported} tone="info" base={base} />
        <Group title="Completed" items={report.completed} tone="ok" base={base} />
      </div>
    </div>
  );
}

function Group({ title, items, tone, base }: { title: string; items: ReportItem[]; tone: 'ok' | 'warn' | 'info'; base: string }) {
  if (items.length === 0) return null;
  return (
    <section aria-labelledby={`h-${title}`}>
      <h2 id={`h-${title}`} className="mb-3 flex items-center gap-2 text-xl">
        {title} <span className={`chip ${tone === 'ok' ? 'chip-ok' : tone === 'warn' ? 'chip-warn' : ''}`}>{items.length}</span>
      </h2>
      <ul className="card divide-y divide-[var(--border)] p-0">
        {items.map((i) => (
          <li key={i.questionId} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
            <span>
              <span className="font-medium">Q{i.index + 1}. {i.label}</span>
              {i.value && <span className="text-muted"> · {i.value}</span>}
              {i.note && <span className="block text-xs text-muted">{i.note}</span>}
            </span>
            {tone !== 'ok' && <Link href={base === '/session' ? `/session?q=${i.index}` : base} className="text-sm underline underline-offset-4 print:hidden">Go to question</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
