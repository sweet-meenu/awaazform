import { config, errorResponse, groqFetch } from '@/lib/groq';
import { rateLimit, tooMany } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Speech-to-text. Audio is forwarded to Groq and never written to disk (§9.4).
export async function POST(req: Request) {
  if (!rateLimit(req, 'stt')) return tooMany();
  try {
    const len = Number(req.headers.get('content-length') ?? 0);
    if (len > config.maxAudioBytes + 10_000) return Response.json({ error: 'Recording is too long' }, { status: 413 });

    const form = await req.formData();
    const audio = form.get('audio');
    const language = form.get('language');
    if (!(audio instanceof Blob) || audio.size === 0) return Response.json({ error: 'No audio' }, { status: 400 });
    if (audio.size > config.maxAudioBytes) return Response.json({ error: 'Recording is too long' }, { status: 413 });

    const body = new FormData();
    body.set('file', audio, 'answer.webm');
    body.set('model', config.sttModel);
    body.set('response_format', 'json');
    body.set('temperature', '0');
    if (language === 'hi' || language === 'en') body.set('language', language);

    const res = await groqFetch('/audio/transcriptions', { method: 'POST', body });
    const json = (await res.json()) as { text?: string };
    return Response.json({ text: (json.text ?? '').trim() });
  } catch (err) {
    return errorResponse(err);
  }
}
