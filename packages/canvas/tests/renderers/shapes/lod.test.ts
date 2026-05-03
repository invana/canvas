/**
 * Step 8 tests — `setLODLevel` and `rasteriseLabel` primitives.
 */

import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { SubLayer } from '../../../src/lifecycle/SubLayer';
import { ShapesRenderer } from '../../../src/renderers/shapes/ShapesRenderer';
import type { CircleShapeSpec } from '../../../src/renderers/shapes/shapes/CircleShape';
import type { TextShapeSpec } from '../../../src/renderers/shapes/shapes/TextShape';
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

describe('setLODLevel — default fallback (visibility toggle)', () => {
  it('level 0 hides the shape gfx; level ≥ 1 shows it', () => {
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

    expect(inst.shape.gfx.visible).toBe(true);
    renderer.setLODLevel('s-1', 0);
    expect(inst.shape.gfx.visible).toBe(false);
    renderer.setLODLevel('s-1', 1);
    expect(inst.shape.gfx.visible).toBe(true);
  });

  it('unknown id is a silent no-op', () => {
    const { renderer } = makeRenderer();
    expect(() => renderer.setLODLevel('missing', 0)).not.toThrow();
  });

  it('shape implementing setLODLevel takes precedence over default', () => {
    const { renderer } = makeRenderer();
    let captured = -1;
    class CustomShape {
      readonly gfx = new Container();
      constructor() {}
      draw() {}
      bounds() {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      destroy() {
        this.gfx.destroy();
      }
      setLODLevel(level: number) {
        captured = level;
      }
    }
    renderer.registerShape('custom', CustomShape as never);
    renderer.addShape('s-1', { kind: 'custom', x: 0, y: 0 } as never);
    renderer.setLODLevel('s-1', 7);
    expect(captured).toBe(7);
  });
});

describe('rasteriseLabel — TextShape resolution', () => {
  it('forwards to TextShape.setLabelResolution', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<TextShapeSpec>('t-1', {
      kind: 'text',
      x: 0,
      y: 0,
      text: 'Hello',
      style: { fontSize: 14, fill: 0 },
      resolution: 1,
    });
    const inst = (renderer as unknown as {
      shapeInstances: Map<string, { shape: { setLabelResolution?: (r: number) => void } }>;
    }).shapeInstances.get('t-1')!;
    expect(typeof inst.shape.setLabelResolution).toBe('function');

    expect(() => renderer.rasteriseLabel('t-1', 2)).not.toThrow();
    expect(() => renderer.rasteriseLabel('t-1', 2)).not.toThrow(); // idempotent
  });

  it('non-text shapes silently ignore rasteriseLabel', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<CircleShapeSpec>('s-1', {
      kind: 'circle',
      x: 0,
      y: 0,
      r: 10,
      fill: 0xff0000,
    });
    expect(() => renderer.rasteriseLabel('s-1', 2)).not.toThrow();
  });

  it('unknown id is a silent no-op', () => {
    const { renderer } = makeRenderer();
    expect(() => renderer.rasteriseLabel('missing', 2)).not.toThrow();
  });
});
