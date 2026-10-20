import { describe, expect, it } from 'vitest';
import { GraphStore } from '../../src/store/GraphStore';
import { adoptBackendIds, unsavedToEditOps } from '../../src/behaviours/unsavedEdits';
import type { UnsavedChangesBehaviour } from '../../src/behaviours/UnsavedChangesBehaviour';

/** A tracker reporting a fixed net change. */
function tracker(change: {
  added?: { nodes?: unknown[]; edges?: unknown[] };
  updated?: { nodes?: { id: string }[]; edges?: { id: string }[] };
  deleted?: { nodes?: { id: string; type: string }[]; edges?: { id: string; type: string }[] };
  before?: Record<string, Record<string, unknown>>;
}): UnsavedChangesBehaviour {
  return {
    changes: () => ({ added: change.added ?? {}, updated: change.updated ?? {} }),
    current: {
      count: 0,
      nodes: { new: [], edited: [], deleted: change.deleted?.nodes ?? [] },
      edges: { new: [], edited: [], deleted: change.deleted?.edges ?? [] },
    },
    before: (_kind: string, id: string) => change.before?.[id],
  } as unknown as UnsavedChangesBehaviour;
}

describe('unsavedToEditOps', () => {
  it('orders deletes, then nodes before the relationships naming them, then updates', () => {
    const store = new GraphStore();
    store.addData({
      nodes: [{ id: 'a', type: 'Airline', data: { name: 'Qantas', _inv_run: 'r1' } }],
      edges: [],
    });
    const ops = unsavedToEditOps(
      tracker({
        added: {
          nodes: [{ id: 'new-1', type: 'Airport', data: { iata: 'SYD', blank: '' } }],
          edges: [{ id: 'new-2', type: 'HUB', source: 'a', target: 'new-1' }],
        },
        updated: { nodes: [{ id: 'a' }] },
        deleted: { edges: [{ id: 'e9', type: 'OLD' }] },
        before: { a: { data: { name: 'QF', _inv_run: 'r1' } } },
      }),
      store,
      { hidden: (k) => k.startsWith('_inv_') },
    );
    expect(ops.map((o) => o.op)).toEqual(['delete_edge', 'add_node', 'add_edge', 'update_node']);
    expect(ops[1]).toMatchObject({ ref: 'new-1', properties: { iata: 'SYD' } });
    expect(ops[3]).toMatchObject({ id: 'a', set: { name: 'Qantas' }, unset: [] });
  });

  it('sends a changed relationship type as delete + add', () => {
    const store = new GraphStore();
    store.addData({
      nodes: [{ id: 'a', type: 'T' }, { id: 'b', type: 'T' }],
      edges: [{ id: 'e', type: 'NEW', source: 'a', target: 'b' }],
    });
    const ops = unsavedToEditOps(tracker({ updated: { edges: [{ id: 'e' }] }, before: { e: { type: 'OLD' } } }), store);
    expect(ops).toMatchObject([
      { op: 'delete_edge', id: 'e', type: 'OLD' },
      { op: 'add_edge', ref: 'e', type: 'NEW', source: 'a', target: 'b' },
    ]);
  });
});

describe('adoptBackendIds', () => {
  it('re-ids a new node and the relationship that names it', () => {
    const store = new GraphStore();
    store.addData({
      nodes: [{ id: 'a', type: 'T' }, { id: 'new-1', type: 'T' }],
      edges: [{ id: 'new-2', type: 'R', source: 'a', target: 'new-1' }],
    });
    adoptBackendIds(store, { 'new-1': '4:x:1', 'new-2': '5:x:2' });
    store.flush();
    expect(store.getNode('4:x:1')).toBeDefined();
    expect(store.getNode('new-1')).toBeUndefined();
    expect(store.getEdge('5:x:2')).toMatchObject({ source: 'a', target: '4:x:1' });
  });
});
