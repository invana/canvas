import { describe, expect, it } from 'vitest';

import { GraphHistory } from '../../src/history';
import { GraphStore } from '../../src/store';

/** A group `g` holding `a` + `b`, loaded group-first (the order datasets use). */
function groupedStore(): GraphStore {
  const store = new GraphStore();
  store.addNode({ type: 'model', id: 'g' });
  store.addNode({ type: 'node', id: 'a', parentId: 'g' });
  store.addNode({ type: 'node', id: 'b', parentId: 'g' });
  store.addNode({ type: 'node', id: 'x' });
  store.addEdge({ type: 'edge', id: 'e1', source: 'a', target: 'x' });
  return store;
}

describe('GraphHistory — group membership', () => {
  it('undo of a clear (group removed before its members) restores membership', () => {
    const store = groupedStore();
    const history = new GraphHistory(store);
    const ids = [...store.nodes()].map((n) => n.id);
    history.transaction('clear', (rec) => {
      for (const id of ids) rec.removeNode(id);
    });
    expect([...store.nodes()]).toHaveLength(0);

    history.undo();
    expect(store.parentOf('a')).toBe('g');
    expect(store.parentOf('b')).toBe('g');
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
    expect(store.hasEdge('e1')).toBe(true);

    history.redo();
    expect([...store.nodes()]).toHaveLength(0);
    history.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
  });

  it('undo of removing only the group re-links its surviving members', () => {
    const store = groupedStore();
    const history = new GraphHistory(store);
    history.transaction('delete group', (rec) => rec.removeNode('g'));
    expect(store.parentOf('a')).toBeUndefined();

    history.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);

    history.redo();
    expect(store.hasNode('g')).toBe(false);
    expect(store.parentOf('a')).toBeUndefined();
  });

  it('control: undo of removing a member (group kept) restores it into the group', () => {
    const store = groupedStore();
    const history = new GraphHistory(store);
    history.transaction('delete member', (rec) => rec.removeNode('a'));
    history.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
    expect(store.hasEdge('e1')).toBe(true);
  });
});
