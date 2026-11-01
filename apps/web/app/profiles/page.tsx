'use client';

import type { CanonicalKey, Profile } from '@awaazform/core';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { Reveal } from '@/components/Motion';
import { createProfile, db, deleteProfile, ensureDefaultProfile, forgetAll, forgetProfileValues, forgetValue, renameProfile } from '@/lib/db';
import { isUnlocked, lock, onVaultChange, readValues, removePassphrase, setPassphrase, unlock } from '@/lib/vault';

// FR-30 – FR-36: profiles, saved values with sources, per-item delete, forget everything, passphrase lock.
export default function ProfilesPage() {
  useEffect(() => void ensureDefaultProfile(), []);
  const profiles = useLiveQuery(() => db.profiles.orderBy('createdAt').toArray(), []);
  const [newLabel, setNewLabel] = useState('');
  const [, tick] = useState(0);
  useEffect(() => onVaultChange(() => tick((n) => n + 1)), []);

  return (
    <div className="container-x max-w-3xl py-12">
      <Reveal>
        <h1 className="text-[clamp(1.75rem,3vw,2.5rem)]">Profiles</h1>
        <p className="mt-2 max-w-xl text-muted">
          Details you chose to remember, for you and for people you help. They stay in this browser only.
        </p>
      </Reveal>

      <form className="composer mt-8" onSubmit={async (e) => { e.preventDefault(); if (newLabel.trim()) { await createProfile(newLabel); setNewLabel(''); } }}>
        <label htmlFor="new-profile" className="sr-only">New profile name</label>
        <input id="new-profile" placeholder="Add someone you help, e.g. “Maa”" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={60} />
        <button className="btn flex-none" type="submit" disabled={!newLabel.trim()}>Add profile</button>
      </form>

      <div className="mt-8 grid gap-6">
        {profiles?.map((p) => <ProfileCard key={p.id} p={p} />)}
      </div>

      <section className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[var(--r-16)] border p-5" style={{ borderColor: 'var(--red-600)' }} aria-labelledby="forget-h">
        <div>
          <h2 id="forget-h" className="text-lg">Forget everything</h2>
          <p className="mt-1 text-sm text-muted">Deletes every profile, saved detail and stored PDF from this browser.</p>
        </div>
        <button type="button" className="btn btn-danger"
          onClick={async () => { if (confirm('Delete all profiles and saved details? This cannot be undone.')) { await forgetAll(); await ensureDefaultProfile(); } }}>
          Forget everything
        </button>
      </section>
    </div>
  );
}

function ProfileCard({ p }: { p: Profile }) {
  const [label, setLabel] = useState(p.label);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Partial<Record<CanonicalKey, string>> | null>(null);
  const [dialog, setDialog] = useState<null | 'set' | 'unlock'>(null);
  const unlocked = isUnlocked(p);
  const fields = Object.values(p.fields).filter(Boolean);

  useEffect(() => {
    let live = true;
    readValues(p).then((v) => live && setValues(v));
    return () => { live = false; };
  }, [p, unlocked]);

  return (
    <section aria-labelledby={`p-${p.id}`} className="card grid gap-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {editing ? (
          <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); await renameProfile(p.id, label); setEditing(false); }}>
            <label htmlFor={`rn-${p.id}`} className="sr-only">Profile name</label>
            <input id={`rn-${p.id}`} className="field-input !min-h-11 !w-48 !py-1" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} autoFocus />
            <button type="submit" className="btn">Save</button>
          </form>
        ) : (
          <h2 id={`p-${p.id}`} className="flex items-center gap-2 text-xl">
            <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--violet-500), var(--magenta-500))' }}>
              {p.label.slice(0, 1).toUpperCase()}
            </span>
            {p.label}
            {p.encrypted && <span className={`chip ${unlocked ? 'chip-ok' : 'chip-accent'}`}>{unlocked ? '🔓 Unlocked' : '🔒 Locked'}</span>}
          </h2>
        )}
        <div className="flex flex-wrap gap-1">
          {!editing && <button type="button" className="btn-quiet" onClick={() => setEditing(true)}>Rename</button>}
          {!p.encrypted && <button type="button" className="btn-quiet" onClick={() => setDialog('set')}>🔒 Add passphrase</button>}
          {p.encrypted && !unlocked && <button type="button" className="btn" onClick={() => setDialog('unlock')}>Unlock</button>}
          {p.encrypted && unlocked && (
            <>
              <button type="button" className="btn-quiet" onClick={() => lock(p.id)}>Lock now</button>
              <button type="button" className="btn-quiet" onClick={async () => { if (confirm(`Remove the passphrase from ${p.label}? Saved details will be stored unencrypted.`)) await removePassphrase(p); }}>Remove passphrase</button>
            </>
          )}
        </div>
      </div>

      {fields.length === 0 ? (
        <p className="rounded-[var(--r-12)] p-4 text-sm text-muted" style={{ background: 'var(--bg-subtle)' }}>
          Nothing saved yet. During a form, AwaazForm asks before remembering anything.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] rounded-[var(--r-16)] border border-line bg-surface">
          {fields.map((f) => f && (
            <li key={f.key} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs text-muted capitalize">{f.key.replace(/_/g, ' ')}</p>
                <p className="font-medium break-all">{values ? values[f.key] : '••••••••'}</p>
                <p className="text-xs text-muted">From {f.sources.join(', ')} · {new Date(f.confirmedAt).toLocaleDateString()}</p>
              </div>
              <button type="button" className="btn-quiet flex-none" onClick={() => forgetValue(p.id, f.key as CanonicalKey)} aria-label={`Delete saved ${f.key.replace(/_/g, ' ')}`}>Delete</button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1 border-t border-line pt-3">
        <button type="button" className="btn-quiet" disabled={fields.length === 0}
          onClick={async () => { if (confirm(`Forget everything saved for ${p.label}?`)) await forgetProfileValues(p.id); }}>
          Forget all for {p.label}
        </button>
        {p.id !== 'me' && (
          <button type="button" className="btn-quiet" style={{ color: 'var(--red-600)' }} onClick={async () => { if (confirm(`Delete the profile ${p.label}?`)) await deleteProfile(p.id); }}>
            Delete profile
          </button>
        )}
      </div>

      <PassphraseDialog mode={dialog} profile={p} onClose={() => setDialog(null)} />
    </section>
  );
}

function PassphraseDialog({ mode, profile, onClose }: { mode: null | 'set' | 'unlock'; profile: Profile; onClose: () => void }) {
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => { setA(''); setB(''); setError(null); onClose(); };

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'set') {
        if (a.length < 8) return setError('Use at least 8 characters.');
        if (a !== b) return setError('The two passphrases do not match.');
        await setPassphrase(profile, a);
        close();
      } else if (mode === 'unlock') {
        if (await unlock(profile, a)) close();
        else setError('That passphrase is not right.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={mode !== null} onClose={close} title={mode === 'set' ? `Protect ${profile.label} with a passphrase` : `Unlock ${profile.label}`}
      footer={<>
        <button type="button" className="btn btn-ghost" onClick={close}>Cancel</button>
        <button type="button" className="btn" onClick={submit} disabled={busy || !a}>{mode === 'set' ? 'Protect' : 'Unlock'}</button>
      </>}>
      {mode === 'set' && (
        <p>Saved details are encrypted in this browser (AES-GCM). You will need the passphrase to use them. <b>If you forget it, they cannot be recovered.</b></p>
      )}
      <label className="grid gap-1.5">
        <span className="font-medium">Passphrase</span>
        <input type="password" className="field-input" value={a} onChange={(e) => setA(e.target.value)} autoComplete={mode === 'set' ? 'new-password' : 'current-password'}
          onKeyDown={(e) => e.key === 'Enter' && mode === 'unlock' && void submit()} aria-invalid={!!error} aria-describedby={error ? `pp-err-${profile.id}` : undefined} />
      </label>
      {mode === 'set' && (
        <label className="grid gap-1.5">
          <span className="font-medium">Type it again</span>
          <input type="password" className="field-input" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" onKeyDown={(e) => e.key === 'Enter' && void submit()} />
        </label>
      )}
      {error && <p id={`pp-err-${profile.id}`} role="alert" className="font-medium" style={{ color: 'var(--red-600)' }}>{error}</p>}
    </Dialog>
  );
}
