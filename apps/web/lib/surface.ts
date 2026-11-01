import type { FieldWriter, FormQuestion, Session, SessionEvent } from '@awaazform/core';

/**
 * Where a session's fills land and animate: the replica iframe (demo / Google Form preview)
 * or a PDF preview. The workspace drives it; the surface owns the real writes and read-backs.
 */
export interface SurfaceHandle extends FieldWriter {
  onEvent(e: SessionEvent): void;
  focus(q: FormQuestion): void;
  /** Called once the session is ready, and again if the surface reloads. */
  sync(s: Session, reduceMotion: boolean): void;
  setReduceMotion(reduce: boolean): void;
}
