import { describe, expect, it, vi } from 'vitest';
import {
  buildReport, createSession, SessionController, ToolRunner,
  type FieldWriter, type SessionEvent, type ToolHost,
} from '../src';
import { DEMO_FORM, DEMO_FORM_TITLE } from './fixtures';

function setup(writerOverride?: Partial<FieldWriter>) {
  const store = new Map<string, string>();
  const writer: FieldWriter = {
    write: vi.fn(async (q, v) => void store.set(q.id, v)),
    read: vi.fn(async (q) => store.get(q.id) ?? null),
    ...writerOverride,
  };
  const ctl = new SessionController(createSession({ id: 's1', formTitle: DEMO_FORM_TITLE, questions: DEMO_FORM }), writer);
  const events: SessionEvent[] = [];
  ctl.onEvent((e) => events.push(e));
  const host: ToolHost = {
    ask: vi.fn(async () => {}),
    readBack: vi.fn(async () => {}),
    explain: vi.fn(async () => 'explanation'),
    highlight: vi.fn(async () => {}),
    requestProfileUse: vi.fn(async () => null),
    offerSave: vi.fn(async () => true),
  };
  const runner = new ToolRunner(ctl, host);
  return { ctl, writer, store, events, host, runner };
}

const call = (name: string, args: unknown, id = 'c1') => ({ id, name, arguments: JSON.stringify(args) });

describe('confirm gate (FR-16, AC-03)', () => {
  it('a proposed fill never reaches the writer without confirmation', async () => {
    const { runner, writer, ctl } = setup();
    const r = await runner.run(call('propose_fill', { questionId: 'q1', value: 'Sunita Devi', source: 'spoken' }));
    expect(r.ok).toBe(true);
    expect(ctl.session.answers.q1!.status).toBe('proposed');
    expect(writer.write).not.toHaveBeenCalled();
  });

  it('retry cannot bypass confirmation', async () => {
    const { ctl, writer } = setup();
    ctl.propose('q1', 'Sunita Devi', 'typed');
    await ctl.retry('q1');
    expect(writer.write).not.toHaveBeenCalled();
  });

  it('there is no confirm tool the model could call', async () => {
    const { runner, writer } = setup();
    await runner.run(call('propose_fill', { questionId: 'q1', value: 'Sunita', source: 'typed' }));
    const r = await runner.run(call('confirm_fill', { questionId: 'q1' }));
    expect(r.ok).toBe(false);
    expect(writer.write).not.toHaveBeenCalled();
  });

  it('confirmation writes then verifies (AC-04)', async () => {
    const { ctl, writer, events } = setup();
    ctl.propose('q4', '१२ मार्च २००१', 'spoken');
    expect(ctl.session.answers.q4!.normalized).toBe('2001-03-12');
    await ctl.confirm('q4');
    expect(writer.write).toHaveBeenCalledOnce();
    expect(ctl.session.answers.q4!.status).toBe('verified');
    expect(events.map((e) => e.type)).toEqual(['fill.proposed', 'fill.confirmed', 'fill.written', 'fill.verified']);
  });

  it('verification mismatch is reported, not hidden', async () => {
    const { ctl } = setup({ read: async () => 'something else' });
    ctl.propose('q1', 'Sunita', 'typed');
    await ctl.confirm('q1');
    const a = ctl.session.answers.q1!;
    expect(a.status).toBe('confirmed');
    expect(a.error).toMatch(/Didn't take/);
  });

  it('refuses to fill unsupported fields', async () => {
    const { ctl } = setup();
    expect(ctl.propose('q13', 'photo.jpg', 'typed').ok).toBe(false);
  });

  it('required questions cannot be skipped', () => {
    const { ctl } = setup();
    expect(ctl.skip('q1')).toBe(false);
    expect(ctl.skip('q12')).toBe(true);
  });
});

describe('tool runner (FR-23)', () => {
  it('rejects invalid arguments and logs the rejection', async () => {
    const { runner, events } = setup();
    const r = await runner.run(call('propose_fill', { questionId: 'q1' }));
    expect(r.ok).toBe(false);
    expect(events.some((e) => e.type === 'tool.result' && !e.ok)).toBe(true);
  });

  it('rejects non-JSON arguments and unknown questions', async () => {
    const { runner } = setup();
    expect((await runner.run({ id: 'x', name: 'read_back', arguments: '{oops' })).ok).toBe(false);
    expect((await runner.run(call('highlight_field', { questionId: 'nope' }))).ok).toBe(false);
  });

  it('profile values need the user to agree first (AC-07)', async () => {
    const { runner, host } = setup();
    let r = await runner.run(call('propose_fill', { questionId: 'q2', value: 'a@b.com', source: 'profile' }));
    expect(r.ok).toBe(false);

    vi.mocked(host.requestProfileUse).mockResolvedValueOnce('a@b.com');
    await runner.run(call('lookup_profile', { key: 'email' }));
    r = await runner.run(call('propose_fill', { questionId: 'q2', value: 'a@b.com', source: 'profile' }));
    expect(r.ok).toBe(true);
  });

  it('offer_save only after confirmation', async () => {
    const { runner, ctl, host } = setup();
    ctl.propose('q2', 'a@b.com', 'typed');
    expect((await runner.run(call('offer_save', { key: 'email', value: 'a@b.com', questionId: 'q2' }))).ok).toBe(false);
    await ctl.confirm('q2');
    expect((await runner.run(call('offer_save', { key: 'email', value: 'a@b.com', questionId: 'q2' }))).ok).toBe(true);
    expect(host.offerSave).toHaveBeenCalledOnce();
  });
});

describe('readiness report (AC-06)', () => {
  it('lists unanswered required questions as missing', async () => {
    const { ctl } = setup();
    ctl.propose('q1', 'Sunita', 'typed');
    await ctl.confirm('q1');
    const r = buildReport(ctl.session);
    expect(r.completed.map((i) => i.questionId)).toEqual(['q1']);
    expect(r.missing.map((i) => i.questionId)).toContain('q2');
    expect(r.unsupported.map((i) => i.questionId)).toEqual(['q13']);
    expect(r.ready).toBe(false);
  });
});
