import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { createHistory } from '../../src/history/createHistory';

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
