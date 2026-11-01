// Tool declarations — PRD §8.2. The model sees the JSON Schema; the runner validates with Zod.
import { z } from 'zod';
import { CANONICAL_KEYS, type ToolName } from './types';

const questionId = z.string().min(1).max(100);
const canonicalKey = z.enum(CANONICAL_KEYS);
const value = z.string().min(1).max(4000);

export const toolSchemas = {
  scan_form: z.object({}),
  get_current_question: z.object({}),
  ask_user: z.object({ questionId, text: z.string().min(1).max(500) }),
  propose_fill: z.object({ questionId, value, source: z.enum(['spoken', 'typed', 'profile']) }),
  read_back: z.object({ questionId, value }),
  explain_field: z.object({ questionId }),
  lookup_profile: z.object({ key: canonicalKey }),
  offer_save: z.object({ key: canonicalKey, value, questionId }),
  highlight_field: z.object({ questionId }),
  verify_field: z.object({ questionId }),
  build_report: z.object({}),
} satisfies Record<ToolName, z.ZodType>;

export type ToolArgs<N extends ToolName> = z.infer<(typeof toolSchemas)[N]>;

const descriptions: Record<ToolName, string> = {
  scan_form: 'List the questions in the current form with type, required flag, options and support status.',
  get_current_question: 'Get the question the user is currently on.',
  ask_user: 'Speak and show a prompt to the user for a question, then wait for their answer.',
  propose_fill: 'Propose a value for a question. This only queues the value; the user must confirm before anything is filled.',
  read_back: 'Read a normalized value back to the user, aloud and on screen.',
  explain_field: 'Explain what a question is asking, in plain language. Never suggest what the answer should be.',
  lookup_profile: "Ask the user whether to use a value saved in their profile. Returns the value only if they agree.",
  offer_save: 'After a confirmed answer, ask the user whether to remember it for next time.',
  highlight_field: 'Highlight a field in the form so the user can see it.',
  verify_field: 'Read a filled field back from the form and check it matches the confirmed answer.',
  build_report: 'Build the submission readiness report.',
};

/** OpenAI-compatible tool declarations (Groq's chat API uses this format). */
export function toolDeclarations() {
  return (Object.keys(toolSchemas) as ToolName[]).map((name) => {
    const { $schema: _omit, ...parameters } = z.toJSONSchema(toolSchemas[name]) as Record<string, unknown>;
    return { type: 'function' as const, function: { name, description: descriptions[name], parameters } };
  });
}

/** Plain-language summary of a tool call for the timeline (FR-24). */
export function describeCall(name: ToolName, args: Record<string, unknown>, label?: string): string {
  const q = label ? `“${label}”` : 'this question';
  switch (name) {
    case 'scan_form': return 'Scanning the form';
    case 'get_current_question': return 'Checking the current question';
    case 'ask_user': return `Asking about ${q}`;
    case 'propose_fill': return `Proposing “${String(args.value)}” for ${q} (from ${String(args.source)})`;
    case 'read_back': return `Reading back “${String(args.value)}”`;
    case 'explain_field': return `Explaining ${q}`;
    case 'lookup_profile': return `Asking to use your saved ${String(args.key).replace(/_/g, ' ')}`;
    case 'offer_save': return `Asking whether to remember your ${String(args.key).replace(/_/g, ' ')}`;
    case 'highlight_field': return `Highlighting ${q}`;
    case 'verify_field': return `Checking ${q} was filled correctly`;
    case 'build_report': return 'Building the readiness report';
  }
}
