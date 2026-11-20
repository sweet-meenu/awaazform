import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';

// PRD §7: CSP and security headers. Fonts are self-hosted by next/font, so everything is 'self'.
const directives = (frameAncestors: string) => [
  "default-src 'self'",
  // 'wasm-unsafe-eval': Live Mode's voice detector (Silero via ONNX) is WebAssembly; it allows compiling wasm only, not eval.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "media-src 'self' blob:",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
  // The real Google Form, shown beside the questions on /form (pre-filled with confirmed answers).
  "frame-src 'self' https://docs.google.com",
  "worker-src 'self' blob:",
  `frame-ancestors ${frameAncestors}`,
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');
const csp = directives("'self'");

// The API is the FastAPI app in backend/. Proxying /api/* keeps one origin for the browser (CSP
// connect-src 'self', no CORS), and the backend's own guard still checks who is calling.
const BACKEND_URL = (process.env.BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '');

const nextConfig: NextConfig = {
  transpilePackages: ['@awaazform/core'],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` }];
  },
  // PDFs and Word files share one page now; keep old links working.
  async redirects() {
    return [
      { source: '/pdf', destination: '/documents', permanent: true },
      { source: '/docx', destination: '/documents', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      { source: '/manifest.webmanifest', headers: [{ key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' }] },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=(), payment=(), usb=(), publickey-credentials-create=(self), publickey-credentials-get=(self)' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          ...(isDev ? [] : [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' }]),
        ],
      },
    ];
  },
};

export default nextConfig;
