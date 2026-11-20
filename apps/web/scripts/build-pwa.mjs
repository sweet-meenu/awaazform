import { existsSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = await readdir(`${root}.next/static`, { recursive: true });
const assets = files.filter((f) => /\.(js|css|woff2?)$/.test(f)).map((f) => `/_next/static/${f}`);
const pages = ['/', '/form', '/documents', '/profiles', '/settings', '/report', '/privacy', '/share', '/offline'];
const icons = (await readdir(`${root}public/icons`)).map((f) => `/icons/${f}`);
const source = await readFile(`${root}pwa/sw.js`, 'utf8');
const build = await readFile(`${root}.next/BUILD_ID`, 'utf8');
const version = createHash('sha256').update(build + source).digest('hex').slice(0, 16);
const sw = source
  .replace('__PWA_VERSION__', version)
  .replace('/* __PRECACHE__ */', JSON.stringify([...pages, ...assets, ...icons, '/manifest.webmanifest', '/pdf.worker.min.mjs']));
await writeFile(`${root}public/sw.js`, sw);
// The static export (served by the Python API) copied public/ before this ran: give it the real one.
if (existsSync(`${root}out`)) await writeFile(`${root}out/sw.js`, sw);
console.log(`PWA ${version}: ${pages.length} pages and ${assets.length} assets prepared for offline use.`);
