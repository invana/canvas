import { describe, expect, it, vi } from 'vitest';

import { GraphStore } from '../../src/store';

/** A small triangle a-b-c with edges ab, bc, ca. */
function triangle(): GraphStore {
  const store = new GraphStore();
  store.addNodesBulk([{ type: 'node', id: 'a' }, { type: 'node', id: 'b' }, { type: 'node', id: 'c' }]);
  store.addEdgesBulk([
    { type: 'edge', id: 'ab', source: 'a', target: 'b' },
    { type: 'edge', id: 'bc', source: 'b', target: 'c' },
    { type: 'edge', id: 'ca', source: 'c', target: 'a' },
  ]);
  return store;
}

describe('GraphStore — visibility: single hide/show', () => {
  it('hideNode sets the explicit flag; showNode clears it', () => {
    const store = triangle();
    expect(store.isNodeHidden('a')).toBe(false);
    expect(store.isNodeVisible('a')).toBe(true);

    store.hideNode('a');
    expect(store.isNodeHidden('a')).toBe(true);
    expect(store.isNodeVisible('a')).toBe(false);

    store.showNode('a');
    expect(store.isNodeHidden('a')).toBe(false);
    expect(store.isNodeVisible('a')).toBe(true);
  });

  it('toggleNodeHidden returns the resulting state', () => {
    const store = triangle();
    expect(store.toggleNodeHidden('a')).toBe(true);
    expect(store.toggleNodeHidden('a')).toBe(false);
  });

  it('getNode / nodes() reconstruct the hidden flag', () => {
    const store = triangle();
    store.hideNode('a');
    expect(store.getNode('a')?.hidden).toBe(true);
    expect(store.getNode('b')?.hidden).toBe(false);
    const byId = new Map([...store.nodes()].map((n) => [n.id, n.hidden]));
    expect(byId.get('a')).toBe(true);
    expect(byId.get('b')).toBe(false);
  });

  it('accepts hidden on addNode and reconstructs it', () => {
    const store = new GraphStore();
    store.addNode({ type: 'node', id: 'x', hidden: true });
    expect(store.isNodeHidden('x')).toBe(true);
    expect(store.getNode('x')?.hidden).toBe(true);
  });

  it('is idempotent — hiding an already-hidden node is a no-op', () => {
    const store = triangle();
    const seen: boolean[] = [];
    store.events.on('node:visibility', ({ hidden }) => seen.push(hidden));
    store.hideNode('a');
    store.hideNode('a');
    expect(seen).toEqual([true]);
  });

  it('unknown ids: isNodeHidden false, isNodeVisible false', () => {
    const store = new GraphStore();
    expect(store.isNodeHidden('nope')).toBe(false);
    expect(store.isNodeVisible('nope')).toBe(false);
  });
});

describe('GraphStore — visibility: effective (incident-edge cascade)', () => {
  it('an edge is effectively hidden when either endpoint is hidden', () => {
    const store = triangle();
    expect(store.isEdgeVisible('ab')).toBe(true);
    store.hideNode('a'); // incident to ab and ca
    expect(store.isEdgeVisible('ab')).toBe(false);
    expect(store.isEdgeVisible('ca')).toBe(false);
    expect(store.isEdgeVisible('bc')).toBe(true); // not incident to a
  });

  it('the cascaded edge is NOT explicitly hidden', () => {
    const store = triangle();
    store.hideNode('a');
    expect(store.isEdgeVisible('ab')).toBe(false);
    expect(store.isEdgeHidden('ab')).toBe(false); // derived, not flagged
  });

  it('showing one endpoint keeps a shared edge hidden while the other stays hidden', () => {
    const store = triangle();
    store.hideNode('a');
    store.hideNode('b'); // ab now hidden by both endpoints
    store.showNode('a'); // b still hidden
    expect(store.isEdgeVisible('ab')).toBe(false);
    store.showNode('b');
    expect(store.isEdgeVisible('ab')).toBe(true);
  });

  it('an explicitly-hidden edge stays hidden when endpoints show', () => {
    const store = triangle();
    store.hideEdge('ab');
    expect(store.isEdgeVisible('ab')).toBe(false);
    store.hideNode('a');
    store.showNode('a');
    expect(store.isEdgeHidden('ab')).toBe(true);
    expect(store.isEdgeVisible('ab')).toBe(false);
  });
});

describe('GraphStore — visibility: bulk + convenience', () => {
  it('hideNodes/showNodes update every id', () => {
    const store = triangle();
    store.hideNodes(['a', 'b']);
    expect(store.hiddenNodeCount()).toBe(2);
    store.showNodes(['a', 'b']);
    expect(store.hiddenNodeCount()).toBe(0);
  });

  it('bulk hide fires exactly one flush', () => {
    const store = triangle();
    const flush = vi.fn();
    store.events.on('flush', flush);
    store.hideNodes(['a', 'b', 'c']);
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('bulk hide emits one node:visibility per id, coalesced into the flush', () => {
    const store = triangle();
    const seen: string[] = [];
    store.events.on('node:visibility', ({ nodeId, hidden }) => {
      expect(hidden).toBe(true);
      seen.push(nodeId);
    });
    store.hideNodes(['a', 'b', 'c']);
    expect(seen.sort()).toEqual(['a', 'b', 'c']);
  });

  it('hidden-then-shown in one batch nets to the final value (one event)', () => {
    const store = triangle();
    const seen: boolean[] = [];
    store.events.on('node:visibility', ({ hidden }) => seen.push(hidden));
    store.batch(() => {
      store.hideNode('a');
      store.showNode('a');
    });
    // net: no change from the pre-batch state (visible), so the flag ends false;
    // the coalesced event carries the final value.
    expect(store.isNodeHidden('a')).toBe(false);
    expect(seen).toEqual([false]);
  });

  it('hiddenNodes / hiddenEdges iterate the explicit sets', () => {
    const store = triangle();
    store.hideNode('a');
    store.hideEdge('bc');
    expect([...store.hiddenNodes()]).toEqual(['a']);
    expect([...store.hiddenEdges()]).toEqual(['bc']);
    expect(store.hiddenNodeCount()).toBe(1);
    expect(store.hiddenEdgeCount()).toBe(1);
  });

  it('showAllHidden clears every explicit flag (nodes + edges)', () => {
    const store = triangle();
    store.hideNodes(['a', 'b']);
    store.hideEdge('ca');
    store.showAllHidden();
    expect(store.hiddenNodeCount()).toBe(0);
    expect(store.hiddenEdgeCount()).toBe(0);
  });

  it('hideNodesByPredicate hides matching nodes only', () => {
    const store = new GraphStore();
    store.addNodesBulk([
      { type: 'node', id: 'a', data: { drop: true } },
      { type: 'node', id: 'b', data: { drop: false } },
    ]);
    store.hideNodesByPredicate((n) => (n.data as { drop?: boolean })?.drop === true);
    expect(store.isNodeHidden('a')).toBe(true);
    expect(store.isNodeHidden('b')).toBe(false);
  });
});

describe('GraphStore — visibility: edges', () => {
  it('hide/show/toggle/is* mirror the node API', () => {
    const store = triangle();
    expect(store.isEdgeHidden('ab')).toBe(false);
    store.hideEdge('ab');
    expect(store.isEdgeHidden('ab')).toBe(true);
    expect(store.toggleEdgeHidden('ab')).toBe(false);
    store.setEdgeHidden('ab', true);
    expect(store.isEdgeHidden('ab')).toBe(true);
  });

  it('edge:visibility fires only for explicit edge changes', () => {
    const store = triangle();
    const edgeEvents: string[] = [];
    store.events.on('edge:visibility', ({ edgeId }) => edgeEvents.push(edgeId));
    store.hideNode('a'); // cascades ab, ca effectively — but no edge:visibility
    expect(edgeEvents).toEqual([]);
    store.hideEdge('bc'); // explicit
    expect(edgeEvents).toEqual(['bc']);
  });
});

describe('GraphStore — visibility: runtime-state interplay', () => {
  it('hiding a node clears its runtime states', () => {
    const store = triangle();
    store.setNodeState('a', 'selected', true);
    store.setNodeState('a', 'hovered', true);
    expect(store.hasNodeState('a', 'selected')).toBe(true);
    store.hideNode('a');
    expect(store.hasNodeState('a', 'selected')).toBe(false);
    expect(store.hasNodeState('a', 'hovered')).toBe(false);
  });

  it('hiding an edge clears its runtime states', () => {
    const store = triangle();
    store.setEdgeState('ab', 'selected', true);
    store.hideEdge('ab');
    expect(store.hasEdgeState('ab', 'selected')).toBe(false);
  });
});

describe('GraphStore — visibility: topology stays visibility-blind', () => {
  it('neighborsOf / degree / nodes() / edges() ignore hidden', () => {
    const store = triangle();
    store.hideNode('a');
    expect([...store.neighborsOf('b')].sort()).toEqual(['a', 'c']); // a still a neighbour
    expect(store.outDegree('a') + store.inDegree('a')).toBe(2); // out ab, in ca
    expect([...store.nodes()].length).toBe(3);
    expect([...store.edges()].length).toBe(3);
  });
});

describe('GraphStore — visibility: serialization round-trip', () => {
  it('hidden node + edge flags survive an export → re-import', () => {
    const store = triangle();
    store.hideNode('a');
    store.hideEdge('bc');

    // Emulate GraphLayer.exportData(): snapshot nodes + edges (carry hidden).
    const snapshot = { nodes: [...store.nodes()], edges: [...store.edges()] };

    const restored = new GraphStore();
    restored.batch(() => {
      for (const n of snapshot.nodes) restored.addNode(n);
      for (const e of snapshot.edges) restored.addEdge(e);
    });

    expect(restored.isNodeHidden('a')).toBe(true);
    expect(restored.isNodeHidden('b')).toBe(false);
    expect(restored.isEdgeHidden('bc')).toBe(true);
    expect(restored.isEdgeHidden('ab')).toBe(false);
    expect([...restored.hiddenNodes()]).toEqual(['a']);
    expect([...restored.hiddenEdges()]).toEqual(['bc']);
  });

  it('hidden flag survives compact()', () => {
    const store = triangle();
    store.addNode({ type: 'node', id: 'd' }); // isolated node
    store.hideNode('a');
    store.hideEdge('bc');
    store.removeNode('d'); // create a tombstone without cascading a/b/c edges
    store.compact();
    expect(store.isNodeHidden('a')).toBe(true);
    expect(store.isEdgeHidden('bc')).toBe(true);
  });
});

describe('GraphStore — visibility: removal cleanup', () => {
  it('removing a hidden node drops it from the hidden index', () => {
    const store = triangle();
    store.hideNode('a');
    expect(store.hiddenNodeCount()).toBe(1);
    store.removeNode('a');
    expect(store.hiddenNodeCount()).toBe(0);
    expect([...store.hiddenNodes()]).toEqual([]);
  });
});
