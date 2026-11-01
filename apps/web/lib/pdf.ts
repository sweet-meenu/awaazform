'use client';

import {
  classifySupport, formatDate, guessFieldType, normalizeDate,
  type FieldType, type FieldWriter, type FormQuestion, type PdfBox,
} from '@awaazform/core';
import {
  EncryptedPDFError, PDFCheckBox, PDFDocument, PDFDropdown, PDFName, PDFOptionList, PDFRadioGroup,
  PDFTextField, StandardFonts, rgb, type PDFField, type PDFFont,
} from 'pdf-lib';

// PDF support (J3, J4, FR-05 – FR-08). Everything runs in the browser; the file is never uploaded.

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export interface PageSize { width: number; height: number }
export interface TextItem { id: string; page: number; x: number; y: number; w: number; h: number; text: string }

/** Where each question lives on the page, for the preview overlay. */
export interface PdfLayout {
  pages: PageSize[];
  boxes: Record<string, { page: number; box: PdfBox; optionBoxes?: Record<string, PdfBox> }>;
}

export interface PdfPlan {
  kind: 'acroform' | 'flat';
  fileName: string;
  title: string;
  questions: FormQuestion[];
  layout: PdfLayout;
}

export type Analysis =
  | { kind: 'unsupported'; reason: string }
  | { kind: 'acroform'; plan: PdfPlan }
  | { kind: 'flat'; fileName: string; title: string; pages: PageSize[]; items: TextItem[] };

// ---------------------------------------------------------------------------
// pdf.js (rendering and text) is loaded lazily, client-side only.

type PdfJs = typeof import('pdfjs-dist');
let pdfjsPromise: Promise<PdfJs> | null = null;
export function pdfjs(): Promise<PdfJs> {
  return (pdfjsPromise ??= import('pdfjs-dist').then((m) => {
    m.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
    return m;
  }));
}

/** Opens a document; call `close()` when done to free the worker-side copy. */
export async function openPdfJs(bytes: ArrayBuffer) {
  const lib = await pdfjs();
  const task = lib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
  const pdf = await task.promise;
  return Object.assign(pdf, { close: () => task.destroy() });
}

const prettify = (name: string) =>
  name.replace(/[._]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\s+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase());

// ---------------------------------------------------------------------------

export async function analyzePdf(bytes: ArrayBuffer, fileName: string): Promise<Analysis> {
  if (bytes.byteLength > MAX_PDF_BYTES) return { kind: 'unsupported', reason: 'This PDF is larger than 10 MB.' };

  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(bytes.slice(0), { updateMetadata: false });
  } catch (err) {
    if (err instanceof EncryptedPDFError) return { kind: 'unsupported', reason: 'This PDF is password-protected. Remove the password and upload it again.' };
    return { kind: 'unsupported', reason: 'This file could not be read as a PDF.' };
  }

  const title = doc.getTitle()?.trim() || fileName.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' ');
  const pages = doc.getPages().map((p) => p.getSize());
  const form = doc.getForm();
  const fields = form.getFields();

  // FR-06: XFA-only forms can't be filled.
  if (form.hasXFA() && fields.length === 0) {
    return { kind: 'unsupported', reason: 'This is an XFA form (made with Adobe LiveCycle). AwaazForm cannot fill XFA forms; open it in Adobe Reader instead.' };
  }

  if (fields.length > 0) return { kind: 'acroform', plan: acroPlan(doc, fields, fileName, title, pages) };

  // Flat PDF: read its text. No text at all means a scan (FR-08).
  const pdf = await openPdfJs(bytes);
  const items: TextItem[] = [];
  for (let p = 0; p < pdf.numPages; p++) {
    const page = await pdf.getPage(p + 1);
    const tc = await page.getTextContent();
    tc.items.forEach((raw, i) => {
      if (!('str' in raw) || !raw.str.trim()) return;
      items.push({ id: `p${p}i${i}`, page: p, x: raw.transform[4], y: raw.transform[5], w: raw.width, h: raw.height || 9, text: raw.str.trim() });
    });
  }
  await pdf.close();
  if (items.reduce((n, i) => n + i.text.length, 0) < 20) {
    return { kind: 'unsupported', reason: 'This PDF looks like a scan (a picture of a page), so there is no text to work with. Scanned PDFs are not supported.' };
  }
  return { kind: 'flat', fileName, title, pages, items };
}

function acroPlan(doc: PDFDocument, fields: PDFField[], fileName: string, title: string, pages: PageSize[]): PdfPlan {
  const questions: FormQuestion[] = [];
  const layout: PdfLayout = { pages, boxes: {} };
  const pageDicts = doc.getPages().map((p) => p.node);

  fields.forEach((f, i) => {
    const name = f.getName();
    const tu = f.acroField.dict.lookup(PDFName.of('TU'));
    const label = (tu && 'decodeText' in tu ? (tu as { decodeText(): string }).decodeText() : '') || prettify(name.split('.').pop() ?? name);
    let type: FieldType = 'text';
    let options: string[] | undefined;
    let control: Parameters<typeof classifySupport>[1] = 'text';

    if (f instanceof PDFTextField) { type = f.isMultiline() ? 'paragraph' : guessFieldType(label); control = type; }
    else if (f instanceof PDFCheckBox) { type = 'yesno'; options = ['Yes', 'No']; control = 'yesno'; }
    else if (f instanceof PDFRadioGroup) { type = 'choice'; options = f.getOptions(); control = 'choice'; }
    else if (f instanceof PDFDropdown) { type = 'dropdown'; options = f.getOptions(); control = 'dropdown'; }
    else if (f instanceof PDFOptionList) { type = 'multichoice'; options = f.getOptions(); control = 'multichoice'; }
    else control = /sig/i.test(f.constructor.name) ? 'signature' : 'unknown';

    const { support, reason } = classifySupport(label, control);
    const id = `f${i}`;
    questions.push({
      id, label, type, options, required: f.isRequired(), support, supportReason: reason,
      source: { kind: 'pdf-acroform', fileName, fieldName: name },
    });

    // Overlay position from the first widget.
    const w = f.acroField.getWidgets()[0];
    if (w) {
      const r = w.getRectangle();
      const pRef = w.P();
      let page = pRef ? pageDicts.findIndex((d) => doc.context.getObjectRef(d) === pRef) : -1;
      if (page < 0) page = pageDicts.findIndex((d) => d.Annots()?.asArray().some((a) => doc.context.lookup(a) === w.dict));
      layout.boxes[id] = { page: Math.max(0, page), box: { x: r.x, y: r.y, w: r.width, h: r.height } };
    }
  });
  return { kind: 'acroform', fileName, title, questions, layout };
}

// ---------------------------------------------------------------------------
// Flat PDFs: candidate questions and answer boxes (J4). The user reviews all of this.

export interface Candidate {
  itemId: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: { text: string; itemId?: string }[];
  include: boolean;
}

const LABEL_HINT = /\b(name|surname|mobile|phone|e-?mail|date of birth|dob|gender|sex|address|house|building|street|locality|town|village|city|post office|pin ?code|postal|tehsil|taluk|district|state|country|father|mother|husband|wife|guardian|relative|relationship|place|date|age|occupation|qualification|nationality|aadha+r|epic|percentage)\b/i;
const OFFICE_USE = /form (no|number)|office use|acknowledg|receipt|\b(ero|aero|blo)\b|signature|thumb impression/i;
const NOT_A_FIELD =/^(\d+\.|to,?$|note|disclaimer|declaration|i hereby|i am |i submit|\(see |\(@|\(to be filled|space for|accessibility)/i;

/** Heuristic fallback when AI is unavailable: short label-like text items. */
export function heuristicCandidates(items: TextItem[]): Candidate[] {
  return items
    .filter((it) => it.text.length >= 3 && it.text.length <= 70 && LABEL_HINT.test(it.text) && !NOT_A_FIELD.test(it.text))
    .map((it) => ({ itemId: it.id, label: cleanLabel(it.text), type: guessFieldType(it.text), required: it.text.startsWith('*'), include: true }));
}

export function cleanLabel(s: string): string {
  return s.replace(/^\*?\s*(\(\w{1,4}\)\s*)+/, '').replace(/[:_\-\s]+$/, '').replace(/_{2,}/g, '').replace(/\s+/g, ' ').trim() || s.trim();
}

/** Asks the server to identify questions, one page per request (keeps each request inside free-tier token limits).
 * Only printed form text is sent, never answers. Long sentences are dropped: they are instructions, not labels. */
export async function aiCandidates(items: TextItem[], pages: PageSize[]): Promise<Candidate[]> {
  const known = new Set(items.map((i) => i.id));
  const out: Candidate[] = [];
  for (let p = 0; p < pages.length; p++) {
    const pageItems = items.filter((i) => i.page === p && i.text.length <= 110);
    if (pageItems.length === 0) continue;
    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: p, pageSize: pages[p],
        items: pageItems.slice(0, 350).map(({ id, x, y, text }) => ({ id, x: Math.round(x), y: Math.round(y), text })),
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { questions?: Omit<Candidate, 'include'>[]; error?: string };
    if (!res.ok || !json.questions) throw new Error(json.error ?? 'AI could not read this form');
    // Office-use fields are unticked (not removed), so the user can still include them.
    out.push(...json.questions.filter((q) => known.has(q.itemId)).map((q) => ({ ...q, include: !OFFICE_USE.test(q.label) })));
  }
  return out;
}

/** Places an answer box to the right of the label, up to the next label on the line or the margin. */
export function placeBoxes(c: Candidate[], items: TextItem[], pages: PageSize[]): PdfLayout['boxes'] {
  const byId = new Map(items.map((i) => [i.id, i]));
  const labelIds = new Set(c.map((x) => x.itemId));
  const boxes: PdfLayout['boxes'] = {};

  for (const cand of c) {
    const it = byId.get(cand.itemId);
    if (!it) continue;
    const pw = pages[it.page]?.width ?? 612;
    const sameLine = items.filter((o) => o.page === it.page && Math.abs(o.y - it.y) <= 3 && o.x > it.x + it.w - 1);
    // Skip short connector text like "(or)" or ":-" when finding where the answer space starts.
    const filler = sameLine.filter((o) => !labelIds.has(o.id) && o.text.length <= 6 && !(cand.options ?? []).some((op) => op.itemId === o.id));
    const start = Math.max(it.x + it.w, ...filler.map((o) => o.x + o.w)) + 6;
    const nextLabel = sameLine.filter((o) => (labelIds.has(o.id) || o.text.length > 6) && o.x >= start).sort((a, b) => a.x - b.x)[0];
    const end = (nextLabel ? nextLabel.x : pw - 24) - 6;
    const h = Math.max(14, it.h + 6);

    const box: PdfBox = end - start >= 60
      ? { x: start, y: it.y - 4, w: end - start, h }
      : { x: it.x, y: it.y - h - 4, w: Math.min(260, pw - it.x - 24), h }; // no room: put it underneath

    let optionBoxes: Record<string, PdfBox> | undefined;
    if (cand.options?.length) {
      optionBoxes = {};
      for (const op of cand.options) {
        const oi = op.itemId ? byId.get(op.itemId) : undefined;
        // Printed tick boxes usually sit just left of the option text.
        if (oi) optionBoxes[op.text] = { x: oi.x - 16, y: oi.y - 2, w: 12, h: 12 };
      }
    }
    boxes[cand.itemId] = { page: it.page, box, optionBoxes };
  }
  return boxes;
}

export function flatPlan(fileName: string, title: string, pages: PageSize[], cands: Candidate[], boxes: PdfLayout['boxes'], items: TextItem[]): PdfPlan {
  const questions: FormQuestion[] = [];
  const layout: PdfLayout = { pages, boxes: {} };
  const byId = new Map(items.map((i) => [i.id, i]));
  cands.filter((c) => c.include && boxes[c.itemId]).forEach((c, i) => {
    const b = boxes[c.itemId]!;
    const id = `q${i + 1}`;
    const raw = byId.get(c.itemId)?.text ?? c.label;
    const control = /signature|thumb impression/i.test(c.label) ? 'signature' : /photo/i.test(c.label) ? 'file' : c.type;
    const { support, reason } = classifySupport(c.label, control);
    const options = c.options?.map((o) => o.text);
    questions.push({
      id, label: c.label, type: options?.length && c.type === 'text' ? 'choice' : c.type, options, required: c.required, support, supportReason: reason,
      source: { kind: 'pdf-flat', fileName, page: b.page, box: b.box, optionBoxes: b.optionBoxes, uppercase: /block letters|capital letters/i.test(raw + ' ' + c.label) },
    });
    layout.boxes[id] = b;
  });
  return { kind: 'flat', fileName, title, questions, layout };
}

// ---------------------------------------------------------------------------
// Filling. Writes go into the document (AcroForm) or a value map (flat); reads come from the same place.

export class PdfFiller implements FieldWriter {
  private doc!: PDFDocument;
  private font!: PDFFont;
  private flatValues = new Map<string, string>();

  private constructor(private bytes: ArrayBuffer, private plan: PdfPlan) {}

  static async create(bytes: ArrayBuffer, plan: PdfPlan) {
    const f = new PdfFiller(bytes, plan);
    f.doc = await PDFDocument.load(bytes.slice(0));
    f.font = await f.doc.embedFont(StandardFonts.Helvetica);
    // Hybrid AcroForm+XFA files: drop XFA so viewers show the AcroForm values we write.
    if (plan.kind === 'acroform' && f.doc.getForm().hasXFA()) f.doc.getForm().deleteXFA();
    return f;
  }

  /** The standard PDF fonts only cover Latin text. Devanagari needs shaping pdf-lib can't do yet. */
  private assertEncodable(value: string) {
    try {
      this.font.widthOfTextAtSize(value, 10);
    } catch {
      throw new Error('Hindi script cannot be written into PDFs yet. Answer in English letters, or write this one by hand');
    }
  }

  private toPdfValue(q: FormQuestion, v: string) {
    const out = q.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? formatDate(v, 'DD/MM/YYYY') : v;
    return q.source.kind === 'pdf-flat' && q.source.uppercase ? out.toUpperCase() : out;
  }

  /** Maps what's in the PDF back to the normalized form, so verification compares like with like. */
  private fromPdfValue(q: FormQuestion, v: string) {
    if (q.type === 'date') return normalizeDate(v) ?? v;
    if (q.source.kind === 'pdf-flat' && q.source.uppercase) {
      const proposed = this.flatValues.get(`${q.id}:orig`);
      return proposed && proposed.toUpperCase() === v ? proposed : v;
    }
    return v;
  }

  private field(q: FormQuestion) {
    if (q.source.kind !== 'pdf-acroform') throw new Error('Not a form field');
    return this.doc.getForm().getField(q.source.fieldName);
  }

  async write(q: FormQuestion, value: string): Promise<void> {
    if (q.support === 'unsupported') throw new Error('This field is not filled by AwaazForm');
    const v = this.toPdfValue(q, value);
    if (q.source.kind === 'pdf-flat') {
      if (!q.source.optionBoxes || !q.options?.length) this.assertEncodable(v);
      this.flatValues.set(q.id, v);
      this.flatValues.set(`${q.id}:orig`, value);
      return;
    }
    const f = this.field(q);
    if (f instanceof PDFTextField) {
      this.assertEncodable(v);
      const max = f.getMaxLength();
      if (max !== undefined && v.length > max) throw new Error(`This field allows at most ${max} characters`);
      f.setText(v);
    } else if (f instanceof PDFCheckBox) {
      if (value === 'Yes') f.check(); else f.uncheck();
    } else if (f instanceof PDFRadioGroup || f instanceof PDFDropdown) {
      f.select(value);
    } else if (f instanceof PDFOptionList) {
      f.select(value.split(', '));
    } else {
      throw new Error('This kind of field is not supported');
    }
  }

  async read(q: FormQuestion): Promise<string | null> {
    if (q.source.kind === 'pdf-flat') {
      const v = this.flatValues.get(q.id);
      return v === undefined ? null : this.fromPdfValue(q, v);
    }
    const f = this.field(q);
    if (f instanceof PDFTextField) return this.fromPdfValue(q, f.getText() ?? '');
    if (f instanceof PDFCheckBox) return f.isChecked() ? 'Yes' : 'No';
    if (f instanceof PDFRadioGroup) return f.getSelected() ?? '';
    if (f instanceof PDFDropdown || f instanceof PDFOptionList) return f.getSelected().join(', ');
    return null;
  }

  /** Display text for the preview overlay. */
  shown(q: FormQuestion): string | undefined {
    return q.source.kind === 'pdf-flat' ? this.flatValues.get(q.id) : undefined;
  }

  /** The filled file. AwaazForm never submits it; the user downloads it and submits it themselves. */
  async export(): Promise<Uint8Array> {
    if (this.plan.kind === 'acroform') {
      this.doc.getForm().updateFieldAppearances(this.font);
      return this.doc.save();
    }
    const pages = this.doc.getPages();
    for (const q of this.plan.questions) {
      const v = this.flatValues.get(q.id);
      if (v === undefined || q.source.kind !== 'pdf-flat') continue;
      const page = pages[q.source.page];
      if (!page) continue;
      const color = rgb(0.05, 0.1, 0.45);
      if (q.source.optionBoxes && q.options?.length) {
        // Tick the printed box for each chosen option.
        for (const choice of v.split(', ')) {
          const b = q.source.optionBoxes[choice];
          if (b) page.drawText('X', { x: b.x + 2, y: b.y + 2, size: Math.min(11, b.h), font: this.font, color });
        }
        continue;
      }
      const b = q.source.box;
      let size = Math.max(6, Math.min(11, b.h - 3));
      while (size > 6 && this.font.widthOfTextAtSize(v, size) > b.w - 4) size -= 0.5;
      page.drawText(v, { x: b.x + 2, y: b.y + Math.max(2, (b.h - size) / 2 + 1), size, font: this.font, color, maxWidth: b.w - 4 });
    }
    return this.doc.save();
  }
}
