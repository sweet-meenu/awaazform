// Submission Readiness Report and Form Rescue (FR-19 – FR-21).
import type { Session } from './types';

export interface ReportItem {
  questionId: string;
  index: number;
  label: string;
  value?: string;
  note?: string;
}

export interface ReadinessReport {
  formTitle: string;
  generatedAt: string;
  completed: ReportItem[];
  missing: ReportItem[];
  invalid: ReportItem[];
  unsupported: ReportItem[];
  manualReview: ReportItem[];
  ready: boolean;
}

export function buildReport(s: Session, now = new Date().toISOString()): ReadinessReport {
  const r: ReadinessReport = {
    formTitle: s.formTitle, generatedAt: now,
    completed: [], missing: [], invalid: [], unsupported: [], manualReview: [], ready: false,
  };

  s.questions.forEach((q, index) => {
    const a = s.answers[q.id];
    const item: ReportItem = { questionId: q.id, index, label: q.label };

    if (q.support === 'unsupported') {
      r.unsupported.push({ ...item, note: q.supportReason });
      return;
    }
    if (a?.status === 'verified') {
      r.completed.push({ ...item, value: a.normalized });
      if (q.support !== 'supported') r.manualReview.push({ ...item, value: a.normalized, note: q.supportReason });
      return;
    }
    if (a?.status === 'invalid' || (a?.status === 'confirmed' && a.error)) {
      r.invalid.push({ ...item, value: a.raw, note: a.error });
      return;
    }
    if (a?.status === 'written') {
      r.manualReview.push({ ...item, value: a.normalized, note: 'Filled but not yet verified' });
      return;
    }
    if (q.required && a?.status !== 'skipped') {
      r.missing.push({ ...item, note: a?.status === 'proposed' ? 'Waiting for your confirmation' : undefined });
    }
  });

  r.ready = r.missing.length === 0 && r.invalid.length === 0;
  return r;
}

export function reportToMarkdown(r: ReadinessReport): string {
  const section = (title: string, items: ReportItem[]) =>
    items.length === 0
      ? ''
      : `\n## ${title} (${items.length})\n\n${items
          .map((i) => `- Q${i.index + 1}. ${i.label}${i.value ? ` — ${i.value}` : ''}${i.note ? ` _(${i.note})_` : ''}`)
          .join('\n')}\n`;

  return [
    `# Readiness report: ${r.formTitle}`,
    '',
    r.ready
      ? '**Ready for you to review and submit.** AwaazForm never submits forms for you.'
      : '**Not ready yet.** Fix the items below, then review and submit the form yourself.',
    section('Missing', r.missing),
    section('Invalid', r.invalid),
    section('Manual review', r.manualReview),
    section('Not supported (fill these yourself)', r.unsupported),
    section('Completed', r.completed),
    `\n_Generated ${new Date(r.generatedAt).toLocaleString()}_\n`,
  ].join('\n');
}
