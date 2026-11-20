"""Finds the questions on a flat (printed) PDF page from its text and positions. Only the printed form
text is sent, never the user's answers. The model's output is validated before use."""

import json
from typing import Literal

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from .. import config
from ..groq import chat_completion, error_response, low_effort
from ..guard import rate_limited

router = APIRouter()


class Item(BaseModel):
    id: str = Field(max_length=20)
    x: float
    y: float
    text: str = Field(max_length=200)


class Size(BaseModel):
    width: float
    height: float


class Input(BaseModel):
    page: int = Field(ge=0, le=50)
    pageSize: Size
    items: list[Item] = Field(max_length=400)


class Option(BaseModel):
    text: str = Field(max_length=80)
    itemId: str | None = None


class Question(BaseModel):
    itemId: str
    label: str = Field(min_length=1, max_length=160)
    type: Literal["text", "paragraph", "number", "date", "time", "email", "phone", "yesno", "choice", "multichoice"]
    required: bool = False
    options: list[Option] | None = Field(default=None, max_length=12)


class Output(BaseModel):
    questions: list[Question] = Field(max_length=80)


SYSTEM = """You read printed (flat) PDF forms. You get text items with ids, page numbers and x/y positions (PDF points, y grows upward).
Find the places where a person must write an answer or tick a box. Return JSON:
{"questions":[{"itemId": id of the label text item, "label": short clear question in plain English,
  "type": "text|paragraph|number|date|time|email|phone|yesno|choice|multichoice", "required": boolean,
  "options": [{"text": option text, "itemId": id of that option's text item}] (only for tick-box choices)}]}
Rules:
- One entry per blank to fill. Make labels self-contained: include the section context, e.g. "Surname (in English, block letters)".
- Skip headings, instructions and notes. Inside declarations, still include the blanks to fill (e.g. place of birth, since when, date, place).
- Skip anything filled by the office or officials: "for office use", form number, acknowledgement/receipt slips, ERO/AERO/BLO.
- Skip photo and signature areas.
- Alternatives with tick boxes are ONE question with all of them as options, never one question per option.
  E.g. Gender: Male / Female / Third Gender -> one "choice"; a list of proof documents -> one "choice".
- Keep labels short (under 12 words). Preserve the form's order. Output JSON only."""


@router.post("/api/extract")
async def extract(request: Request):
    if (r := rate_limited(request, "extract", 10)):
        return r
    if not config.CHAT_MODEL:
        return JSONResponse({"error": "AI is not configured"}, status_code=503)
    try:
        body = Input.model_validate(await request.json())
    except (ValidationError, ValueError):
        return JSONResponse({"error": "Invalid request"}, status_code=400)
    listing = "\n".join(f"{i.id}\t{i.x:g}\t{i.y:g}\t{i.text}" for i in body.items)
    try:
        res = await chat_completion(lambda model: {
            "model": model, "temperature": 0, **low_effort(model),
            # Groq counts the requested maximum against the per-minute budget: reserve what a page needs.
            "max_tokens": min(4000, 900 + len(body.items) * 12),
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Page {body.page + 1}, {round(body.pageSize.width)}x{round(body.pageSize.height)} points.\n\nid\tx\ty\ttext\n{listing}"},
            ],
        })
        try:
            data = json.loads((res.json().get("choices") or [{}])[0].get("message", {}).get("content") or "")
        except ValueError:
            return JSONResponse({"error": "AI returned unreadable output"}, status_code=502)
        try:
            return Output.model_validate(data).model_dump(exclude_none=True)
        except ValidationError as e:
            where = "; ".join(f"{'.'.join(map(str, x['loc']))}: {x['msg']}" for x in e.errors()[:3])
            return JSONResponse({"error": f"AI returned an unexpected format ({where})"}, status_code=502)
    except Exception as err:  # noqa: BLE001
        return error_response(err)
