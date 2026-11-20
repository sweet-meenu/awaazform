"""One model step. The tool loop runs in the browser (tools act on browser-side state); this route only
forwards the minimal context to Groq. Streams as small server-sent events when asked."""

import json
from datetime import date
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, StreamingResponse

from .. import config
from ..contract import LANGUAGES, TOOLS, question_context, system_prompt
from ..groq import chat_completion, error_response, low_effort
from ..guard import rate_limited

router = APIRouter()


@router.post("/api/chat")
async def chat(request: Request):
    if (r := rate_limited(request, "chat", 60)):
        return r
    if not config.CHAT_MODEL:
        return JSONResponse({"error": "AI chat is not configured", "fallback": "typing"}, status_code=503)
    try:
        body: dict[str, Any] = await request.json()
        messages = body.get("messages") if isinstance(body.get("messages"), list) else []
        messages = messages[-16:]
        if len(json.dumps(messages)) > config.MAX_CHAT_CHARS * 8:
            return JSONResponse({"error": "Conversation too long"}, status_code=413)
        if any(m.get("role") == "user" and len(str(m.get("content", ""))) > config.MAX_CHAT_CHARS for m in messages):
            return JSONResponse({"error": "Message too long"}, status_code=413)

        language = body.get("language") if body.get("language") in LANGUAGES else "en"
        position = body.get("position") or {}
        outline = body.get("outline") if isinstance(body.get("outline"), list) else []
        stream = bool(body.get("stream"))
        system = [
            {"role": "system", "content": system_prompt(str(body.get("formTitle", ""))[:200], str(body.get("profileLabel", ""))[:60], language)},
            {"role": "system", "content": f"Today's date: {date.today().isoformat()} ({date.today():%A})."},
            {"role": "system", "content": f"Current question: {question_context(body.get('question'), int(position.get('index', 0) or 0), int(position.get('total', 0) or 0))}"},
        ]
        if outline:
            system.append({"role": "system", "content": f"Form outline (all questions; use these ids): {json.dumps(outline[:120], ensure_ascii=False)[:16000]}"})

        def build(model: str) -> dict[str, Any]:
            req: dict[str, Any] = {"model": model, "temperature": 0.2, "max_tokens": 1200, **low_effort(model), "messages": [*system, *messages]}
            if not body.get("noTools"):
                req |= {"tools": TOOLS, "tool_choice": "auto"}
            if stream:
                req["stream"] = True
            return req

        res = await chat_completion(build, stream=stream)
        if stream:
            return StreamingResponse(_relay(res), media_type="text/event-stream", headers={"Cache-Control": "no-cache, no-transform"})
        message = (res.json().get("choices") or [{}])[0].get("message") or {}
        if message.get("role") != "assistant":
            return JSONResponse({"error": "Empty reply"}, status_code=502)
        # Only what the client needs; the model's hidden reasoning stays on the server.
        return {"message": {"role": "assistant", "content": message.get("content"), "tool_calls": message.get("tool_calls")}}
    except Exception as err:  # noqa: BLE001
        return error_response(err)


async def _relay(res):
    """Re-emits Groq's stream as `{"c": text}` and `{"t": [...]}` events; reasoning is dropped here."""
    try:
        async for line in res.aiter_lines():
            line = line.strip()
            if not line.startswith("data:"):
                continue
            data = line[5:].strip()
            if data == "[DONE]":
                continue
            try:
                delta = (json.loads(data).get("choices") or [{}])[0].get("delta") or {}
            except ValueError:
                continue
            if delta.get("content"):
                yield f"data: {json.dumps({'c': delta['content']}, ensure_ascii=False)}\n\n"
            if delta.get("tool_calls"):
                yield f"data: {json.dumps({'t': delta['tool_calls']}, ensure_ascii=False)}\n\n"
    finally:
        await res.aclose()
        yield "data: [DONE]\n\n"
