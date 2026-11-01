'use client';

import type { FieldType, PdfBox } from '@awaazform/core';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { Candidate, PageSize, PdfLayout } from '@/lib/pdf';
import { boxStyle, PdfPages } from './PdfPages';

const TYPES: [FieldType, string][] = [
  ['text', 'Text'], ['paragraph', 'Long text'], ['number', 'Number'], ['date', 'Date'], ['phone', 'Phone'],
  ['email', 'Email'], ['yesno', 'Yes / No'], ['choice', 'Tick one'], ['multichoice', 'Tick many'],
];

type Drag = { id: string; option?: string; mode: 'move' | 'resize'; startX: number; startY: number; orig: PdfBox; scale: number };

/** J4 step 3: confirm the questions and adjust answer boxes on the page preview. */
export function BoxEditor({ bytes, pages, candidates, boxes, onChange, onBoxes }: {
  bytes: ArrayBuffer; pages: PageSize[]; candidates: Candidate[]; boxes: PdfLayout['boxes'];
  onChange: (c: Candidate[]) => void; onBoxes: (b: PdfLayout['boxes']) => void;
}) {
  const [selected, setSelected] = useState<string | null>(candidates[0]?.itemId ?? null);
  const drag = useRef<Drag | null>(null);
  const included = candidates.filter((c) => c.include).length;

  const setBox = (id: string, option: string | undefined, b: PdfBox) => {
    const cur = boxes[id];
    if (!cur) return;
    onBoxes({ ...boxes, [id]: option ? { ...cur, optionBoxes: { ...cur.optionBoxes, [option]: b } } : { ...cur, box: b } });
  };

  const onPointerDown = (e: PointerEvent, id: string, option: string | undefined, mode: Drag['mode'], scale: number) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = boxes[id];
    const orig = option ? cur?.optionBoxes?.[option] : cur?.box;
    if (!orig) return;
    setSelected(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { id, option, mode, startX: e.clientX, startY: e.clientY, orig, scale };
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.startX) / d.scale, dy = (e.clientY - d.startY) / d.scale;
    setBox(d.id, d.option, d.mode === 'move'
      ? { ...d.orig, x: d.orig.x + dx, y: d.orig.y - dy }
      : { ...d.orig, w: Math.max(12, d.orig.w + dx), h: Math.max(8, d.orig.h + dy), y: d.orig.y - dy });
  };

  /** Keyboard: arrows move (Shift = 10pt); Alt+arrows resize. */
  const onKey = (e: KeyboardEvent, id: string, option?: string) => {
    const cur = option ? boxes[id]?.optionBoxes?.[option] : boxes[id]?.box;
    if (!cur) return;
    const step = e.shiftKey ? 10 : 1;
    const map: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = map[e.key];
    if (!m) return;
    e.preventDefault();
    setBox(id, option, e.altKey
      ? { ...cur, w: Math.max(12, cur.w + m[0]), h: Math.max(8, cur.h + m[1]) }
      : { ...cur, x: cur.x + m[0], y: cur.y + m[1] });
  };

  const update = (id: string, patch: Partial<Candidate>) => onChange(candidates.map((c) => (c.itemId === id ? { ...c, ...patch } : c)));

  const addBox = () => {
    const id = `custom-${Date.now()}`;
    const p = pages[0]!;
    onChange([...candidates, { itemId: id, label: 'New question', type: 'text', required: false, include: true }]);
    onBoxes({ ...boxes, [id]: { page: 0, box: { x: p.width / 2 - 80, y: p.height / 2, w: 160, h: 16 } } });
    setSelected(id);
  };

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section aria-labelledby="qs-h" className="card grid gap-4 p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2">
          <h2 id="qs-h" className="text-xl">Questions <span className="text-muted">({included})</span></h2>
          <button type="button" className="btn btn-ghost" onClick={addBox}>+ Add a box</button>
        </div>
        <p className="text-sm text-muted">Untick anything that isn&apos;t a question. Select one to see its box on the page. Drag it into place, or use the arrow keys (Shift to move faster, Alt to resize).</p>
        <ol className="grid max-h-[56vh] gap-2 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {candidates.map((c, i) => (
            <li key={c.itemId}>
              <div className="grid gap-2 rounded-[var(--r-12)] border p-3 transition-colors"
                style={{ borderColor: selected === c.itemId ? 'var(--violet-500)' : 'var(--border)', background: selected === c.itemId ? 'var(--violet-100)' : 'var(--surface)', opacity: c.include ? 1 : 0.55 }}
                onFocusCapture={() => setSelected(c.itemId)} onClick={() => setSelected(c.itemId)}>
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="h-5 w-5 flex-none" checked={c.include} onChange={(e) => update(c.itemId, { include: e.target.checked })} aria-label={`Include question ${i + 1}`} />
                  <label className="sr-only" htmlFor={`lbl-${c.itemId}`}>Question {i + 1} label</label>
                  <input id={`lbl-${c.itemId}`} className="min-h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 font-medium hover:border-line focus:border-line" value={c.label} onChange={(e) => update(c.itemId, { label: e.target.value })} />
                </div>
                {selected === c.itemId && (
                  <div className="flex flex-wrap items-center gap-2 pl-7 text-sm">
                    <label className="flex items-center gap-1.5">
                      <span className="text-muted">Type</span>
                      <select className="min-h-11 rounded-lg border border-line bg-surface px-2" value={c.type} onChange={(e) => update(c.itemId, { type: e.target.value as FieldType })}>
                        {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </label>
                    <label className="flex min-h-11 items-center gap-1.5"><input type="checkbox" className="h-4 w-4" checked={c.required} onChange={(e) => update(c.itemId, { required: e.target.checked })} /> Required</label>
                    {c.options?.length ? <span className="text-xs text-muted">Options: {c.options.map((o) => o.text).join(' · ')}</span> : null}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="Page preview with answer boxes" className="card max-h-[80vh] overflow-auto p-4" style={{ background: 'var(--bg-subtle)', scrollbarWidth: 'thin' }}
        onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null; }}>
        <PdfPages bytes={bytes} pages={pages} overlay={(page, scale) =>
          candidates.filter((c) => c.include).map((c) => {
            const b = boxes[c.itemId];
            if (!b || b.page !== page) return null;
            const sel = selected === c.itemId;
            const color = sel ? 'var(--violet-500)' : 'rgba(98,77,227,0.55)';
            return (
              <div key={c.itemId}>
                <div role="button" tabIndex={0} aria-label={`Answer box for ${c.label}. Arrow keys move it; Alt plus arrows resize it.`}
                  className="absolute cursor-move rounded-[3px] outline-none" onKeyDown={(e) => onKey(e, c.itemId)}
                  onFocus={() => setSelected(c.itemId)} onPointerDown={(e) => onPointerDown(e, c.itemId, undefined, 'move', scale)}
                  style={{ ...boxStyle(b.box, pages[page]!, scale), border: `1.5px ${sel ? 'solid' : 'dashed'} ${color}`, background: sel ? 'rgba(98,77,227,0.14)' : 'rgba(98,77,227,0.06)', zIndex: sel ? 2 : 1 }}>
                  {sel && <span className="pointer-events-none absolute -top-5 left-0 max-w-[260px] truncate rounded px-1.5 text-[10px] font-medium whitespace-nowrap text-white" style={{ background: 'var(--violet-500)' }}>{c.label}</span>}
                  <span aria-hidden className="absolute -right-1.5 -bottom-1.5 h-3 w-3 cursor-se-resize rounded-sm border-2 border-white" style={{ background: color }}
                    onPointerDown={(e) => onPointerDown(e, c.itemId, undefined, 'resize', scale)} />
                </div>
                {b.optionBoxes && Object.entries(b.optionBoxes).map(([opt, ob]) => (
                  <div key={opt} role="button" tabIndex={0} aria-label={`Tick box for ${opt} (${c.label})`}
                    className="absolute cursor-move rounded-[2px] outline-none" onKeyDown={(e) => onKey(e, c.itemId, opt)}
                    onPointerDown={(e) => onPointerDown(e, c.itemId, opt, 'move', scale)}
                    style={{ ...boxStyle(ob, pages[page]!, scale), border: `1.5px solid ${color}`, background: 'rgba(198,58,248,0.12)', zIndex: 3 }} />
                ))}
              </div>
            );
          })
        } />
      </section>
    </div>
  );
}
