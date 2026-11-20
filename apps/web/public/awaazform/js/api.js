// Same-origin adapter for the AwaazForm Next.js backend.
// Every function resolves to null when the server is off, slow or fails,
// so the app always falls back to its on-device logic and keeps working.

export const API_BASE = (typeof window !== 'undefined' && window.AWAAZ_API_BASE) || '/api/legacy';

// PRIVACY SWITCH. The app tells users "Your answers stay on this device".
// While this is false, typed answers are never sent to the server.
// Set it to true only after that wording (consentText, trustLine in i18n.js) is updated.
// Even when true, 'sensitive' fields (Aadhaar, PAN...) are never sent.
export const SERVER_VALIDATION = false;

let online = null;
let checkedAt = 0;
const RECHECK_MS = 30000;

async function call(path, options = {}, timeoutMs = 4000) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, signal: ctl.signal });
    return res.ok ? await res.json() : null;
  } catch {
    return null; // server off, blocked by CORS/CSP, or timed out
  } finally {
    clearTimeout(timer);
  }
}

// True if the backend answers its health check. The result is remembered for 30 seconds.
export async function serverOnline() {
  if (online !== null && Date.now() - checkedAt < RECHECK_MS) return online;
  const r = await call('/health', {}, 1500);
  online = r?.status === 'ok';
  checkedAt = Date.now();
  return online;
}

// Same result shape as normalize() in data.js: { valid, value } or { valid:false, err }.
// Returns null (use the local check) when disabled, sensitive, or the server is unavailable.
export async function serverValidate(field, raw) {
  if (!SERVER_VALIDATION || field.type === 'sensitive') return null;
  if (!(await serverOnline())) return null;
  const r = await call('/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ field, raw: String(raw ?? '') }),
  });
  if (!r) return null;
  return r.valid ? { valid: true, value: r.value } : { valid: false, err: r.err };
}

// Turns pasted questions into fields. Returns an array of fields, or null to use parseText().
export async function serverParseText(text) {
  if (!(await serverOnline())) return null;
  const r = await call('/parse/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return r?.fields ?? null;
}

// Reads the text of a PDF or .txt on the server. Returns a string, or null to read it in the browser.
export async function serverExtractText(file) {
  if (!(await serverOnline())) return null;
  const body = new FormData();
  body.append('file', file);
  const r = await call('/extract/text', { method: 'POST', body }, 15000);
  return typeof r?.text === 'string' && r.text ? r.text : null;
}

// Asks the server to visit a form link and read its questions.
// The link is the only thing sent. Returns one of:
//   { offline: true }                       server not running -> keep the manual flow
//   { ok: true, title, fields, flagged, sourceUrl }    questions found
//   { ok: false, code }                     blocked | fetch_failed | too_large | not_html | needs_signin | no_questions
export async function serverParseUrl(url) {
  if (!(await serverOnline())) return { offline: true };
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 25000);
  try {
    const res = await fetch(`${API_BASE}/parse/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: ctl.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true, title: body.title, fields: body.fields, flagged: body.flagged || 0, sourceUrl: body.source_url };
    return { ok: false, code: body?.detail?.code || 'fetch_failed' };
  } catch {
    return { ok: false, code: 'fetch_failed' };
  } finally {
    clearTimeout(timer);
  }
}

// Account APIs belonged to the removed FastAPI backend. The selected Next.js backend uses device-local encrypted profiles instead; these legacy account endpoints are not available here.
const AUTH_TOKEN_KEY = 'awaazform_auth_token';
export function getAuthToken() { return sessionStorage.getItem(AUTH_TOKEN_KEY) || ''; }
export function clearAuthToken() { sessionStorage.removeItem(AUTH_TOKEN_KEY); }
export async function authRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = body.detail;
    throw new Error(typeof detail === 'string' ? detail : detail?.message || 'Something went wrong. Please try again.');
  }
  return body;
}
export async function authLogin(email, password) {
  const result = await authRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  sessionStorage.setItem(AUTH_TOKEN_KEY, result.access_token);
  return result.user;
}
export async function authRegister(values) {
  const result = await authRequest('/auth/register', { method: 'POST', body: JSON.stringify(values) });
  sessionStorage.setItem(AUTH_TOKEN_KEY, result.access_token);
  return result.user;
}
export async function authGetProfile() { return authRequest('/auth/me'); }
export async function authUpdateProfile(values) {
  return authRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(values) });
}
export async function authLogout() {
  try { await authRequest('/auth/logout', { method: 'POST' }); } finally { clearAuthToken(); }
}
