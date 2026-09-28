import { describe, expect, it } from 'vitest';

import type { DataOpAdapter, Delta, Patch, StepSpec, StoreChange } from '@invana/canvas-core';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { createOperationLog, type ViewPatchMode } from '../../src/log/createOperationLog';
import { createPlaybook, PlaybookStepError, type PlaybookEnv } from '../../src/log/createPlaybook';
import { historyView } from '../../src/log/historyView';

interface S {
  definition: { color: string };
  interaction: { focus: string[] | null; camera: number };
}

const classify = (patch: Patch, change: StoreChange<S>): ViewPatchMode => {
  if (change.action?.startsWith('edit:')) return patch.path[0] === 'definition' ? 'undoable' : 'skip';
  if (patch.path[0] === 'interaction' && patch.path[1] === 'focus') return 'record';
  return 'skip';
};

/**
 * A playbook over a toy canvas: a view store, a data source holding ids (its
 * `applyDelta` adds / removes and records `{ add | remove }` ops), and an env
 * that plays a step the way the engine does.
 */
function setup() {
  const view = createMemoryStore<S>({ definition: { color: 'red' }, interaction: { focus: null, camera: 0 } });
  const log = createOperationLog<S>({ view, classify });
  const ids = new Set<string>(['a']);
  type Op = { add?: string; remove?: string };
  const adapter: DataOpAdapter = {
    sourceId: 'graph',
    applyOps(ops, direction) {
      const list = (direction === 'forward' ? ops : [...ops].reverse()) as Op[];
      for (const op of list) {
        const add = direction === 'forward' ? op.add : op.remove;
        const remove = direction === 'forward' ? op.remove : op.add;
        if (add) ids.add(add);
        if (remove) ids.delete(remove);
      }
    },
    applyDelta(delta: Delta, opts) {
      const ops: Op[] = [];
      for (const n of delta.added?.nodes ?? []) if (!ids.has(n.id)) (ids.add(n.id), ops.push({ add: n.id }));
      for (const id of delta.removed?.nodeIds ?? []) if (ids.delete(id)) ops.push({ remove: id });
      log.recordData('graph', ops, opts?.actor);
    },
    hasElement: (id) => ids.has(id),
  };
  log.registerSource(adapter);

  const commands: string[] = [];
  let settles = 0;
  const env: PlaybookEnv<{ color?: string }> = {
    validate(step, source) {
      const problems: string[] = [];
      if (step.data && source !== 'graph') problems.push('bad source');
      for (const id of step.view?.focus?.ids ?? []) {
        const added = step.data?.added?.nodes?.some((n) => n.id === id);
        if (!ids.has(id) && !added) problems.push(`unknown id ${id}`);
      }
      for (const v of step.do ?? []) if (v.command !== 'layout.run') problems.push(`unknown command ${v.command}`);
      return problems;
    },
    apply(step, source) {
      if (step.data && source) log.source(source)?.applyDelta?.(step.data, { actor: step.actor ?? 'user' });
      if (step.settings?.color) view.update((d) => void (d.definition.color = step.settings!.color!), 'edit:playbook');
      if (step.view?.focus !== undefined) {
        const focus = step.view.focus;
        view.update((d) => void (d.interaction.focus = focus ? [...focus.ids] : null), 'view:focus:set');
      }
    },
    async runCommand(name) {
      commands.push(name);
      return true;
    },
    async whenSettled() {
      settles++;
    },
    actor: () => 'user',
  };
  const playbook = createPlaybook(log, env, { doc: { version: 1, title: 'T', source: 'graph', steps: [] } });
  return { view, log, ids, playbook, commands, settles: () => settles };
}

const expand: StepSpec<{ color?: string }> = {
  id: 's1',
  title: 'Expand',
  actor: 'assistant',
  data: { added: { nodes: [{ id: 'b' }, { id: 'c' }] } },
  settings: { color: 'blue' },
  view: { focus: { ids: ['b'] } },
  do: [{ command: 'layout.run' }],
};

const narrow: StepSpec<{ color?: string }> = {
  id: 's2',
  title: 'Narrow',
  data: { removed: { nodeIds: ['c'] } },
  view: { focus: null },
};

describe('createPlaybook (F13, V11)', () => {
  it('addStep only appends: the canvas does not change', () => {
    const { playbook, ids, log, view } = setup();
    playbook.addStep(expand);
    expect(playbook.steps).toHaveLength(1);
    expect(playbook.index).toBe(-1);
    expect([...ids]).toEqual(['a']);
    expect(log.entries()).toHaveLength(0);
    expect(view.getState().definition.color).toBe('red');
  });

  it('next plays a step as one entry tagged with its id, title and actor, then runs its verbs and settles', async () => {
    const { playbook, ids, log, view, commands, settles } = setup();
    playbook.addStep(expand);
    await playbook.next();
    expect([...ids].sort()).toEqual(['a', 'b', 'c']);
    expect(view.getState().definition.color).toBe('blue');
    expect(view.getState().interaction.focus).toEqual(['b']);
    const entries = log.entries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ stepId: 's1', title: 'Expand', actor: 'assistant' });
    expect(entries[0]!.parts.map((p) => p.kind)).toEqual(['data', 'view', 'view']);
    expect(commands).toEqual(['layout.run']);
    expect(settles()).toBe(1);
    expect(playbook.current?.id).toBe('s1');
  });

  it('previous reverts every part of the step, view intent included; next replays the recorded entry', async () => {
    const { playbook, ids, log, view, commands } = setup();
    playbook.addStep(expand);
    await playbook.next();
    await playbook.previous();
    expect([...ids]).toEqual(['a']);
    expect(view.getState().definition.color).toBe('red');
    expect(view.getState().interaction.focus).toBeNull();
    expect(playbook.index).toBe(-1);

    await playbook.next();
    expect([...ids].sort()).toEqual(['a', 'b', 'c']);
    expect(view.getState().interaction.focus).toEqual(['b']);
    // Replayed, not re-played: still one entry, and the verbs run again.
    expect(log.entries()).toHaveLength(1);
    expect(commands).toEqual(['layout.run', 'layout.run']);
  });

  it('goTo moves through several steps in either direction', async () => {
    const { playbook, ids, view } = setup();
    playbook.addStep(expand);
    playbook.addStep(narrow);
    await playbook.goTo('s2');
    expect([...ids].sort()).toEqual(['a', 'b']);
    expect(view.getState().interaction.focus).toBeNull();
    await playbook.goTo('s1');
    expect([...ids].sort()).toEqual(['a', 'b', 'c']);
    expect(view.getState().interaction.focus).toEqual(['b']);
  });

  it('a bad step writes nothing and rejects with every problem', async () => {
    const { playbook, ids, log } = setup();
    playbook.addStep({ id: 'bad', title: 'Bad', view: { focus: { ids: ['nope'] } }, do: [{ command: 'rm' }] });
    const err = await playbook.next().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PlaybookStepError);
    expect((err as PlaybookStepError).problems).toEqual(['unknown id nope', 'unknown command rm']);
    expect(log.entries()).toHaveLength(0);
    expect([...ids]).toEqual(['a']);
    expect(playbook.index).toBe(-1);
  });

  it('a step that throws while applying is taken back whole; the position stays and a retry plays afresh (F28)', async () => {
    const { playbook, ids, log, view } = setup();
    // `settings.color` is written after the data, then the view write throws.
    playbook.addStep({ ...expand, view: { focus: { ids: ['b'] } }, do: [] });
    const off = view.subscribe((s, prev) => {
      if (s.interaction.focus !== prev.interaction.focus && s.interaction.focus) throw new Error('boom');
    });
    await expect(playbook.next()).rejects.toThrow('boom');
    expect([...ids]).toEqual(['a']);
    expect(view.getState().definition.color).toBe('red');
    expect(log.entries()).toHaveLength(0);
    expect(log.canRedo()).toBe(false);
    expect(playbook.index).toBe(-1);
    off();
    await playbook.next();
    expect([...ids].sort()).toEqual(['a', 'b', 'c']);
    expect(log.entries({ stepId: 's1' })).toHaveLength(1);
  });

  it('a change made after stepping back cuts the recorded entry off, so the step plays afresh', async () => {
    const { playbook, log, view } = setup();
    playbook.addStep(expand);
    await playbook.next();
    await playbook.previous();
    view.update((d) => void (d.definition.color = 'green'), 'edit:user');
    await playbook.next();
    const steps = log.entries({ stepId: 's1' });
    expect(steps).toHaveLength(1);
    expect(view.getState().definition.color).toBe('blue');
  });

  it('rejects duplicate step ids, and moves queue behind each other', async () => {
    const { playbook } = setup();
    playbook.addStep(expand);
    expect(() => playbook.addStep({ ...expand })).toThrow(/duplicate/);
    playbook.addStep(narrow);
    await Promise.all([playbook.next(), playbook.next()]);
    expect(playbook.current?.id).toBe('s2');
  });

  it('toJSON and load round-trip the script without touching the canvas', async () => {
    const { playbook, ids } = setup();
    playbook.addStep(expand);
    const doc = playbook.toJSON();
    expect(doc).toMatchObject({ version: 1, title: 'T', source: 'graph' });
    await playbook.load({ ...doc, title: 'Again' });
    expect(playbook.title).toBe('Again');
    expect(playbook.steps.map((s) => s.id)).toEqual(['s1']);
    expect([...ids]).toEqual(['a']);
  });
});

describe('history.sinceLastStep (F14, V12)', () => {
  /** The playbook setup, plus a history view whose `describeView` reads the toy view. */
  function withHistory() {
    const ctx = setup();
    const history = historyView(ctx.log, {
      describeView: (parts) => {
        const touched = new Set(parts.flatMap((p) => p.patches.map((q) => q.path.join('/'))));
        const s = ctx.view.getState();
        return {
          ...(touched.has('definition/color') ? { settings: { color: s.definition.color } } : {}),
          ...(touched.has('interaction/focus') ? { view: { focus: s.interaction.focus ? { ids: s.interaction.focus } : null } } : {}),
        };
      },
    });
    // The toy source's net delta: adds and removes that survive.
    const adapter = ctx.log.source('graph')!;
    adapter.toDelta = (ops) => {
      const added = new Set<string>();
      const removed = new Set<string>();
      for (const op of ops as Array<{ add?: string; remove?: string }>) {
        if (op.add) (removed.has(op.add) ? removed.delete(op.add) : added.add(op.add));
        if (op.remove) (added.has(op.remove) ? added.delete(op.remove) : removed.add(op.remove));
      }
      return {
        ...(added.size ? { added: { nodes: [...added].map((id) => ({ id })) } } : {}),
        ...(removed.size ? { removed: { nodeIds: [...removed] } } : {}),
      };
    };
    const userAdd = (id: string) => adapter.applyDelta!({ added: { nodes: [{ id }] } }, { actor: 'user' });
    const userRemove = (id: string) => adapter.applyDelta!({ removed: { nodeIds: [id] } }, { actor: 'user' });
    return { ...ctx, history, userAdd, userRemove };
  }

  it('summarises work since the last step: net delta, merged settings, final view; reading changes nothing', async () => {
    const { playbook, history, view, log, userAdd, userRemove } = withHistory();
    playbook.addStep(expand);
    await playbook.next();
    userAdd('x');
    userAdd('y');
    userRemove('x'); // cancels with the add
    userRemove('c'); // added by the step, removed by the user
    view.update((d) => void (d.definition.color = 'green'), 'edit:user');
    view.update((d) => void (d.definition.color = 'pink'), 'edit:user');
    view.update((d) => void (d.interaction.focus = ['y']), 'view:focus:set');
    const before = log.entries().length;

    const step = history.sinceLastStep<{ color?: string }>('My changes');
    expect(step).toEqual({
      id: expect.stringMatching(/^since-/),
      title: 'My changes',
      source: 'graph',
      data: { added: { nodes: [{ id: 'y' }] }, removed: { nodeIds: ['c'] } },
      settings: { color: 'pink' },
      view: { focus: { ids: ['y'] } },
    });
    expect(log.entries()).toHaveLength(before);
  });

  it('with nothing since the last step, returns a bare step', async () => {
    const { playbook, history } = withHistory();
    playbook.addStep(expand);
    await playbook.next();
    const step = history.sinceLastStep('Nothing');
    expect(Object.keys(step).sort()).toEqual(['id', 'title']);
  });

  it('addStep adopts the recorded entries: no re-run, previous reverts them, next replays them', async () => {
    const { playbook, history, ids, log, userAdd, commands } = withHistory();
    playbook.addStep(expand);
    await playbook.next();
    userAdd('x');
    const step = history.sinceLastStep('Add x');
    playbook.addStep(step);
    expect(playbook.index).toBe(1);
    expect(log.entries({ stepId: step.id })).toHaveLength(1);
    expect(log.entries()).toHaveLength(2);

    await playbook.previous();
    expect(ids.has('x')).toBe(false);
    await playbook.next();
    expect(ids.has('x')).toBe(true);
    expect(log.entries()).toHaveLength(2); // replayed, not re-run
    expect(commands).toEqual(['layout.run']);
  });

  it('a copy, or a result that is no longer the newest work, is added as an ordinary step', async () => {
    const { playbook, history, log, userAdd } = withHistory();
    userAdd('x');
    const stale = history.sinceLastStep('Stale');
    userAdd('y');
    playbook.addStep(stale);
    expect(playbook.index).toBe(-1);
    const copy = JSON.parse(JSON.stringify(history.sinceLastStep('Copy'))) as StepSpec<{ color?: string }>;
    copy.id = 'copy';
    playbook.addStep(copy);
    expect(playbook.index).toBe(-1);
    expect(log.entries().every((e) => e.stepId === undefined)).toBe(true);
  });
});
