import { describe, expect, it } from 'vitest';
import { decryptFields, guessFieldType, lockProfile, parseVoiceCommand, saveToProfile, unlockKey, unlockProfilePermanently, type Profile } from '../src';

describe('voice commands (Live Mode)', () => {
  it('recognises whole-utterance commands in English and Hindi', () => {
    expect(parseVoiceCommand('Yes.')).toBe('confirm');
    expect(parseVoiceCommand('हाँ')).toBe('confirm');
    expect(parseVoiceCommand('sahi hai')).toBe('confirm');
    expect(parseVoiceCommand('No')).toBe('reject');
    expect(parseVoiceCommand('अगला')).toBe('next');
    expect(parseVoiceCommand('please repeat')).toBe('repeat');
  });

  it('never treats an answer as a command', () => {
    expect(parseVoiceCommand('yes I need wheelchair access')).toBeNull();
    expect(parseVoiceCommand('Sunita Devi')).toBeNull();
    expect(parseVoiceCommand('next tuesday')).toBeNull();
  });
});

describe('field type guessing', () => {
  it('guesses from printed labels', () => {
    expect(guessFieldType('(4) Email ID of Self')).toBe('email');
    expect(guessFieldType('(3) Mobile No. of Self')).toBe('phone');
    expect(guessFieldType('(7) (a)Date of Birth d d / m m / y y y y')).toBe('date');
    expect(guessFieldType('PIN Code')).toBe('number');
    expect(guessFieldType('Town/Village')).toBe('text');
  });
});

describe('profile lock (FR-36)', () => {
  it('locks, rejects a wrong passphrase, and unlocks', async () => {
    let p: Profile = { id: 'me', label: 'Me', createdAt: '', encrypted: false, fields: {} };
    p = saveToProfile(p, 'email', 'sunita@example.com', 'Email', 'demo');
    const { profile: locked } = await lockProfile(p, 'correct horse battery');
    expect(locked.encrypted).toBe(true);
    expect(locked.fields.email!.value).not.toContain('sunita');
    expect(await unlockKey(locked, 'wrong passphrase')).toBeNull();
    const key = await unlockKey(locked, 'correct horse battery');
    expect(key).not.toBeNull();
    expect((await decryptFields(locked, key!)).email).toBe('sunita@example.com');
    const plain = await unlockProfilePermanently(locked, key!);
    expect(plain.encrypted).toBe(false);
    expect(plain.fields.email!.value).toBe('sunita@example.com');
  });

  it('refuses short passphrases', async () => {
    const p: Profile = { id: 'me', label: 'Me', createdAt: '', encrypted: false, fields: {} };
    await expect(lockProfile(p, 'short')).rejects.toThrow();
  });
});
