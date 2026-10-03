import { describe, expect, it } from 'vitest';

import { GraphStore } from '../../src/store';

function storeWith(points: Record<string, [number, number]>): GraphStore {
  const store = new GraphStore();
  for (const [id, [x, y]] of Object.entries(points)) {
    store.addNode({ type: 'node', id, position: { x, y } });
  }
  return store;
}

describe('GraphStore.nodeIdsWithin', () => {
  it('returns exactly the nodes inside the radius (boundary inclusive)', () => {
    const store = storeWith({ a: [0, 0], b: [3, 4], c: [6, 0], d: [-2, 1] });
    expect(store.nodeIdsWithin(0, 0, 5).sort()).toEqual(['a', 'b', 'd']);
  });

  it('excludes hidden nodes', () => {
    const store = storeWith({ a: [0, 0], b: [1, 0] });
    store.hideNode('b');
    expect(store.nodeIdsWithin(0, 0, 10)).toEqual(['a']);
  });

  it('fills and clears the supplied buffer instead of allocating', () => {
    const store = storeWith({ a: [0, 0], b: [100, 0] });
    const out = ['stale'];
    const res = store.nodeIdsWithin(100, 0, 1, out);
    expect(res).toBe(out);
    expect(out).toEqual(['b']);
  });

  it('answers nothing for a non-positive radius', () => {
    const store = storeWith({ a: [0, 0] });
    expect(store.nodeIdsWithin(0, 0, 0)).toEqual([]);
    expect(store.nodeIdsWithin(0, 0, -1)).toEqual([]);
  });

  it('follows position updates', () => {
    const store = storeWith({ a: [0, 0] });
    store.setPosition('a', { x: 50, y: 50 });
    expect(store.nodeIdsWithin(0, 0, 10)).toEqual([]);
    expect(store.nodeIdsWithin(50, 50, 1)).toEqual(['a']);
  });
});
