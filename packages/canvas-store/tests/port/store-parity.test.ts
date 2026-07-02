import { describe, expect, it } from 'vitest';

import { createMemoryStore } from '../../src/port/createMemoryStore';
import { createReactiveStore } from '../../src/adapters/zustand/createReactiveStore';
import type { ReactiveStore } from '../../src/port/types';

interface S {
  count: number;
  nested: { a: number; b: number };
  tags: string[];
}
const init = (): S => ({ count: 0, nested: { a: 1, b: 2 }, tags: ['x'] });

// The whole point of the port: both adapters behave identically.
const factories: Record<string, (s: S) => ReactiveStore<S>> = {
  memory: createMemoryStore,
  zustand: createReactiveStore,
};

for (const [name, make] of Object.entries(factories)) {
  describe(`ReactiveStore parity — ${name}`, () => {
    it('recipe update mutates and reads back', () => {
      const s = make(init());
      s.update((d) => {
        d.count = 5;
      }, 'set-count');
      expect(s.getState().count).toBe(5);
    });

    it('deep-partial patch merges plain objects, replaces arrays', () => {
      const s = make(init());
      s.update({ nested: { a: 9 } });
      expect(s.getState().nested).toEqual({ a: 9, b: 2 });
      s.update({ tags: ['y', 'z'] });
      expect(s.getState().tags).toEqual(['y', 'z']);
    });

    it('subscribe fires once with (state, prev)', () => {
      const s = make(init());
      let calls = 0;
      let seen: { next: number; prev: number } | null = null;
      s.subscribe((st, pr) => {
        calls++;
        seen = { next: st.count, prev: pr.count };
      });
      s.update((d) => {
        d.count = 1;
      });
      expect(calls).toBe(1);
      expect(seen).toEqual({ next: 1, prev: 0 });
    });

    it('no-op update notifies nobody', () => {
      const s = make(init());
      let changes = 0;
      let states = 0;
      s.subscribeChanges(() => changes++);
      s.subscribe(() => states++);
      s.update(() => {
        /* touches nothing */
      });
      expect(changes).toBe(0);
      expect(states).toBe(0);
    });

    it('batch coalesces to one change + one state notify, read-after-write works', () => {
      const s = make(init());
      let changes = 0;
      let states = 0;
      let patchCount = 0;
      s.subscribeChanges((c) => {
        changes++;
        patchCount = c.patches.length;
      });
      s.subscribe(() => states++);
      s.batch(() => {
        s.update((d) => {
          d.count = 1;
        });
        // read-after-write inside the batch:
        expect(s.getState().count).toBe(1);
        s.update((d) => {
          d.nested.a = 7;
        });
      }, 'multi');
      expect(changes).toBe(1);
      expect(states).toBe(1);
      expect(patchCount).toBe(2);
      expect(s.getState()).toEqual({ count: 1, nested: { a: 7, b: 2 }, tags: ['x'] });
    });

    it('change carries forward + inverse patches', () => {
      const s = make(init());
      let captured: { patches: number; inverse: number } | null = null;
      s.subscribeChanges((c) => {
        captured = { patches: c.patches.length, inverse: c.inverse.length };
      });
      s.update((d) => {
        d.count = 42;
      });
      expect(captured).toEqual({ patches: 1, inverse: 1 });
    });
  });
}
