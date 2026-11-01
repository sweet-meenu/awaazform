// Pure session reducer — the Confidence Loop state machine (G2).
import type { Answer, AnswerStatus, FillSource, FormQuestion, Language, Session } from './types';

export type SessionAction =
  | { type: 'goto'; index: number }
  | { type: 'listening'; questionId: string }
  | { type: 'propose'; questionId: string; raw: string; normalized: string; source: FillSource; translated?: string }
  | { type: 'invalid'; questionId: string; raw: string; error: string }
  | { type: 'confirm'; questionId: string }
  | { type: 'edit'; questionId: string }
  | { type: 'written'; questionId: string }
  | { type: 'verified'; questionId: string; ok: boolean; actual?: string }
  | { type: 'skip'; questionId: string };

/** Legal transitions. Anything else is ignored, so a write can never skip confirmation. */
const ALLOWED: Record<SessionAction['type'], AnswerStatus[] | '*'> = {
  goto: '*',
  listening: ['pending', 'invalid', 'proposed', 'skipped', 'verified', 'written', 'confirmed', 'listening'],
  propose: ['pending', 'listening', 'invalid', 'proposed', 'skipped', 'verified', 'written', 'confirmed'],
  invalid: ['pending', 'listening', 'invalid', 'proposed', 'skipped'],
  confirm: ['proposed'],
  edit: ['proposed', 'invalid', 'confirmed', 'written', 'verified', 'skipped'],
  written: ['confirmed'],
  verified: ['written'],
  skip: ['pending', 'listening', 'invalid', 'proposed'],
};

export function createSession(input: {
  id: string; formTitle: string; questions: FormQuestion[];
  profileId?: string; language?: Language; now?: string;
}): Session {
  const now = input.now ?? new Date().toISOString();
  return {
    id: input.id,
    formTitle: input.formTitle,
    profileId: input.profileId ?? 'me',
    language: input.language ?? 'en',
    liveMode: false,
    questions: input.questions,
    answers: Object.fromEntries(
      input.questions.map((q) => [q.id, { questionId: q.id, raw: '', status: 'pending', updatedAt: now } satisfies Answer]),
    ),
    currentIndex: 0,
    createdAt: now,
  };
}

export function sessionReducer(s: Session, a: SessionAction, now = new Date().toISOString()): Session {
  if (a.type === 'goto') {
    const index = Math.max(0, Math.min(a.index, s.questions.length - 1));
    return index === s.currentIndex ? s : { ...s, currentIndex: index };
  }

  const prev = s.answers[a.questionId];
  if (!prev) return s;
  const allowed = ALLOWED[a.type];
  if (allowed !== '*' && !allowed.includes(prev.status)) return s;

  const q = s.questions.find((x) => x.id === a.questionId);
  if (a.type === 'skip' && q?.required) return s; // FR-10: skip optional fields only

  let next: Answer;
  switch (a.type) {
    case 'listening':
      next = { ...prev, status: 'listening', error: undefined };
      break;
    case 'propose':
      next = { ...prev, raw: a.raw, normalized: a.normalized, translated: a.translated, source: a.source, status: 'proposed', error: undefined };
      break;
    case 'invalid':
      next = { ...prev, raw: a.raw, normalized: undefined, status: 'invalid', error: a.error };
      break;
    case 'confirm':
      next = { ...prev, status: 'confirmed' };
      break;
    case 'edit':
      next = { ...prev, status: 'pending', error: undefined };
      break;
    case 'written':
      next = { ...prev, status: 'written' };
      break;
    case 'verified':
      next = a.ok
        ? { ...prev, status: 'verified', error: undefined }
        : { ...prev, status: 'confirmed', error: `Didn't take${a.actual !== undefined ? ` (field shows “${a.actual}”)` : ''}. Retry or tell me` };
      break;
    case 'skip':
      next = { ...prev, status: 'skipped', error: undefined };
      break;
  }
  return { ...s, answers: { ...s.answers, [a.questionId]: { ...next, updatedAt: now } } };
}

export function currentQuestion(s: Session): FormQuestion | undefined {
  return s.questions[s.currentIndex];
}
