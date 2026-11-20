# AwaazForm API (FastAPI)

The web app proxies `/api/*` here. See the main README for running both together (`pnpm dev:all`).

```bash
uv sync                                   # Python 3.12, CPU-only PyTorch
cp .env.example .env                      # GROQ_API_KEY and options
uv run python -m app.download en hi ta    # optional: fetch voices ahead of time
uv run uvicorn app.main:app --port 8000
```

| Route | What it does |
|---|---|
| `POST /api/chat` | One assistant step on Groq (tools declared from `packages/core`), streamed as server-sent events when asked |
| `POST /api/stt` | Groq Whisper, with silence and hallucination filtering |
| `GET/POST /api/tts` | Local voices: Kokoro (en, hi), MMS-TTS (other languages). `GET ?warm=xx` loads a voice in the background |
| `POST /api/translate` | The form's own wording into the user's language (Groq) |
| `POST /api/extract` | Questions on a printed PDF page (Groq), validated with Pydantic |
| `POST /api/gform`, `/api/msform` | Fetch a public form (allow-listed hosts, every redirect checked); the browser parses it |
| `GET /api/health` | What's configured and which voices are warm (no secrets) |

Licences: Kokoro is Apache-2.0. MMS-TTS is CC-BY-NC-4.0 (non-commercial), fine for a demo; replace it before any commercial use.
