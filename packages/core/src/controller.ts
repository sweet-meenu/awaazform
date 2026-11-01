// Session controller: owns state, emits events, and holds the confirm gate (D3, FR-16, FR-25).
import { sessionReducer, type SessionAction } from './session';
import type { FillSource, FormQuestion, Session, SessionEvent } from './types';
import { validateAnswer } from './validate';
import { isNeverFill } from './safety';

/** Writes to a real form surface (extension tab, PDF, replica). */
export interface FieldWriter {
  write(q: FormQuestion, value: string): Promise<void>;
  /** Reads the field back for verification (FR-17). `null` if the field cannot be found. */
  read(q: FormQuestion): Promise<string | null>;
}

export type ProposeResult = { ok: true; normalized: string } | { ok: false; error: string };

type Listener = (e: SessionEvent) => void;
type StateListener = (s: Session) => void;

export class SessionController {
  private state: Session;
  private events = new Set<Listener>();
  private states = new Set<StateListener>();

  constructor(initial: Session, private writer: FieldWriter) {
    this.state = initial;
  }

  get session(): Session {
    return this.state;
  }

  onEvent(fn: Listener): () => void {
    this.events.add(fn);
    return () => this.events.delete(fn);
  }

  onState(fn: StateListener): () => void {
    this.states.add(fn);
    return () => this.states.delete(fn);
  }

  emit(e: SessionEvent): void {
    this.events.forEach((fn) => fn(e));
  }

  private dispatch(a: SessionAction): void {
    const next = sessionReducer(this.state, a);
    if (next === this.state) return;
    this.state = next;
    this.states.forEach((fn) => fn(next));
  }

  private question(id: string): FormQuestion {
    const q = this.state.questions.find((x) => x.id === id);
    if (!q) throw new Error(`Unknown question ${id}`);
    return q;
  }

  /** Choose whose details are being filled. Only allowed before any answer is given (FR-37). */
  setProfile(profileId: string): boolean {
    if (Object.values(this.state.answers).some((a) => a.status !== 'pending')) return false;
    this.state = { ...this.state, profileId };
    this.states.forEach((fn) => fn(this.state));
    return true;
  }

  goto(index: number): void {
    this.dispatch({ type: 'goto', index });
    const q = this.state.questions[this.state.currentIndex];
    if (q) this.emit({ type: 'question.presented', questionId: q.id });
  }

  listening(questionId: string): void {
    this.dispatch({ type: 'listening', questionId });
  }

  /**
   * Queue a pending fill. Never writes. Used by typed/spoken answers and by the `propose_fill` tool.
   */
  propose(questionId: string, raw: string, source: FillSource, translated?: string): ProposeResult {
    const q = this.question(questionId);
    if (q.support === 'unsupported' || isNeverFill(q.label)) {
      return { ok: false, error: 'AwaazForm does not fill this field. Please complete it yourself.' };
    }
    const r = validateAnswer(q, translated ?? raw);
    if (!r.ok) {
      this.dispatch({ type: 'invalid', questionId, raw, error: r.error });
      return r;
    }
    this.dispatch({ type: 'propose', questionId, raw, normalized: r.normalized, source, translated });
    this.emit({ type: 'fill.proposed', questionId, value: r.normalized, source });
    return { ok: true, normalized: r.normalized };
  }

  /**
   * User confirmation. Only the UI calls this — it is deliberately not exposed as a tool.
   * Confirming triggers the write and verification.
   */
  async confirm(questionId: string): Promise<void> {
    const a = this.state.answers[questionId];
    if (a?.status !== 'proposed' || a.normalized === undefined) return;
    this.dispatch({ type: 'confirm', questionId });
    this.emit({ type: 'fill.confirmed', questionId, value: a.normalized });
    await this.writeConfirmed(questionId);
  }

  /** Retry a write that failed verification. Still requires a prior confirmation. */
  async retry(questionId: string): Promise<void> {
    await this.writeConfirmed(questionId);
  }

  private async writeConfirmed(questionId: string): Promise<void> {
    const a = this.state.answers[questionId];
    // The gate: nothing reaches the writer unless the answer is in `confirmed`.
    if (a?.status !== 'confirmed' || a.normalized === undefined) return;
    const q = this.question(questionId);
    const value = a.normalized;
    try {
      await this.writer.write(q, value);
    } catch (err) {
      // Answer stays `confirmed`, so the user can retry, edit, or skip.
      this.emit({ type: 'error', message: `Couldn't fill “${q.label}”: ${(err as Error).message}`, recoverable: true });
      return;
    }
    this.dispatch({ type: 'written', questionId });
    this.emit({ type: 'fill.written', questionId, value });
    await this.verify(questionId);
  }

  async verify(questionId: string): Promise<boolean> {
    const q = this.question(questionId);
    const a = this.state.answers[questionId];
    if (a?.status !== 'written' && a?.status !== 'verified') return false;
    const actual = await this.writer.read(q);
    const ok = actual !== null && actual.trim() === (a.normalized ?? '').trim();
    if (a.status === 'written') this.dispatch({ type: 'verified', questionId, ok, actual: actual ?? undefined });
    this.emit({ type: 'fill.verified', questionId, ok, actual: actual ?? undefined });
    return ok;
  }

  edit(questionId: string): void {
    this.dispatch({ type: 'edit', questionId });
  }

  skip(questionId: string): boolean {
    const before = this.state;
    this.dispatch({ type: 'skip', questionId });
    return before !== this.state;
  }
}
