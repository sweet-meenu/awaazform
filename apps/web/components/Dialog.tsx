'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/** Native <dialog>: focus trap, Escape to close and inert background come from the browser. */
export function Dialog({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(100%-32px,480px)] rounded-[var(--r-24)] border border-line bg-surface p-0 text-ink shadow-[var(--shadow-lg)] backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="grid gap-4 p-6">
        <h2 id={titleId} className="text-xl">{title}</h2>
        <div className="grid gap-3 text-sm leading-relaxed">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 pt-2">{footer}</div>}
      </div>
    </dialog>
  );
}
