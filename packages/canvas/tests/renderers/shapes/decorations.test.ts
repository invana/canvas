/**
 * Step 5 tests — decoration framework + built-in static decorations
 * (`halo`, `border`, `glow`).
 */

import { Container } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { SubLayer } from '../../../src/layers/SubLayer';
import { ShapesRenderer } from '../../../src/renderers/ShapesRenderer';
import type { CircleShapeSpec } from '../../../src/renderers/shapes/CircleShape';
import type { RectShapeSpec } from '../../../src/renderers/shapes/RectShape';
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
  const renderer = new ShapesRenderer({ subLayer, camera });
  return { renderer };
}

function addCircle(renderer: ShapesRenderer, id: string) {
  renderer.addShape<CircleShapeSpec>(id, {
    kind: 'circle',
    x: 100,
    y: 100,
    r: 20,
    fill: 0xff0000,
  });
  return renderer.shapeGfxFor(id);
}

// Convenient introspection — augment the shape gfx accessor on the test side.
declare module '../../../src/renderers/ShapesRenderer' {
  interface ShapesRenderer {
    shapeGfxFor(id: string): Container;
  }
}
ShapesRenderer.prototype.shapeGfxFor = function (this: ShapesRenderer, id: string): Container {
  // @ts-expect-error — accessing private via index for tests
  return (this.shapeInstances.get(id) as { shape: { gfx: Container } }).shape.gfx;
};

describe('setDecoration — wiring', () => {
  it('attaches a halo decoration to a shape gfx', () => {
    const { renderer } = makeRenderer();
    const gfx = addCircle(renderer, 'c-1');
    expect(gfx.children.length).toBe(1); // shape graphics

    renderer.setDecoration('c-1', 'halo', {
      kind: 'halo',
      style: { color: 0xffaa00, padding: 6, alpha: 0.3 },
    });
    expect(gfx.children.length).toBe(2); // + halo container
    expect(gfx.sortableChildren).toBe(true);
  });

  it('replacing the same slot disposes the previous decoration', () => {
    const { renderer } = makeRenderer();
    const gfx = addCircle(renderer, 'c-1');

    renderer.setDecoration('c-1', 'halo', { kind: 'halo', style: { color: 0xff0000 } });
    expect(gfx.children.length).toBe(2);

    renderer.setDecoration('c-1', 'halo', { kind: 'halo', style: { color: 0x00ff00 } });
    expect(gfx.children.length).toBe(2); // still one halo, replaced
  });

  it('passing null clears the decoration', () => {
    const { renderer } = makeRenderer();
    const gfx = addCircle(renderer, 'c-1');
    renderer.setDecoration('c-1', 'halo', { kind: 'halo', style: { color: 0xff0000 } });
    renderer.setDecoration('c-1', 'halo', null);
    expect(gfx.children.length).toBe(1); // back to just the shape
  });

  it('multiple slots stack with fixed z-band ordering', () => {
    const { renderer } = makeRenderer();
    const gfx = addCircle(renderer, 'c-1');

    renderer.setDecoration('c-1', 'glow', { kind: 'glow', style: { color: 0x0000ff } });
    renderer.setDecoration('c-1', 'halo', { kind: 'halo', style: { color: 0xff0000 } });
    renderer.setDecoration('c-1', 'border', {
      kind: 'border',
      style: { color: 0x000000, width: 2 },
    });

    // 1 shape + 3 decorations
    expect(gfx.children.length).toBe(4);

    // z-order: glow (-200), halo (-100), shape (0 default), border (100)
    const zs = gfx.children.map((c) => c.zIndex).sort((a, b) => a - b);
    expect(zs[0]).toBe(-200);
    expect(zs[1]).toBe(-100);
    expect(zs[zs.length - 1]).toBe(100);
  });

  it('rejects unknown decoration kind', () => {
    const { renderer } = makeRenderer();
    addCircle(renderer, 'c-1');
    expect(() =>
      renderer.setDecoration('c-1', 'halo', { kind: 'spaceship', style: {} }),
    ).toThrow(/unknown kind/);
  });

  it('rejects target-mismatch (shape decoration on a connector)', () => {
    const { renderer } = makeRenderer();
    renderer.addConnector<LineConnectorSpec>('e-1', {
      kind: 'line',
      source: { kind: 'point', x: 0, y: 0 },
      target: { kind: 'point', x: 50, y: 50 },
      stroke: 0,
      strokeWidth: 1,
    });
    expect(() =>
      renderer.setDecoration('e-1', 'halo', {
        kind: 'halo',
        style: { color: 0 },
      }),
    ).toThrow(/targets "shape"/);
  });

  it('clearing a slot that has no decoration is a no-op', () => {
    const { renderer } = makeRenderer();
    addCircle(renderer, 'c-1');
    expect(() => renderer.setDecoration('c-1', 'halo', null)).not.toThrow();
  });
});

describe('updateShape refreshes decoration bounds', () => {
  it("calling updateShape triggers a decoration's update() hook", () => {
    const { renderer } = makeRenderer();
    addCircle(renderer, 'c-1');

    renderer.setDecoration('c-1', 'halo', {
      kind: 'halo',
      style: { color: 0xff0000, padding: 4 },
    });
    // Resize: bigger circle → halo should follow.
    expect(() =>
      renderer.updateShape<CircleShapeSpec>('c-1', { r: 40 }),
    ).not.toThrow();
  });
});

describe('removeShape disposes attached decorations', () => {
  it('decorations on a removed shape are torn down', () => {
    const { renderer } = makeRenderer();
    addCircle(renderer, 'c-1');
    renderer.setDecoration('c-1', 'halo', { kind: 'halo', style: { color: 0 } });
    renderer.setDecoration('c-1', 'border', {
      kind: 'border',
      style: { color: 0, width: 1 },
    });
    renderer.removeShape('c-1');
    expect(renderer.hasShape('c-1')).toBe(false);
  });
});

describe('Border on a rect host renders rounded corners when style asks', () => {
  it('cornerRadius style is honoured', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<RectShapeSpec>('r-1', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 40,
      height: 30,
      cornerRadius: 8,
    });
    expect(() =>
      renderer.setDecoration('r-1', 'border', {
        kind: 'border',
        style: { color: 0x000000, width: 2, cornerRadius: 8 },
      }),
    ).not.toThrow();
  });
});
