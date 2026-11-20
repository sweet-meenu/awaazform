'use client';

import { apiUrl } from './api';
import { en, fmt, type Strings } from '@/lib/i18n/core';
import { formOutline, type FormQuestion, type Language, type SessionController, type Shield, type ToolRunner } from '@awaazform/core';

// Client-side tool loop (§8.5): the model proposes tool calls, the runner validates and executes
// them against browser-side state. Max 6 tool rounds per turn.

const MAX_ROUNDS = 6;

type ToolCallMsg = { id: string; type: 'function'; function: { name: string; arguments: string } };
export type ChatMsg =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: ToolCallMsg[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export class AiUnavailable extends Error {}

interface Ctx {
  ctl: SessionController;
  runner: ToolRunner;
  profileLabel: string;
  language: Language;
  /** Privacy shield: identifiers are swapped for placeholders before anything reaches the AI. */
  shield?: Shield;
}

type Assistant = Extract<ChatMsg, { role: 'assistant' }>;

async function step(ctx: Ctx, messages: ChatMsg[], noTools = false, onText?: (delta: string) => void): Promise<Assistant> {
  const s = ctx.ctl.session;
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formTitle: s.formTitle,
      profileLabel: ctx.profileLabel,
      language: ctx.language,
      question: s.questions[s.currentIndex],
      position: { index: s.currentIndex, total: s.questions.length },
      outline: noTools ? undefined : formOutline(s.questions, Object.fromEntries(Object.entries(s.answers).map(([k, a]) => [k, a.status]))),
      messages,
      noTools,
      stream: !!onText,
    }),
  });
  if (onText && res.ok && res.headers.get('content-type')?.includes('text/event-stream') && res.body) return readStream(res.body, onText);
  const json = (await res.json().catch(() => ({}))) as { message?: Assistant; error?: string };
  if (!res.ok || !json.message) throw new AiUnavailable(json.error ?? 'AI is unavailable');
  return json.message;
}

type ToolDelta = { index?: number; id?: string; type?: string; function?: { name?: string; arguments?: string } };

/** Rebuilds one assistant message from the server's stream, passing reply text on as it arrives. */
async function readStream(body: ReadableStream<Uint8Array>, onText: (delta: string) => void): Promise<Assistant> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buffer = '';
  let content = '';
  const calls: ToolCallMsg[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    let cut: number;
    while ((cut = buffer.indexOf('\n\n')) >= 0) {
      const line = buffer.slice(0, cut).trim();
      buffer = buffer.slice(cut + 2);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const ev = JSON.parse(data) as { c?: string; t?: ToolDelta[] };
        if (ev.c) { content += ev.c; onText(ev.c); }
        for (const d of ev.t ?? []) {
          const i = d.index ?? calls.length;
          const call = (calls[i] ??= { id: '', type: 'function', function: { name: '', arguments: '' } });
          if (d.id) call.id = d.id;
          if (d.function?.name) call.function.name += d.function.name;
          if (d.function?.arguments) call.function.arguments += d.function.arguments;
        }
      } catch { /* partial event */ }
    }
  }
  const tool_calls = calls.filter(Boolean);
  return { role: 'assistant', content: content || null, tool_calls: tool_calls.length ? tool_calls : undefined };
}

/** Splits streamed text into sentences, so speech can start with the first one. */
function sentenceSplitter(onSentence: (s: string) => void) {
  let buf = '';
  return {
    push(delta: string) {
      buf += delta;
      let m: RegExpMatchArray | null;
      while ((m = buf.match(/^([\s\S]*?[.!?।۔])(\s+|$)/u)) && m[2]) {
        const sentence = m[1]!.trim();
        buf = buf.slice(m[0].length);
        if (sentence) onSentence(sentence);
      }
    },
    flush() {
      const rest = buf.trim();
      buf = '';
      if (rest) onSentence(rest);
    },
  };
}

/**
 * Runs one user turn through the model and tools. Returns the assistant's final words, if any.
 * With `onSentence`, the reply streams and each sentence is handed over as soon as it is complete
 * (`streamed` is then true, and the caller should not speak `reply` again).
 */
export async function assistantTurn(
  ctx: Ctx, history: ChatMsg[], utterance: string, onSentence?: (s: string) => void,
): Promise<{ reply: string | null; history: ChatMsg[]; proposed: string[]; streamed: boolean }> {
  const proposed: string[] = [];
  const hide = (s: string) => (ctx.shield ? ctx.shield.hide(s) : s);
  const reveal = (s: string) => (ctx.shield ? ctx.shield.reveal(s) : s);
  const messages: ChatMsg[] = [...history, { role: 'user', content: hide(utterance.slice(0, 2000)) }];
  let streamed = false;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    // When the model fills an answer, the app reads it back and asks the next question itself; the
    // model's own words (“is that right?”, the next question rephrased) would repeat that, late. Its
    // text often streams just before the tool call in the same message, so sentences are held until
    // the message is complete and spoken only if it filled nothing.
    const held: string[] = [];
    const split = onSentence ? sentenceSplitter((s) => held.push(s)) : null;
    const msg = await step(ctx, messages, false, split ? (d) => split.push(d) : undefined);
    split?.flush();
    if (onSentence && !proposed.length && !msg.tool_calls?.some((c) => c.function.name === 'propose_fill')) {
      for (const s of held) { streamed = true; onSentence(reveal(s)); }
    }
    messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls });
    if (!msg.tool_calls?.length) return { reply: msg.content && !proposed.length ? reveal(msg.content) : null, history: messages, proposed, streamed };
    for (const tc of msg.tool_calls) {
      // Real values go back in locally, just before the runner validates the call.
      const args = reveal(tc.function.arguments);
      const out = await ctx.runner.run({ id: tc.id, name: tc.function.name, arguments: args });
      messages.push({ role: 'tool', tool_call_id: tc.id, content: hide(out.content) });
      if (out.ok && tc.function.name === 'propose_fill') {
        try {
          const id = String((JSON.parse(args) as { questionId?: unknown }).questionId);
          if (!proposed.includes(id)) proposed.push(id);
        } catch { /* the runner already rejected bad JSON */ }
      }
    }
  }
  return { reply: null, history: messages, proposed, streamed };
}

/** FR-18 / J6: plain-language explanation. Never suggests an answer. */
export async function explainQuestion(ctx: Ctx, q: FormQuestion): Promise<string> {
  try {
    const msg = await step(
      ctx,
      [{ role: 'user', content: `Explain in one or two plain sentences what this question is asking: “${q.label}”${q.helpText ? ` (help text: “${q.helpText}”)` : ''}. Do not suggest an answer.` }],
      true,
    );
    if (msg.content) return msg.content;
  } catch {
    // fall back below
  }
  return fallbackExplanation(q);
}

/** Plain-language explanation when the AI is unavailable, in the interface language. */
export function fallbackExplanation(q: FormQuestion, t: Strings = en): string {
  const e = t.explain;
  const kind: Record<FormQuestion['type'], string> = {
    text: e.k_text, paragraph: e.k_paragraph, number: e.k_number, date: e.k_date, time: e.k_time, email: e.k_email,
    phone: e.k_phone, yesno: e.k_yesno, choice: e.k_choice, multichoice: e.k_multi, checkbox: e.k_multi, dropdown: e.k_choice, scale: e.k_scale, file: e.k_file, signature: e.k_signature,
  };
  return [
    fmt(e.asks, { label: q.label, kind: kind[q.type] }),
    q.helpText ? fmt(e.form_says, { help: q.helpText }) : '',
    q.options?.length ? fmt(e.options_are, { list: q.options.join(', ') }) : '',
  ].filter(Boolean).join(' ');
}
