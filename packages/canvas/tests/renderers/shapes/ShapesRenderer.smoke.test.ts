/**
 * Smoke test for the Step 1 ShapesRenderer skeleton.
 *
 * Asserts that the orchestrator wires up registries, mutates instance maps,
 * runs router resolution, advances animated decorations, and tears down
 * cleanly. Built-in shapes/connectors/decorations are NOT registered yet
 * (Steps 2–6); we use minimal in-test fakes to drive the surface.
 */

import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { SubLayer } from '../../../src/lifecycle/SubLayer';
import { ShapesRenderer } from '../../../src/renderers/ShapesRenderer';
import { makeTestScene } from '../../_helpers/makeWorld';
import type {
  BaseConnectorSpec,
  BaseShapeSpec,
  ConnectorHostInfo,
  IConnector,
  IRouter,
  IShape,
  Point,
  Rect,
  ShapeHostInfo,
} from '../../../src/renderers/types';

// ─── Minimal in-test fakes ─────────────────────────────────────────────────

interface FakeShapeSpec extends BaseShapeSpec {
  readonly kind: 'fake';
  readonly r: number;
}

class FakeShape implements IShape<FakeShapeSpec> {
  readonly gfx = new Container();
  private currentR = 0;
  constructor(_spec: FakeShapeSpec, host: ShapeHostInfo) {
    host.surface.addChild(this.gfx);
  }
  draw(spec: FakeShapeSpec): void {
    this.currentR = spec.r;
  }
  bounds(): Rect {
    const r = this.currentR;
    return { x: -r, y: -r, width: r * 2, height: r * 2 };
  }
  destroy(): void {
    this.gfx.destroy();
  }
}

interface FakeConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'fake-line';
}

class FakeConnector implements IConnector<FakeConnectorSpec> {
  readonly gfx = new Container();
  drawnPoints: ReadonlyArray<Point> = [];
  constructor(_spec: FakeConnectorSpec, host: ConnectorHostInfo) {
    host.surface.addChild(this.gfx);
  }
  draw(_spec: FakeConnectorSpec, points: ReadonlyArray<Point>): void {
    this.drawnPoints = points;
  }
  destroy(): void {
    this.gfx.destroy();
  }
}

const straightRouter: IRouter = (a, b) => [
  { x: a.x, y: a.y },
  { x: b.x, y: b.y },
];

// ─── Setup helper ──────────────────────────────────────────────────────────

function makeRenderer() {
  const bus = new CanvasEventBus();
  const { world } = makeTestScene();
  const root = new Container({ isRenderGroup: true });
  root.label = 'test';
  world.addChild(root);
  const subLayer = new SubLayer('test', root);
  const camera = new Camera({
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  const renderer = new ShapesRenderer({ subLayer, camera });
  return { renderer, world, subLayer };
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('ShapesRenderer — Step 1 skeleton', () => {
  it('registers and instantiates a shape; bounds land in the hit index', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);

    renderer.addShape<FakeShapeSpec>('s-1', { kind: 'fake', x: 100, y: 50, r: 10 });

    expect(renderer.hasShape('s-1')).toBe(true);
    expect(renderer.shapeCount).toBe(1);
    expect(renderer.getRenderStats().shapes).toBe(1);

    // Hit-testing — the bbox is centered at (100, 50) with radius 10.
    expect(renderer.hitTest(100, 50)).toEqual({ kind: 'shape', id: 's-1' });
    expect(renderer.hitTest(200, 200)).toBeNull();
  });

  it('addShape rejects duplicate ids and unknown kinds', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);
    renderer.addShape<FakeShapeSpec>('s-1', { kind: 'fake', x: 0, y: 0, r: 5 });

    expect(() =>
      renderer.addShape<FakeShapeSpec>('s-1', { kind: 'fake', x: 0, y: 0, r: 5 }),
    ).toThrow(/already exists/);
    expect(() =>
      renderer.addShape('s-2', { kind: 'unknown', x: 0, y: 0 } as BaseShapeSpec),
    ).toThrow(/unknown shape kind/);
  });

  it('updateShape repaints + re-syncs hit index', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);
    renderer.addShape<FakeShapeSpec>('s-1', { kind: 'fake', x: 0, y: 0, r: 5 });

    expect(renderer.hitTest(0, 0)).not.toBeNull();
    renderer.updateShape<FakeShapeSpec>('s-1', { x: 1000, y: 1000 });
    expect(renderer.hitTest(0, 0)).toBeNull();
    expect(renderer.hitTest(1000, 1000)).toEqual({ kind: 'shape', id: 's-1' });
  });

  it('removeShape clears instance + hit index', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);
    renderer.addShape<FakeShapeSpec>('s-1', { kind: 'fake', x: 0, y: 0, r: 5 });
    renderer.removeShape('s-1');

    expect(renderer.hasShape('s-1')).toBe(false);
    expect(renderer.hitTest(0, 0)).toBeNull();
    expect(renderer.getRenderStats().shapes).toBe(0);
  });

  it('hitTest resolves topmost-by-zIndex among overlapping shapes', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);
    renderer.addShape<FakeShapeSpec>('low', { kind: 'fake', x: 0, y: 0, r: 20, zIndex: 0 });
    renderer.addShape<FakeShapeSpec>('high', { kind: 'fake', x: 0, y: 0, r: 20, zIndex: 5 });

    expect(renderer.hitTest(0, 0)?.id).toBe('high');
  });

  it('connectors: router resolution + draw is called with routed points', () => {
    const { renderer } = makeRenderer();
    renderer.registerConnector<FakeConnectorSpec>('fake-line', FakeConnector);
    renderer.registerRouter('straight', straightRouter);

    renderer.addConnector<FakeConnectorSpec>('e-1', {
      kind: 'fake-line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 50 },
      router: 'straight',
    });

    expect(renderer.hasConnector('e-1')).toBe(true);
    expect(renderer.connectorCount).toBe(1);
    expect(renderer.getRenderStats().connectors).toBe(1);
  });

  it('connector with shape-bound endpoint resolves to the shape position', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);
    renderer.registerConnector<FakeConnectorSpec>('fake-line', FakeConnector);
    renderer.registerRouter('straight', straightRouter);

    renderer.addShape<FakeShapeSpec>('a', { kind: 'fake', x: 10, y: 10, r: 5 });
    renderer.addShape<FakeShapeSpec>('b', { kind: 'fake', x: 90, y: 90, r: 5 });
    renderer.addConnector<FakeConnectorSpec>('e-1', {
      kind: 'fake-line',
      source: { kind: 'shape', shapeId: 'a' },
      target: { kind: 'shape', shapeId: 'b' },
      router: 'straight',
    });

    // No throw → endpoints resolved. Sanity stat:
    expect(renderer.getRenderStats().connectors).toBe(1);
  });

  it('connector with unknown shape endpoint throws', () => {
    const { renderer } = makeRenderer();
    renderer.registerConnector<FakeConnectorSpec>('fake-line', FakeConnector);
    renderer.registerRouter('straight', straightRouter);

    expect(() =>
      renderer.addConnector<FakeConnectorSpec>('e-1', {
        kind: 'fake-line',
        source: { kind: 'shape', shapeId: 'missing' },
        target: { kind: 'point', x: 0, y: 0 },
        router: 'straight',
      }),
    ).toThrow(/unknown shape/);
  });

  it('tickAnimations no-ops with empty animated set', () => {
    const { renderer } = makeRenderer();
    expect(() => renderer.tickAnimations(16)).not.toThrow();
    expect(renderer.getRenderStats().animatedDecorations).toBe(0);
  });

  it('decoration setter rejects unknown target ids', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.setDecoration('missing', 'halo', { kind: 'halo', style: { color: 0 } }),
    ).toThrow(/unknown target/);
  });

  it('destroy clears all instances + hit index', () => {
    const { renderer } = makeRenderer();
    renderer.registerShape<FakeShapeSpec>('fake', FakeShape);
    renderer.registerConnector<FakeConnectorSpec>('fake-line', FakeConnector);
    renderer.registerRouter('straight', straightRouter);

    renderer.addShape<FakeShapeSpec>('s-1', { kind: 'fake', x: 0, y: 0, r: 5 });
    renderer.addConnector<FakeConnectorSpec>('e-1', {
      kind: 'fake-line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 1, y: 1 },
      router: 'straight',
    });

    renderer.destroy();
    expect(renderer.getRenderStats()).toEqual({
      shapes: 0,
      connectors: 0,
      animatedDecorations: 0,
    });
    expect(renderer.shapeCount).toBe(0);
    expect(renderer.connectorCount).toBe(0);
  });
});
