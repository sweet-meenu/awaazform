import Link from 'next/link';
import { Reveal, Wave } from '@/components/Motion';
import { Logo } from '@/components/Nav';

const LOOP = ['Listen', 'Transcribe', 'Validate', 'Read back', 'Confirm', 'Fill', 'Verify'];

const PERSONAS = [
  'People with visual impairments', 'People with motor disabilities', 'Reading or writing difficulty',
  'Hindi speakers', 'Caregivers and family helpers', 'Elderly and first-time users',
];

const SOURCES = [
  {
    title: 'Google Forms',
    body: 'Paste a form link. Answer by voice, then open the real form with your confirmed answers filled in. No install needed.',
    tag: 'Paste a link',
  },
  {
    title: 'Fillable PDFs',
    body: 'Upload a PDF with form fields. It is filled in your browser and downloaded, and it is never uploaded anywhere.',
    tag: 'In your browser',
  },
  {
    title: 'Printed (flat) PDFs',
    body: 'For PDFs without fields, you place the answer boxes and AwaazForm writes your confirmed answers in them.',
    tag: 'Approximate placement',
  },
];

const PROMISES = [
  ['Never submits', 'There is no code path that presses Submit. You always submit the form yourself.'],
  ['Nothing filled without your yes', 'Every answer is read back. Only confirmed answers reach the form.'],
  ['Every action visible', 'A timeline shows each step the AI takes, in plain language, as it happens.'],
  ['No passwords or payments', 'Passwords, OTPs, CAPTCHAs, card and bank details are never filled.'],
  ['Your data stays with you', 'Saved details live in your browser only, with optional passphrase encryption.'],
  ['Saved only when you agree', 'AwaazForm asks before remembering anything, and you can forget it all in one tap.'],
] as const;

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="overflow-x-clip pt-20 text-center md:pt-24">
        <div className="container-x grid justify-items-center gap-6">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full py-1 pr-3 pl-1 text-xs font-medium text-white shadow-[var(--shadow-md)]" style={{ background: 'var(--ink-900)' }}>
              <span className="rounded-full px-2 py-0.5" style={{ background: 'var(--violet-500)' }}>New</span>
              Voice and text, in English and Hindi
            </span>
          </Reveal>
          <Reveal y={30} delay={0.08}>
            <h1 className="max-w-[860px] text-[clamp(2.5rem,6vw,4rem)] tracking-[-0.035em]">
              Your voice. Your form.<br />
              <span className="gradient-text">Your access.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="max-w-[580px] text-muted">
              AwaazForm reads each question aloud, listens to your answer, reads it back, and fills it in only after
              you confirm. You watch every step, and you always press Submit yourself.
            </p>
          </Reveal>
          <Reveal delay={0.24} className="flex flex-wrap justify-center gap-3">
            <Link href="/session" className="btn">Try the demo form</Link>
            <Link href="/form" className="btn btn-ghost">Paste a Google Form link</Link>
          </Reveal>
        </div>

        {/* Product shot on violet glow → dark band */}
        <div className="relative mt-16">
          <div aria-hidden className="pointer-events-none absolute inset-x-[-10%] top-[20%] bottom-[-10%] blur-[40px]"
            style={{ background: 'radial-gradient(60% 55% at 50% 40%, rgba(98,77,227,1) 0%, rgba(141,74,247,0.55) 45%, rgba(21,23,24,0) 75%)' }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5"
            style={{ background: 'linear-gradient(180deg, rgba(21,23,24,0) 0%, rgba(21,23,24,0.32) 40%, rgba(21,23,24,0.82) 72%, #151718 100%)' }} />
          <Reveal y={0} className="relative z-10">
            <ProductShot />
          </Reveal>
        </div>
      </section>

      {/* Dark band: who it's for */}
      <section aria-label="Who AwaazForm is for" className="pt-10 pb-24 text-center text-white" style={{ background: 'var(--ink-950)' }}>
        <p className="mb-8 text-sm" style={{ color: 'var(--ink-400)' }}>Built with and for</p>
        <div className="marquee" style={{ ['--speed' as string]: '40s' }}>
          <ul className="marquee-track">
            {[...PERSONAS, ...PERSONAS].map((p, i) => (
              <li key={i} aria-hidden={i >= PERSONAS.length} className="font-display text-xl font-semibold whitespace-nowrap text-white/75">{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Confidence Loop */}
      <section className="py-24 md:py-32">
        <div className="container-x">
          <SectionHead title={<>The Confidence Loop,<br />on every answer</>} body="Nothing reaches your form until you have heard it, seen it, and said yes." />
          <Reveal>
            <ol className="flex flex-wrap items-center justify-center gap-2" aria-label="Steps for every answer">
              {LOOP.map((s, i) => (
                <li key={s} className="flex items-center gap-2">
                  <span className={`chip !px-4 !py-2 !text-sm ${s === 'Confirm' ? 'chip-accent' : ''}`}>
                    <span className="text-muted">{i + 1}</span> {s}
                  </span>
                  {i < LOOP.length - 1 && <span aria-hidden className="text-muted">→</span>}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      {/* Sources */}
      <section id="sources" className="pb-24 md:pb-32">
        <div className="container-x">
          <SectionHead title={<>Google Forms and PDFs.<br />Nothing else, yet.</>} body="AwaazForm is clear about its limits: it only works where it can fill and verify reliably." />
          <div className="grid gap-6 md:grid-cols-3">
            {SOURCES.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08} className="card grid content-start gap-3 p-8 transition-transform duration-[400ms] hover:-translate-y-1">
                <span className="chip w-fit">{s.tag}</span>
                <h3 className="text-2xl">{s.title}</h3>
                <p className="text-sm text-muted">{s.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Promises */}
      <section className="pb-24 md:pb-32">
        <div className="container-x">
          <SectionHead title={<>Responsible by design,<br />enforced in code</>} />
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
        </div>
      </section>

      {/* Violet "get started" panel */}
      <section className="container-x">
        <div className="overflow-hidden rounded-[var(--r-40)] px-6 pt-24 pb-16 text-center"
          style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--violet-100) 30%, var(--violet-500) 72%, var(--ink-950) 100%)' }}>
          <SectionHead title={<>Fill your Google Form<br />by voice</>} body="Install the extension, open your form, and start a session from the side panel." />
          <ol className="mx-auto grid max-w-3xl gap-4 text-left text-white md:grid-cols-3">
            {[
              ['Install', 'Load the AwaazForm extension in Chrome or Edge.'],
              ['Open your form', 'Open any Google Form and click the AwaazForm side panel.'],
              ['Talk it through', 'Answer each question, confirm the read-back, then submit yourself.'],
            ].map(([t, b], i) => (
              <Reveal as="li" key={t} delay={i * 0.08} className="rounded-[var(--r-16)] border border-white/20 bg-white/10 p-6 backdrop-blur-md">
                <span className="text-xs opacity-80">Step {i + 1}</span>
                <h3 className="mt-1 mb-2 text-lg">{t}</h3>
                <p className="text-sm opacity-90">{b}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 text-center md:py-32">
        <div className="container-x grid justify-items-center gap-8">
          <Reveal><span style={{ color: 'var(--accent)' }}><Wave bars={24} /></span></Reveal>
          <Reveal delay={0.08}><h2 className="max-w-[520px] text-[clamp(2rem,4vw,2.75rem)]">Start with the<br />demo form today.</h2></Reveal>
          <Reveal delay={0.16} className="flex flex-wrap justify-center gap-3">
            <Link href="/session" className="btn">Try the demo form</Link>
            <Link href="/form" className="btn btn-ghost">Paste a Google Form link</Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-line py-12 text-sm">
        <div className="container-x flex flex-wrap items-center justify-between gap-4 text-muted">
          <Logo />
          <span>CodeKweens · Katathon 6.0 · Problem Statement 402</span>
          <Link href="/privacy" className="underline-offset-4 hover:underline">Privacy</Link>
        </div>
      </footer>
    </>
  );
}

function SectionHead({ title, body }: { title: React.ReactNode; body?: string }) {
  return (
    <div className="mx-auto mb-14 grid max-w-[620px] justify-items-center gap-5 text-center">
      <Reveal><h2 className="text-[clamp(2rem,4vw,2.75rem)]">{title}</h2></Reveal>
      {body && <Reveal delay={0.08}><p className="max-w-[460px] text-muted">{body}</p></Reveal>}
    </div>
  );
}

/** Static illustration of a session: replica, read-back and timeline. */
function ProductShot() {
  return (
    <div aria-hidden className="mx-auto w-[min(100%-48px,960px)] overflow-hidden rounded-[var(--r-16)] border border-line bg-surface text-left text-xs shadow-[var(--shadow-lg),0_40px_80px_rgba(98,77,227,0.25)]">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="flex gap-1.5">{[0, 1, 2].map((i) => <i key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: 'var(--gray-300)' }} />)}</span>
        <span className="text-muted">Community Health Camp Registration · Filling for <b className="text-ink">Me</b></span>
        <span className="chip chip-ok">4 of 13 verified</span>
      </div>
      <div className="grid md:grid-cols-[1.3fr_1fr]">
        <div className="grid content-start gap-3 p-6">
          {[
            ['Full name', 'Sunita Devi', 'ok'],
            ['Email address', 'sunita@example.com', 'ok'],
            ['Date of birth', '12/03/1978', 'pending'],
          ].map(([l, v, s]) => (
            <div key={l} className="rounded-[var(--r-12)] border border-line bg-surface p-3 shadow-[var(--shadow-sm)]" style={s === 'pending' ? { borderColor: 'var(--violet-500)', boxShadow: '0 0 0 3px var(--violet-100)' } : undefined}>
              <div className="text-muted">{l}</div>
              <div className="mt-1 flex items-center justify-between text-sm font-medium">
                {v}
                {s === 'ok' ? <span style={{ color: 'var(--green-600)' }}>✓</span> : <span className="chip chip-accent">Is this right?</span>}
              </div>
            </div>
          ))}
          <div className="rounded-[var(--r-12)] p-3 font-mono text-[11px] leading-relaxed" style={{ background: 'var(--ink-950)', color: 'var(--gray-300)' }}>
            <span style={{ color: 'var(--violet-300)' }}>›</span> “बारह मार्च उन्नीस सौ अठहत्तर”<br />
            <span style={{ color: 'var(--violet-300)' }}>›</span> Date of birth: 12 March 1978
          </div>
        </div>
        <div className="border-t border-line p-6 md:border-t-0 md:border-l">
          <div className="mb-3 font-medium">What AwaazForm is doing</div>
          {['Asking about “Date of birth”', 'Proposing “1978-03-12” (from spoken)', 'Reading back “12 March 1978”', 'Waiting for your confirmation'].map((t, i) => (
            <div key={t} className="flex items-start gap-2 border-b border-line py-2 last:border-0">
              <span className="mt-1 h-2 w-2 flex-none rounded-full" style={{ background: i === 3 ? 'var(--violet-500)' : 'var(--green-600)' }} />
              <span className={i === 3 ? 'font-medium' : 'text-muted'}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
