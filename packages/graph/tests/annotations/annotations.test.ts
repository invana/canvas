/**
 * Annotations drawn in the graph: never data, left out of a saved state, and a
 * new card lands clear of what is drawn.
 */
import { describe, expect, it } from 'vitest';

import { ANNOTATION_TYPES, isAnnotationElement, placeBeside } from '../../src/annotations';
import { unsavedToEditOps } from '../../src/behaviours/unsavedEdits';
import type { UnsavedChangesBehaviour } from '../../src/behaviours/UnsavedChangesBehaviour';
import { GraphLayer } from '../../src/layer/GraphLayer';

const box = (w: number, h: number) => ({ x: -w / 2, y: -h / 2, width: w, height: h });

describe('annotation elements', () => {
  it('are told apart from records by type', () => {
    expect(isAnnotationElement({ type: 'annotation' })).toBe(true);
    expect(isAnnotationElement({ type: 'annotates' })).toBe(true);
    expect(isAnnotationElement({ type: 'Airport' })).toBe(false);
    expect(isAnnotationElement(undefined)).toBe(false);
  });

  it('never reach the edit ops a host saves', () => {
    const layer = new GraphLayer({ id: 'graph', options: {} });
    const tracker = {
      changes: () => ({
        added: {
          nodes: [
            { id: 'n1', type: 'Airport', data: { iata: 'SYD' } },
            { id: 'annotation:a1', type: 'annotation', data: { text: 'late' } },
          ],
          edges: [{ id: 'annotates:a1:n1', type: 'annotates', source: 'annotation:a1', target: 'n1' }],
        },
        updated: {},
      }),
      current: { count: 0, nodes: { new: [], edited: [], deleted: [] }, edges: { new: [], edited: [], deleted: [] } },
      before: () => undefined,
    } as unknown as UnsavedChangesBehaviour;
    const ops = unsavedToEditOps(tracker, layer.store);
    expect(ops).toEqual([{ op: 'add_node', ref: 'n1', type: 'Airport', properties: { iata: 'SYD' } }]);
  });
});

describe('exportSkipTypes', () => {
  it('leaves the listed types out of exportData; without it every element is exported', () => {
    const layer = new GraphLayer({ id: 'graph', options: {} });
    layer.store.addData({
      nodes: [
        { id: 'n1', type: 'Airport' },
        { id: 'annotation:a1', type: 'annotation' },
      ],
      edges: [{ id: 'annotates:a1', type: 'annotates', source: 'annotation:a1', target: 'n1' }],
    });
    expect(layer.exportData().nodes).toHaveLength(2);
    layer.setOptions({ exportSkipTypes: ANNOTATION_TYPES });
    const out = layer.exportData();
    expect(out.nodes.map((n) => n.id)).toEqual(['n1']);
    expect(out.edges).toEqual([]);
  });
});

describe('placeBeside', () => {
  it('puts a card right of its record, or the next side when that is taken', () => {
    const layer = new GraphLayer({ id: 'graph', options: {} });
    layer.store.addData({
      nodes: [
        { id: 'r', type: 'x', position: { x: 0, y: 0 }, boundingBox: box(20, 20) },
        { id: 'block', type: 'x', position: { x: 150, y: 0 }, boundingBox: box(40, 40) },
      ],
      edges: [],
    });
    const free = placeBeside(layer, 'r', { width: 100, height: 40 }, { gap: 10 });
    expect(free!.x).toBeLessThan(0);
    layer.store.removeNode('block');
    const right = placeBeside(layer, 'r', { width: 100, height: 40 }, { gap: 10 });
    expect(right!.y).toBe(0);
    expect(right!.x).toBeGreaterThan(0);
  });
});
