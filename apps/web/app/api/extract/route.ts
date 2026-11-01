import { z } from 'zod';
import { config, errorResponse, groqFetch } from '@/lib/groq';
import { rateLimit, tooMany } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// J4 step 2: identify questions on a flat (printed) PDF from its text and positions.
// Only the printed form text is sent — never the user's answers.

const Input = z.object({
  page: z.number().int().min(0).max(50),
  pageSize: z.object({ width: z.number(), height: z.number() }),
  items: z.array(z.object({ id: z.string().max(20), x: z.number(), y: z.number(), text: z.string().max(200) })).max(400),
});

const Output = z.object({
  questions: z.array(z.object({
    itemId: z.string(),
    label: z.string().min(1).max(160),
    type: z.enum(['text', 'paragraph', 'number', 'date', 'time', 'email', 'phone', 'yesno', 'choice', 'multichoice']),
    required: z.boolean().default(false),
    options: z.array(z.object({ text: z.string().max(80), itemId: z.string().optional() })).max(12).optional(),
  })).max(80),
});

const SYSTEM = `You read printed (flat) PDF forms. You get text items with ids, page numbers and x/y positions (PDF points, y grows upward).
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
- Keep labels short (under 12 words). Preserve the form's order. Output JSON only.`;

export async function POST(req: Request) {
  if (!rateLimit(req, 'extract', 10)) return tooMany();
  if (!config.chatModel) return Response.json({ error: 'AI is not configured' }, { status: 503 });
  try {
    const parsed = Input.safeParse(await req.json());
    if (!parsed.success) return Response.json({ error: 'Invalid request' }, { status: 400 });
    const { page, pageSize, items } = parsed.data;
    const listing = items.map((i) => `${i.id}\t${i.x}\t${i.y}\t${i.text}`).join('\n');

    const res = await groqFetch('/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.chatModel,
        temperature: 0,
        max_tokens: 5000,
        reasoning_effort: 'low',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: `Page ${page + 1}, ${Math.round(pageSize.width)}x${Math.round(pageSize.height)} points.\n\nid\tx\ty\ttext\n${listing}` },
        ],
      }),
    });
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    let data: unknown;
    try {
      data = JSON.parse(json.choices?.[0]?.message?.content ?? '');
    } catch {
      return Response.json({ error: 'AI returned unreadable output' }, { status: 502 });
    }
    // D6: model output is validated before use.
    const out = Output.safeParse(data);
    if (!out.success) {
      const where = out.error.issues.slice(0, 3).map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return Response.json({ error: `AI returned an unexpected format (${where})` }, { status: 502 });
    }
    return Response.json(out.data);
  } catch (err) {
    return errorResponse(err);
  }
}
