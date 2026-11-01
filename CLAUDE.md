# AwaazForm

Assistive form filling (Katathon 6.0, PS 402). Users complete Google Forms and PDFs by voice or text. Each answer is read back and filled only after the user confirms. AwaazForm never submits. The full spec is the PRD (v2.0) that the user provided, and it is the source of truth for scope.

## Non-negotiables (PRD §9, enforced in `packages/core`)

- Writes reach a form only through `SessionController.confirm()`, which only the UI calls. There is no confirm tool for the model.
- The model acts only through the tools in `packages/core/src/tools.ts`, and the runner validates every argument with Zod.
- Never submit forms. Never fill passwords, OTPs, CAPTCHAs, payment or auth fields. Never save the sensitive categories in `safety.ts`.
- `GROQ_API_KEY` is used only in server code (`apps/web/lib/groq.ts`, which imports `server-only`). Personal data stays in the browser.
- Report only accuracy, latency or success numbers that were actually measured.

## Design theme: mirrors specifyapp.com (keep it)

All UI follows the Specify-derived theme. Never hard-code colours, radii, shadows or easings. Use the CSS variables in `apps/web/app/globals.css`.

- **Palette:** white / `--gray-100` surfaces, `--ink-900` text, `--violet-500` (#624DE3) as the single accent. Use `--text-muted` (ink-600) for small muted text so it keeps AA contrast.
- **Type:** Inter for headings (600, tight negative tracking) and body, Noto Sans Devanagari for Hindi, Fira Code for transcripts and code. Section heads are centred with a two-line `<br />` break and a muted subtitle beneath.
- **Section rhythm:** centred head, then a button pair (primary violet + white ghost), then content. Use `.card` (`--r-24`, white→gray-100 gradient, 1px border).
- **Signature moves:** hero product shot on a violet glow fading into an `--ink-950` band; edge-masked `.marquee`; a violet→dark rounded panel; a dark pill badge.
- **Motion:** `<Reveal>` in `components/Motion.tsx` replicates Framer's appear effect (fade + 20–30px rise, 0.4s, `[0.44,0,0.56,1]`). Every animation must respect `useSettings().reduceMotion` (FR-28).
- **Accessibility (WCAG 2.2 AA):** 44px minimum targets (`.btn` has them), visible focus, `aria-live` for announcements, no meaning carried by colour alone. Themes: `data-contrast="high"` and `data-text="large"` on `<html>`.
- **Motif:** `<Wave />` waveform.

## Structure

- `packages/core`: shared types, normalizers, validators, safety rules, session reducer, controller (confirm gate), tool runner, report, profile crypto, demo fixture. Tests in `test/`.
- `apps/web`: Next.js 16 app. Routes: `/`, `/session`, `/pdf`, `/replica` (iframe animation surface), `/report`, `/profiles`, `/settings`, `/privacy`, `/api/{chat,stt,tts,extract}`.
  - `components/SessionWorkspace.tsx` is the one session UI (question card, read-back/confirm, Live Mode, stepper, Form/Activity tabs). Sources plug in a `SurfaceHandle` (`lib/surface.ts`): `ReplicaSurface` for forms, `PdfSurface` for PDFs.
  - `lib/pdf.ts` handles PDF analysis, box placement and filling; `lib/live.ts` is Live Mode's voice detection; `lib/vault.ts` holds profile passphrase keys (in memory only).
- `apps/extension`: not yet created (Phases 2 and 4).
- `design/specify-reference/`: the original static Specify-style mockup, kept for visual reference.
- `example_forms/`: real test forms (ECI Form 6, a flat PDF).

## Commands

- `pnpm test`: core unit tests (Vitest)
- `pnpm --filter web build`, then `pnpm --filter web start`, then `pnpm --filter web test:e2e` and `test:a11y` (Playwright via the installed Edge; `BASE_URL` defaults to `http://localhost:3000`)
- Groq: `GROQ_CHAT_MODEL=openai/gpt-oss-120b` (verified 2026-11-01; `llama-3.1-8b-instant` is not available to this key). Orpheus TTS needs its terms accepted in the Groq console. Free-tier per-minute token limits are tight, so PDF extraction runs one page per request.
