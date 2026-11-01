import { describe, expect, it } from 'vitest';
import {
  canSave, classifySupport, decryptValue, deriveKey, encryptValue, newSalt, saveToProfile,
  suggestCanonicalKey, validateAnswer, type FormQuestion, type Profile,
} from '../src';

const profile: Profile = { id: 'me', label: 'Me', createdAt: '', encrypted: false, fields: {} };

describe('sensitive data (§9.3, AC-09)', () => {
  it('never offers passport or Aadhaar numbers for saving', () => {
    expect(suggestCanonicalKey({ label: 'Passport number', type: 'text' })).toBeNull();
    expect(canSave('full_name', 'Passport number')).toBe(false);
    expect(canSave('full_name', 'आधार संख्या')).toBe(false);
    expect(() => saveToProfile(profile, 'full_name', 'X123', 'Passport number', 'form')).toThrow();
  });

  it('only canonical keys are saveable', () => {
    expect(canSave('blood_group', 'Name')).toBe(false);
    expect(canSave('email', 'Email address')).toBe(true);
  });

  it('classifies auth, payment and upload controls as unsupported', () => {
    expect(classifySupport('Enter OTP', 'text').support).toBe('unsupported');
    expect(classifySupport('Card number', 'number').support).toBe('unsupported');
    expect(classifySupport('Password', 'password').support).toBe('unsupported');
    expect(classifySupport('Upload resume', 'file').support).toBe('unsupported');
    expect(classifySupport('PIN code', 'number').support).toBe('supported');
    expect(classifySupport('Passport number', 'text').support).toBe('manual');
  });

  it('suggests canonical keys for common labels', () => {
    expect(suggestCanonicalKey({ label: 'Full name', type: 'text' })).toBe('full_name');
    expect(suggestCanonicalKey({ label: "Father's name", type: 'text' })).toBeNull();
    expect(suggestCanonicalKey({ label: 'Mobile number', type: 'phone' })).toBe('phone');
    expect(suggestCanonicalKey({ label: 'PIN code', type: 'number' })).toBe('postal_code');
  });
});

describe('validation', () => {
  const base = { id: 'x', required: true, support: 'supported', source: { kind: 'fixture', name: 't' } } as const;
  const q = (type: FormQuestion['type'], options?: string[]): FormQuestion => ({ ...base, label: 'L', type, options });

  it('validates multi-select against options', () => {
    expect(validateAnswer(q('checkbox', ['Eye check-up', 'Dental']), 'eye check-up and dental')).toEqual({ ok: true, normalized: 'Eye check-up, Dental' });
    expect(validateAnswer(q('checkbox', ['Eye check-up', 'Dental']), 'surgery').ok).toBe(false);
  });

  it('rejects bad emails', () => {
    expect(validateAnswer(q('email'), 'not an email').ok).toBe(false);
  });
});

describe('profile encryption (FR-36)', () => {
  it('round-trips, and fails with the wrong passphrase', async () => {
    const salt = newSalt();
    const key = await deriveKey('correct horse', salt);
    const ct = await encryptValue(key, 'ayush@example.com');
    expect(ct).not.toContain('ayush');
    expect(await decryptValue(key, ct)).toBe('ayush@example.com');
    const wrong = await deriveKey('wrong', salt);
    await expect(decryptValue(wrong, ct)).rejects.toThrow();
  });
});
