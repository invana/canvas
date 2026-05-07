/**
 * Step 4 tests — built-in routers (straight, orthogonal, bezier),
 * connectors (line, curve), and shape-as-marker rendering (markers are
 * registered shapes painted into the connector's Graphics via
 * `ShapeCtor.paintInto`).
 */

import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { ShapesRenderer } from '../../../src/renderers/ShapesRenderer';
import type { LineConnectorSpec } from '../../../src/renderers/connectors/LineConnector';
import type { CurveConnectorSpec } from '../../../src/renderers/connectors/CurveConnector';
import {
  arrowMarkerSpec,
  circleMarkerSpec,
  diamondMarkerSpec,
  squareMarkerSpec,
} from '../../../src/renderers/markers/markers';
import { straightRouter } from '../../../src/renderers/routers/straight';
import { orthogonalRouter } from '../../../src/renderers/routers/orthogonal';
import { bezierRouter } from '../../../src/renderers/routers/bezier';
import { makeTestScene } from '../../_helpers/makeWorld';

function makeRenderer() {
  const bus = new CanvasEventBus();
  const { world } = makeTestScene();
  const root = new Container({ isRenderGroup: true });
  root.label = 'test';
  world.addChild(root);
  const camera = new Camera({
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  const renderer = new ShapesRenderer({ container: root, camera });
  return { renderer, root };
}

// ─── Routers (pure-fn unit tests) ──────────────────────────────────────────

describe('straightRouter', () => {
  it('returns the two endpoints unchanged', () => {
    const out = straightRouter({ x: 0, y: 0 }, { x: 100, y: 50 });
    expect(out).toEqual([
      { x: 0, y: 0 },
      { x: 100, y: 50 },
    ]);
  });
});

describe('orthogonalRouter', () => {
  it('produces a 4-point L for diagonal endpoints, horizontal-first when |dx| ≥ |dy|', () => {
    const out = orthogonalRouter({ x: 0, y: 0 }, { x: 100, y: 30 });
    expect(out.length).toBe(4);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[3]).toEqual({ x: 100, y: 30 });
    expect(out[1]?.x).toBe(50);
    expect(out[1]?.y).toBe(0);
    expect(out[2]?.x).toBe(50);
    expect(out[2]?.y).toBe(30);
  });

  it('vertical-first when |dy| > |dx|', () => {
    const out = orthogonalRouter({ x: 0, y: 0 }, { x: 30, y: 100 });
    expect(out.length).toBe(4);
    expect(out[1]?.x).toBe(0);
    expect(out[1]?.y).toBe(50);
    expect(out[2]?.x).toBe(30);
    expect(out[2]?.y).toBe(50);
  });

  it('collapses to 2 points when endpoints share an axis', () => {
    expect(orthogonalRouter({ x: 0, y: 0 }, { x: 100, y: 0 }).length).toBe(2);
    expect(orthogonalRouter({ x: 0, y: 0 }, { x: 0, y: 100 }).length).toBe(2);
  });
});

describe('bezierRouter', () => {
  it('returns samples+1 points by default (17 with default samples=16)', () => {
    const out = bezierRouter({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(out.length).toBe(17);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[16]?.x).toBeCloseTo(100, 5);
    expect(out[16]?.y).toBeCloseTo(0, 5);
  });

  it('honours opts.samples', () => {
    const out = bezierRouter({ x: 0, y: 0 }, { x: 10, y: 0 }, { samples: 4 });
    expect(out.length).toBe(5);
  });

  it('uses endpoint tangents when provided', () => {
    // Tangent pointing straight down at start, straight up at end.
    const out = bezierRouter(
      { x: 0, y: 0, tangent: { x: 0, y: 1 } },
      { x: 100, y: 0, tangent: { x: 0, y: -1 } },
      { samples: 8 },
    );
    // Mid-point should be pulled DOWN by the tangent setup.
    const mid = out[4]!;
    expect(mid.y).toBeGreaterThan(0);
  });
});

// ─── Connectors ────────────────────────────────────────────────────────────

describe('LineConnector', () => {
  it('auto-registers under kind "line"', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addConnector<LineConnectorSpec>('e-1', {
        kind: 'line',
        source: { kind: 'point', x: 0, y: 0 },
        target: { kind: 'point', x: 50, y: 50 },
        stroke: 0x000000,
        strokeWidth: 2,
      }),
    ).not.toThrow();
  });

  it('routes via the named router (orthogonal yields a 4-point polyline)', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 80, y: 40 },
      stroke: 0,
      strokeWidth: 1,
      router: 'orthogonal',
    });
    expect(renderer.hasConnector('e-1')).toBe(true);
  });
});

describe('CurveConnector', () => {
  it('auto-registers under kind "curve"', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addConnector<CurveConnectorSpec>('e-1', {
        kind: 'curve',
        source: { kind: 'point', x: 0, y: 0 },
        target: { kind: 'point', x: 100, y: 0 },
        stroke: 0,
        strokeWidth: 2,
        router: 'bezier',
      }),
    ).not.toThrow();
  });
});

// ─── Markers (shape-as-marker) ─────────────────────────────────────────────

describe('Markers', () => {
  it('all four built-in marker shapes paint into the connector Graphics', () => {
    const { renderer, root } = makeRenderer();
    const builders = [arrowMarkerSpec, circleMarkerSpec, squareMarkerSpec, diamondMarkerSpec];
    for (const [i, builder] of builders.entries()) {
      renderer.addConnector<LineConnectorSpec>(`e-${i}`, {
        kind: 'line',
        source: { kind: 'point', x: i * 100, y: 0 },
        target: { kind: 'point', x: i * 100 + 50, y: 0 },
        stroke: 0,
        strokeWidth: 1,
        targetMarker: builder(6, { color: 0xff0000 }),
      });
    }
    // Markers paint inline into each connector's Graphics — only the four
    // connector containers attach to the renderer's surface.
    expect(root.children.length).toBe(4);
  });

  it('source + target markers paint as one drawing', () => {
    const { renderer, root } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 50, y: 0 },
      stroke: 0,
      strokeWidth: 1,
      sourceMarker: circleMarkerSpec(6),
      targetMarker: arrowMarkerSpec(8),
    });
    // Connector + path-and-markers Graphics are one container — root has 1.
    expect(root.children.length).toBe(1);
  });

  it('updateConnector swapping marker shape repaints inline', () => {
    const { renderer, root } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 50, y: 0 },
      stroke: 0,
      strokeWidth: 1,
      targetMarker: circleMarkerSpec(6),
    });
    expect(root.children.length).toBe(1);
    renderer.updateConnector<LineConnectorSpec>('e-1', { targetMarker: diamondMarkerSpec(8) });
    expect(root.children.length).toBe(1);
  });

  it('removeConnector tears down the connector cleanly', () => {
    const { renderer, root } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 50, y: 0 },
      stroke: 0,
      strokeWidth: 1,
      sourceMarker: circleMarkerSpec(6),
      targetMarker: arrowMarkerSpec(8),
    });
    expect(root.children.length).toBe(1);
    renderer.removeConnector('e-1');
    expect(root.children.length).toBe(0);
  });

  it('marker referencing an unregistered shape kind throws', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addConnector<LineConnectorSpec>('e-1', {
        kind: 'line',
        source: { kind: 'point', x: 0, y: 0 },
        target: { kind: 'point', x: 50, y: 0 },
        stroke: 0,
        strokeWidth: 1,
        targetMarker: { kind: 'spaceship' } as never,
      }),
    ).toThrow(/unregistered shape kind/);
  });
});
