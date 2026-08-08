/**
 * Headless picking — the P4/D5 gate: the engine resolves a pick with **no
 * renderer mounted, no GPU and no DOM**. Every record here is a plain object;
 * nothing constructs a pixi display object.
 *
 * These tests pin the behaviours that are easy to break silently when picking
 * moves between packages: the two-band ranking, the hit floor, the scale
 * divisor, the deferred-bbox flush, and the two hover heuristics.
 */

import { describe, expect, it } from 'vitest';
import {
  PickingIndex,
  connectorHitBoxes,
  type ConnectorHitRecord,
  type HitGeometrySource,
  type ShapeHitRecord,
} from '../../src/hit/PickingIndex';
import type { BaseShapeSpec } from '../../src/specs/shape';
import type { BaseConnectorSpec } from '../../src/specs/connector';

/** A mutable stand-in for the renderer's half of the picking contract. */
class FakeSource implements HitGeometrySource {
  readonly shapes = new Map<string, ShapeHitRecord>();
  readonly connectors = new Map<string, ConnectorHitRecord>();

  shapeRecord(id: string): ShapeHitRecord | null {
    return this.shapes.get(id) ?? null;
  }
  connectorRecord(id: string): ConnectorHitRecord | null {
    return this.connectors.get(id) ?? null;
  }
  shapeIds(): Iterable<string> {
    return this.shapes.keys();
  }
}

/**
 * A filled circle. The fill is not decoration: a spec with no silhouette fill
 * is **hollow** by design (only its stroke band picks — `contains.ts` §1), so a
 * fill-less circle would fail every containment test here for the right reason.
 */
function circle(x: number, y: number, radius: number): BaseShapeSpec {
  return { kind: 'circle', x, y, radius, fill: 0x336699 } as unknown as BaseShapeSpec;
}

function edge(strokeWidth = 1): BaseConnectorSpec {
  return {
    kind: 'line',
    source: { kind: 'point', x: 0, y: 0 },
    target: { kind: 'point', x: 0, y: 0 },
    stroke: { width: strokeWidth },
  } as unknown as BaseConnectorSpec;
}

/** An index over a camera at `scale`, with the given screen-px margins. */
function makeIndex(
  opts: { scale?: number; hitFloorPx?: number; hoverHysteresisPx?: number; hoverNodeIncidencePx?: number } = {},
) {
  const source = new FakeSource();
  const camera = { scale: opts.scale ?? 1 };
  const index = new PickingIndex({
    source,
    camera,
    hitFloorPx: opts.hitFloorPx ?? 0,
    hoverHysteresisPx: opts.hoverHysteresisPx ?? 0,
    hoverNodeIncidencePx: opts.hoverNodeIncidencePx ?? 0,
  });
  const addShape = (id: string, spec: BaseShapeSpec, zIndex = 0, scale = 1): void => {
    source.shapes.set(id, { spec, scale });
    index.insertShape(id, zIndex);
  };
  const addConnector = (
    id: string,
    polyline: Array<{ x: number; y: number }>,
    zIndex = 0,
    strokeWidth = 1,
  ): void => {
    source.connectors.set(id, { spec: edge(strokeWidth), polyline });
    index.insertConnector(id, zIndex);
  };
  return { index, source, addShape, addConnector };
}

describe('PickingIndex — narrow phase from specs alone', () => {
  it('picks a shape whose silhouette contains the point, not merely its bbox', () => {
    const { index, addShape } = makeIndex();
    addShape('c', circle(0, 0, 10));

    expect(index.hitTest(0, 0)?.id).toBe('c');
    // Inside the bbox corner but outside the circle — bbox-only picking fails here.
    expect(index.hitTest(9.5, 9.5)).toBeNull();
  });

  it('returns null for a point nowhere near anything', () => {
    const { index, addShape } = makeIndex();
    addShape('c', circle(0, 0, 10));
    expect(index.hitTest(500, 500)).toBeNull();
  });

  it('divides world deltas by the record scale, so an inflated shape still picks', () => {
    const { index, source, addShape } = makeIndex();
    addShape('c', circle(0, 0, 10));
    // A LOD behaviour inflates the shape 5× without touching the spec.
    source.shapes.set('c', { spec: circle(0, 0, 10), scale: 5 });
    index.reindexShapes(['c']);

    // 30 world units out: outside the unscaled silhouette, inside the drawn one.
    expect(index.hitTest(30, 0)?.id).toBe('c');
  });
});

describe('PickingIndex — ranking', () => {
  it('higher zIndex wins over a lower one', () => {
    const { index, addShape } = makeIndex();
    addShape('under', circle(0, 0, 20), 0);
    addShape('over', circle(0, 0, 20), 5);
    expect(index.hitTest(0, 0)?.id).toBe('over');
  });

  it('on a zIndex tie, a shape beats a connector', () => {
    const { index, addShape, addConnector } = makeIndex();
    addConnector('e', [{ x: -50, y: 0 }, { x: 50, y: 0 }], 0);
    addShape('n', circle(0, 0, 20), 0);
    expect(index.hitTest(0, 0)?.kind).toBe('shape');
  });

  it('on a same-kind tie, the closer origin wins', () => {
    const { index, addShape } = makeIndex();
    addShape('far', circle(0, 0, 60), 0);
    addShape('near', circle(20, 0, 60), 0);
    expect(index.hitTest(15, 0)?.id).toBe('near');
  });

  it('an excluded id is skipped, revealing what sits beneath it', () => {
    const { index, addShape } = makeIndex();
    addShape('under', circle(0, 0, 20), 0);
    addShape('preview', circle(0, 0, 20), 9);
    expect(index.hitTest(0, 0)?.id).toBe('preview');
    expect(index.hitTest(0, 0, new Set(['preview']))?.id).toBe('under');
  });
});

describe('PickingIndex — the hit floor', () => {
  it('rescues a near-miss within the floor, and scales it with zoom', () => {
    // 20 screen px of floor at scale 1 == 20 world units.
    const near = makeIndex({ hitFloorPx: 20 });
    near.addShape('c', circle(0, 0, 2));
    expect(near.index.hitTest(10, 0)?.id).toBe('c');
    expect(near.index.hitTest(30, 0)).toBeNull();

    // Zoomed 10× in, the same 20 screen px is only 2 world units.
    const zoomed = makeIndex({ hitFloorPx: 20, scale: 10 });
    zoomed.addShape('c', circle(0, 0, 2));
    expect(zoomed.index.hitTest(10, 0)).toBeNull();
  });

  it('an exact hit always beats a nearer floor candidate', () => {
    const { index, addShape } = makeIndex({ hitFloorPx: 100 });
    addShape('pinpoint', circle(5, 0, 0.5), 0);
    addShape('big', circle(0, 0, 40), 0);
    // The pinpoint's origin is closer, but only `big` genuinely contains (20, 0).
    expect(index.hitTest(20, 0)?.id).toBe('big');
  });
});

describe('PickingIndex — deferred bounds', () => {
  it('a moved shape picks at its new position once the query flushes', () => {
    const { index, source, addShape } = makeIndex();
    addShape('c', circle(0, 0, 10));

    // Simulate the renderer's fast-path move: mutate the spec, mark it stale.
    source.shapes.set('c', { spec: circle(300, 0, 10), scale: 1 });
    index.markShapeMoved('c');

    expect(index.hitTest(300, 0)?.id).toBe('c');
    expect(index.hitTest(0, 0)).toBeNull();
  });

  it('a re-routed connector picks along its new path after the flush', () => {
    const { index, source, addConnector } = makeIndex();
    addConnector('e', [{ x: 0, y: 0 }, { x: 100, y: 0 }]);

    source.connectors.set('e', { spec: edge(1), polyline: [{ x: 0, y: 200 }, { x: 100, y: 200 }] });
    index.markConnectorMoved('e');

    expect(index.hitTest(50, 200)?.id).toBe('e');
    expect(index.hitTest(50, 0)).toBeNull();
  });

  it('removal takes an element out of picking entirely', () => {
    const { index, source, addShape } = makeIndex();
    addShape('c', circle(0, 0, 10));
    index.remove('c');
    source.shapes.delete('c');
    expect(index.hitTest(0, 0)).toBeNull();
    expect(index.has('c')).toBe(false);
  });
});

describe('PickingIndex — enable flag', () => {
  it('disabled picking answers null regardless of geometry', () => {
    const { index, addShape } = makeIndex();
    addShape('c', circle(0, 0, 10));
    index.setEnabled(false);
    expect(index.hitTest(0, 0)).toBeNull();
    expect(index.pickHover(0, 0, null)).toBeNull();
    index.setEnabled(true);
    expect(index.hitTest(0, 0)?.id).toBe('c');
  });
});

describe('PickingIndex — hover heuristics', () => {
  it('hysteresis keeps the current hover when the new winner is barely closer', () => {
    const { index, addConnector } = makeIndex({ hoverHysteresisPx: 10 });
    // Two parallel edges 2 world units apart, cursor nearer to `b`.
    addConnector('a', [{ x: -50, y: 0 }, { x: 50, y: 0 }]);
    addConnector('b', [{ x: -50, y: 2 }, { x: 50, y: 2 }]);

    // With no prior hover, the genuinely-closest edge wins.
    expect(index.pickHover(0, 1.4, null)?.id).toBe('b');
    // Holding `a`, a 0.8-unit improvement doesn't clear the 10-unit margin.
    expect(index.pickHover(0, 1.4, { kind: 'connector', id: 'a' })?.id).toBe('a');
  });

  it('hysteresis does not hold across kinds — landing on a node always wins', () => {
    const { index, addShape } = makeIndex({ hoverHysteresisPx: 100 });
    addShape('n', circle(0, 0, 20));
    expect(index.pickHover(0, 0, { kind: 'connector', id: 'e' })?.id).toBe('n');
  });

  it('node-incidence bias prefers an edge touching the nearby node', () => {
    const { index, addShape, addConnector } = makeIndex({ hoverNodeIncidencePx: 30 });
    addShape('n', circle(0, 0, 5));
    // Both edges are exact hits at (20, 0) — `through` is the closer of the two,
    // but merely passes through; it touches nothing.
    addConnector('through', [{ x: -100, y: 2 }, { x: 100, y: 2 }]);
    // `incident` starts at the node's centre and fans away from it.
    addConnector('incident', [{ x: 0, y: 0 }, { x: 200, y: 30 }]);

    // Raw picking is distance-only, so the passer-by wins.
    expect(index.hitTest(20, 0)?.id).toBe('through');
    // Hover, with a node inside the incidence radius, prefers the incident edge.
    expect(index.pickHover(20, 0, null)?.id).toBe('incident');
  });
});

describe('connectorHitBoxes', () => {
  it('a short edge indexes as one padded box', () => {
    const boxes = connectorHitBoxes([{ x: 0, y: 0 }, { x: 10, y: 0 }], 2);
    expect(boxes).toHaveLength(1);
    // pad = strokeWidth / 2 + slop = 1 + 4
    expect(boxes[0]).toEqual({ x: -5, y: -5, width: 20, height: 10 });
  });

  it('a long edge splits into several tight boxes, capped at 8', () => {
    const boxes = connectorHitBoxes([{ x: 0, y: 0 }, { x: 5000, y: 0 }], 1);
    expect(boxes.length).toBeGreaterThan(1);
    expect(boxes.length).toBeLessThanOrEqual(8);
    // Tight: no single box spans the whole edge.
    expect(Math.max(...boxes.map((b) => b.width))).toBeLessThan(5000);
  });

  it('a degenerate path still yields a box rather than throwing', () => {
    expect(connectorHitBoxes([], 1)).toHaveLength(1);
    expect(connectorHitBoxes([{ x: 3, y: 4 }], 1)).toHaveLength(1);
  });
});
