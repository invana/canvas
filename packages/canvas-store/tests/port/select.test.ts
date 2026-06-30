import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { select } from '../../src/port/select';

interface S {
  a: number;
  b: number;
}

describe('select', () => {
  it('reads the slice', () => {
    const store = createMemoryStore<S>({ a: 1, b: 2 });
    const a = select(store, (s) => s.a);
    expect(a.get()).toBe(1);
  });

  it('notifies only when the selected slice changes', () => {
    const store = createMemoryStore<S>({ a: 1, b: 2 });
    const a = select(store, (s) => s.a);
    let wakes = 0;
    a.subscribe(() => wakes++);

    store.update((d) => {
      d.b = 99;
    }); // unrelated slice → no wake
    expect(wakes).toBe(0);

    store.update((d) => {
      d.a = 2;
    }); // selected slice → wake
    expect(wakes).toBe(1);
    expect(a.get()).toBe(2);
  });
});
