// Serves the pdf.js worker from our own origin (CSP: worker-src 'self').
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const src = join(dirname(require.resolve('pdfjs-dist/package.json')), 'build', 'pdf.worker.min.mjs');
mkdirSync('public', { recursive: true });
copyFileSync(src, 'public/pdf.worker.min.mjs');
