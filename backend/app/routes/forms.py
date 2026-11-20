"""Fetches a public Google or Microsoft Form for the browser, which parses it with packages/core.
Only the form itself is fetched, never anything about the user. Hosts are allow-listed, every redirect
hop is checked (no SSRF), responses are size-capped and time-limited."""

import json
import re
from urllib.parse import urljoin, urlsplit

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError

from ..guard import rate_limited

router = APIRouter()

MAX_BYTES = 4_000_000
GOOGLE_HOSTS = {"docs.google.com", "forms.gle"}
MS_HOSTS = {"forms.office.com", "forms.microsoft.com", "forms.cloud.microsoft"}
UA = {"User-Agent": "Mozilla/5.0 (compatible; AwaazForm/1.0)", "Accept-Language": "en"}
_client = httpx.AsyncClient(follow_redirects=False, timeout=httpx.Timeout(10))


class Input(BaseModel):
    url: str = Field(min_length=10, max_length=2000)
    edit: bool = False  # the pasted link was the form's editing link


class Fail(Exception):
    def __init__(self, error: str, status: int = 422):
        self.error, self.status = error, status


def _fail(e: Fail) -> JSONResponse:
    return JSONResponse({"error": e.error}, status_code=e.status)


async def _read(res: httpx.Response) -> str:
    size, chunks = 0, []
    async for chunk in res.aiter_bytes():
        size += len(chunk)
        if size > MAX_BYTES:
            raise Fail("This form is too large to read.", 413)
        chunks.append(chunk)
    return b"".join(chunks).decode("utf-8", "replace")


async def _follow(url: str, hosts: set[str], sign_in, unexpected: str, too_many: str) -> tuple[httpx.Response, str]:
    """Follows redirects one hop at a time, only between the platform's own https hosts."""
    for _ in range(5):
        res = await _client.send(_client.build_request("GET", url, headers=UA), stream=True)
        if not 300 <= res.status_code < 400:
            return res, url
        await res.aclose()
        to = urljoin(url, res.headers.get("location", ""))
        parts = urlsplit(to)
        if (msg := sign_in(parts)):
            raise Fail(msg)
        if parts.scheme != "https" or parts.hostname not in hosts:
            raise Fail(unexpected)
        url = to
    raise Fail(too_many)


def _start(url: str, hosts: set[str]) -> str:
    parts = urlsplit(url)
    if parts.scheme != "https" or parts.hostname not in hosts:
        raise Fail("Invalid form link.", 400)
    return url


@router.post("/api/gform")
async def gform(request: Request):
    """Body: {url} built by the browser from the pasted link. Returns {html, finalUrl}."""
    if (r := rate_limited(request, "gform", 20)):
        return r
    try:
        body = Input.model_validate(await request.json())
    except (ValidationError, ValueError):
        return JSONResponse({"error": "Please paste a Google Form link."}, status_code=400)
    edit = body.edit
    needs_sign_in = ("This is the form’s editing link. Use the link you’d send to people who fill it in (Send → link)." if edit
                     else "This form needs a Google sign-in, so AwaazForm can’t read it. Fill it on Google Forms directly.")

    def sign_in(p):
        return needs_sign_in if p.hostname == "accounts.google.com" or "ServiceLogin" in p.path else None

    try:
        res, final = await _follow(_start(body.url, GOOGLE_HOSTS), GOOGLE_HOSTS, sign_in,
                                   "Google redirected this form somewhere unexpected.", "Google redirected this form too many times.")
        try:
            # Forms limited to signed-in users (one response per person, verified emails, one organisation)
            # answer 401 with a "You must sign in" page instead of redirecting.
            if res.status_code in (401, 403):
                raise Fail(needs_sign_in)
            if res.status_code == 404:
                raise Fail("No form was found at this link. Check that it’s complete.", 404)
            if res.status_code >= 400:
                raise Fail(f"Google Forms returned an error ({res.status_code}). Try again in a moment.", 502)
            html = await _read(res)
        finally:
            await res.aclose()
        if "FB_PUBLIC_LOAD_DATA_" not in html and "You must sign in" in html:
            raise Fail(needs_sign_in)
        return {"html": html, "finalUrl": final}
    except Fail as e:
        return _fail(e)
    except httpx.TimeoutException:
        return _fail(Fail("Google Forms took too long to respond. Try again.", 502))
    except httpx.HTTPError:
        return _fail(Fail("AwaazForm couldn’t reach Google Forms. Try again.", 502))


def _ms_api_url(html: str) -> str | None:
    """The form's JSON API address from its responder page (same checks as core's extractMicrosoftApiUrl)."""
    m = re.search(r'"prefetchFormUrl"\s*:\s*"([^"]+)"', html)
    if not m:
        return None
    try:
        raw = json.loads(f'"{m.group(1)}"')
    except ValueError:
        return None
    p = urlsplit(raw)
    return raw if p.scheme == "https" and p.hostname in MS_HOSTS and p.path.startswith("/formapi/api/") else None


@router.post("/api/msform")
async def msform(request: Request):
    """Body: {url} of the responder page. Returns {finalUrl, form} where form is the form API's JSON."""
    if (r := rate_limited(request, "msform", 20)):
        return r
    try:
        body = Input.model_validate(await request.json())
    except (ValidationError, ValueError):
        return JSONResponse({"error": "Please paste a Microsoft Forms link."}, status_code=400)

    org_only = "This form only accepts people signed in to an organisation, so AwaazForm can’t read it. Fill it on Microsoft Forms directly."
    sign_in = lambda p: org_only if re.search(r"login\.microsoftonline\.com|login\.live\.com|login\.microsoft\.com", p.hostname or "") else None  # noqa: E731
    try:
        res, final = await _follow(_start(body.url, MS_HOSTS), MS_HOSTS, sign_in,
                                   "Microsoft redirected this form somewhere unexpected.", "Microsoft redirected this form too many times.")
        try:
            if res.status_code in (401, 403):
                raise Fail(org_only)
            if res.status_code >= 400:
                raise Fail("No form was found at this link. Check that it’s complete.", 404) if res.status_code == 404 \
                    else Fail(f"Microsoft Forms returned an error ({res.status_code}).", 502)
            html = await _read(res)
        finally:
            await res.aclose()
        api = _ms_api_url(html)
        if not api:
            raise Fail("AwaazForm couldn’t read the questions on this form. It may need a sign-in.")
        api_res = await _client.send(_client.build_request("GET", api, headers={**UA, "Accept": "application/json"}), stream=True)
        try:
            if api_res.status_code in (401, 403):
                raise Fail("This form only accepts people signed in to an organisation, so AwaazForm can’t read it.")
            if api_res.status_code >= 400:
                raise Fail(f"Microsoft Forms returned an error ({api_res.status_code}). Try again in a moment.", 502)
            text = await _read(api_res)
        finally:
            await api_res.aclose()
        try:
            form = json.loads(text)
        except ValueError:
            raise Fail("AwaazForm couldn’t read the questions on this form.") from None
        return {"finalUrl": final, "form": form}
    except Fail as e:
        return _fail(e)
    except httpx.TimeoutException:
        return _fail(Fail("Microsoft Forms took too long to respond. Try again.", 502))
    except httpx.HTTPError:
        return _fail(Fail("AwaazForm couldn’t reach Microsoft Forms. Try again.", 502))
