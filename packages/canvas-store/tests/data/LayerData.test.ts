import { describe, expect, it, vi } from 'vitest';

import { LayerData, type LayerFlush } from '../../src/data/LayerData';

/** Capture the next flush synchronously. */
function capture(): { ld: LayerData; flushes: LayerFlush[] } {
  const ld = new LayerData();
  const flushes: LayerFlush[] = [];
  ld.on('flush', (e) => flushes.push(e));
  return { ld, flushes };
}

describe('LayerData — nodes', () => {
  it('add / update / remove → flush delta', () => {
    const { ld, flushes } = capture();
    ld.addNode({ id: 'a', label: 'A' });
    ld.addNode({ id: 'b' });
    ld.flush();
    expect(flushes[0]!.nodes.added.sort()).toEqual(['a', 'b']);
    expect(ld.counts.nodes).toBe(2);

    ld.updateNode('a', { label: 'A2' }); // non-position → changed
    ld.flush();
    expect(flushes[1]!.nodes.changed).toEqual(['a']);
    expect(flushes[1]!.nodes.moved).toEqual([]);
    expect(ld.node('a')?.label).toBe('A2');

    ld.removeNode('b');
    ld.flush();
    expect(flushes[2]!.nodes.removed).toEqual(['b']);
    expect(ld.counts.nodes).toBe(1);
  });

  it('position-only update → moved (not changed)', () => {
    const { ld, flushes } = capture();
    ld.addNode({ id: 'a' });
    ld.flush();
    ld.updateNode('a', { x: 10, y: 20 });
    ld.flush();
    expect(flushes[1]!.nodes.moved).toEqual(['a']);
    expect(flushes[1]!.nodes.changed).toEqual([]);
    expect(ld.node('a')).toMatchObject({ x: 10, y: 20 });
  });

  it('applyPositions → bulk moved (layout output)', () => {
    const { ld, flushes } = capture();
    ld.setData({ nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] });
    ld.flush();
    ld.applyPositions([
      { id: 'a', x: 0, y: 0 },
      { id: 'b', x: 100, y: 0 },
      { id: 'c', x: 200, y: 0 },
    ]);
    ld.flush();
    expect(flushes[1]!.nodes.moved.sort()).toEqual(['a', 'b', 'c']);
    expect(ld.node('b')?.x).toBe(100);
  });

  it('add-then-remove before flush is a net no-op', () => {
    const { ld, flushes } = capture();
    ld.addNode({ id: 'x' });
    ld.removeNode('x');
    ld.flush();
    expect(flushes).toHaveLength(0);
    expect(ld.counts.nodes).toBe(0);
  });
});

describe('LayerData — edges', () => {
  it('add / update / remove', () => {
    const { ld, flushes } = capture();
    ld.addEdge({ id: 'e1', source: 'a', target: 'b' });
    ld.flush();
    expect(flushes[0]!.edges.added).toEqual(['e1']);
    ld.updateEdge('e1', { weight: 3 });
    ld.flush();
    expect(flushes[1]!.edges.changed).toEqual(['e1']);
    expect(ld.edge('e1')?.weight).toBe(3);
    ld.removeEdge('e1');
    ld.flush();
    expect(flushes[2]!.edges.removed).toEqual(['e1']);
  });
});

describe('LayerData — groups', () => {
  it('add / update (membership + geometry) / remove', () => {
    const { ld, flushes } = capture();
    ld.addGroup({ id: 'g1', memberIds: ['a', 'b'] });
    ld.flush();
    expect(flushes[0]!.groups.added).toEqual(['g1']);
    ld.updateGroup('g1', { memberIds: ['a', 'b', 'c'], geometry: { hull: [] } });
    ld.flush();
    expect(flushes[1]!.groups.changed).toEqual(['g1']);
    expect(ld.group('g1')?.memberIds).toEqual(['a', 'b', 'c']);
    ld.removeGroup('g1');
    ld.flush();
    expect(flushes[2]!.groups.removed).toEqual(['g1']);
  });
});

describe('LayerData — annotations', () => {
  it('add / update / remove', () => {
    const { ld, flushes } = capture();
    ld.addAnnotation({ id: 'note1', kind: 'text', text: 'hi' });
    ld.flush();
    expect(flushes[0]!.annotations.added).toEqual(['note1']);
    ld.updateAnnotation('note1', { text: 'bye' });
    ld.flush();
    expect(flushes[1]!.annotations.changed).toEqual(['note1']);
    expect(ld.annotation('note1')?.text).toBe('bye');
    ld.removeAnnotation('note1');
    ld.flush();
    expect(flushes[2]!.annotations.removed).toEqual(['note1']);
  });
});

describe('LayerData — bulk setData + coalescing', () => {
  it('setData diffs every kind into one flush', () => {
    const { ld, flushes } = capture();
    ld.setData({
      nodes: [{ id: 'a' }, { id: 'b' }],
      edges: [{ id: 'e1', source: 'a', target: 'b' }],
      groups: [{ id: 'g1', memberIds: ['a', 'b'] }],
      annotations: [{ id: 'n1', kind: 'text' }],
    });
    ld.flush();
    const f = flushes[0]!;
    expect(f.nodes.added.sort()).toEqual(['a', 'b']);
    expect(f.edges.added).toEqual(['e1']);
    expect(f.groups.added).toEqual(['g1']);
    expect(f.annotations.added).toEqual(['n1']);

    // re-setData with one node dropped, one added → removed + added
    ld.setData({ nodes: [{ id: 'b' }, { id: 'c' }] });
    ld.flush();
    expect(flushes[1]!.nodes.added).toEqual(['c']);
    expect(flushes[1]!.nodes.removed).toEqual(['a']);
  });

  it('coalesces many sync writes into one microtask flush', async () => {
    const { ld } = capture();
    const listener = vi.fn();
    ld.on('flush', listener);
    ld.addNode({ id: 'a' });
    ld.addEdge({ id: 'e', source: 'a', target: 'a' });
    ld.addAnnotation({ id: 'n', kind: 'text' });
    expect(listener).not.toHaveBeenCalled(); // not yet — coalesced
    await new Promise<void>((resolve) => queueMicrotask(resolve));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
