"""Prompts, language names and tool declarations, generated from packages/core (scripts/export-contract.mjs)."""

import json
from pathlib import Path

_c = json.loads((Path(__file__).parent / "contract.json").read_text(encoding="utf-8"))
LANGUAGES: list[str] = _c["languages"]
LANGUAGE_NAMES: dict[str, str] = _c["languageNames"]
TOOLS: list[dict] = _c["tools"]


def system_prompt(form_title: str, profile_label: str, language: str) -> str:
    tpl = _c["systemPrompts"].get(language) or _c["systemPrompts"]["en"]
    return tpl.replace("{{formTitle}}", form_title).replace("{{profileLabel}}", profile_label)


def question_context(q: dict | None, index: int, total: int) -> str:
    """Same fields as core's questionContext."""
    if not q:
        return "No current question."
    keep = {"position": f"{index + 1} of {total}"}
    for k in ("id", "label", "helpText", "type", "required", "options", "support"):
        if q.get(k) is not None:
            keep[k] = q[k]
    return json.dumps(keep, ensure_ascii=False, separators=(",", ":"))
