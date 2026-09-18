/**
 * The store's effective-visibility rule — the single source of truth.
 *
 * `isNodeVisible` folds three terms: the explicit `hidden` flag, the
 * collapsed-ancestor set the owning layer pushes, and the placement gate. These
 * pin the two terms added by
 * `rfc:fix-2026-09-17-effective-visibility-is-decided-outside-the-store`,
 * including the one place the rule deliberately does **not** apply: edges.
 */
import { describe, expect, it } from 'vitest';
import { GraphStore } from '../../src/store/GraphStore';

function makeStore(): GraphStore {
  const store = new GraphStore();
  store.addNodesBulk([
    { id: 'g', type: 'group', position: { x: 0, y: 0 } },
    { id: 'a', type: 'thing', parentId: 'g', position: { x: 10, y: 10 } },
    { id: 'b', type: 'thing', position: { x: 100, y: 0 } },
  ]);
  store.addEdgesBulk([{ id: 'e1', type: 'rel', source: 'a', target: 'b' }]);
  return store;
}

describe('GraphStore — effective visibility', () => {
  it('starts with everything visible', () => {
    const store = makeStore();
    expect(store.isNodeVisible('a')).toBe(true);
    expect(store.isNodeVisible('b')).toBe(true);
    expect(store.isEdgeVisible('e1')).toBe(true);
  });

  it('honours the explicit hidden flag', () => {
    const store = makeStore();
    store.hideNode('a');
    expect(store.isNodeVisible('a')).toBe(false);
    // An explicitly hidden endpoint DOES hide its edges — unchanged behaviour.
    expect(store.isEdgeVisible('e1')).toBe(false);
  });

  // ─── Collapse ─────────────────────────────────────────────────────────────

  it('hides a node the layer reports as collapse-hidden', () => {
    const store = makeStore();
    store.setCollapseHidden(['a']);
    expect(store.isNodeVisible('a')).toBe(false);
    expect(store.isCollapseHidden('a')).toBe(true);
    // Not the authored flag — collapse is derived, and must not look like a
    // user hide (it would then be exported as one).
    expect(store.isNodeHidden('a')).toBe(false);
    expect(store.getNode('a')?.hidden).toBe(false);
  });

  it('does NOT hide an edge whose endpoint is merely collapse-hidden', () => {
    // Collapse re-parents an edge onto the group frame; it does not delete it.
    // Folding this term into `isEdgeVisible` would erase every edge crossing
    // into a collapsed group.
    const store = makeStore();
    store.setCollapseHidden(['a']);
    expect(store.isNodeVisible('a')).toBe(false);
    expect(store.isEdgeVisible('e1')).toBe(true);
  });

  it('replaces the collapse set wholesale, so expanding restores visibility', () => {
    const store = makeStore();
    store.setCollapseHidden(['a']);
    store.setCollapseHidden([]);
    expect(store.isNodeVisible('a')).toBe(true);
  });

  it('emits node:visibility for both sides of a collapse change', () => {
    const store = makeStore();
    const seen: Array<{ nodeId: string; hidden: boolean }> = [];
    store.events.on('node:visibility', (e) => seen.push(e));

    store.setCollapseHidden(['a']);
    expect(seen).toEqual([{ nodeId: 'a', hidden: true }]);

    seen.length = 0;
    store.setCollapseHidden([]);
    expect(seen).toEqual([{ nodeId: 'a', hidden: false }]);
  });

  it('emits nothing when the collapse set is unchanged', () => {
    const store = makeStore();
    store.setCollapseHidden(['a']);
    const seen: unknown[] = [];
    store.events.on('node:visibility', (e) => seen.push(e));
    store.setCollapseHidden(['a']);
    expect(seen).toEqual([]);
  });

  it('DOES hide an edge whose endpoint is placement-withheld', () => {
    // The asymmetry with collapse: collapse re-routes an edge onto the group
    // frame, but an unplaced endpoint has nowhere to re-route to — the
    // connector collapses to a stub at the origin and paints as a stray
    // arrowhead on an otherwise empty canvas.
    const store = makeStore();
    store.addNodesBulk([{ id: 'floating', type: 'thing' }]);
    store.addEdgesBulk([{ id: 'e2', type: 'rel', source: 'b', target: 'floating' }]);

    expect(store.isEdgeVisible('e2')).toBe(true);
    store.setPlacementPending(true);
    expect(store.isEdgeVisible('e2')).toBe(false);
    // 'e1' joins two placed nodes and is unaffected.
    expect(store.isEdgeVisible('e1')).toBe(true);
  });

  // ─── Placement ────────────────────────────────────────────────────────────

  it('withholds never-placed nodes only while placement is pending', () => {
    const store = new GraphStore();
    store.addNodesBulk([
      { id: 'placed', type: 'thing', position: { x: 5, y: 5 } },
      { id: 'unplaced', type: 'thing' },
    ]);

    expect(store.isNodeVisible('unplaced')).toBe(true);

    store.setPlacementPending(true);
    expect(store.isNodeVisible('unplaced')).toBe(false);
    // A node with an authored position is unaffected — mixed graphs still draw.
    expect(store.isNodeVisible('placed')).toBe(true);

    store.setPlacementPending(false);
    expect(store.isNodeVisible('unplaced')).toBe(true);
  });

  it('lifts the placement gate per node as the layout places it', () => {
    const store = new GraphStore();
    store.addNodesBulk([{ id: 'n', type: 'thing' }]);
    store.setPlacementPending(true);
    expect(store.isNodeVisible('n')).toBe(false);

    store.setPosition('n', { x: 42, y: 42 });
    // Placement is per node: once it has a position it is visible, even while
    // the layout is still solving for its siblings.
    expect(store.isNodeVisible('n')).toBe(true);
  });

  it('emits node:visibility only for the nodes the placement gate affects', () => {
    const store = new GraphStore();
    store.addNodesBulk([
      { id: 'placed', type: 'thing', position: { x: 1, y: 1 } },
      { id: 'unplaced', type: 'thing' },
    ]);
    const seen: Array<{ nodeId: string }> = [];
    store.events.on('node:visibility', (e) => seen.push(e));
    store.setPlacementPending(true);
    expect(seen.map((e) => e.nodeId)).toEqual(['unplaced']);
  });

  it('is idempotent on the placement flag', () => {
    const store = makeStore();
    store.setPlacementPending(true);
    const seen: unknown[] = [];
    store.events.on('node:visibility', (e) => seen.push(e));
    store.setPlacementPending(true);
    expect(seen).toEqual([]);
  });

  // ─── The terms compose ────────────────────────────────────────────────────

  it('stays hidden while any one term says so', () => {
    const store = makeStore();
    store.hideNode('a');
    store.setCollapseHidden(['a']);
    store.setPlacementPending(true);

    store.showNode('a');
    expect(store.isNodeVisible('a')).toBe(false); // still collapse-hidden

    store.setCollapseHidden([]);
    expect(store.isNodeVisible('a')).toBe(true); // 'a' has a position, so placement is moot
  });
});
