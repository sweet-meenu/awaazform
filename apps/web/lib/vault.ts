'use client';

import {
  decryptFields, lockProfile, unlockKey, unlockProfilePermanently,
  type CanonicalKey, type Profile,
} from '@awaazform/core';
import { db } from './db';

// Keys for unlocked profiles live only in memory: a reload locks everything again (FR-36).
const keys = new Map<string, CryptoKey>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

export function onVaultChange(fn: () => void) {
  listeners.add(fn);
  return () => void listeners.delete(fn);
}

export const isUnlocked = (p: Profile) => !p.encrypted || keys.has(p.id);
export const keyFor = (profileId: string) => keys.get(profileId);

export async function setPassphrase(p: Profile, passphrase: string) {
  const { profile, key } = await lockProfile(p, passphrase);
  await db.profiles.put(profile);
  keys.set(p.id, key);
  notify();
}

/** Returns false for a wrong passphrase. */
export async function unlock(p: Profile, passphrase: string): Promise<boolean> {
  const key = await unlockKey(p, passphrase);
  if (!key) return false;
  keys.set(p.id, key);
  notify();
  return true;
}

export function lock(profileId: string) {
  keys.delete(profileId);
  notify();
}

export async function removePassphrase(p: Profile) {
  const key = keys.get(p.id);
  if (!key) throw new Error('Unlock this profile first');
  await db.profiles.put(await unlockProfilePermanently(p, key));
  keys.delete(p.id);
  notify();
}

/** Plain saved values, or `null` while the profile is locked. */
export async function readValues(p: Profile): Promise<Partial<Record<CanonicalKey, string>> | null> {
  if (!p.encrypted) return Object.fromEntries(Object.values(p.fields).map((f) => [f!.key, f!.value]));
  const key = keys.get(p.id);
  return key ? decryptFields(p, key) : null;
}
