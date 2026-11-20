"""Who may call the API: the web app (directly or through its /api proxy) and the AwaazForm extension,
so other websites can't spend the AI quota or post data through it. Also a per-client rate limiter."""

import re
import time
from collections import defaultdict

from fastapi import Request
from fastapi.responses import JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

from . import config

EXT = re.compile(r"^(chrome|moz)-extension://([a-z0-9-]+)$", re.I)


def _extension(origin: str) -> bool:
    m = EXT.match(origin)
    return bool(m) and (not config.EXTENSION_IDS or m.group(2) in config.EXTENSION_IDS)


class GuardMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not request.url.path.startswith("/api/") or request.url.path == "/api/health":
            return await call_next(request)
        origin = request.headers.get("origin")
        cors: dict[str, str] = {}
        if origin and origin not in config.ALLOWED_ORIGINS and request.headers.get("sec-fetch-site") != "same-origin":
            if not _extension(origin):
                return JSONResponse({"error": "Not allowed from this site"}, status_code=403)
            cors = {"Access-Control-Allow-Origin": origin, "Vary": "Origin"}
        if request.method == "OPTIONS":
            return Response(status_code=204, headers={**cors, "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                                                      "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "600"})
        res = await call_next(request)
        for k, v in cors.items():
            res.headers[k] = v
        return res


_hits: dict[str, list[float]] = defaultdict(list)


def rate_limited(request: Request, bucket: str, limit: int = 30, window: float = 60.0) -> JSONResponse | None:
    """Best-effort, in-memory limiter: blunts bursts from one client. Returns a 429 response when over."""
    ip = (request.headers.get("x-forwarded-for") or "").split(",")[0].strip() or (request.client.host if request.client else "local")
    key, now = f"{bucket}:{ip}", time.monotonic()
    recent = [t for t in _hits[key] if now - t < window]
    recent.append(now)
    _hits[key] = recent
    if len(recent) > limit:
        return JSONResponse({"error": "Too many requests, please slow down", "fallback": "typing"}, status_code=429)
    return None
