# AwaazForm — integrated frontend + backend

This package combines the **AwaazForm frontend** from `AwaazForm-voice-workspace-final.zip`
with the **Next.js backend/application** from `awaazform-main.zip`.

## What is used

- Frontend: original HTML, CSS and JavaScript in `apps/web/public/awaazform/`.
- Backend: original Next.js application, API routes, shared `@awaazform/core` package and extension.
- The root URL redirects to `/awaazform/index.html`.
- The frontend's form-link reader uses `/api/legacy/parse/url`, a same-origin adapter that delegates
  to the backend's existing Google Forms and Microsoft Forms parsers (`/api/gform` and `/api/msform`).
- Existing backend AI, speech-to-text, text-to-speech, translation and document-extraction routes remain.

## Requirements

- Node.js 20.9 or later (a current Node.js LTS release is recommended).
- Corepack and pnpm (the repository pins pnpm in `package.json`).
- A Groq API key is optional. Without one, AI/voice endpoints use their documented fallback behavior.

## Run on Windows (PowerShell)

From this folder:

```powershell
corepack enable
pnpm install
Copy-Item apps/web/.env.example apps/web/.env.local
```

Add `GROQ_API_KEY` to `apps/web/.env.local` for AI, Whisper STT or configured TTS features. Then:

```powershell
pnpm dev
```

Open **http://localhost:3000**. Frontend and backend APIs share the same origin; no separate Python
server, FastAPI server, port override or CORS setup is required.

## Build and checks

```powershell
pnpm typecheck
pnpm test
pnpm build
```

For browser end-to-end tests, start the app and run the relevant scripts from `apps/web`. See the
original backend documentation for the complete test commands.

## Integration notes and limitations

1. The frontend ZIP also contained an older FastAPI backend and an older extension. Neither is used
   as the active backend. The Next.js backend and its matching extension are retained.
2. The compatibility route maps Next.js form-question results into the original frontend's expected
   field format. Google and Microsoft form reading therefore uses the second ZIP's parser code.
3. The first frontend's account registration/login endpoints belonged to FastAPI and are not present
   in the selected Next.js backend. The legacy Sign In button is hidden rather than sending credentials
   to a missing or incompatible endpoint. The Next.js app has encrypted browser-local profiles at
   `/profiles`.
4. Pasted-question and PDF text parsing continue to use the first frontend's built-in browser-side
   fallback. Its optional FastAPI parsing/extraction endpoints were not recreated.
5. The embedded Google Form workspace requires the browser extension. Use the integrated extension
   page at `/extension`; do not install the obsolete extension from the first ZIP.
6. Backend AI services require a valid `GROQ_API_KEY` in `apps/web/.env.local`. Never put this key in
   frontend JavaScript or a `NEXT_PUBLIC_` variable.

The original backend documentation, design notes, tests, workspace packages and API implementation
are retained.
