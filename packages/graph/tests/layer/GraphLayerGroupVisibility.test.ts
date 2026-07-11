import { describe, expect, it, vi } from 'vitest';

import { GraphLayer } from '../../src/layer/GraphLayer';
import { GraphStore } from '../../src/store';

/**
 * A parent group `g` with children `c1`, `c2`, a grandchild `gc` under `c1`, an
 * unrelated node `x`, and edges linking them. Built on an injected store so the
 * layer's group-visibility wrappers can be exercised without mounting a renderer.
 */
function groupLayer(): { layer: GraphLayer; store: GraphStore } {
  const store = new GraphStore();
  store.addNodesBulk([
    { id: 'g', style: { group: {} } }, // container node → isGroupNode true
    { id: 'c1', parentId: 'g' },
    { id: 'c2', parentId: 'g' },
    { id: 'gc', parentId: 'c1' },
    { id: 'x' },
  ]);
  store.addEdgesBulk([
    { id: 'c1-c2', source: 'c1', target: 'c2' },
    { id: 'c1-x', source: 'c1', target: 'x' },
  ]);
  const layer = new GraphLayer({ id: 'graph', options: { store } });
  return { layer, store };
}

describe('GraphLayer — group visibility', () => {
  it('hideGroup hides the container node and its whole subtree', () => {
    const { layer, store } = groupLayer();
    layer.hideGroup('g');
    expect(store.isNodeHidden('g')).toBe(true);
    expect(store.isNodeHidden('c1')).toBe(true);
    expect(store.isNodeHidden('c2')).toBe(true);
    expect(store.isNodeHidden('gc')).toBe(true); // grandchild included
    expect(store.isNodeHidden('x')).toBe(false); // unrelated untouched
  });

  it('incident edges auto-hide via the endpoint cascade', () => {
    const { layer, store } = groupLayer();
    layer.hideGroup('g');
    expect(store.isEdgeVisible('c1-c2')).toBe(false); // both endpoints hidden
    expect(store.isEdgeVisible('c1-x')).toBe(false); // c1 hidden
    expect(store.isEdgeHidden('c1-c2')).toBe(false); // derived, not flagged
  });

  it('hideGroup fires exactly one flush for the whole subtree', () => {
    const { layer, store } = groupLayer();
    const flush = vi.fn();
    store.events.on('flush', flush);
    layer.hideGroup('g');
    expect(flush).toHaveBeenCalledTimes(1);
  });

  it('showGroup reveals the whole subtree', () => {
    const { layer, store } = groupLayer();
    layer.hideGroup('g');
    layer.showGroup('g');
    for (const id of ['g', 'c1', 'c2', 'gc']) {
      expect(store.isNodeHidden(id)).toBe(false);
    }
    expect(store.isEdgeVisible('c1-c2')).toBe(true);
  });

  it('toggleGroupHidden flips the whole subtree and returns the group state', () => {
    const { layer, store } = groupLayer();
    expect(layer.toggleGroupHidden('g')).toBe(true);
    expect(store.isNodeHidden('gc')).toBe(true);
    expect(layer.toggleGroupHidden('g')).toBe(false);
    expect(store.isNodeHidden('gc')).toBe(false);
  });

  it('hideGroups hides multiple groups in one flush', () => {
    const { layer, store } = groupLayer();
    const flush = vi.fn();
    store.events.on('flush', flush);
    layer.hideGroups(['c1', 'c2']); // c1 (+gc) and c2
    expect(flush).toHaveBeenCalledTimes(1);
    expect(store.isNodeHidden('c1')).toBe(true);
    expect(store.isNodeHidden('gc')).toBe(true);
    expect(store.isNodeHidden('c2')).toBe(true);
    expect(store.isNodeHidden('g')).toBe(false); // parent not swept
  });

  it('a leaf id behaves like hideNode (empty subtree)', () => {
    const { layer, store } = groupLayer();
    layer.hideGroup('x');
    expect(store.isNodeHidden('x')).toBe(true);
  });

  it('isGroupHidden reflects the container node hidden flag', () => {
    const { layer } = groupLayer();
    expect(layer.isGroupHidden('g')).toBe(false);
    layer.hideGroup('g');
    expect(layer.isGroupHidden('g')).toBe(true);
    layer.showGroup('g');
    expect(layer.isGroupHidden('g')).toBe(false);
  });

  it('hiddenGroups lists only hidden group containers, not swept members', () => {
    const { layer } = groupLayer();
    expect(layer.hiddenGroups()).toEqual([]);
    layer.hideGroup('g'); // hides g + c1, c2, gc — but only g is a group node
    expect(layer.hiddenGroups()).toEqual(['g']);
    layer.showGroup('g');
    expect(layer.hiddenGroups()).toEqual([]);
  });

  it('hideGroup emits group:visibility(true) once for the container', () => {
    const { layer } = groupLayer();
    const ev = vi.fn();
    layer.events.on('group:visibility', ev);
    layer.hideGroup('g');
    expect(ev).toHaveBeenCalledTimes(1);
    expect(ev).toHaveBeenCalledWith({ groupId: 'g', hidden: true });
  });

  it('showGroup emits group:visibility(false)', () => {
    const { layer } = groupLayer();
    layer.hideGroup('g');
    const ev = vi.fn();
    layer.events.on('group:visibility', ev);
    layer.showGroup('g');
    expect(ev).toHaveBeenCalledTimes(1);
    expect(ev).toHaveBeenCalledWith({ groupId: 'g', hidden: false });
  });

  it('a no-op group hide/show emits nothing', () => {
    const { layer } = groupLayer();
    layer.hideGroup('g');
    const ev = vi.fn();
    layer.events.on('group:visibility', ev);
    layer.hideGroup('g'); // already hidden — no transition
    expect(ev).not.toHaveBeenCalled();
  });

  it('toggleGroupHidden emits the resulting state each flip', () => {
    const { layer } = groupLayer();
    const states: boolean[] = [];
    layer.events.on('group:visibility', ({ hidden }) => states.push(hidden));
    layer.toggleGroupHidden('g');
    layer.toggleGroupHidden('g');
    expect(states).toEqual([true, false]);
  });

  it('hideGroups emits one event per container that transitioned', () => {
    const { layer } = groupLayer();
    const ids: string[] = [];
    layer.events.on('group:visibility', ({ groupId }) => ids.push(groupId));
    layer.hideGroups(['c1', 'c2']);
    expect(ids.sort()).toEqual(['c1', 'c2']);
  });
});
