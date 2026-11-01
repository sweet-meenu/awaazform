// Profile helpers: save guard and optional passphrase encryption (FR-31, FR-36, FR-38).
import { isSensitive } from './safety';
import { CANONICAL_KEYS, type CanonicalKey, type Profile } from './types';

export function canSave(key: string, questionLabel: string): key is CanonicalKey {
  return (CANONICAL_KEYS as readonly string[]).includes(key) && !isSensitive(questionLabel);
}

/** Returns a new profile with the value saved. Throws if saving is not allowed. */
export function saveToProfile(
  p: Profile, key: CanonicalKey, value: string, questionLabel: string, source: string, now = new Date().toISOString(),
): Profile {
  if (!canSave(key, questionLabel)) throw new Error('This kind of information is never saved.');
  const prev = p.fields[key];
  const sources = prev?.sources.includes(source) ? prev.sources : [...(prev?.sources ?? []), source];
  return { ...p, fields: { ...p.fields, [key]: { key, value, confirmedAt: now, sources } } };
}

export function forgetField(p: Profile, key: CanonicalKey): Profile {
  const { [key]: _gone, ...rest } = p.fields;
  return { ...p, fields: rest };
}

// --- Encryption: AES-GCM with a PBKDF2-derived key (WebCrypto, no dependencies) ---

const PBKDF2_ITERATIONS = 310_000;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export function newSalt(): string {
  return b64(crypto.getRandomValues(new Uint8Array(16)));
}

export async function deriveKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: unb64(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

/** Returns `base64(iv).base64(ciphertext)`. */
export async function encryptValue(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return `${b64(iv)}.${b64(ct)}`;
}

/** Throws if the passphrase is wrong (AES-GCM authentication fails). */
export async function decryptValue(key: CryptoKey, payload: string): Promise<string> {
  const [iv, ct] = payload.split('.');
  if (!iv || !ct) throw new Error('Malformed ciphertext');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(iv) }, key, unb64(ct));
  return new TextDecoder().decode(pt);
}

// --- Whole-profile lock/unlock (FR-36) ---

const VERIFIER = 'awaazform-verifier-v1';

/** Encrypts every saved value. Returns the locked profile and the key, so it can stay unlocked in memory. */
export async function lockProfile(p: Profile, passphrase: string): Promise<{ profile: Profile; key: CryptoKey }> {
  if (p.encrypted) throw new Error('Profile is already locked');
  if (passphrase.length < 8) throw new Error('Use a passphrase of at least 8 characters');
  const salt = newSalt();
  const key = await deriveKey(passphrase, salt);
  const fields: Profile['fields'] = {};
  for (const f of Object.values(p.fields)) {
    if (f) fields[f.key] = { ...f, value: await encryptValue(key, f.value) };
  }
  return { profile: { ...p, encrypted: true, salt, verifier: await encryptValue(key, VERIFIER), fields }, key };
}

/** Returns the key if the passphrase is right, otherwise `null`. */
export async function unlockKey(p: Profile, passphrase: string): Promise<CryptoKey | null> {
  if (!p.encrypted || !p.salt || !p.verifier) return null;
  const key = await deriveKey(passphrase, p.salt);
  try {
    return (await decryptValue(key, p.verifier)) === VERIFIER ? key : null;
  } catch {
    return null;
  }
}

/** Plain values of a locked profile, for display and reuse while unlocked. */
export async function decryptFields(p: Profile, key: CryptoKey): Promise<Partial<Record<CanonicalKey, string>>> {
  const out: Partial<Record<CanonicalKey, string>> = {};
  for (const f of Object.values(p.fields)) if (f) out[f.key] = p.encrypted ? await decryptValue(key, f.value) : f.value;
  return out;
}

/** Removes encryption (requires the key). */
export async function unlockProfilePermanently(p: Profile, key: CryptoKey): Promise<Profile> {
  const plain = await decryptFields(p, key);
  const fields: Profile['fields'] = {};
  for (const f of Object.values(p.fields)) if (f) fields[f.key] = { ...f, value: plain[f.key]! };
  const { salt: _s, verifier: _v, ...rest } = p;
  return { ...rest, encrypted: false, fields };
}
