"""Serves the web app: the static export of apps/web (`next build` with output: 'export'), on the same
origin as the API. One Python server, no Node at runtime.

Also does what Next.js did for the live site: security headers on every response, clean URLs (/form →
form.html), the old /pdf and /docx links, and the share-target fallback."""

from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, RedirectResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware

from . import config

# Mirrors apps/web/next.config.ts (production). 'wasm-unsafe-eval' is for Live Mode's voice detector
# (Silero, ONNX WebAssembly); frame-src allows the real Google Form beside the questions.
CSP = "; ".join([
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "frame-src 'self' https://docs.google.com",
    "worker-src 'self' blob:",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
])
SECURITY_HEADERS = {
    "Content-Security-Policy": CSP,
    "X-Frame-Options": "SAMEORIGIN",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), "
                          "publickey-credentials-create=(self), publickey-credentials-get=(self)",
    "Cross-Origin-Opener-Policy": "same-origin",
}


class SecurityHeaders(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        res = await call_next(request)
        for k, v in SECURITY_HEADERS.items():
            res.headers.setdefault(k, v)
        if request.url.scheme == "https":
            res.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        return res


def mount(app: FastAPI) -> bool:
    """Adds the web routes if the export exists. Returns whether it did."""
    root: Path = config.WEB_DIR
    if not (root / "index.html").exists():
        print(f"[web] no static export at {root}: run `pnpm --filter web build` (the API still works)")
        return False
    root = root.resolve()
    app.add_middleware(SecurityHeaders)

    @app.get("/pdf")
    @app.get("/docx")
    async def documents_moved():
        # PDFs and Word files share one page now; keep old links working.
        return RedirectResponse("/documents", status_code=308)

    @app.post("/share-target")
    async def share_target_fallback():
        # The installed app's service worker handles shares locally, including offline. If it can't,
        # don't read or keep an uploaded document on the server.
        return RedirectResponse("/share?error=unavailable", status_code=303)

    @app.get("/{path:path}", include_in_schema=False)
    async def static(path: str):
        if path.startswith("api/"):
            return Response(status_code=404)
        target = _resolve(root, path)
        if target is None:
            return FileResponse(root / "404.html", status_code=404, media_type="text/html") if (root / "404.html").exists() \
                else Response("Not found", status_code=404)
        headers = {}
        if target.name == "sw.js":
            headers = {"Cache-Control": "no-cache, no-store, must-revalidate", "Service-Worker-Allowed": "/"}
        elif target.name == "manifest.webmanifest":
            headers = {"Cache-Control": "public, max-age=0, must-revalidate"}
        elif "/_next/static/" in target.as_posix():
            headers = {"Cache-Control": "public, max-age=31536000, immutable"}  # file names carry a hash
        media = {".mjs": "text/javascript", ".js": "text/javascript", ".webmanifest": "application/manifest+json",
                 ".wasm": "application/wasm", ".onnx": "application/octet-stream"}.get(target.suffix)
        return FileResponse(target, headers=headers, media_type=media)

    print(f"[web] serving the site from {root}")
    return True


def _resolve(root: Path, path: str) -> Path | None:
    """/form → form.html, / → index.html, files as they are. Never outside the export folder."""
    path = path.strip("/")
    for candidate in ([path, f"{path}.html", f"{path}/index.html"] if path else ["index.html"]):
        p = (root / candidate).resolve()
        if p.is_file() and p.is_relative_to(root):
            return p
    return None
