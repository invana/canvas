/**
 * Step 2 tests — built-in `circle` and `rect` shapes auto-register and
 * round-trip through the renderer's add/update/remove path.
 */

import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { SubLayer } from '../../../src/layers/SubLayer';
import { ShapesRenderer } from '../../../src/renderers/ShapesRenderer';
import type { CircleShapeSpec } from '../../../src/renderers/shapes/CircleShape';
import type { RectShapeSpec } from '../../../src/renderers/shapes/RectShape';
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
  const renderer = new ShapesRenderer({ subLayer, camera });
  return { renderer, subLayer };
}

describe('Built-in shapes — circle', () => {
  it('auto-registers under kind "circle"', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addShape<CircleShapeSpec>('c-1', {
        kind: 'circle',
        x: 0,
        y: 0,
        r: 12,
        fill: 0xff0000,
      }),
    ).not.toThrow();
  });

  it('positions the gfx at spec (x, y) and yields a centered local bbox', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<CircleShapeSpec>('c-1', {
      kind: 'circle',
      x: 100,
      y: 50,
      r: 8,
      fill: 0x00ff00,
    });

    // Circle at (100, 50), r=8. Precise hit: distance ≤ r.
    expect(renderer.hitTest(100, 50)?.id).toBe('c-1');
    expect(renderer.hitTest(105, 50)?.id).toBe('c-1');
    expect(renderer.hitTest(100, 57)?.id).toBe('c-1');
    // Bbox corner (108, 58) is OUTSIDE the circle → no hit (precision).
    expect(renderer.hitTest(108, 58)).toBeNull();
    expect(renderer.hitTest(120, 50)).toBeNull();
  });

  it('updateShape re-syncs hit index when r changes', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<CircleShapeSpec>('c-1', { kind: 'circle', x: 0, y: 0, r: 5 });
    expect(renderer.hitTest(8, 0)).toBeNull();

    renderer.updateShape<CircleShapeSpec>('c-1', { r: 12 });
    expect(renderer.hitTest(8, 0)?.id).toBe('c-1');
  });
});

describe('Built-in shapes — rect', () => {
  it('auto-registers under kind "rect"', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addShape<RectShapeSpec>('r-1', {
        kind: 'rect',
        x: 0,
        y: 0,
        width: 40,
        height: 20,
        fill: 0x0000ff,
      }),
    ).not.toThrow();
  });

  it('treats (x, y) as center; bbox spans (x ± w/2, y ± h/2)', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<RectShapeSpec>('r-1', {
      kind: 'rect',
      x: 50,
      y: 30,
      width: 40,
      height: 20,
    });

    // Span: x ∈ [30, 70], y ∈ [20, 40].
    expect(renderer.hitTest(50, 30)?.id).toBe('r-1');
    expect(renderer.hitTest(31, 21)?.id).toBe('r-1');
    expect(renderer.hitTest(69, 39)?.id).toBe('r-1');
    expect(renderer.hitTest(75, 30)).toBeNull();
  });

  it('cornerRadius does not change bbox', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<RectShapeSpec>('r-1', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 40,
      height: 40,
      cornerRadius: 8,
    });
    expect(renderer.hitTest(-19, -19)?.id).toBe('r-1');
    expect(renderer.hitTest(19, 19)?.id).toBe('r-1');
  });

  it('fill-only and stroke-only specs both render without throwing', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<RectShapeSpec>('fill', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: 0xff00ff,
    });
    renderer.addShape<RectShapeSpec>('stroke', {
      kind: 'rect',
      x: 100,
      y: 0,
      width: 10,
      height: 10,
      stroke: 0x00ffff,
      strokeWidth: 2,
    });
    expect(renderer.shapeCount).toBe(2);
  });

  it('removeShape destroys the gfx tree', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<RectShapeSpec>('r-1', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: 0,
    });
    expect(renderer.shapeCount).toBe(1);
    renderer.removeShape('r-1');
    expect(renderer.shapeCount).toBe(0);
  });
});

describe('Built-ins + custom registration co-exist', () => {
  it('overriding a built-in via registerShape replaces it (last-wins)', () => {
    const { renderer } = makeRenderer();
    let constructed = false;
    class CustomCircle {
      readonly gfx = new Container();
      constructor() {
        constructed = true;
      }
      draw(): void {}
      bounds() {
        return { x: 0, y: 0, width: 1, height: 1 };
      }
      destroy() {
        this.gfx.destroy();
      }
    }
    renderer.registerShape('circle', CustomCircle as never);
    renderer.addShape<CircleShapeSpec>('c-1', { kind: 'circle', x: 0, y: 0, r: 5 });
    expect(constructed).toBe(true);
  });
});
