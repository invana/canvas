/**
 * `GraphStore.applyDelta` as the one recorded data door (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F5 / F6):
 * every public content writer is one history entry carrying an actor, a batch
 * is one entry, the existing order and skip-unknown behaviour hold, the new
 * `hidden` / `shown` / `pinned` fields invert, and derived writes
 * (`store.internal`, positions, runtime states) are not recorded.
 */
import { describe, expect, it } from 'vitest';
import { createOperationLog, type DataLogPart, type OperationLog } from '@invana/canvas';

import { GraphStore } from '../../src/store';
import type { HistoryOp } from '../../src/history/types';

function setup(): { store: GraphStore; log: OperationLog } {
  const store = new GraphStore();
  store.addNode({ id: 'a', type: 'node', position: { x: 0, y: 0 } });
  store.addNode({ id: 'b', type: 'node', position: { x: 10, y: 0 } });
  store.addNode({ id: 'c', type: 'node', position: { x: 20, y: 0 } });
  store.addEdge({ id: 'ab', type: 'edge', source: 'a', target: 'b' });
  const log = createOperationLog({ actor: () => 'session' });
  store.attachLog(log, 'graph');
  return { store, log };
}

const opsOf = (log: OperationLog): HistoryOp[][] =>
  log.entries().map((e) => e.parts.flatMap((p) => (p.kind === 'data' ? (p as DataLogPart).ops : [])) as HistoryOp[]);

const snapshot = (store: GraphStore) => ({
  nodes: [...store.nodes()].map((n) => ({ ...n })).sort((x, y) => x.id.localeCompare(y.id)),
  edges: [...store.edges()].map((e) => ({ ...e })).sort((x, y) => x.id.localeCompare(y.id)),
});

describe('V4 — every public writer is exactly one entry, with the default or given actor', () => {
  const writers: [string, (s: GraphStore) => void][] = [
    ['addNode', (s) => s.addNode({ id: 'n', type: 'node' })],
    ['upsertNode (new)', (s) => s.upsertNode({ id: 'n', type: 'node' })],
    ['upsertNode (existing)', (s) => s.upsertNode({ id: 'a', type: 'node', data: { v: 1 } })],
    ['updateNode', (s) => s.updateNode('a', { data: { v: 1 } })],
    ['removeNode (cascades)', (s) => s.removeNode('a')],
    ['addEdge', (s) => s.addEdge({ id: 'bc', type: 'edge', source: 'b', target: 'c' })],
    ['updateEdge', (s) => s.updateEdge('ab', { data: { w: 2 } })],
    ['reverseEdge', (s) => s.reverseEdge('ab')],
    ['removeEdge', (s) => s.removeEdge('ab')],
    ['setPinned', (s) => s.setPinned('a', true)],
    ['hideNode', (s) => s.hideNode('a')],
    ['toggleNodeHidden', (s) => s.toggleNodeHidden('a')],
    ['hideNodes', (s) => s.hideNodes(['a', 'b'])],
    ['setEdgesHidden', (s) => s.setEdgesHidden(['ab'], true)],
    ['hideNodesByPredicate', (s) => s.hideNodesByPredicate(() => true)],
    ['addNodesBulk', (s) => s.addNodesBulk([{ id: 'n1', type: 'node' }, { id: 'n2', type: 'node' }])],
    ['addData', (s) => s.addData({ nodes: [{ id: 'n1', type: 'node' }], edges: [{ id: 'e', type: 'edge', source: 'n1', target: 'a' }] })],
    ['applyDelta', (s) => s.applyDelta({ added: { nodes: [{ id: 'n', type: 'node' }] }, removed: { nodeIds: ['c'] } })],
    ['clear', (s) => s.clear()],
  ];

  for (const [name, write] of writers) {
    it(`${name}: one entry, attributed to the session actor, that undoes and redoes`, () => {
      const { store, log } = setup();
      const before = snapshot(store);
      write(store);
      const after = snapshot(store);
      expect(log.entries()).toHaveLength(1);
      expect(log.entries()[0]!.actor).toBe('session');

      log.undo();
      expect(snapshot(store)).toEqual(before);
      log.redo();
      expect(snapshot(store)).toEqual(after);
    });
  }

  it('applyDelta names its own actor', () => {
    const { store, log } = setup();
    store.applyDelta({ updated: { nodes: [{ id: 'a', patch: { data: { flag: 'suspect' } } }] } }, { actor: 'engine' });
    expect(log.entries().map((e) => e.actor)).toEqual(['engine']);
  });

  it('batch(fn) is one entry however many writers run inside', () => {
    const { store, log } = setup();
    store.batch(() => {
      store.addNode({ id: 'n', type: 'node' });
      store.updateNode('a', { data: { v: 1 } });
      store.hideNode('b');
      store.removeEdge('ab');
    });
    expect(log.entries()).toHaveLength(1);
    log.undo();
    expect(store.hasNode('n')).toBe(false);
    expect(store.isNodeHidden('b')).toBe(false);
    expect(store.hasEdge('ab')).toBe(true);
  });

  it('a no-op write records nothing', () => {
    const { store, log } = setup();
    store.showNode('a'); // already shown
    store.setPinned('a', false); // already unpinned
    store.applyDelta({ removed: { nodeIds: ['ghost'] }, updated: { nodes: [{ id: 'ghost', patch: {} }] } });
    expect(log.entries()).toHaveLength(0);
  });

  it('with no log attached nothing is recorded and nothing breaks', () => {
    const store = new GraphStore();
    store.applyDelta({ added: { nodes: [{ id: 'a', type: 'node' }] }, hidden: { nodeIds: ['a'] } });
    expect(store.isNodeHidden('a')).toBe(true);
    expect(store.operationLog).toBeUndefined();
  });
});

describe('V5 — applyDelta keeps its order and skip-unknown behaviour; new fields invert', () => {
  it('removes edges, then nodes, then adds, then updates — adds in a batch collect into one bulk op', () => {
    const { store, log } = setup();
    store.applyDelta({
      added: { nodes: [{ id: 'd', type: 'node' }], edges: [{ id: 'cd', type: 'edge', source: 'c', target: 'd' }] },
      updated: { nodes: [{ id: 'b', patch: { data: { v: 1 } } }] },
      removed: { nodeIds: ['a'], edgeIds: ['ab'] },
    });
    expect(opsOf(log)[0]!.map((op) => op.kind)).toEqual(['removeEdge', 'removeNode', 'addNodes', 'addEdges', 'updateNode']);
  });

  it('skips unknown ids in removed / updated / hidden / shown / pinned', () => {
    const { store } = setup();
    expect(() =>
      store.applyDelta({
        removed: { nodeIds: ['x'], edgeIds: ['y'] },
        updated: { nodes: [{ id: 'x', patch: { data: 1 } }], edges: [{ id: 'y', patch: { data: 1 } }] },
        hidden: { nodeIds: ['x'], edgeIds: ['y'] },
        shown: { nodeIds: ['x'] },
        pinned: [{ id: 'x' }],
      }),
    ).not.toThrow();
    expect(store.nodeCount()).toBe(3);
  });

  it('hidden / shown round-trip through undo and redo', () => {
    const { store, log } = setup();
    store.applyDelta({ hidden: { nodeIds: ['a', 'b'], edgeIds: ['ab'] } });
    // A bulk hide compacts to one op per element kind.
    expect(opsOf(log)[0]).toEqual([
      { kind: 'setHidden', element: 'node', ids: ['a', 'b'], hidden: true },
      { kind: 'setHidden', element: 'edge', ids: ['ab'], hidden: true },
    ]);
    store.applyDelta({ shown: { nodeIds: ['a'] } });
    log.undo();
    expect(store.isNodeHidden('a')).toBe(true);
    log.undo();
    expect(store.isNodeHidden('a')).toBe(false);
    expect(store.isEdgeHidden('ab')).toBe(false);
    log.redo();
    expect(store.isNodeHidden('b')).toBe(true);
  });

  it('pinned pins in place, or pins and moves with x / y; undo restores both', () => {
    const { store, log } = setup();
    store.applyDelta({ pinned: [{ id: 'a' }, { id: 'b', x: 120, y: 80 }] });
    expect(store.isPinned('a')).toBe(true);
    expect(store.getPosition('b')).toEqual({ x: 120, y: 80 });
    log.undo();
    expect(store.isPinned('a')).toBe(false);
    expect(store.isPinned('b')).toBe(false);
    expect(store.getPosition('b')).toEqual({ x: 10, y: 0 });
    store.applyDelta({ pinned: [{ id: 'a', pinned: false }] }); // already unpinned: nothing
    expect(log.canUndo()).toBe(false);
  });

  it('undo of a removed group restores its members and their edges', () => {
    const { store, log } = setup();
    store.applyDelta({ added: { nodes: [{ id: 'g', type: 'group' }] } });
    store.applyDelta({ updated: { nodes: [{ id: 'a', patch: { parentId: 'g' } }, { id: 'b', patch: { parentId: 'g' } }] } });
    store.removeNode('g');
    store.removeNode('a');
    log.undo();
    log.undo();
    expect([...store.childrenOf('g')].sort()).toEqual(['a', 'b']);
    expect(store.hasEdge('ab')).toBe(true);
  });
});

describe('V6 (store half) — derived writes are not recorded', () => {
  it('store.internal.*, position writes and runtime states leave no entry', () => {
    const { store, log } = setup();
    store.internal.updateNode('a', { style: { bgFill: 0xff0000 } });
    store.internal.updateEdge('ab', { style: { strokeWidth: 3 } as never });
    store.internal.hideEdges(['ab']);
    store.internal.applyDelta({ added: { nodes: [{ id: 'd', type: 'node' }] } });
    store.internal.run(() => store.removeNode('c'));
    store.setPosition('a', { x: 5, y: 5 });
    store.setPositionsBulk(['a', 'b'], new Float32Array([1, 1, 2, 2]));
    store.setNodeState('a', 'selected', true);
    store.setCollapseHidden(['b']);
    expect(log.entries()).toHaveLength(0);
  });

  it('a derived write inside a recorded batch stays out of its entry', () => {
    const { store, log } = setup();
    store.batch(() => {
      store.updateNode('a', { data: { v: 1 } });
      store.internal.updateNode('b', { style: { bgFill: 1 } });
    });
    expect(opsOf(log)[0]!.map((op) => (op.kind === 'updateNode' ? op.id : op.kind))).toEqual(['a']);
  });

  it('recordApplied journals an already-applied gesture as one titled entry', () => {
    const { store, log } = setup();
    store.setPosition('a', { x: 50, y: 50 }); // the drag frames: unrecorded
    store.recordApplied([{ kind: 'moveNode', id: 'a', before: { x: 0, y: 0 }, after: { x: 50, y: 50 } }], { title: 'move' });
    expect(log.entries().map((e) => e.title)).toEqual(['move']);
    log.undo();
    expect(store.getPosition('a')).toEqual({ x: 0, y: 0 });
  });
});
