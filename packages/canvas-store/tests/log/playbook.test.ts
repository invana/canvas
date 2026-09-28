import { describe, expect, it } from 'vitest';

import type { DataOpAdapter, Delta, Patch, StepSpec, StoreChange } from '@invana/canvas-core';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { createOperationLog, type ViewPatchMode } from '../../src/log/createOperationLog';
import { createPlaybook, PlaybookStepError, type PlaybookEnv } from '../../src/log/createPlaybook';

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
