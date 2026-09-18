import { describe, expect, it } from 'vitest';

import { GraphStore } from '../../src/store';

/**
 * `hasPosition` — the store's answer to "has anyone ever placed this node?".
 *
 * `getPosition` cannot answer it: `x` / `y` are typed-array columns, so a node
 * nobody has placed reads back as `(0, 0)`, exactly like a node deliberately put
 * at the origin. A one-shot layout uses the distinction to decide whether to
 * glide a node into place or snap it there — without it, every node of a fresh
 * graph glided out from the origin. See
 * `docs/rfcs/fix/2026-09-17-auto-fit-frames-the-graph-before-the-layout-runs.md`
 * rows F6 / F7.
 */
describe('GraphStore — placement', () => {
  it('reports a node inserted without a position as unplaced, at the origin', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a' });

    expect(store.hasPosition('a')).toBe(false);
    // The ambiguity this flag exists to resolve: the column still reads (0, 0).
    expect(store.getPosition('a')).toEqual({ x: 0, y: 0 });
  });

  it('treats an explicit origin position as placed', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a', position: { x: 0, y: 0 } });

    expect(store.hasPosition('a')).toBe(true);
  });

  it('marks a node placed on setPosition', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a' });
    store.setPosition('a', { x: 5, y: 6 });

    expect(store.hasPosition('a')).toBe(true);
  });

  it('marks nodes placed on setPositionsBulk, including the silent fast path', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a' });
    store.addNode({ type: 'task', id: 'b' });
    store.setPositionsBulk(['a', 'b'], new Float32Array([1, 2, 3, 4]), { silent: true });

    expect(store.hasPosition('a')).toBe(true);
    expect(store.hasPosition('b')).toBe(true);
  });

  it('marks a node placed on updateNode with a position patch', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a' });
    store.updateNode('a', { position: { x: 9, y: 9 } });

    expect(store.hasPosition('a')).toBe(true);
  });

  it('leaves a node unplaced when updateNode carries no position', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a' });
    store.updateNode('a', { data: { touched: true } });

    expect(store.hasPosition('a')).toBe(false);
  });

  it('carries the flag across compact(), which rebuilds every column', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a', position: { x: 4, y: 4 } });
    store.addNode({ type: 'task', id: 'b' });
    store.addNode({ type: 'task', id: 'gone' });
    store.removeNode('gone');
    store.compact();

    expect(store.hasPosition('a')).toBe(true);
    expect(store.getPosition('a')).toEqual({ x: 4, y: 4 });
    expect(store.hasPosition('b')).toBe(false);
  });

  it('reports an unknown id as unplaced rather than throwing', () => {
    const store = new GraphStore();

    expect(store.hasPosition('nope')).toBe(false);
  });

  it('forgets placement when a node is removed and re-added without one', () => {
    const store = new GraphStore();
    store.addNode({ type: 'task', id: 'a', position: { x: 7, y: 7 } });
    store.removeNode('a');
    store.addNode({ type: 'task', id: 'a' });

    expect(store.hasPosition('a')).toBe(false);
  });
});
