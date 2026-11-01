import { extractGoogleFormData, googleFormUrl, parseGoogleForm, parseGoogleFormUrl } from '@awaazform/core';
import { z } from 'zod';
import { rateLimit, tooMany } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Reads a public Google Form's questions from its responder page. Only the form itself is fetched,
// never anything about the user. Hosts are allow-listed and each redirect hop is checked (no SSRF).

const Input = z.object({ url: z.string().min(10).max(2000) });
const MAX_BYTES = 4_000_000;
const fail = (error: string, status = 400) => Response.json({ error }, { status });

async function get(url: string) {
  return fetch(url, {
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AwaazForm/1.0)', 'Accept-Language': 'en' },
  });
}

async function readCapped(res: Response): Promise<string | null> {
  const reader = res.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function POST(req: Request) {
  if (!rateLimit(req, 'gform', 20)) return tooMany();
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail('Please paste a Google Form link.');

  let link = parseGoogleFormUrl(parsed.data.url);
  try {
    if (link?.kind === 'short') {
      const res = await get(link.url);
      link = parseGoogleFormUrl(res.headers.get('location') ?? '');
      if (link?.kind === 'short') link = null;
    }
    if (!link) return fail('This doesn’t look like a Google Form link. It should start with docs.google.com/forms or forms.gle.');
    if (link.kind === 'edit') return fail('This is the form’s editing link. Use the link you’d send to people who fill it in (Send → link).');

    const formId = link.formId;
    const res = await get(googleFormUrl(formId));
    if (res.status >= 300 && res.status < 400) {
      const to = res.headers.get('location') ?? '';
      if (/accounts\.google\.com|ServiceLogin/.test(to)) return fail('This form needs a Google sign-in, so AwaazForm can’t read it. Fill it on Google Forms directly.', 422);
      return fail('Google redirected this form somewhere unexpected.', 422);
    }
    if (res.status === 404) return fail('No form was found at this link. Check that it’s complete.', 404);
    if (!res.ok) return fail(`Google Forms returned an error (${res.status}). Try again in a moment.`, 502);

    const html = await readCapped(res);
    if (html === null) return fail('This form is too large to read.', 413);
    const data = extractGoogleFormData(html);
    if (!data) {
      if (/no longer accepting responses|closedform/i.test(html)) return fail('This form is no longer accepting responses.', 422);
      return fail('AwaazForm couldn’t read the questions on this form.', 422);
    }
    const form = parseGoogleForm(data, formId);
    if (form.questions.length === 0) return fail('This form has no questions to fill.', 422);
    return Response.json({ formId, ...form });
  } catch (err) {
    const timeout = (err as Error).name === 'TimeoutError';
    return fail(timeout ? 'Google Forms took too long to respond. Try again.' : 'AwaazForm couldn’t reach Google Forms. Try again.', 502);
  }
}
