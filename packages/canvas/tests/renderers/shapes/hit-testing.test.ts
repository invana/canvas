/**
 * Step 7 tests — precise hit-testing for shapes + connectors and pointer
 * event forwarding through `renderer.events`.
 */

import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { SubLayer } from '../../../src/lifecycle/SubLayer';
import { ShapesRenderer } from '../../../src/renderers/ShapesRenderer';
import type { CircleShapeSpec } from '../../../src/renderers/CircleShape';
import type { LineConnectorSpec } from '../../../src/renderers/connectors/LineConnector';
import { makeTestScene } from '../../_helpers/makeWorld';

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
  return { renderer: new ShapesRenderer({ subLayer, camera }) };
}

describe('Connector precise hit-testing', () => {
  it('hits when point is on the polyline', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 0 },
      stroke: 0,
      strokeWidth: 2,
    });
    expect(renderer.hitTest(50, 0)?.id).toBe('e-1');
    expect(renderer.hitTest(50, 0)?.kind).toBe('connector');
  });

  it('misses when point is outside the stroke + slop tolerance', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 0 },
      stroke: 0,
      strokeWidth: 2, // tolerance = 2/2 + 4 = 5 px
    });
    expect(renderer.hitTest(50, 4)?.id).toBe('e-1'); // within 5
    expect(renderer.hitTest(50, 10)).toBeNull(); // outside 5
  });

  it('orthogonal-routed connector: hit on the elbow segment', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 100 },
      stroke: 0,
      strokeWidth: 2,
      router: 'orthogonal',
    });
    // Polyline: (0,0) → (50,0) → (50,100) → (100,100). Hit on the vertical leg.
    expect(renderer.hitTest(50, 50)?.id).toBe('e-1');
  });

  it('removeConnector clears hit-index entry', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 0 },
      stroke: 0,
      strokeWidth: 2,
    });
    expect(renderer.hitTest(50, 0)?.id).toBe('e-1');
    renderer.removeConnector('e-1');
    expect(renderer.hitTest(50, 0)).toBeNull();
  });

  it('updateConnector re-routes and re-indexes', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 0 },
      stroke: 0,
      strokeWidth: 2,
    });
    expect(renderer.hitTest(50, 0)?.id).toBe('e-1');

    renderer.updateConnector<LineConnectorSpec>('e-1', {
      target: { kind: 'point', x: 200, y: 200 },
    });
    expect(renderer.hitTest(50, 0)).toBeNull();
    // New polyline goes through (100, 100).
    expect(renderer.hitTest(100, 100)?.id).toBe('e-1');
  });
});

describe('Shape vs connector hit precedence', () => {
  it('shape wins over an underlying connector at the same point', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 50 },
      target: { kind: 'point', x: 100, y: 50 },
      stroke: 0,
      strokeWidth: 2,
      zIndex: 0,
    });
    renderer.addShape<CircleShapeSpec>('s-1', {
      kind: 'circle',
      x: 50,
      y: 50,
      r: 8,
      fill: 0xff0000,
      zIndex: 5,
    });
    expect(renderer.hitTest(50, 50)?.id).toBe('s-1');
  });
});

describe('Pointer event wiring', () => {
  it('shape pointerover/pointerdown/click forward through renderer.events', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<CircleShapeSpec>('s-1', {
      kind: 'circle',
      x: 0,
      y: 0,
      r: 10,
      fill: 0xff0000,
    });

    const seen: string[] = [];
    renderer.events.on('shape:pointerover', (e) => seen.push(`over:${e.id}`));
    renderer.events.on('shape:pointerdown', (e) => seen.push(`down:${e.id}`));
    renderer.events.on('shape:click', (e) => seen.push(`click:${e.id}`));

    // Drive synthetic pixi events directly. Pixi's federated event model
    // dispatches by emitting on the target's eventEmitter — we just verify
    // the listener path by emitting through the shape's gfx.
    const inst = (renderer as unknown as {
      shapeInstances: Map<string, { shape: { gfx: Container } }>;
    }).shapeInstances.get('s-1')!;
    const gfx = inst.shape.gfx;

    // Use the Container's emit path with a minimal event shape — our
    // listener body only reads `global.x` / `global.y` and `button`.
    const fakeEvent = { global: { x: 0, y: 0 }, button: 0 };
    gfx.emit('pointerover', fakeEvent as never);
    gfx.emit('pointerdown', fakeEvent as never);
    gfx.emit('click', fakeEvent as never);

    expect(seen).toEqual(['over:s-1', 'down:s-1', 'click:s-1']);
  });

  it('connector pointer events forward with the connector id', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 100, y: 0 },
      stroke: 0,
      strokeWidth: 2,
    });

    const seen: string[] = [];
    renderer.events.on('connector:click', (e) => seen.push(`click:${e.id}`));

    const inst = (renderer as unknown as {
      connectorInstances: Map<string, { connector: { gfx: Container } }>;
    }).connectorInstances.get('e-1')!;
    inst.connector.gfx.emit('click', { global: { x: 50, y: 0 }, button: 0 } as never);

    expect(seen).toEqual(['click:e-1']);
  });

  it('eventMode is set to static so pixi performs hit testing', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<CircleShapeSpec>('s-1', {
      kind: 'circle',
      x: 0,
      y: 0,
      r: 10,
      fill: 0xff0000,
    });
    const inst = (renderer as unknown as {
      shapeInstances: Map<string, { shape: { gfx: Container } }>;
    }).shapeInstances.get('s-1')!;
    expect(inst.shape.gfx.eventMode).toBe('static');
  });
});
