// Runs AI question extraction on the example Form 6 PDF against a running server, one page per request.
// Usage: BASE_URL=http://localhost:3000 node e2e/extract-form6.mjs
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'node:fs';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const bytes = new Uint8Array(fs.readFileSync(new URL('../../../example_forms/Form_6_English.pdf', import.meta.url)));
const doc = await pdfjs.getDocument({ data: bytes }).promise;
const items = [], pages = [];
for (let p = 0; p < doc.numPages; p++) {
  const pg = await doc.getPage(p + 1);
  const vp = pg.getViewport({ scale: 1 });
  pages.push({ width: vp.width, height: vp.height });
  (await pg.getTextContent()).items.forEach((r, i) => {
    if (r.str?.trim()) items.push({ id: `p${p}i${i}`, page: p, x: Math.round(r.transform[4]), y: Math.round(r.transform[5]), text: r.str.trim().slice(0, 160) });
  });
}

for (let p = 0; p < pages.length; p++) {
  const t = Date.now();
  const pageItems = items.filter((i) => i.page === p && i.text.length <= 110).map(({ id, x, y, text }) => ({ id, x, y, text }));
  const res = await fetch(`${BASE}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ page: p, pageSize: pages[p], items: pageItems }),
  });
  const j = await res.json();
  console.log(`page ${p + 1}: status ${res.status} in ${Date.now() - t}ms ${j.error ?? ''}`);
  for (const q of j.questions ?? []) {
    const opts = q.options ? ` [${q.options.map((o) => o.text).join(' / ')}]` : '';
    console.log(`  ${q.itemId.padEnd(8)} ${q.type.padEnd(11)} ${q.required ? '*' : ' '} ${q.label}${opts}`);
  }
}
