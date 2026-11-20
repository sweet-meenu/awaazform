'use client';

import { commandWords, LANGUAGES } from '@awaazform/core';
import Link from 'next/link';
import { Reveal, Wave } from '@/components/Motion';
import { Logo } from '@/components/Nav';
import { fmt, LANGUAGE_META, Rich, type Strings } from '@/lib/i18n';
import { useSettings } from '@/lib/settings';

const LANG_SAMPLES = [
  { code: 'en', hello: 'What is your full name?' },
  { code: 'hi', hello: 'आपका पूरा नाम क्या है?' },
  { code: 'mr', hello: 'तुमचे पूर्ण नाव काय आहे?' },
] as const;

export default function Home() {
  const { t } = useSettings();
  const h = t.home;
  const WAYS = [
    { n: '01', title: h.way1_title, body: h.way1_body, href: '/form', cta: h.way1_cta, tags: ['Google Forms', 'Microsoft Forms'] },
    { n: '02', title: h.way2_title, body: h.way2_body, href: '/documents', cta: h.way2_cta, tags: ['PDF', 'Word .docx'] },
    { n: '03', title: h.way3_title, body: h.way3_body, href: '/extension', cta: h.way3_cta, tags: ['Chrome', 'Edge'] },
  ];
  const ASSIST = [[h.a1_t, h.a1_b], [h.a2_t, h.a2_b], [h.a3_t, h.a3_b], [h.a4_t, h.a4_b], [h.a5_t, h.a5_b], [h.a6_t, h.a6_b]] as const;
  const PROMISES = [[h.p1_t, h.p1_b], [h.p2_t, h.p2_b], [h.p3_t, h.p3_b], [h.p4_t, h.p4_b], [h.p5_t, h.p5_b], [h.p6_t, h.p6_b]] as const;
  return (
    <>
      {/* Hero */}
      <section className="overflow-x-clip pt-20 text-center md:pt-24">
        <div className="container-x grid justify-items-center gap-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-medium text-white shadow-[var(--shadow-md)]" style={{ background: 'var(--ink-900)' }}>
              <span className="rounded-full px-2 py-0.5" style={{ background: 'var(--violet-500)' }}>{h.badge_new}</span>
              {h.badge}
            </span>
          </Reveal>
          <Reveal y={30} delay={0.08}>
            <h1 className="max-w-[860px] text-[clamp(2.5rem,6vw,4rem)] tracking-[-0.035em]">
              {h.title_1}<br />
              <span className="gradient-text">{h.title_2}</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-[600px] text-muted">{h.lead}</p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap justify-center gap-3">
            <Link href="/form" className="btn">{h.cta_fill}</Link>
            <Link href="/extension" className="btn btn-ghost">{h.cta_extension}</Link>
          </Reveal>
          <Reveal delay={0.3}>
            <ul className="flex flex-wrap justify-center gap-2 text-xs" aria-label={h.highlights}>
              {[h.hl_1, h.hl_2, h.hl_3].map((x) => (
                <li key={x} className="chip !px-3 !py-1"><span aria-hidden style={{ color: 'var(--accent-text)' }}>✓</span>{x}</li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Product shot on violet glow → dark band */}
        <div className="relative mt-16">
          <div aria-hidden className="pointer-events-none absolute inset-x-[-10%] top-[20%] bottom-[-10%] blur-[40px]"
            style={{ background: 'radial-gradient(60% 55% at 50% 40%, rgba(98,77,227,1) 0%, rgba(141,74,247,0.55) 45%, rgba(21,23,24,0) 75%)' }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
            style={{ background: 'linear-gradient(180deg, rgba(21,23,24,0) 0%, rgba(21,23,24,0.32) 40%, rgba(21,23,24,0.82) 72%, #151718 100%)' }} />
          <Reveal y={0} className="relative z-10">
            <ProductShot t={t} />
          </Reveal>
        </div>
      </section>

      {/* Dark band: who it's for */}
      <section aria-label={h.built_for} className="pt-10 pb-24 text-center text-white" style={{ background: 'var(--ink-950)' }}>
        <p className="mb-8 text-sm" style={{ color: 'var(--ink-400)' }}>{h.built_for}</p>
        <div className="marquee" style={{ ['--speed' as string]: '40s' }}>
          <ul className="marquee-track">
            {[...h.personas, ...h.personas].map((p, i) => (
              <li key={i} aria-hidden={i >= h.personas.length} className="font-display text-xl font-semibold whitespace-nowrap text-white/75">{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Three ways */}
      <section id="ways" className="py-24 md:py-32">
        <div className="container-x">
          <SectionHead title={h.ways_title} body={h.ways_body} />
          <div className="grid gap-6 md:grid-cols-3">
            {WAYS.map((w, i) => (
              <Reveal key={w.n} delay={i * 0.08} className="card grid content-start gap-4 p-8 transition-transform duration-[400ms] hover:-translate-y-1">
                <span className="font-display text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>{w.n}</span>
                <h3 className="text-2xl">{w.title}</h3>
                <p className="text-sm text-muted">{w.body}</p>
                <ul className="flex flex-wrap gap-1.5" aria-label={h.works_with}>
                  {w.tags.map((t) => <li key={t} className="chip">{t}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link href={w.href} className="btn">{w.cta} →</Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Assistant */}
      <section className="pb-24 md:pb-32">
        <div className="container-x">
          <SectionHead title={h.assist_title} body={h.assist_body} />
          <ol className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {ASSIST.map(([t, b], i) => (
              <Reveal as="li" key={t} delay={(i % 3) * 0.08} className="grid content-start gap-2">
                <span className="font-display text-sm font-semibold" style={{ color: 'var(--accent-text)' }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className="text-lg">{t}</h3>
                <p className="text-sm text-muted">{b}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Languages */}
      <section aria-labelledby="langs-h" className="pb-24 md:pb-32">
        <div className="container-x">
          <div className="mx-auto mb-14 grid max-w-[620px] justify-items-center gap-5 text-center">
            <Reveal><h2 id="langs-h" className="text-[clamp(2rem,4vw,2.75rem)]"><Rich text={h.langs_title} /></h2></Reveal>
            <Reveal delay={0.08}><p className="max-w-[460px] text-muted">{h.langs_body}</p></Reveal>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LANG_SAMPLES.map((l, i) => {
              const w = commandWords(l.code);
              return (
                <Reveal key={l.code} delay={(i % 3) * 0.06} className="card grid content-start gap-2 p-6" >
                  <div lang={l.code} dir={LANGUAGE_META[l.code].dir} className="grid gap-2">
                    <p className="font-display text-3xl font-semibold">{LANGUAGE_META[l.code].native}</p>
                    <p className="text-sm">“{l.hello}”</p>
                    <p className="text-xs text-muted">“{w.yes}” ✓ · “{w.next}” →</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal delay={0.1}>
            <ul className="mt-8 flex flex-wrap justify-center gap-2" aria-label={t.nav.language}>
              {LANGUAGES.map((l) => <li key={l} lang={l} className="chip !px-3 !py-1 !text-sm">{LANGUAGE_META[l].native}</li>)}
            </ul>
            <p className="mx-auto mt-4 max-w-[520px] text-center text-xs text-muted">{h.langs_more}</p>
          </Reveal>
        </div>
      </section>

      {/* Confidence Loop */}
      <section className="pb-24 md:pb-32">
        <div className="container-x">
          <SectionHead title={h.loop_title} body={h.loop_body} />
          <Reveal>
            <ol className="flex flex-wrap items-center justify-center gap-2" aria-label={h.loop_label}>
              {h.loop.map((s, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className={`chip !px-4 !py-2 !text-sm ${i === 4 ? 'chip-accent' : ''}`}>
                    <span className="text-muted">{i + 1}</span> {s}
                  </span>
                  {i < h.loop.length - 1 && <span aria-hidden className="text-muted rtl:rotate-180">→</span>}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Promises */}
      <section className="pb-24 md:pb-32">
        <div className="container-x">
          <SectionHead title={h.trust_title} body={h.trust_body} />
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map(([t, b], i) => (
              <Reveal as="li" key={t} delay={(i % 3) * 0.08}>
                <h3 className="mb-2 flex items-center gap-2 font-sans text-sm tracking-normal">
                  <span aria-hidden style={{ color: 'var(--accent-text)' }}>✓</span> {t}
                </h3>
                <p className="text-sm text-muted">{b}</p>
              </Reveal>
            ))}
          </ul>
          <p className="mt-10 text-center text-sm"><Link href="/privacy" className="underline underline-offset-4">{h.privacy_link}</Link></p>
        </div>
      </section>

      {/* Violet extension panel */}
      <section className="container-x">
        <div className="overflow-hidden rounded-[var(--r-40)] px-6 pt-24 pb-16 text-center"
          style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--violet-100) 30%, var(--violet-500) 72%, var(--ink-950) 100%)' }}>
          <SectionHead title={h.ext_title} body={h.ext_body} />
          <ol className="mx-auto grid max-w-3xl gap-4 text-left text-white md:grid-cols-3">
            {[[h.e1_t, h.e1_b], [h.e2_t, h.e2_b], [h.e3_t, h.e3_b]].map(([title, b], i) => (
              <Reveal as="li" key={i} delay={i * 0.08} className="rounded-[var(--r-16)] border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                <span className="text-xs opacity-80">{fmt(h.step, { n: i + 1 })}</span>
                <h3 className="mt-1 mb-2 text-lg">{title}</h3>
                <p className="text-sm opacity-90">{b}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.2} className="mt-10 flex justify-center">
            <Link href="/extension" className="btn" style={{ background: 'var(--white)', color: 'var(--ink-900)' }}>{h.ext_cta}</Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center md:py-32">
        <div className="container-x grid justify-items-center gap-8">
          <Reveal><span style={{ color: 'var(--accent)' }}><Wave bars={24} /></span></Reveal>
          <Reveal delay={0.08}><h2 className="max-w-[520px] text-[clamp(2rem,4vw,2.75rem)]"><Rich text={h.cta_title} /></h2></Reveal>
          <Reveal delay={0.16} className="flex flex-wrap justify-center gap-3">
            <Link href="/form" className="btn">{h.cta_form}</Link>
            <Link href="/documents" className="btn btn-ghost">{h.cta_doc}</Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line py-12 text-sm">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 text-muted">
          <Logo />
          <span>{h.footer}</span>
          <span className="flex gap-4">
            <Link href="/extension" className="underline-offset-4 hover:underline">{t.nav.extension}</Link>
            <Link href="/privacy" className="underline-offset-4 hover:underline">{t.nav.privacy}</Link>
          </span>
        </div>
      </footer>
    </>
  );
}

function SectionHead({ title, body }: { title: string; body?: string }) {
  return (
    <div className="mx-auto mb-14 grid max-w-[620px] justify-items-center gap-5 text-center">
      <Reveal><h2 className="text-[clamp(2rem,4vw,2.75rem)]"><Rich text={title} /></h2></Reveal>
      {body && <Reveal delay={0.08}><p className="max-w-[460px] text-muted">{body}</p></Reveal>}
    </div>
  );
}

/** Static illustration of Live Mode: one spoken sentence fills several fields, each awaiting a yes. */
function ProductShot({ t }: { t: Strings }) {
  return (
    <div aria-hidden className="mx-auto w-[min(100%-48px,960px)] overflow-hidden rounded-[var(--r-16)] border border-line bg-surface text-left text-xs shadow-[var(--shadow-lg),0_40px_80px_rgba(98,77,227,0.25)]">
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--gray-300)' }} />)}</span>
        <span className="truncate text-muted">Scholarship Registration · Microsoft Form</span>
        <span className="chip chip-accent"><Wave bars={3} /> {t.live.mode}</span>
      </div>
      <div className="grid md:grid-cols-[1fr_1.1fr]">
        <div className="grid content-start gap-2 p-5" style={{ background: 'var(--ink-950)', color: 'var(--white)' }}>
          <div className="mb-1 flex items-center gap-2 font-medium"><span className="h-2 w-2 rounded-full" style={{ background: 'var(--red-600)' }} /> {t.live.listening}</div>
          <p className="max-w-[90%] justify-self-start rounded-[var(--r-12)] px-3 py-2" style={{ background: 'var(--ink-700)' }}>तुमचे पूर्ण नाव काय आहे?</p>
          <p className="max-w-[90%] justify-self-end rounded-[var(--r-12)] px-3 py-2 font-mono" style={{ background: 'var(--violet-500)' }}>“माझं नाव आशा पाटील, मी कॉलेजमध्ये शिकते”</p>
          <p className="max-w-[90%] justify-self-start rounded-[var(--r-12)] px-3 py-2" style={{ background: 'var(--ink-700)' }}>Asha Patil. हे बरोबर आहे का? मी आणखी 1 उत्तर नोंदवले आहे.</p>
          <p className="max-w-[90%] justify-self-end rounded-[var(--r-12)] px-3 py-2 font-mono" style={{ background: 'var(--violet-500)' }}>“हो”</p>
        </div>
        <div className="grid content-start gap-3 p-5">
          <div className="font-medium">{t.nav.form}</div>
          {[
            ['Full name', 'Asha Patil', 'ok', 'romanised'],
            ['You are a', 'Student', 'pending', 'from “कॉलेजमध्ये शिकते”'],
            ['Email address', '', 'todo', ''],
          ].map(([l, v, s, note]) => (
            <div key={l} className="rounded-[var(--r-12)] border border-line bg-surface p-3 shadow-[var(--shadow-sm)]" style={s === 'pending' ? { borderColor: 'var(--violet-500)', boxShadow: '0 0 0 3px var(--violet-100)' } : undefined}>
              <div className="flex justify-between text-muted"><span>{l}</span>{note && <span>{note}</span>}</div>
              <div className="mt-1 flex min-h-5 items-center justify-between text-sm font-medium">
                {v || <span className="text-muted">{t.session.next}</span>}
                {s === 'ok' ? <span style={{ color: 'var(--green-600)' }}>✓ {t.session.st_verified}</span> : s === 'pending' ? <span className="chip chip-accent">{t.session.is_this_right}</span> : null}
              </div>
            </div>
          ))}
          <div className="flex flex-wrap gap-1.5">
            {['Student', 'Teacher', 'Working professional'].map((o, i) => (
              <span key={o} className="chip" style={i === 0 ? { borderColor: 'var(--violet-500)', color: 'var(--accent-text)', background: 'var(--violet-100)' } : undefined}>{i + 1} · {o}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
