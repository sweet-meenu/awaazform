<p align="center">
  <img src="docs/media/bolu.png" alt="Bolu, the AwaazForm robot" width="132" />
</p>

<h1 align="center">AwaazForm</h1>

<p align="center">
  <b>Your voice. Your form. Your access.</b><br />
  Fill Google Forms and PDFs by talking. Every answer is read back and filled only after you say yes.
</p>

<p align="center">
  <a href="https://github.com/sweet-meenu/awaazform/releases/download/v0.1.0/awaazform-explainer.mp4"><img src="https://img.shields.io/badge/Watch_the_2--min_explainer-624DE3?style=for-the-badge&logo=youtube&logoColor=white" alt="Watch the explainer" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js_16-151718?logo=nextdotjs&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/TypeScript-151718?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/WCAG_2.2-AA-624DE3" alt="WCAG 2.2 AA" />
  <img src="https://img.shields.io/badge/English_%2B_हिन्दी-624DE3" alt="English and Hindi" />
</p>

<p align="center">
  <img src="docs/media/demo.gif" alt="AwaazForm reads back 12 March 1978, the user confirms, and the date of birth field is filled and verified" width="840" />
</p>

---

## The Confidence Loop

Bolu **listens**, **writes down** what you said, **checks** it, and **reads it back**. Nothing touches the form until you confirm, and then Bolu verifies that the value really landed.

<p align="center">
  <img src="docs/media/loop.png" alt="The Confidence Loop: listen, write down, check, read back" width="720" />
</p>

## What it does

<table>
  <tr>
    <td width="50%"><img src="docs/media/pdf.png" alt="PDF question review" /><br /><b>Printed PDFs too.</b> AI finds the questions, you nudge the boxes into place, AwaazForm writes the answers and ticks the boxes. The file never leaves your browser.</td>
    <td width="50%"><img src="docs/media/live.png" alt="Live Mode" /><br /><b>Live Mode.</b> Hands-free and off by default. Say "yes", "next" or "repeat" (or the Hindi equivalents), or interrupt at any time.</td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/media/activity.png" alt="Activity list" /><br /><b>No hidden actions.</b> Every step appears in a plain-language activity list.</td>
    <td width="50%"><img src="docs/media/safety.png" alt="Safety features" /><br /><b>Safe by design.</b> Saved details stay on your device, optionally locked with a passphrase (AES-GCM). It never fills passwords, OTPs or payment details.</td>
  </tr>
</table>

<p align="center">
  <img src="docs/media/access.png" alt="Big buttons, high contrast, large text" width="720" /><br />
  <sub>Big targets · high contrast · large text · Hindi · full keyboard control · reduce motion</sub>
</p>

## Guarantees

- **It never submits.** You press Submit yourself.
- **Only you can confirm.** The model can propose an answer but has no tool to confirm it. Writes go through one gate, `SessionController.confirm()`, which only the UI calls.
- **Your data stays private.** Personal data stays in the browser. The Groq key is used only on the server.

## Quick start

```bash
corepack enable
pnpm install
cp apps/web/.env.example apps/web/.env.local   # add your GROQ_API_KEY
pnpm dev                                       # http://localhost:3000
```

Without a key the app still works: you type your answers, and read-back uses the browser's voice.

| Command | Purpose |
|---|---|
| `pnpm test` | Core unit tests (Vitest) |
| `pnpm --filter web test:e2e` | Session and PDF end-to-end tests (needs a running server) |
| `pnpm --filter web test:a11y` | axe-core WCAG 2.2 AA audit |

## Deploy on Vercel

Import the repo, set **Root Directory** to `apps/web`, and add the variables from [`.env.example`](apps/web/.env.example). Vercel detects Next.js and pnpm on its own.

## Project layout

```
packages/core   types, validators, safety rules, session reducer, confirm gate, tool runner
apps/web        Next.js app: session, PDF, profiles, report, settings, API routes
media           the explainer video, rendered from code (see media/README.md)
example_forms   real test forms (ECI Form 6)
```

## Status

**Working:** the demo form session, fillable and printed PDFs, Live Mode, profiles, the readiness report, and the English and Hindi interface. axe-core reports no critical or serious violations on any route.

**Not yet:** the Chrome extension for live Google Forms, Devanagari text inside PDFs, and a manual screen-reader pass.

**Out of scope by design:** auto-submit, logins, payments, CAPTCHAs, sites other than Google Forms, and scanned PDFs.

---

<p align="center">
  <img src="docs/media/bolu.png" alt="" width="40" /><br />
  <sub>Team <b>CodeKweens</b> · Katathon 6.0 · Problem Statement 402</sub>
</p>
