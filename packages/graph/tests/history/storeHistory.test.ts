/**
 * A graph store's recorded writes undo and redo through the operation log —
 * the control for RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`
 * V3 once `GraphHistory` was removed: a labelled `batch` is one entry, group
 * membership survives undo, and entries carry their label and time.
 */
import { describe, expect, it } from 'vitest';
import { createOperationLog } from '@invana/canvas';

import { GraphStore } from '../../src/store';

/** A group `g` holding `a` + `b`, loaded group-first (the order datasets use), on a fresh log. */
function groupedStore() {
  const store = new GraphStore();
  store.addNode({ type: 'model', id: 'g' });
  store.addNode({ type: 'node', id: 'a', parentId: 'g' });
  store.addNode({ type: 'node', id: 'b', parentId: 'g' });
  store.addNode({ type: 'node', id: 'x' });
  store.addEdge({ type: 'edge', id: 'e1', source: 'a', target: 'x' });
  const log = createOperationLog();
  store.attachLog(log, 'graph');
  return { store, log };
}

describe('store history — group membership', () => {
  it('undo of removing every node (group before its members) restores membership', () => {
    const { store, log } = groupedStore();
    const ids = [...store.nodes()].map((n) => n.id);
    store.batch(() => {
      for (const id of ids) store.removeNode(id);
    }, { title: 'clear' });
    expect([...store.nodes()]).toHaveLength(0);
    expect(log.entries()).toHaveLength(1);

    log.undo();
    expect(store.parentOf('a')).toBe('g');
    expect(store.parentOf('b')).toBe('g');
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
    expect(store.hasEdge('e1')).toBe(true);

    log.redo();
    expect([...store.nodes()]).toHaveLength(0);
    log.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
  });

  it('undo of removing only the group re-links its surviving members', () => {
    const { store, log } = groupedStore();
    store.removeNode('g');
    expect(store.parentOf('a')).toBeUndefined();

    log.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);

    log.redo();
    expect(store.hasNode('g')).toBe(false);
    expect(store.parentOf('a')).toBeUndefined();
  });

  it('control: undo of removing a member (group kept) restores it into the group', () => {
    const { store, log } = groupedStore();
    store.removeNode('a');
    log.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
    expect(store.hasEdge('e1')).toBe(true);
  });
});

describe('store history — labels + timestamps', () => {
  it('a labelled batch or delta is one entry; peek reports the label and time; redo re-stamps', () => {
    const { store, log } = groupedStore();
    expect(log.peekUndo()).toBeUndefined();

    store.applyDelta({ added: { nodes: [{ type: 'node', id: 'n' }] } }, { title: 'add n', actor: 'assistant' });
    const first = log.peekUndo();
    expect(first).toMatchObject({ title: 'add n', actor: 'assistant' });
    expect(typeof first?.at).toBe('number');

    log.undo();
    expect(log.peekUndo()).toBeUndefined();
    expect(log.peekRedo()).toEqual(first);

    log.redo();
    expect(log.peekUndo()!.at).toBeGreaterThanOrEqual(first!.at);
    expect(log.peekRedo()).toBeUndefined();
  });

  it('a labelled batch that throws writes nothing', () => {
    const { store, log } = groupedStore();
    expect(() =>
      store.batch(() => {
        store.removeNode('x');
        throw new Error('boom');
      }, { title: 'fails' }),
    ).toThrow('boom');
    expect(store.hasNode('x')).toBe(true);
    expect(store.hasEdge('e1')).toBe(true);
    expect(log.entries()).toHaveLength(0);
  });
});
