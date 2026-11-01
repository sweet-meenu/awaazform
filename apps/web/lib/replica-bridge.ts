'use client';

import type { FieldWriter, FormQuestion, SessionEvent } from '@awaazform/core';

// The replica (D2) is a same-origin page in an iframe. The session talks to it by postMessage,
// so writes and verification go through a separate DOM, just as they will in the real tab.

export type ToReplica =
  | { type: 'init'; title: string; questions: FormQuestion[]; values: Record<string, string> }
  | { type: 'event'; event: SessionEvent }
  | { type: 'focus'; questionId: string }
  | { type: 'write'; id: string; questionId: string; value: string }
  | { type: 'read'; id: string; questionId: string }
  | { type: 'motion'; reduce: boolean };

export type FromReplica =
  | { type: 'ready' }
  | { type: 'written'; id: string; ok: boolean; error?: string }
  | { type: 'readResult'; id: string; value: string | null };

export class ReplicaBridge implements FieldWriter {
  private pending = new Map<string, (m: FromReplica) => void>();
  private onMessage = (e: MessageEvent) => {
    if (e.origin !== window.location.origin || e.source !== this.frame.contentWindow) return;
    const m = e.data as FromReplica;
    if (m.type === 'ready') this.readyListeners.forEach((fn) => fn());
    else this.pending.get(m.id)?.(m);
  };
  private readyListeners = new Set<() => void>();

  constructor(private frame: HTMLIFrameElement) {
    window.addEventListener('message', this.onMessage);
  }

  dispose() {
    window.removeEventListener('message', this.onMessage);
  }

  onReady(fn: () => void) {
    this.readyListeners.add(fn);
    return () => this.readyListeners.delete(fn);
  }

  send(m: ToReplica) {
    this.frame.contentWindow?.postMessage(m, window.location.origin);
  }

  private request<T extends FromReplica>(m: ToReplica & { id: string }, timeoutMs = 8000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(m.id);
        reject(new Error('The form did not respond'));
      }, timeoutMs);
      this.pending.set(m.id, (reply) => {
        clearTimeout(timer);
        this.pending.delete(m.id);
        resolve(reply as T);
      });
      this.send(m);
    });
  }

  async write(q: FormQuestion, value: string): Promise<void> {
    const r = await this.request<Extract<FromReplica, { type: 'written' }>>({ type: 'write', id: crypto.randomUUID(), questionId: q.id, value });
    if (!r.ok) throw new Error(r.error ?? "Couldn't find this field");
  }

  async read(q: FormQuestion): Promise<string | null> {
    const r = await this.request<Extract<FromReplica, { type: 'readResult' }>>({ type: 'read', id: crypto.randomUUID(), questionId: q.id });
    return r.value;
  }
}
