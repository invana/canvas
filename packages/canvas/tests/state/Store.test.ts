import { describe, expect, it, vi } from 'vitest';
import { createLayerStore } from '../../src/state/Store';

type State = {
  hoveredId: string | null;
  selectedIds: Set<string>;
  haloStyles: Map<string, { color: number }>;
  count: number;
};

const initial: State = {
  hoveredId: null,
  selectedIds: new Set(),
  haloStyles: new Map(),
  count: 0,
};

describe('createLayerStore', () => {
  it('returns initial state', () => {
    const store = createLayerStore<State>(initial);
    expect(store.getState()).toEqual(initial);
  });

  it('immer-style mutation produces a new state with structural sharing', () => {
    const store = createLayerStore<State>(initial);
    const before = store.getState();

    store.setState((s) => {
      s.hoveredId = 'n-42';
    });

    const after = store.getState();
    expect(after).not.toBe(before); // top-level changed
    expect(after.hoveredId).toBe('n-42');
    // Untouched branches are kept by reference (structural sharing).
    expect(after.selectedIds).toBe(before.selectedIds);
    expect(after.haloStyles).toBe(before.haloStyles);
  });

  it('immer supports Map mutations after enableMapSet()', () => {
    const store = createLayerStore<State>(initial);
    store.setState((s) => {
      s.haloStyles.set('n-1', { color: 0xff0000 });
    });
    expect(store.getState().haloStyles.get('n-1')).toEqual({ color: 0xff0000 });
  });

  it('immer supports Set mutations after enableMapSet()', () => {
    const store = createLayerStore<State>(initial);
    store.setState((s) => {
      s.selectedIds.add('n-1');
      s.selectedIds.add('n-2');
    });
    expect([...store.getState().selectedIds]).toEqual(['n-1', 'n-2']);
  });

  it('subscribe(listener) fires on every change', () => {
    const store = createLayerStore<State>(initial);
    const listener = vi.fn();
    store.subscribe(listener);

    store.setState((s) => {
      s.count = 1;
    });
    store.setState((s) => {
      s.count = 2;
    });

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('subscribeWithSelector subscribes to a slice with custom equality', () => {
    const store = createLayerStore<State>(initial);
    const listener = vi.fn();

    // Should fire only when count changes, not when hoveredId changes.
    const off = store.subscribe(
      (s) => s.count,
      (curr, prev) => listener(curr, prev),
    );

    store.setState((s) => {
      s.hoveredId = 'a';
    });
    expect(listener).not.toHaveBeenCalled();

    store.setState((s) => {
      s.count = 1;
    });
    expect(listener).toHaveBeenCalledWith(1, 0);

    off();
    store.setState((s) => {
      s.count = 2;
    });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('high-frequency mutations stay below 1ms each', () => {
    const store = createLayerStore<State>(initial);
    const N = 10_000;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) {
      store.setState((s) => {
        s.count = i;
      });
    }
    const ms = performance.now() - t0;
    // 10k mutations should run well under 1 second total.
    // This is a smoke test, not a strict perf assertion.
    expect(ms).toBeLessThan(1000);
    expect(store.getState().count).toBe(N - 1);
  });
});
