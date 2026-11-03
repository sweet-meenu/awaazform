'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  // The replica is rendered inside an iframe; it has no chrome.
  if (path?.startsWith('/replica')) return null;

  const links = [
    { href: '/form', label: t.nav_form },
    { href: '/pdf', label: t.nav_pdf },
    { href: '/report', label: t.nav_report },
    { href: '/profiles', label: t.nav_profiles },
    { href: '/settings', label: t.nav_settings },
    { href: '/privacy', label: t.nav_privacy },
  ];

  return (
    <>
      <a href="#main" className="skip-link">{t.skip}</a>
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md transition-colors"
        style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)', borderColor: scrolled ? 'var(--border)' : 'transparent' }}
      >
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link href="/" aria-label="AwaazForm home"><Logo /></Link>
          <nav aria-label="Main" className="hidden md:block">
            <ul className="flex gap-1 text-sm">
              {links.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={path === l.href ? 'page' : undefined}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-muted transition-colors hover:text-ink aria-[current=page]:font-medium aria-[current=page]:text-ink"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <span className="chip hidden sm:inline-flex" title="Supported sources">Google Forms and PDFs only</span>
            <button
              type="button"
              className="btn btn-ghost !min-h-11 !px-3 text-sm"
              onClick={() => update({ language: settings.language === 'en' ? 'hi' : 'en' })}
              aria-label={settings.language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'}
            >
              {settings.language === 'en' ? 'हिन्दी' : 'English'}
            </button>
          </div>
        </div>
        <nav aria-label="Main (mobile)" className="container-x flex gap-1 overflow-x-auto pb-2 text-sm md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} aria-current={path === l.href ? 'page' : undefined} className="chip !min-h-11 !px-4 whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
