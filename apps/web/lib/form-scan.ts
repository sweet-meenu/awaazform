'use client';

import {
  canonicalFormId, extractGoogleFormData, googleFormUrl, parseGoogleForm, parseGoogleFormUrl,
  parseMicrosoftForm, parseMicrosoftFormUrl, type FormQuestion, type MicrosoftFormJson,
} from '@awaazform/core';
import { apiUrl } from './api';

export interface ScannedForm { formId: string; title: string; description?: string; questions: FormQuestion[]; platform?: 'google' | 'microsoft' }

/**
 * Reads a public Google or Microsoft Form. The API fetches the page (allow-listed hosts, every redirect
 * checked); parsing happens here with packages/core. Errors are the same English messages as before,
 * translated for display by localizeMessage.
 */
export async function scanForm(input: string): Promise<{ form: ScannedForm } | { error: string }> {
  return parseMicrosoftFormUrl(input) ? scanMicrosoft(input) : scanGoogle(input);
}

async function post<T>(path: string, body: { url: string; edit?: boolean }): Promise<{ data: T } | { error: string }> {
  const res = await fetch(apiUrl(path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  return res.ok ? { data } : { error: data.error ?? 'AwaazForm couldn’t read the questions on this form.' };
}

async function scanGoogle(input: string) {
  const link = parseGoogleFormUrl(input);
  if (!link) return { error: 'This doesn’t look like a Google Form link. It should start with docs.google.com/forms or forms.gle.' };
  const start = link.kind === 'short' ? link.url : googleFormUrl(link.kind === 'form' ? link.formId : `d/${link.docId}`);
  // The editing link redirects to a sign-in; `edit` lets the API say why.
  const r = await post<{ html: string; finalUrl: string }>('/api/gform', { url: start, edit: link.kind === 'doc' && link.edit });
  if ('error' in r) return r;
  const data = extractGoogleFormData(r.data.html);
  if (!data) {
    if (/no longer accepting responses|closedform/i.test(r.data.html)) return { error: 'This form is no longer accepting responses.' };
    return { error: 'AwaazForm couldn’t read the questions on this form.' };
  }
  const final = parseGoogleFormUrl(r.data.finalUrl);
  const formId = canonicalFormId(data) ?? (final?.kind === 'form' ? final.formId : final?.kind === 'doc' ? `d/${final.docId}` : null);
  if (!formId) return { error: 'AwaazForm couldn’t work out this form’s address.' };
  const form = parseGoogleForm(data, formId);
  if (form.questions.length === 0) return { error: 'This form has no questions to fill.' };
  return { form: { formId, ...form } };
}

async function scanMicrosoft(input: string) {
  const link = parseMicrosoftFormUrl(input)!;
  if (link.kind === 'edit') return { error: 'This is the form’s editing link. Use the link you’d send to people who fill it in (Collect responses → Copy link).' };
  const start = link.kind === 'short' ? link.url : `https://${link.host}/Pages/ResponsePage.aspx?id=${encodeURIComponent(link.formId)}`;
  const r = await post<{ finalUrl: string; form: MicrosoftFormJson & { status?: string } }>('/api/msform', { url: start });
  if ('error' in r) return r;
  const final = parseMicrosoftFormUrl(r.data.finalUrl);
  if (final?.kind !== 'form') return { error: 'AwaazForm couldn’t work out this form’s address.' };
  if (r.data.form.status && r.data.form.status !== 'Active') return { error: 'This form is no longer accepting responses.' };
  const form = parseMicrosoftForm(r.data.form, final.formId, final.host);
  if (form.questions.length === 0) return { error: 'This form has no questions to fill.' };
  return { form: { formId: final.formId, platform: 'microsoft' as const, ...form } };
}
