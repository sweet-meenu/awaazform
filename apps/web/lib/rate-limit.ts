import 'server-only';

// Best-effort, in-memory, per-instance limiter. Serverless instances don't share it — it only
// blunts bursts from one client. Groq's own limits are the real ceiling.
const hits = new Map<string, number[]>();

export function rateLimit(req: Request, bucket: string, limit = 30, windowMs = 60_000): boolean {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  hits.set(key, recent);
  return recent.length <= limit;
}

export const tooMany = () => Response.json({ error: 'Too many requests, please slow down', fallback: 'typing' }, { status: 429 });
