import { describe, expect, it, vi } from 'vitest';

import { GraphStore } from '../../src/store';
import type { GraphStoreEventMap } from '../../src/store';

describe('GraphStore — CRUD', () => {
  it('adds and reads a node with all fields', () => {
    const store = new GraphStore();
    store.addNode({
      id: 'a',
      data: { kind: 'vessel' },
      position: { x: 10, y: 20 },
      pinned: true,
    });
    const node = store.getNode<{ kind: string }>('a');
    expect(node).toBeDefined();
    expect(node?.id).toBe('a');
    expect(node?.data?.kind).toBe('vessel');
    expect(node?.position).toEqual({ x: 10, y: 20 });
    expect(node?.pinned).toBe(true);
  });

  it('throws on duplicate addNode', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a' });
    expect(() => store.addNode({ id: 'a' })).toThrow(/duplicate/);
  });

  it('upsertNode adds if absent, merges if present', () => {
    const store = new GraphStore();
    store.upsertNode({ id: 'a', data: { count: 1 } });
    store.upsertNode({ id: 'a', data: { count: 2 } });
    expect(store.getNode<{ count: number }>('a')?.data?.count).toBe(2);
  });

  it('updateNode applies a partial patch', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a', position: { x: 1, y: 1 } });
    store.updateNode('a', { position: { x: 5, y: 5 } });
    expect(store.getPosition('a')).toEqual({ x: 5, y: 5 });
  });

  it('removeNode cascades incident edges by default', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    store.addEdgesBulk([
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'bc', source: 'b', target: 'c' },
    ]);
    store.removeNode('b');
    expect(store.hasNode('b')).toBe(false);
    expect(store.hasEdge('ab')).toBe(false);
    expect(store.hasEdge('bc')).toBe(false);
  });

  it('removeNode with cascade:false throws when edges still exist', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }]);
    store.addEdge({ id: 'ab', source: 'a', target: 'b' });
    expect(() => store.removeNode('a', { cascade: false })).toThrow(/incident edges/);
    expect(store.hasNode('a')).toBe(true);
  });
});

describe('GraphStore — referential integrity', () => {
  it('throws on edge with unknown endpoint by default', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a' });
    expect(() => store.addEdge({ id: 'x', source: 'a', target: 'missing' })).toThrow(
      /unknown endpoint/,
    );
  });

  it('drops the edge under unknownEndpoint:"drop"', () => {
    const store = new GraphStore({ unknownEndpoint: 'drop' });
    store.addNode({ id: 'a' });
    store.addEdge({ id: 'x', source: 'a', target: 'missing' });
    expect(store.hasEdge('x')).toBe(false);
    expect(store.edgeCount()).toBe(0);
  });

  it('buffers and admits the edge under unknownEndpoint:"buffer"', () => {
    const store = new GraphStore({ unknownEndpoint: 'buffer' });
    store.addNode({ id: 'a' });
    store.addEdge({ id: 'x', source: 'a', target: 'b' });
    expect(store.hasEdge('x')).toBe(false);
    store.addNode({ id: 'b' });
    expect(store.hasEdge('x')).toBe(true);
    expect(store.edgeCount()).toBe(1);
  });

  it('buffers and admits the edge when both endpoints arrive after the edge', () => {
    const store = new GraphStore({ unknownEndpoint: 'buffer' });
    store.addEdge({ id: 'x', source: 'a', target: 'b' });
    store.addNode({ id: 'a' });
    expect(store.hasEdge('x')).toBe(false); // still missing b
    store.addNode({ id: 'b' });
    expect(store.hasEdge('x')).toBe(true);
  });
});

describe('GraphStore — adjacency', () => {
  it('reports in/out degrees correctly', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    store.addEdgesBulk([
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ac', source: 'a', target: 'c' },
      { id: 'cb', source: 'c', target: 'b' },
    ]);
    expect(store.outDegree('a')).toBe(2);
    expect(store.inDegree('a')).toBe(0);
    expect(store.outDegree('b')).toBe(0);
    expect(store.inDegree('b')).toBe(2);
    expect(store.outDegree('c')).toBe(1);
    expect(store.inDegree('c')).toBe(1);
  });

  it('iterates edgesOf in the requested direction', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    store.addEdgesBulk([
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ca', source: 'c', target: 'a' },
    ]);
    const out = [...store.edgesOf('a', 'out')].map((e) => e.id);
    const inE = [...store.edgesOf('a', 'in')].map((e) => e.id);
    const both = [...store.edgesOf('a', 'both')].map((e) => e.id);
    expect(out).toEqual(['ab']);
    expect(inE).toEqual(['ca']);
    expect(both.sort()).toEqual(['ab', 'ca']);
  });

  it('iterates neighborsOf correctly', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    store.addEdgesBulk([
      { id: 'ab', source: 'a', target: 'b' },
      { id: 'ca', source: 'c', target: 'a' },
    ]);
    expect([...store.neighborsOf('a', 'out')]).toEqual(['b']);
    expect([...store.neighborsOf('a', 'in')]).toEqual(['c']);
    expect([...store.neighborsOf('a', 'both')].sort()).toEqual(['b', 'c']);
  });

  it('supports multi-edges between the same pair', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }]);
    store.addEdge({ id: 'ab-1', source: 'a', target: 'b', type: 'calls' });
    store.addEdge({ id: 'ab-2', source: 'a', target: 'b', type: 'imports' });
    expect(store.outDegree('a')).toBe(2);
    const ids = [...store.edgesOf('a', 'out')].map((e) => e.id).sort();
    expect(ids).toEqual(['ab-1', 'ab-2']);
  });

  it('rewires adjacency on updateEdge endpoint change', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    store.addEdge({ id: 'e', source: 'a', target: 'b' });
    store.updateEdge('e', { target: 'c' });
    expect(store.outDegree('a')).toBe(1);
    expect(store.inDegree('b')).toBe(0);
    expect(store.inDegree('c')).toBe(1);
    expect([...store.neighborsOf('a', 'out')]).toEqual(['c']);
  });
});

describe('GraphStore — parent/child', () => {
  it('indexes parent → children and supports descendants/ancestors', () => {
    const store = new GraphStore();
    store.addNode({ id: 'root' });
    store.addNode({ id: 'a', parentId: 'root' });
    store.addNode({ id: 'b', parentId: 'root' });
    store.addNode({ id: 'a1', parentId: 'a' });
    store.addNode({ id: 'a2', parentId: 'a' });

    expect([...store.childrenOf('root')].sort()).toEqual(['a', 'b']);
    expect([...store.descendantsOf('root')].sort()).toEqual(['a', 'a1', 'a2', 'b']);
    expect([...store.ancestorsOf('a1')]).toEqual(['a', 'root']);
    expect(store.parentOf('a1')).toBe('a');
  });

  it('rejects parentId cycles on updateNode', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a' });
    store.addNode({ id: 'b', parentId: 'a' });
    store.addNode({ id: 'c', parentId: 'b' });
    expect(() => store.updateNode('a', { parentId: 'c' })).toThrow(/cycle/);
  });

  it('rejects self-parent', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a' });
    expect(() => store.updateNode('a', { parentId: 'a' })).toThrow(/cycle/);
  });

  it('orphans direct children when a parent is removed', () => {
    const store = new GraphStore();
    store.addNode({ id: 'root' });
    store.addNode({ id: 'a', parentId: 'root' });
    store.addNode({ id: 'a1', parentId: 'a' });
    store.removeNode('a');
    expect(store.hasNode('a1')).toBe(true);
    expect(store.parentOf('a1')).toBeUndefined();
  });
});

describe('GraphStore — positions', () => {
  it('setPosition default fires node:update', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a', position: { x: 0, y: 0 } });
    const cb = vi.fn();
    store.events.on('node:update', cb);
    store.setPosition('a', { x: 1, y: 2 });
    expect(cb).toHaveBeenCalledTimes(1);
    expect(store.getPosition('a')).toEqual({ x: 1, y: 2 });
  });

  it('setPosition silent does not fire node:update but bumps version', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a', position: { x: 0, y: 0 } });
    const cb = vi.fn();
    store.events.on('node:update', cb);
    const v1 = store.version;
    store.setPosition('a', { x: 1, y: 2 }, { silent: true });
    expect(cb).not.toHaveBeenCalled();
    expect(store.version).toBeGreaterThan(v1);
    expect(store.getPosition('a')).toEqual({ x: 1, y: 2 });
  });

  it('setPositionsBulk writes many positions in one call', () => {
    const store = new GraphStore();
    store.addNodesBulk([
      { id: 'a', position: { x: 0, y: 0 } },
      { id: 'b', position: { x: 0, y: 0 } },
      { id: 'c', position: { x: 0, y: 0 } },
    ]);
    const xy = new Float32Array([10, 20, 30, 40, 50, 60]);
    store.setPositionsBulk(['a', 'b', 'c'], xy, { silent: true });
    expect(store.getPosition('a')).toEqual({ x: 10, y: 20 });
    expect(store.getPosition('b')).toEqual({ x: 30, y: 40 });
    expect(store.getPosition('c')).toEqual({ x: 50, y: 60 });
  });

  it('setPositionsBulk validates xy length', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a' });
    expect(() =>
      store.setPositionsBulk(['a'], new Float32Array([1, 2, 3]), { silent: true }),
    ).toThrow(/xy.length/);
  });

  it('setPinned + isPinned + pinnedIds round-trip', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }, { id: 'c', pinned: true }]);
    store.setPinned('a', true);
    expect(store.isPinned('a')).toBe(true);
    expect(store.isPinned('b')).toBe(false);
    expect(store.isPinned('c')).toBe(true);
    expect([...store.pinnedIds()].sort()).toEqual(['a', 'c']);
  });
});

describe('GraphStore — batch / events / flush', () => {
  it('batch coalesces N adds into one flush', () => {
    const store = new GraphStore();
    const flushCb = vi.fn();
    store.events.on('flush', flushCb);
    store.batch(() => {
      store.addNode({ id: 'a' });
      store.addNode({ id: 'b' });
      store.addNode({ id: 'c' });
    });
    expect(flushCb).toHaveBeenCalledTimes(1);
    expect(flushCb.mock.calls[0]![0]).toMatchObject({ addedNodes: 3 });
  });

  it('batch dedupes node:update for the same id', () => {
    const store = new GraphStore();
    store.addNode({ id: 'a' });
    const cb = vi.fn();
    store.events.on('node:update', cb);
    store.batch(() => {
      store.updateNode('a', { data: 1 });
      store.updateNode('a', { data: 2 });
      store.updateNode('a', { data: 3 });
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('add+remove of the same id within a batch nets to zero events', () => {
    const store = new GraphStore();
    const addCb = vi.fn();
    const removeCb = vi.fn();
    store.events.on('node:add', addCb);
    store.events.on('node:remove', removeCb);
    store.batch(() => {
      store.addNode({ id: 'a' });
      store.removeNode('a');
    });
    expect(addCb).not.toHaveBeenCalled();
    expect(removeCb).not.toHaveBeenCalled();
  });

  it('nested batch() flushes only at outermost exit', () => {
    const store = new GraphStore();
    const flushCb = vi.fn();
    store.events.on('flush', flushCb);
    store.batch(() => {
      store.addNode({ id: 'a' });
      store.batch(() => {
        store.addNode({ id: 'b' });
      });
      expect(flushCb).not.toHaveBeenCalled();
      store.addNode({ id: 'c' });
    });
    expect(flushCb).toHaveBeenCalledTimes(1);
    expect(flushCb.mock.calls[0]![0]).toMatchObject({ addedNodes: 3 });
  });

  it('sync flushMode fires events immediately', () => {
    const store = new GraphStore({ flushMode: 'sync' });
    const cb = vi.fn();
    store.events.on('node:add', cb);
    store.addNode({ id: 'a' });
    expect(cb).toHaveBeenCalledTimes(1);
  });

  it('frame flushMode coalesces synchronous bursts', async () => {
    const store = new GraphStore({ flushMode: 'frame' });
    const flushCb = vi.fn<(p: GraphStoreEventMap['flush']) => void>();
    store.events.on('flush', flushCb);
    for (let i = 0; i < 100; i++) store.addNode({ id: `n${i}` });
    // Nothing has flushed yet (RAF deferred).
    expect(flushCb).not.toHaveBeenCalled();
    store.flush();
    expect(flushCb).toHaveBeenCalledTimes(1);
    expect(flushCb.mock.calls[0]![0].addedNodes).toBe(100);
  });
});

describe('GraphStore — upsert in streaming mode', () => {
  it('upsertEdge adds when absent and updates when present', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }]);
    store.upsertEdge({ id: 'e', source: 'a', target: 'b', type: 'first' });
    store.upsertEdge({ id: 'e', source: 'a', target: 'b', type: 'second' });
    expect(store.edgeCount()).toBe(1);
    expect(store.getEdge('e')?.type).toBe('second');
  });
});

describe('GraphStore — clear and compact', () => {
  it('clear wipes everything', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'a' }, { id: 'b' }]);
    store.addEdge({ id: 'ab', source: 'a', target: 'b' });
    store.clear();
    expect(store.nodeCount()).toBe(0);
    expect(store.edgeCount()).toBe(0);
    expect(store.hasNode('a')).toBe(false);
  });

  it('compact preserves data through a rebuild', () => {
    const store = new GraphStore();
    store.addNodesBulk([
      { id: 'a', position: { x: 1, y: 2 }, pinned: true },
      { id: 'b' },
      { id: 'c' },
    ]);
    store.addEdge({ id: 'ab', source: 'a', target: 'b' });
    store.removeNode('c');
    store.compact();
    expect(store.nodeCount()).toBe(2);
    expect(store.edgeCount()).toBe(1);
    expect(store.getPosition('a')).toEqual({ x: 1, y: 2 });
    expect(store.isPinned('a')).toBe(true);
    expect(store.outDegree('a')).toBe(1);
  });
});

describe('GraphStore — pending edge TTL', () => {
  it('emits edge:orphaned after TTL for buffered edges whose endpoints never arrive', () => {
    const store = new GraphStore({
      unknownEndpoint: 'buffer',
      pendingEdgeTTL: 0,
      flushMode: 'frame',
    });
    const orphanCb = vi.fn();
    store.events.on('edge:orphaned', orphanCb);
    store.addEdge({ id: 'x', source: 'a', target: 'b' });
    expect(store.hasEdge('x')).toBe(false);
    // Manually drive a flush — pending TTL is 0 so it should expire immediately.
    store.flush();
    expect(orphanCb).toHaveBeenCalledWith({ edgeId: 'x' });
  });
});
