"""Translates a form's own wording (labels, help text, options) into the user's language. Only the
form's printed text is sent, never the user's answers."""

import json

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from .. import config
from ..contract import LANGUAGE_NAMES, LANGUAGES
from ..groq import chat_completion, error_response, low_effort
from ..guard import rate_limited

router = APIRouter()


class Input(BaseModel):
    language: str
    items: list[str] = Field(min_length=1, max_length=80)


@router.post("/api/translate")
async def translate(request: Request):
    if (r := rate_limited(request, "translate", 30)):
        return r
    if not config.CHAT_MODEL:
        return JSONResponse({"error": "AI is not configured"}, status_code=503)
    try:
        body = Input.model_validate(await request.json())
    except (ValidationError, ValueError):
        return JSONResponse({"error": "Invalid request"}, status_code=400)
    if body.language not in LANGUAGES or body.language == "en" or any(len(s) > 600 for s in body.items):
        return JSONResponse({"error": "Invalid request"}, status_code=400)
    items = body.items
    payload = {str(i): s for i, s in enumerate(items)}
    try:
        res = await chat_completion(lambda model: {
            "model": model, "temperature": 0.1, **low_effort(model),
            "max_tokens": min(6000, 400 + len(json.dumps(payload, ensure_ascii=False)) * 3),
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": (
                    f"Translate each value of the JSON object into {LANGUAGE_NAMES[body.language]}. These are questions and answer options from a form "
                    "that someone will hear read aloud: use simple, natural, everyday words, and the polite form. Keep the same keys. Keep names of people, "
                    "organisations and products, email addresses, numbers and abbreviations (e.g. SISC, NA, PIN) as they are. Return only the JSON object.")},
                {"role": "user", "content": json.dumps(payload, ensure_ascii=False)},
            ],
        })
        try:
            out = json.loads((res.json().get("choices") or [{}])[0].get("message", {}).get("content") or "{}")
        except ValueError:
            out = {}
        # Anything missing or odd stays in the form's own words.
        return {"translations": [(out.get(str(i)).strip()[:800] if isinstance(out.get(str(i)), str) and out.get(str(i)).strip() else s)
                                 for i, s in enumerate(items)]}
    except Exception as err:  # noqa: BLE001
        return error_response(err)
