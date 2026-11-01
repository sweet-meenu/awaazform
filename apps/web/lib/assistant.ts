'use client';

import type { FormQuestion, Language, SessionController, ToolRunner } from '@awaazform/core';

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
}

async function step(ctx: Ctx, messages: ChatMsg[], noTools = false): Promise<Extract<ChatMsg, { role: 'assistant' }>> {
  const s = ctx.ctl.session;
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      formTitle: s.formTitle,
      profileLabel: ctx.profileLabel,
      language: ctx.language,
      question: s.questions[s.currentIndex],
      position: { index: s.currentIndex, total: s.questions.length },
      messages,
      noTools,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { message?: Extract<ChatMsg, { role: 'assistant' }>; error?: string };
  if (!res.ok || !json.message) throw new AiUnavailable(json.error ?? 'AI is unavailable');
  return json.message;
}

/** Runs one user turn through the model and tools. Returns the assistant's final words, if any. */
export async function assistantTurn(ctx: Ctx, history: ChatMsg[], utterance: string): Promise<{ reply: string | null; history: ChatMsg[] }> {
  const messages: ChatMsg[] = [...history, { role: 'user', content: utterance.slice(0, 2000) }];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const msg = await step(ctx, messages);
    messages.push({ role: 'assistant', content: msg.content ?? null, tool_calls: msg.tool_calls });
    if (!msg.tool_calls?.length) return { reply: msg.content ?? null, history: messages };
    for (const tc of msg.tool_calls) {
      const out = await ctx.runner.run({ id: tc.id, name: tc.function.name, arguments: tc.function.arguments });
      messages.push({ role: 'tool', tool_call_id: tc.id, content: out.content });
    }
  }
  return { reply: null, history: messages };
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

export function fallbackExplanation(q: FormQuestion): string {
  const kind: Record<FormQuestion['type'], string> = {
    text: 'a short written answer', paragraph: 'a longer written answer', number: 'a number', date: 'a date',
    time: 'a time', email: 'an email address', phone: 'a phone number', yesno: 'yes or no',
    choice: 'one of the options', multichoice: 'one or more options', checkbox: 'one or more options',
    dropdown: 'one of the options', scale: 'a number on the scale',
  };
  return `This question, “${q.label}”, asks for ${kind[q.type]}.${q.helpText ? ` The form says: ${q.helpText}` : ''}${q.options?.length ? ` The options are: ${q.options.join(', ')}.` : ''}`;
}
