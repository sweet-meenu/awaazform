'use client';

import { encryptValue, forgetField, saveToProfile, type CanonicalKey, type Profile } from '@awaazform/core';
import Dexie, { type EntityTable } from 'dexie';

// Profiles live only in this browser (D5). IndexedDB via Dexie.
/** An uploaded PDF and its fill plan, kept locally so a PDF session survives reload (FR-22). */
export interface StoredPdf {
  id: string;
  name: string;
  bytes: ArrayBuffer;
  plan: unknown;
  createdAt: string;
}

class AwaazDB extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  files!: EntityTable<StoredPdf, 'id'>;
  constructor() {
    super('awaazform');
    this.version(1).stores({ profiles: 'id, label, createdAt' });
    this.version(2).stores({ profiles: 'id, label, createdAt', files: 'id, createdAt' });
  }
}

export const db = new AwaazDB();

export async function ensureDefaultProfile(): Promise<Profile[]> {
  const all = await db.profiles.orderBy('createdAt').toArray();
  if (all.length > 0) return all;
  const me: Profile = { id: 'me', label: 'Me', createdAt: new Date().toISOString(), encrypted: false, fields: {} };
  await db.profiles.put(me);
  return [me];
}

export async function createProfile(label: string): Promise<Profile> {
  const p: Profile = { id: crypto.randomUUID(), label: label.trim().slice(0, 60) || 'New profile', createdAt: new Date().toISOString(), encrypted: false, fields: {} };
  await db.profiles.put(p);
  return p;
}

export async function renameProfile(id: string, label: string) {
  await db.profiles.update(id, { label: label.trim().slice(0, 60) });
}

export async function deleteProfile(id: string) {
  await db.profiles.delete(id);
}

/** Saves one confirmed value. `saveToProfile` throws for sensitive labels (FR-38). */
export async function saveValue(profileId: string, key: CanonicalKey, value: string, questionLabel: string, source: string) {
  const p = await db.profiles.get(profileId);
  if (!p) throw new Error('Profile not found');
  let stored = value;
  if (p.encrypted) {
    // Imported lazily to avoid a cycle: vault imports db.
    const { keyFor } = await import('./vault');
    const k = keyFor(p.id);
    if (!k) throw new Error('Unlock this profile before saving to it');
    stored = await encryptValue(k, value);
  }
  await db.profiles.put(saveToProfile(p, key, stored, questionLabel, source));
}

export async function forgetValue(profileId: string, key: CanonicalKey) {
  const p = await db.profiles.get(profileId);
  if (p) await db.profiles.put(forgetField(p, key));
}

/** FR-35: forget everything for one profile. */
export async function forgetProfileValues(profileId: string) {
  await db.profiles.update(profileId, { fields: {} });
}

/** FR-35: forget everything, all profiles. */
export async function forgetAll() {
  await db.profiles.clear();
  await db.files.clear();
}
