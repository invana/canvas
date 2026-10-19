/**
 * Edge shape resolution and layout geometry.
 *
 * `shape` merges field by field (template → layout route → the edge's own
 * style), a route draws only under a path type of its own family, and the
 * geometry belongs to the layout instance that wrote it.
 */
import { describe, expect, it } from 'vitest';
import { GraphLayer } from '../../src/layer/GraphLayer';
import type { EdgePathType, LayoutRoute } from '../../src/layer/types';

const ELBOWS = [
  { x: 0, y: 0 },
  { x: 0, y: 50 },
  { x: 100, y: 50 },
];

function graph(pathType?: EdgePathType, ownShape?: Record<string, unknown>): GraphLayer {
  const layer = new GraphLayer({
    id: 'graph',
    options: pathType ? { edge: { style: { shape: { pathType } } } } : {},
  });
  layer.store.addData({
    nodes: [{ id: 'a', type: 'n' }, { id: 'b', type: 'n' }],
    edges: [{ id: 'e', type: 'r', source: 'a', target: 'b', ...(ownShape ? { style: { shape: ownShape } } : {}) }],
  });
  return layer;
}

const shapeOf = (layer: GraphLayer) => layer.resolveEdgeStyle(layer.store.getEdge('e')!).shape;
const route = (pathType: EdgePathType): Map<string, LayoutRoute> =>
  new Map([['e', { pathType, waypoints: ELBOWS }]]);

describe('edge shape resolution', () => {
  it("keeps the layer's pathType under an edge's own waypoints", () => {
    const layer = graph('bezier', { waypoints: [{ x: 5, y: 5 }] });
    expect(shapeOf(layer)).toMatchObject({ pathType: 'bezier', waypoints: [{ x: 5, y: 5 }] });
  });

  it("lets an edge's own pathType win", () => {
    expect(shapeOf(graph('bezier', { pathType: 'orth' }))?.pathType).toBe('orth');
  });
});

describe('layout geometry', () => {
  const elk = { id: 'elk' };
  const force = { id: 'force' };

  it('draws a route under its own family and drops it under another', () => {
    const orth = graph('orth');
    orth.setLayoutGeometry(elk, { routes: route('orth') });
    expect(shapeOf(orth)).toMatchObject({ pathType: 'orth', waypoints: ELBOWS });

    const unset = graph();
    unset.setLayoutGeometry(elk, { routes: route('orth') });
    expect(shapeOf(unset)).toMatchObject({ pathType: 'orth', waypoints: ELBOWS });

    const straight = graph('straight');
    straight.setLayoutGeometry(elk, { routes: route('orth') });
    expect(shapeOf(straight)).toEqual({ pathType: 'straight' });

    // `bezier` ignores waypoints, so a curved route draws as its own type.
    const curved = graph('bezier');
    curved.setLayoutGeometry(elk, { routes: route('spline') });
    expect(shapeOf(curved)).toMatchObject({ pathType: 'spline', waypoints: ELBOWS });
  });

  it('is cleared by a run of another layout, not by a re-run of its own', () => {
    const layer = graph('orth');
    layer.setLayoutGeometry(elk, { routes: route('orth') });
    layer.beginLayoutRun(elk);
    expect(shapeOf(layer)?.waypoints).toEqual(ELBOWS);
    layer.beginLayoutRun(force);
    expect(shapeOf(layer)).toEqual({ pathType: 'orth' });
    expect(layer.store.getEdge('e')?.style).toBeUndefined();
  });

  it('fills the polar origin from the frame unless the edge sets one', () => {
    const layer = graph('bump-radial');
    layer.setLayoutGeometry(elk, { frame: { origin: { x: 10, y: 20 } } });
    expect(shapeOf(layer)?.pathStyleOpts).toEqual({ origin: { x: 10, y: 20 } });

    const own = graph('bump-radial', { pathStyleOpts: { origin: { x: 1, y: 1 } } });
    own.setLayoutGeometry(elk, { frame: { origin: { x: 10, y: 20 } } });
    expect(shapeOf(own)?.pathStyleOpts).toEqual({ origin: { x: 1, y: 1 } });
  });
});
