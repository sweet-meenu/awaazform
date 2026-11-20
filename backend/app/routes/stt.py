"""Speech-to-text via Groq Whisper. Audio is forwarded and never written to disk."""

import re

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from .. import config
from ..contract import LANGUAGES
from ..groq import error_response, groq_post
from ..guard import rate_limited

router = APIRouter()

# What Whisper "hears" in silence, breathing or room noise. Dropped when the whole clip is just this.
HALLUCINATIONS = re.compile(
    r"^(thank you( for watching)?|thanks( for watching)?|bye|you|okay|subtitles? by .*|please subscribe.*|धन्यवाद|शुक्रिया|सब्सक्राइब.*|नमस्ते"
    r"|ধন্যবাদ|நன்றி|ధన్యవాదాలు|ಧನ್ಯವಾದ|നന്ദി|ਧੰਨਵਾਦ|شکریہ)[.!। ]*$", re.I)


def clean_transcript(data: dict) -> str:
    """Keep only segments Whisper is reasonably sure are speech; strip <|xx|> tokens and silence phrases."""
    segs = data.get("segments") or None
    if segs:
        kept = " ".join(s.get("text") or "" for s in segs
                        if (s.get("no_speech_prob") or 0) < 0.6 and (s.get("avg_logprob") or 0) > -1.2 and (s.get("compression_ratio") or 1) < 2.6)
    else:
        kept = data.get("text") or ""
    text = re.sub(r"\s+", " ", re.sub(r"<\|[^|>]{1,20}\|>", " ", kept)).strip()
    if not any(ch.isalnum() for ch in text) or HALLUCINATIONS.match(text):
        return ""
    return text


@router.post("/api/stt")
async def stt(request: Request):
    if (r := rate_limited(request, "stt")):
        return r
    try:
        if int(request.headers.get("content-length") or 0) > config.MAX_AUDIO_BYTES + 10_000:
            return JSONResponse({"error": "Recording is too long"}, status_code=413)
        form = await request.form()
        audio = form.get("audio")
        if audio is None or isinstance(audio, str):
            return JSONResponse({"error": "No audio"}, status_code=400)
        blob = await audio.read()
        if not blob:
            return JSONResponse({"error": "No audio"}, status_code=400)
        if len(blob) > config.MAX_AUDIO_BYTES:
            return JSONResponse({"error": "Recording is too long"}, status_code=413)
        data = {"model": config.STT_MODEL, "response_format": "verbose_json", "temperature": "0"}
        if (lang := form.get("language")) in LANGUAGES:
            data["language"] = lang
        if isinstance(prompt := form.get("prompt"), str) and prompt.strip():
            data["prompt"] = prompt[:600]  # the question being answered, never personal data
        res = await groq_post("/audio/transcriptions", data=data, files={"file": ("answer.webm", blob, audio.content_type or "audio/webm")})
        return {"text": clean_transcript(res.json())}
    except Exception as err:  # noqa: BLE001
        return error_response(err)
