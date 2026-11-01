'use client';

import type { PdfBox } from '@awaazform/core';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { openPdfJs, type PageSize } from '@/lib/pdf';

/** Converts a PDF-space box (origin bottom-left) to CSS pixels on a rendered page. */
export function boxStyle(b: PdfBox, page: PageSize, scale: number) {
  return { left: b.x * scale, top: (page.height - b.y - b.h) * scale, width: b.w * scale, height: b.h * scale };
}

/** Renders every page to a canvas at the container's width, with an overlay layer per page. */
export function PdfPages({ bytes, pages, overlay, className = '' }: {
  bytes: ArrayBuffer; pages: PageSize[]; overlay: (page: number, scale: number) => ReactNode; className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvases = useRef<(HTMLCanvasElement | null)[]>([]);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e!.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!width) return;
    let cancelled = false;
    (async () => {
      const pdf = await openPdfJs(bytes);
      for (let i = 0; i < pdf.numPages && !cancelled; i++) {
        const page = await pdf.getPage(i + 1);
        const base = page.getViewport({ scale: 1 });
        const scale = width / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = page.getViewport({ scale: scale * dpr });
        const canvas = canvases.current[i];
        if (!canvas) continue;
        canvas.width = vp.width;
        canvas.height = vp.height;
        await page.render({ canvas, viewport: vp }).promise;
      }
      await pdf.close();
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [bytes, width]);

  return (
    <div ref={wrapRef} className={`grid gap-4 ${className}`}>
      {width > 0 && pages.map((p, i) => {
        const scale = width / p.width;
        return (
          <div key={i} className="relative overflow-hidden rounded-[var(--r-8)] bg-white shadow-[var(--shadow-md)]" style={{ width, height: p.height * scale }}>
            <canvas ref={(el) => { canvases.current[i] = el; }} className="absolute inset-0 h-full w-full" aria-hidden />
            <div className="absolute inset-0">{overlay(i, scale)}</div>
            <span className="sr-only">Page {i + 1}</span>
          </div>
        );
      })}
    </div>
  );
}
