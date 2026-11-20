import { guard, preflight, withCors } from '@/lib/guard';

export function GET(req: Request) {
  const g = guard(req);
  if (!g.ok) return g.response;
  return withCors(Response.json({ status: 'ok', backend: 'awaazform-nextjs' }), g);
}

export const OPTIONS = preflight;
