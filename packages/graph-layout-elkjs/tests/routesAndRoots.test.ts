/**
 * ELK hands its edge geometry to the layer — never onto the edges — and a
 * rooted run starts where it is told.
 *
 * Runs the in-process ELK build (no `Worker` under Node) against an unmounted
 * `GraphLayer`, so the store and style resolution are real and nothing renders.
 */
import { describe, expect, it } from 'vitest';
import { GraphLayer, type EdgePathType } from '@invana/graph';
import { ElkLayout } from '../src';

type Edge = [string, string];

function graph(edges: Edge[], pathType?: EdgePathType): GraphLayer {
  const ids = [...new Set(edges.flat())];
  const layer = new GraphLayer({
    id: 'graph',
    options: pathType ? { edge: { style: { shape: { pathType } } } } : {},
  });
  layer.store.addData({
    nodes: ids.map((id) => ({ id, type: 'n' })),
    edges: edges.map(([source, target], i) => ({ id: `e${i}`, type: 'r', source, target })),
  });
  return layer;
}

const shapes = (layer: GraphLayer) =>
  [...layer.store.edges()].map((e) => layer.resolveEdgeStyle(e).shape ?? {});
const pos = (layer: GraphLayer, id: string) => layer.store.getPosition(id)!;

const DAG: Edge[] = [
  ['a', 'b'],
  ['a', 'c'],
  ['b', 'd'],
  ['c', 'd'],
  ['d', 'e'],
];

describe('ElkLayout edge geometry', () => {
  it('routes orthogonally, then leaves no route once another layout runs', async () => {
    const layer = graph(DAG);
    await new ElkLayout({ id: 'tree', direction: 'DOWN', edgeRouting: 'ORTHOGONAL', transition: false }).apply(layer);
    expect(shapes(layer).every((s) => s.pathType === 'orth' && (s.waypoints?.length ?? 0) >= 2)).toBe(true);

    await new ElkLayout({ id: 'other', algorithm: 'stress', transition: false }).apply(layer);
    expect(shapes(layer).filter((s) => s.pathType === 'orth' || s.waypoints)).toHaveLength(0);
    expect([...layer.store.edges()].every((e) => e.style === undefined)).toBe(true);
  });

  it('draws SPLINES as a Bézier chain under a curved layer type', async () => {
    const layer = graph(DAG, 'bezier');
    await new ElkLayout({ edgeRouting: 'SPLINES', transition: false }).apply(layer);
    for (const s of shapes(layer)) {
      expect(s.pathType).toBe('spline');
      expect((s.waypoints!.length - 1) % 3).toBe(0);
    }
  });

  it('keeps the layer type when it is of another family', async () => {
    const layer = graph(DAG, 'straight');
    await new ElkLayout({ edgeRouting: 'ORTHOGONAL', transition: false }).apply(layer);
    expect(shapes(layer).every((s) => s.pathType === 'straight' && !s.waypoints)).toBe(true);
  });
});

describe('ElkLayout roots', () => {
  // Cyclic, no source, with `hub` the most-connected node.
  const CYCLIC: Edge[] = [
    ['hub', 'a'],
    ['a', 'b'],
    ['b', 'hub'],
    ['hub', 'c'],
    ['c', 'd'],
    ['d', 'hub'],
    ['hub', 'e'],
    ['e', 'hub'],
    ['x', 'y'],
    ['y', 'x'],
  ];

  it('centres radial on the most-connected node, on rings, with no nodes stacked', async () => {
    const layer = graph(CYCLIC, 'bump-radial');
    await new ElkLayout({ algorithm: 'radial', transition: false }).apply(layer);
    const ids = [...layer.store.nodes()].map((n) => n.id);
    const points = new Set(ids.map((id) => `${Math.round(pos(layer, id).x)},${Math.round(pos(layer, id).y)}`));
    expect(points.size).toBe(ids.length);

    const centre = pos(layer, 'hub');
    const radius = (id: string) => Math.hypot(pos(layer, id).x - centre.x, pos(layer, id).y - centre.y);
    expect(ids.filter((id) => id !== 'hub').every((id) => radius(id) > 0)).toBe(true);
    expect(radius('a')).toBeCloseTo(radius('c'), 0);
    // The centre is the frame origin `bump-radial` curves around.
    const origin = shapes(layer)[0]!.pathStyleOpts?.['origin'] as { x: number; y: number };
    expect(origin.x).toBeCloseTo(centre.x, 3);
    expect(origin.y).toBeCloseTo(centre.y, 3);
  });

  it('centres radial on rootNodeId, and the selection beats the most-connected', async () => {
    const named = graph(CYCLIC);
    await new ElkLayout({ algorithm: 'radial', rootNodeId: 'b', transition: false }).apply(named);
    const others = ['hub', 'a', 'c'].map((id) => Math.hypot(pos(named, id).x - pos(named, 'b').x, pos(named, id).y - pos(named, 'b').y));
    expect(Math.min(...others)).toBeGreaterThan(0);
    expect(shapes(named).length).toBe(CYCLIC.length);

    const selected = graph(CYCLIC);
    selected.store.setNodeState('d', 'selected');
    await new ElkLayout({ algorithm: 'radial', transition: false }).apply(selected);
    const ringOf = (id: string) => Math.round(Math.hypot(pos(selected, id).x - pos(selected, 'd').x, pos(selected, id).y - pos(selected, 'd').y));
    expect(ringOf('c')).toBe(ringOf('hub'));
  });

  it("starts a layered tree from the selection with root: 'selection'", async () => {
    const layer = graph(DAG);
    layer.store.setNodeState('c', 'selected');
    await new ElkLayout({ direction: 'DOWN', root: 'selection', transition: false }).apply(layer);
    const top = Math.min(...[...layer.store.nodes()].map((n) => pos(layer, n.id).y));
    expect(pos(layer, 'c').y).toBe(top);
  });

  it('puts rootNodeId in the first layer of a layered tree', async () => {
    const layer = graph(DAG);
    await new ElkLayout({ direction: 'DOWN', rootNodeId: 'd', transition: false }).apply(layer);
    const top = Math.min(...[...layer.store.nodes()].map((n) => pos(layer, n.id).y));
    expect(pos(layer, 'd').y).toBe(top);
  });
});
