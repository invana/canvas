import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { createHistory } from '../../src/port/createHistory';

interface S {
  count: number;
  nested: { a: number };
}

describe('createHistory', () => {
  it('undo restores, redo re-applies', () => {
    const store = createMemoryStore<S>({ count: 0, nested: { a: 1 } });
    const history = createHistory(store);

    store.update((d) => {
      d.count = 5;
    }, 'set-5');
    store.update((d) => {
      d.count = 9;
    }, 'set-9');
    expect(store.getState().count).toBe(9);

    history.undo();
    expect(store.getState().count).toBe(5);
    history.undo();
    expect(store.getState().count).toBe(0);
    expect(history.canUndo()).toBe(false);

    history.redo();
    expect(store.getState().count).toBe(5);
    history.redo();
    expect(store.getState().count).toBe(9);
  });

  it('a batch is one undo step', () => {
    const store = createMemoryStore<S>({ count: 0, nested: { a: 1 } });
    const history = createHistory(store);

    store.batch(() => {
      store.update((d) => {
        d.count = 1;
      });
      store.update((d) => {
        d.nested.a = 7;
      });
    }, 'batch');

    expect(store.getState()).toEqual({ count: 1, nested: { a: 7 } });
    history.undo(); // one step undoes both
    expect(store.getState()).toEqual({ count: 0, nested: { a: 1 } });
  });

  it('a fresh update clears the redo stack', () => {
    const store = createMemoryStore<S>({ count: 0, nested: { a: 1 } });
    const history = createHistory(store);
    store.update((d) => {
      d.count = 1;
    });
    history.undo();
    expect(history.canRedo()).toBe(true);
    store.update((d) => {
      d.count = 2;
    });
    expect(history.canRedo()).toBe(false);
  });
});

describe('createHistory — scoping, merging, observing', () => {
  const make = () => createMemoryStore<S>({ count: 0, nested: { a: 1 } });

  it('filter keeps unmatched changes off the stack', () => {
    const store = make();
    const history = createHistory(store, { filter: (c) => c.action?.startsWith('edit:') ?? false });
    store.update((d) => {
      d.count = 1;
    }, 'camera');
    store.update((d) => {
      d.count = 2;
    }, 'edit:count');
    history.undo();
    expect(store.getState().count).toBe(1);
    expect(history.canUndo()).toBe(false);
  });

  it('patchFilter strips patches outside the kept paths', () => {
    const store = make();
    const history = createHistory(store, { patchFilter: (p) => p.path[0] === 'nested' });
    store.update((d) => {
      d.count = 7;
      d.nested.a = 2;
    }, 'both');
    store.update((d) => {
      d.count = 8;
    }, 'count-only'); // no kept patches → not recorded
    history.undo();
    expect(store.getState()).toEqual({ count: 8, nested: { a: 1 } });
    expect(history.canUndo()).toBe(false);
  });

  it('merges same-action changes inside the window into one step', () => {
    let t = 0;
    const store = make();
    const history = createHistory(store, { mergeWithinMs: 100, now: () => t });
    for (const n of [1, 2, 3]) {
      t += 50;
      store.update((d) => {
        d.count = n;
      }, 'edit:count');
    }
    t += 500;
    store.update((d) => {
      d.count = 4;
    }, 'edit:count');
    history.undo();
    expect(store.getState().count).toBe(3);
    history.undo();
    expect(store.getState().count).toBe(0);
    history.redo();
    expect(store.getState().count).toBe(3);
  });

  it('peek reports action + time; subscribe hears every stack change', () => {
    let t = 10;
    const store = make();
    const history = createHistory(store, { now: () => t });
    let heard = 0;
    history.subscribe(() => heard++);
    store.update((d) => {
      d.count = 1;
    }, 'edit:a');
    expect(history.peekUndo()).toEqual({ action: 'edit:a', at: 10 });
    t = 20;
    history.undo();
    expect(history.peekUndo()).toBeUndefined();
    expect(history.peekRedo()).toEqual({ action: 'edit:a', at: 10 });
    history.redo();
    expect(history.peekUndo()?.at).toBe(20);
    history.clear();
    expect(heard).toBe(4);
  });
});
