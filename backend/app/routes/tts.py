"""Text-to-speech: local voices (Kokoro, MMS-TTS) first, Groq's English voice as an option, and the
browser's own voices as the client-side fallback (it falls back on any non-200 answer)."""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field, ValidationError

from .. import config
from ..contract import LANGUAGES
from ..groq import error_response, groq_post
from ..guard import rate_limited
from ..tts import engines

router = APIRouter()


class Input(BaseModel):
    text: str = Field(min_length=1, max_length=600)
    language: str = "en"


def _languages() -> list[str]:
    langs = set(engines.languages())
    if config.GROQ_TTS_MODEL:
        langs.add("en")
    return sorted(langs)


@router.get("/api/tts")
async def tts_info(warm: str | None = None):
    """Which languages the server can speak, so clients don't probe with failing requests.
    `?warm=ta` loads that language's voice in the background (the user just chose it)."""
    if warm in LANGUAGES and config.LOCAL_TTS:
        engines.warm_soon(warm)
    langs = _languages()
    return {"available": bool(langs), "languages": langs, "engine": "local" if config.LOCAL_TTS else "groq"}


@router.post("/api/tts")
async def tts(request: Request):
    if (r := rate_limited(request, "tts", 120)):
        return r
    try:
        body = Input.model_validate(await request.json())
    except (ValidationError, ValueError):
        return JSONResponse({"error": "No text"}, status_code=400)
    lang = body.language if body.language in LANGUAGES else "en"
    text = body.text.strip()
    if not text:
        return JSONResponse({"error": "No text"}, status_code=400)
    headers = {"Cache-Control": "no-store"}
    try:
        if config.LOCAL_TTS and engines.engine_for(lang):
            return Response(await engines.synth(text, lang), media_type="audio/wav", headers=headers)
        if lang == "en" and config.GROQ_TTS_MODEL:
            res = await groq_post("/audio/speech", json={"model": config.GROQ_TTS_MODEL, "voice": config.GROQ_TTS_VOICE or None,
                                                          "input": text, "response_format": "wav"})
            return Response(res.content, media_type="audio/wav", headers=headers)
        return JSONResponse({"error": "TTS not configured", "fallback": "speechSynthesis"}, status_code=501)
    except Exception as err:  # noqa: BLE001
        return error_response(err)
