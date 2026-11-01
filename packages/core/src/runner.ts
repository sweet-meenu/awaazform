// Tool runner — the only way the model can act (FR-23). Validates arguments, logs every call
// to the timeline, and routes fills through the controller's confirm gate.
import type { SessionController } from './controller';
import { buildReport, reportToMarkdown } from './report';
import { isSensitive } from './safety';
import { describeCall, toolSchemas } from './tools';
import { TOOL_NAMES, type CanonicalKey, type FormQuestion, type ToolName } from './types';

/** UI hooks the runner needs. Each one that asks the user resolves with their decision. */
export interface ToolHost {
  ask(q: FormQuestion, text: string): Promise<void>;
  readBack(q: FormQuestion, value: string): Promise<void>;
  explain(q: FormQuestion): Promise<string>;
  highlight(q: FormQuestion): Promise<void>;
  /** Shows the saved value and asks “Use saved …?”. Resolves to the value only if the user says yes. */
  requestProfileUse(key: CanonicalKey): Promise<string | null>;
  /** Asks “Remember this for next time?”. Resolves true only if the user says yes. */
  offerSave(key: CanonicalKey, value: string, q: FormQuestion): Promise<boolean>;
}

export interface ToolCall {
  id: string;
  name: string;
  /** JSON string, as returned by the model. */
  arguments: string;
}

export interface ToolOutcome {
  ok: boolean;
  /** Content returned to the model. */
  content: string;
}

export class ToolRunner {
  /** Profile values the user agreed to use in this session; a `profile` fill must match one. */
  private approvedProfileValues = new Set<string>();

  constructor(private ctl: SessionController, private host: ToolHost) {}

  async run(call: ToolCall): Promise<ToolOutcome> {
    if (!(TOOL_NAMES as readonly string[]).includes(call.name)) {
      return this.reject(call, `Unknown tool “${call.name}”.`);
    }
    const name = call.name as ToolName;

    let parsedJson: unknown;
    try {
      parsedJson = call.arguments ? JSON.parse(call.arguments) : {};
    } catch {
      return this.reject(call, 'Arguments were not valid JSON.', name);
    }
    const parsed = toolSchemas[name].safeParse(parsedJson);
    if (!parsed.success) {
      return this.reject(call, `Invalid arguments: ${parsed.error.issues.map((i) => `${i.path.join('.') || 'args'}: ${i.message}`).join('; ')}`, name);
    }
    const args = parsed.data as Record<string, unknown>;

    const q = typeof args.questionId === 'string' ? this.ctl.session.questions.find((x) => x.id === args.questionId) : undefined;
    if ('questionId' in args && !q) return this.reject(call, `No question with id “${String(args.questionId)}”.`, name);

    this.ctl.emit({ type: 'tool.called', callId: call.id, name, args });
    try {
      const content = await this.execute(name, args, q);
      this.ctl.emit({ type: 'tool.result', callId: call.id, name, ok: true, summary: describeCall(name, args, q?.label) });
      return { ok: true, content };
    } catch (err) {
      const message = (err as Error).message;
      this.ctl.emit({ type: 'tool.result', callId: call.id, name, ok: false, summary: message });
      return { ok: false, content: JSON.stringify({ error: message }) };
    }
  }

  private reject(call: ToolCall, message: string, name?: ToolName): ToolOutcome {
    // Rejections are logged too — nothing the model does is hidden (§8.2).
    if (name) this.ctl.emit({ type: 'tool.result', callId: call.id, name, ok: false, summary: message });
    else this.ctl.emit({ type: 'error', message, recoverable: true });
    return { ok: false, content: JSON.stringify({ error: message }) };
  }

  private async execute(name: ToolName, args: Record<string, unknown>, q?: FormQuestion): Promise<string> {
    const s = this.ctl.session;
    switch (name) {
      case 'scan_form':
        return JSON.stringify(s.questions.map(({ id, label, type, required, options, support }) => ({ id, label, type, required, options, support })));

      case 'get_current_question': {
        const cur = s.questions[s.currentIndex];
        return JSON.stringify(cur ? { ...cur, answer: s.answers[cur.id] } : null);
      }

      case 'ask_user':
        await this.host.ask(q!, String(args.text));
        return JSON.stringify({ asked: true });

      case 'propose_fill': {
        const source = args.source as 'spoken' | 'typed' | 'profile';
        const value = String(args.value);
        if (source === 'profile' && !this.approvedProfileValues.has(value)) {
          throw new Error('Profile values can only be proposed after the user agrees via lookup_profile.');
        }
        const r = this.ctl.propose(q!.id, value, source);
        if (!r.ok) throw new Error(r.error);
        return JSON.stringify({ status: 'proposed', normalized: r.normalized, note: 'Waiting for the user to confirm. Do not assume it is filled.' });
      }

      case 'read_back':
        await this.host.readBack(q!, String(args.value));
        return JSON.stringify({ readBack: true });

      case 'explain_field':
        return JSON.stringify({ explanation: await this.host.explain(q!) });

      case 'lookup_profile': {
        const v = await this.host.requestProfileUse(args.key as CanonicalKey);
        if (v === null) return JSON.stringify({ used: false, note: 'The user declined or nothing is saved. Ask them instead.' });
        this.approvedProfileValues.add(v);
        return JSON.stringify({ used: true, value: v });
      }

      case 'offer_save': {
        const status = s.answers[q!.id]?.status;
        if (status !== 'confirmed' && status !== 'written' && status !== 'verified') {
          throw new Error('Only confirmed answers can be offered for saving.');
        }
        if (isSensitive(q!.label)) throw new Error('This kind of information is never saved.');
        const saved = await this.host.offerSave(args.key as CanonicalKey, String(args.value), q!);
        return JSON.stringify({ saved });
      }

      case 'highlight_field':
        await this.host.highlight(q!);
        return JSON.stringify({ highlighted: true });

      case 'verify_field':
        return JSON.stringify({ ok: await this.ctl.verify(q!.id) });

      case 'build_report':
        return reportToMarkdown(buildReport(s));
    }
  }
}
