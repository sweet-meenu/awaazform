"""AwaazForm API (FastAPI).

The Next.js app proxies /api/* here, so the browser still talks to one origin. Speech-to-text and the
assistant use Groq; speech output runs locally (Kokoro, MMS-TTS). Run: uv run uvicorn app.main:app"""

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI

from . import config
from . import web
from .guard import GuardMiddleware
from .routes import chat, extract, forms, stt, translate, tts
from .tts import engines


@asynccontextmanager
async def lifespan(_: FastAPI):
    task = asyncio.create_task(engines.warm_up()) if config.LOCAL_TTS else None
    yield
    if task and not task.done():
        task.cancel()


app = FastAPI(title="AwaazForm API", version="0.1.0", lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(GuardMiddleware)
for r in (chat, stt, translate, extract, forms, tts):
    app.include_router(r.router)


@app.get("/api/health")
async def health():
    """What's configured and loaded (no secrets)."""
    return {
        "ok": True,
        "groq": bool(config.GROQ_API_KEY),
        "chatModel": config.CHAT_MODEL or None,
        "localTts": config.LOCAL_TTS,
        "ttsLanguages": engines.languages(),
        "warm": engines.status(),
    }


# The site itself (static export of apps/web), on the same origin as the API. Mounted last, so its
# catch-all route never shadows /api/*.
_web_mounted = web.mount(app)
