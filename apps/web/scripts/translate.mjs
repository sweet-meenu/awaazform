// Generates lib/i18n/locales/<code>.json from the English source (lib/i18n/en.ts) with Groq.
//
//   node scripts/translate.mjs              all languages, only keys that are new or whose English changed
//   node scripts/translate.mjs hi ta        just these languages
//   node scripts/translate.mjs --force hi   retranslate everything for hi
//
// Reads GROQ_API_KEY from the environment or apps/web/.env.local. Every translation is checked:
// same keys, same {placeholders}, same <b>/<code>/<br/> tags. Anything that fails twice is left out,
// and the app shows English for it. Each file records the English it was made from (`_source`),
// so editing en.ts and rerunning only translates what changed.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { en } = await import(join(root, 'lib/i18n/en.ts'));
const OUT = join(root, 'lib/i18n/locales');

const NAMES = { hi: 'Hindi (Devanagari)', mr: 'Marathi (Devanagari)' };

const args = process.argv.slice(2);
const force = args.includes('--force');
const langs = args.filter((a) => !a.startsWith('--'));
const targets = langs.length ? langs : Object.keys(NAMES);

const key = process.env.GROQ_API_KEY || (existsSync(join(root, '.env.local'))
  ? readFileSync(join(root, '.env.local'), 'utf8').match(/^GROQ_API_KEY=(.+)$/m)?.[1]?.trim() : '');
if (!key) throw new Error('Set GROQ_API_KEY (or add it to apps/web/.env.local)');
const MODEL = process.env.TRANSLATE_MODEL || 'openai/gpt-oss-120b';

/** { group: { a: 's', list: ['x','y'] } } → { 'group.a': 's', 'group.list.0': 'x', … } (msgs keys kept whole). */
function flatten(obj, prefix = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (prefix === 'msgs') out[`msgs::${k}`] = v;
    else if (Array.isArray(v)) v.forEach((x, i) => (out[`${path}.${i}`] = x));
    else if (v && typeof v === 'object') Object.assign(out, flatten(v, path));
    else out[path] = v;
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [path, v] of Object.entries(flat)) {
    if (path.startsWith('msgs::')) { (out.msgs ??= {})[path.slice(6)] = v; continue; }
    const parts = path.split('.');
    let o = out;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) o[p] = v;
      else o = o[p] ??= /^\d+$/.test(parts[i + 1]) ? [] : {};
    });
  }
  return out;
}

const tokens = (s) => [...s.matchAll(/\{\w+\}|<\/?b>|<\/?code>|<br\s*\/?>/g)].map((m) => m[0].replace(/<br\s*\/?>/, '<br/>')).sort().join('|');
const valid = (src, out) => typeof out === 'string' && out.trim() !== '' && tokens(src) === tokens(out);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function ask(lang, batch) {
  const body = {
    model: MODEL,
    temperature: 0.2,
    // Groq counts the requested maximum against the per-minute budget, so keep it close to what a batch needs.
    max_completion_tokens: Math.min(3000, 250 + Math.ceil(JSON.stringify(batch).length * (/ur|ml|ta|te|kn/.test(lang) ? 3 : 2.2))),
    response_format: { type: 'json_object' },
    ...(MODEL.includes('gpt-oss') ? { reasoning_effort: 'low' } : {}),
    messages: [
      {
        role: 'system',
        content: `You translate the interface of AwaazForm, an accessibility app that helps people fill forms by voice, from English into ${NAMES[lang]}.
Users include elderly people, people with low literacy and people with disabilities: use simple, warm, everyday words people actually speak, not formal or Sanskritised vocabulary. Use the polite form of address.
Rules:
- Return a JSON object with exactly the same keys. Translate only the values.
- Keep {placeholders} exactly as they are, untranslated. Keep <b>, </b>, <code>, </code> and <br/> tags, around the matching words.
- Keep these names unchanged: AwaazForm, Google Forms, Google Form, Microsoft Forms, Microsoft Form, PDF, Word, .docx, Groq, Chrome, Edge, AES-GCM, IndexedDB, Markdown, Hinglish, XFA, Adobe, CodeKweens, Katathon.
- Keep text inside <code> tags, URLs, email addresses, file names and examples like “______” or ☐ unchanged.
- Keep emoji and symbols (→, ✓, 🔒, ·, ×) where they are.
- Keep it about as short as the English; these are button labels and short sentences.`,
      },
      { role: 'user', content: JSON.stringify(batch) },
    ],
  };
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      process.stdout.write('n');
      await sleep(5000 * (attempt + 1)); // network blip: back off and retry
      continue;
    }
    if (res.status === 429 || res.status >= 500) {
      process.stdout.write(res.status === 429 ? 'r' : 's');
      const wait = Number(res.headers.get('retry-after')) || 10;
      await sleep(Math.min(60, wait + 1) * 1000);
      continue;
    }
    if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    try {
      return JSON.parse(json.choices?.[0]?.message?.content ?? '{}');
    } catch {
      process.stdout.write('x'); // cut-off or malformed reply; try again
      continue;
    }
  }
  return {};
}

/** Batches of roughly `limit` characters, so each request stays well inside the per-minute token budget. */
function batches(entries, limit = 900) {
  const out = [];
  let cur = {};
  let size = 0;
  for (const [k, v] of entries) {
    if (size + v.length > limit && size) { out.push(cur); cur = {}; size = 0; }
    cur[k] = v;
    size += v.length + k.length;
  }
  if (size) out.push(cur);
  return out;
}

const source = flatten(en);

for (const lang of targets) {
  if (!NAMES[lang]) { console.error(`Unknown language ${lang}`); continue; }
  const file = join(OUT, `${lang}.json`);
  const existing = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const prevSource = existing._source ?? {};
  const done = force ? {} : flatten(Object.fromEntries(Object.entries(existing).filter(([k]) => k !== '_source')));
  const todo = Object.entries(source).filter(([k, v]) => force || !(k in done) || prevSource[k] !== v);
  console.log(`${lang}: ${todo.length} of ${Object.keys(source).length} strings to translate`);

  const result = { ...done };
  for (const k of Object.keys(result)) if (!(k in source)) delete result[k];
  const save = () => {
    const keep = Object.fromEntries(Object.entries(result).filter(([k]) => k in source));
    const used = Object.fromEntries(Object.keys(keep).map((k) => [k, source[k]]));
    writeFileSync(file, JSON.stringify({ ...unflatten(keep), _source: used }, null, 1) + '\n');
  };

  let failed = 0;
  for (const batch of batches(todo)) {
    let out = await ask(lang, batch);
    let retry = Object.fromEntries(Object.entries(batch).filter(([k, v]) => !valid(v, out[k])));
    if (Object.keys(retry).length) {
      const again = await ask(lang, retry);
      out = { ...out, ...again };
    }
    for (const [k, v] of Object.entries(batch)) {
      if (valid(v, out[k])) result[k] = out[k].trim();
      else failed++;
    }
    save();
    process.stdout.write('.');
  }
  save();
  console.log(`\n${lang}: done${failed ? `, ${failed} left in English (failed checks)` : ''}`);
}
