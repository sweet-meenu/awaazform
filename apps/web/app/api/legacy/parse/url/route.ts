import { guard, preflight, withCors } from '@/lib/guard';
import { POST as parseGoogleForm } from '@/app/api/gform/route';
import { POST as parseMicrosoftForm } from '@/app/api/msform/route';

export const runtime = 'nodejs';

type LegacyField = {
  id: string;
  type: string;
  required: boolean;
  label: { en: string; hi: string };
  options?: { v: string; en: string; hi: string }[];
  flag?: boolean;
  source_key?: string;
};

function toLegacyField(q: any, index: number): LegacyField {
  const supportedTypes = new Set(['text', 'number', 'date', 'email', 'phone']);
  const choiceTypes = new Set(['yesno', 'choice', 'multichoice', 'checkbox', 'dropdown', 'scale']);
  let type = supportedTypes.has(q.type) ? q.type : choiceTypes.has(q.type) ? 'select' : 'text';
  const options = Array.isArray(q.options)
    ? q.options.map((value: unknown) => String(value)).filter(Boolean).map((value: string) => ({ v: value, en: value, hi: value }))
    : undefined;
  if (type === 'select' && (!options || options.length === 0)) type = 'text';
  const label = String(q.label || `Question ${index + 1}`);
  return {
    id: String(q.id || `q${index + 1}`), type, required: q.required === true,
    label: { en: label, hi: label },
    ...(type === 'select' ? { options } : {}),
    ...(q.support === 'unsupported' || q.support === 'manual' || q.type === 'checkbox' || q.type === 'multichoice' ? { flag: true } : {}),
    ...(q.source?.kind === 'google-form' && q.source.entryId ? { source_key: `entry.${q.source.entryId}` } : {}),
  };
}

async function parseWith(path: '/api/gform' | '/api/msform', url: string, req: Request) {
  const internalRequest = new Request(new URL(path, req.url), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  return path === '/api/gform' ? parseGoogleForm(internalRequest) : parseMicrosoftForm(internalRequest);
}

export async function POST(req: Request) {
  const g = guard(req);
  if (!g.ok) return g.response;
  try {
    const body = await req.json() as { url?: unknown };
    if (typeof body.url !== 'string' || body.url.length < 8 || body.url.length > 2000)
      return withCors(Response.json({ detail: { code: 'invalid_url' } }, { status: 400 }), g);
    const rawUrl = body.url.trim();
    let parsed: URL;
    try { parsed = new URL(/^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`); }
    catch { return withCors(Response.json({ detail: { code: 'invalid_url' } }, { status: 400 }), g); }
    const host = parsed.hostname.toLowerCase();
    const google = host === 'forms.gle' || host === 'docs.google.com';
    const microsoft = ['forms.office.com', 'forms.microsoft.com', 'forms.cloud.microsoft'].includes(host);
    if (!google && !microsoft)
      return withCors(Response.json({ detail: { code: 'unsupported_host' } }, { status: 400 }), g);

    const response = await parseWith(google ? '/api/gform' : '/api/msform', parsed.toString(), req);
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      return withCors(Response.json({ detail: { code: 'fetch_failed', message: result.error || 'Could not read this form.' } }, { status: response.status }), g);
    const questions = Array.isArray(result.questions) ? result.questions : [];
    const fields = questions.map(toLegacyField);
    const sourceUrl = questions.find((q: any) => q?.source?.url)?.source?.url || parsed.toString();
    const flagged = fields.filter((field: LegacyField) => field.flag).length;
    const title = result.title || (google ? 'Google Form' : 'Microsoft Form');
    return withCors(Response.json({ ok: true, title: { en: title, hi: title }, fields, flagged, sourceUrl }), g);
  } catch {
    return withCors(Response.json({ detail: { code: 'fetch_failed' } }, { status: 500 }), g);
  }
}

export const OPTIONS = preflight;
