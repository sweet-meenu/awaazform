"""Server-side Groq client (OpenAI-compatible REST). The key never leaves this process."""

import asyncio
from collections.abc import Callable
from typing import Any

import httpx
from fastapi.responses import JSONResponse

from . import config

BASE = "https://api.groq.com/openai/v1"
_client = httpx.AsyncClient(base_url=BASE, timeout=httpx.Timeout(60, connect=10))


class GroqError(Exception):
    def __init__(self, message: str, status: int):
        super().__init__(message)
        self.status = status


async def _send(path: str, **kw: Any) -> httpx.Response:
    headers = {**kw.pop("headers", {}), "Authorization": f"Bearer {config.GROQ_API_KEY}"}
    stream = kw.pop("stream", False)
    req = _client.build_request("POST", path, headers=headers, **kw)
    return await _client.send(req, stream=stream)


async def groq_post(path: str, **kw: Any) -> httpx.Response:
    """One retry on 429/5xx, honouring Groq's retry-after (capped), then surface the error."""
    if not config.GROQ_API_KEY:
        raise GroqError("AI is not configured on this server", 503)
    res = await _send(path, **dict(kw))
    if res.status_code == 429 or res.status_code >= 500:
        after = res.headers.get("retry-after")
        wait = min(float(after), 10.0) if res.status_code == 429 and after and after.replace(".", "", 1).isdigit() else 0.8
        await res.aclose()
        await asyncio.sleep(wait)
        res = await _send(path, **dict(kw))
    if res.status_code >= 400:
        # Never echo request bodies; only the status reaches logs and clients.
        await res.aclose()
        status = 429 if res.status_code == 429 else 502 if res.status_code >= 500 else res.status_code
        raise GroqError("AI is busy (rate limit)" if res.status_code == 429 else f"AI request failed ({res.status_code})", status)
    return res


async def chat_completion(body: Callable[[str], dict[str, Any]], stream: bool = False) -> httpx.Response:
    """A chat completion on the configured model, retried once on the fallback model if rate-limited."""
    send = lambda model: groq_post("/chat/completions", json=body(model), stream=stream)  # noqa: E731
    try:
        return await send(config.CHAT_MODEL)
    except GroqError as e:
        if e.status != 429 or not config.CHAT_FALLBACK or config.CHAT_FALLBACK == config.CHAT_MODEL:
            raise
        return await send(config.CHAT_FALLBACK)


def low_effort(model: str) -> dict[str, str]:
    # gpt-oss models reason before answering; low effort keeps voice replies quick.
    return {"reasoning_effort": "low"} if "gpt-oss" in model else {}


def error_response(err: Exception) -> JSONResponse:
    if isinstance(err, GroqError) and err.status == 429:
        return JSONResponse({"error": str(err), "fallback": "typing"}, status_code=429, headers={"Retry-After": "8"})
    if not isinstance(err, GroqError):
        print(f"[api] unexpected error: {type(err).__name__}: {err}")  # message only, never request bodies
    status = err.status if isinstance(err, GroqError) else 500
    return JSONResponse({"error": str(err) if isinstance(err, GroqError) else "Something went wrong", "fallback": "typing"}, status_code=status)
