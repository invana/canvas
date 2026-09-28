import { describe, expect, it } from 'vitest';

import type { DataOpAdapter, Patch, StoreChange } from '@invana/canvas-core';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { createOperationLog, type ViewPatchMode } from '../../src/log/createOperationLog';

interface S {
  definition: { color: string; size: number };
  interaction: { selection: Set<string> };
  camera: { zoom: number };
}

const initial = (): S => ({
  definition: { color: 'red', size: 1 },
  interaction: { selection: new Set() },
  camera: { zoom: 1 },
});

/** The canvas's classification (G5), in miniature. */
const classify = (patch: Patch, change: StoreChange<S>): ViewPatchMode => {
  if (change.action?.startsWith('edit:')) return patch.path[0] === 'definition' ? 'undoable' : 'skip';
  if (patch.path[0] === 'interaction') return 'record';
  return 'skip';
};

/** A toy data source: a set of ids, ops `{ add | remove: id }`. */
function makeSource(sourceId = 'data') {
  const ids = new Set<string>();
  type Op = { add?: string; remove?: string };
  const adapter: DataOpAdapter = {
    sourceId,
    applyOps(ops, direction) {
      const list = (direction === 'forward' ? ops : [...ops].reverse()) as Op[];
      for (const op of list) {
        const add = direction === 'forward' ? op.add : op.remove;
        const remove = direction === 'forward' ? op.remove : op.add;
        if (add) ids.add(add);
        if (remove) ids.delete(remove);
      }
    },
  };
  return { ids, adapter };
}

function setup() {
  const view = createMemoryStore<S>(initial());
  let actor = 'user';
  const log = createOperationLog<S>({ view, classify, actor: () => actor });
  const src = makeSource();
  log.registerSource(src.adapter);
  const addId = (id: string, who?: string) => {
    src.ids.add(id);
    log.recordData('data', [{ add: id }], who);
  };
  return { view, log, src, addId, setActor: (a: string) => (actor = a) };
}

describe('createOperationLog — one log (G1)', () => {
  it('V2: an entry holding a data op and a view patch undoes and redoes in one call', () => {
    const { view, log, src } = setup();
    log.group({ title: 'step' }, () => {
      src.ids.add('n1');
      log.recordData('data', [{ add: 'n1' }]);
      view.update((d) => {
        d.definition.color = 'blue';
      }, 'edit:color');
    });
    expect(log.entries()).toHaveLength(1);
    expect(log.entries()[0]!.parts.map((p) => p.kind)).toEqual(['data', 'view']);

    log.undo();
    expect(src.ids.has('n1')).toBe(false);
    expect(view.getState().definition.color).toBe('red');
    expect(log.entries()).toHaveLength(0);

    log.redo();
    expect(src.ids.has('n1')).toBe(true);
    expect(view.getState().definition.color).toBe('blue');
    expect(log.entries()).toHaveLength(1);
  });

  it('undo is linear across data and view entries', () => {
    const { view, log, src, addId } = setup();
    addId('a');
    view.update((d) => {
      d.definition.size = 2;
    }, 'edit:size');
    addId('b');
    log.undo();
    expect([...src.ids]).toEqual(['a']);
    log.undo();
    expect(view.getState().definition.size).toBe(1);
    log.undo();
    expect(src.ids.size).toBe(0);
    expect(log.canUndo()).toBe(false);
  });

  it('view replays write undo:/redo: actions so the engine can reconcile', () => {
    const { view, log } = setup();
    const actions: (string | undefined)[] = [];
    view.subscribeChanges((c) => actions.push(c.action));
    view.update((d) => {
      d.definition.color = 'blue';
    }, 'edit:color');
    log.undo();
    log.redo();
    expect(actions).toEqual(['edit:color', 'undo:edit:color', 'redo:edit:color']);
  });
});

describe('createOperationLog — classification (G5)', () => {
  it('programmatic config and camera are not recorded', () => {
    const { view, log } = setup();
    view.update((d) => {
      d.definition.color = 'green';
    }, 'canvas:update');
    view.update((d) => {
      d.camera.zoom = 2;
    }, 'view:camera:zoom');
    expect(log.entries()).toHaveLength(0);
  });

  it('selection is recorded but plain undo steps over it, leaving it applied', () => {
    const { view, log } = setup();
    view.update((d) => {
      d.definition.size = 5;
    }, 'edit:size');
    view.update((d) => {
      d.interaction.selection = new Set(['n1']);
    }, 'view:selection:set');
    expect(log.entries()).toHaveLength(2);

    log.undo();
    expect(view.getState().definition.size).toBe(1);
    expect([...view.getState().interaction.selection]).toEqual(['n1']);
    expect(log.canUndo()).toBe(false); // only the selection entry is left
  });

  it('a record-only entry after an undo keeps the redo', () => {
    const { view, log } = setup();
    view.update((d) => {
      d.definition.size = 5;
    }, 'edit:size');
    log.undo();
    view.update((d) => {
      d.interaction.selection = new Set(['n2']);
    }, 'view:selection:set');
    expect(log.canRedo()).toBe(true);
    log.redo();
    expect(view.getState().definition.size).toBe(5);
  });

  it('revertTo(null) reverts every part, selection included; replayTo restores it', () => {
    const { view, log } = setup();
    view.update((d) => {
      d.interaction.selection = new Set(['n1']);
    }, 'view:selection:set');
    const [entry] = log.entries();
    log.revertTo(null);
    expect(view.getState().interaction.selection.size).toBe(0);
    expect(log.atLatest()).toBe(false);
    log.replayTo(entry!.id);
    expect([...view.getState().interaction.selection]).toEqual(['n1']);
    expect(log.atLatest()).toBe(true);
  });
});

describe('createOperationLog — actor, groups, branches, limits', () => {
  it('every entry carries the session actor unless one is given (G2)', () => {
    const { log, addId, setActor } = setup();
    addId('a');
    addId('b', 'engine');
    setActor('user:ravi');
    addId('c');
    expect(log.entries().map((e) => e.actor)).toEqual(['user', 'engine', 'user:ravi']);
    expect(log.entries({ actor: 'engine' }).map((e) => e.parts[0])).toEqual([
      { kind: 'data', sourceId: 'data', ops: [{ add: 'b' }] },
    ]);
  });

  it('a group is one entry; nested groups merge into the outermost', () => {
    const { log, addId } = setup();
    log.group({ title: 'outer', actor: 'engine', stepId: 's1' }, () => {
      addId('a');
      log.group({ title: 'inner' }, () => addId('b'));
    });
    const entries = log.entries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ title: 'outer', actor: 'engine', stepId: 's1' });
    expect(entries[0]!.parts).toEqual([{ kind: 'data', sourceId: 'data', ops: [{ add: 'a' }, { add: 'b' }] }]);
    expect(log.entries({ stepId: 's1' })).toHaveLength(1);
  });

  it('an empty group records nothing', () => {
    const { log } = setup();
    log.group({ title: 'nothing' }, () => undefined);
    expect(log.entries()).toHaveLength(0);
  });

  it('writes made while replaying are not recorded', () => {
    const view = createMemoryStore<S>(initial());
    const log = createOperationLog<S>({ view, classify });
    const ids = new Set<string>();
    log.registerSource({
      sourceId: 'data',
      applyOps(ops, direction) {
        for (const op of ops as { add: string }[]) {
          if (direction === 'back') ids.delete(op.add);
          else ids.add(op.add);
        }
        // A reacting writer during replay — must be dropped.
        log.recordData('data', [{ add: 'echo' }]);
      },
    });
    ids.add('a');
    log.recordData('data', [{ add: 'a' }]);
    log.undo();
    log.redo();
    expect(log.entries()).toHaveLength(1);
  });

  it('there is no limit by default (G6)', () => {
    const { log, addId } = setup();
    for (let i = 0; i < 250; i++) addId(`n${i}`);
    expect(log.entries()).toHaveLength(250);
  });

  it('a change after undo moves the redo tail aside rather than applying it', () => {
    const { log, src, addId } = setup();
    addId('a');
    addId('b');
    log.undo();
    addId('c');
    expect(log.canRedo()).toBe(false);
    expect([...src.ids].sort()).toEqual(['a', 'c']);
    expect(log.entries()).toHaveLength(2);
  });

  it('an unregistered source is skipped on undo instead of throwing', () => {
    const { log } = setup();
    log.recordData('gone', [{ add: 'x' }]);
    expect(() => log.undo()).not.toThrow();
  });

  it('onEntry hears new entries; peekUndo reports actor and title', () => {
    const { log, addId } = setup();
    const heard: string[] = [];
    log.onEntry((e) => heard.push(e.actor));
    log.group({ title: 'paste', actor: 'user:ravi' }, () => addId('a'));
    expect(heard).toEqual(['user:ravi']);
    expect(log.peekUndo()).toMatchObject({ title: 'paste', actor: 'user:ravi' });
  });

  it('merges same-action undoable edits within mergeWithinMs', () => {
    let t = 0;
    const view = createMemoryStore<S>(initial());
    const log = createOperationLog<S>({ view, classify, mergeWithinMs: 600, now: () => t });
    for (const size of [2, 3, 4]) {
      t += 100;
      view.update((d) => {
        d.definition.size = size;
      }, 'edit:size');
    }
    expect(log.entries()).toHaveLength(1);
    log.undo();
    expect(view.getState().definition.size).toBe(1);
  });
});
