'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LANGUAGES, type Language } from '@awaazform/core';
import { LANGUAGE_META } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';

export function Logo() {
  return (
    <span className="flex items-center gap-2 font-display text-base font-semibold">
      <span
        aria-hidden
        className="grid h-[22px] w-[22px] grid-flow-col place-items-center gap-px rounded-md px-[5px]"
        style={{ background: 'linear-gradient(135deg, var(--violet-500), var(--magenta-500))' }}
      >
        <i className="h-1.5 w-0.5 rounded bg-white" />
        <i className="h-[11px] w-0.5 rounded bg-white" />
        <i className="h-[7px] w-0.5 rounded bg-white" />
      </span>
      AwaazForm
    </span>
  );
}

export function Nav() {
  const { t, settings, update } = useSettings();
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [framed, setFramed] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => setFramed(window.parent !== window), []);
  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // The replica and the extension panel are rendered inside iframes; they have no chrome.
  if (path?.startsWith('/replica') || (path?.startsWith('/extension') && framed)) return null;

  const links = [
    { href: '/form', label: t.nav.form },
    { href: '/documents', label: t.nav.documents },
    { href: '/extension', label: t.nav.extension },
    { href: '/report', label: t.nav.report },
    { href: '/profiles', label: t.nav.profiles },
    { href: '/settings', label: t.nav.settings },
    { href: '/privacy', label: t.nav.privacy },
  ];

  const picker = (
    <label className="flex items-center">
      <span className="sr-only">{t.nav.language}</span>
      <select className="btn btn-ghost !min-h-11 !px-3 text-sm" value={settings.language}
        onChange={(e) => update({ language: e.target.value as Language })}>
        {LANGUAGES.map((l) => <option key={l} value={l} lang={l}>{LANGUAGE_META[l].native}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <a href="#main" className="skip-link">{t.nav.skip}</a>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md transition-colors"
        style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)', borderColor: scrolled || open ? 'var(--border)' : 'transparent' }}
      >
        <div className="nav-row container-wide flex h-16 items-center justify-between gap-3">
          <Link href="/" aria-label="AwaazForm"><Logo /></Link>
          <nav aria-label={t.nav.main} className="hidden xl:block">
            <ul className="flex gap-0.5 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={path === l.href ? 'page' : undefined}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 whitespace-nowrap text-muted transition-colors hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            {picker}
            <button type="button" className="btn btn-ghost !min-h-11 !px-3 xl:!hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}>
              <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
              <span className="sr-only">{t.nav.main}</span>
            </button>
          </div>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label={t.nav.main} className="container-wide border-t border-line pb-4 xl:hidden">
            <ul className="grid gap-1 pt-2 sm:grid-cols-2">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} aria-current={path === l.href ? 'page' : undefined}
                    className="flex min-h-12 items-center rounded-[var(--r-12)] px-4 text-base transition-colors hover:bg-[var(--bg-subtle)] aria-[current=page]:bg-[var(--violet-100)] aria-[current=page]:font-semibold aria-[current=page]:text-[var(--accent-text)]">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
    </>
  );
}
