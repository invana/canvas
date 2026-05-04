/**
 * Step 3 tests — `ellipse`, `polygon`, `path`, `image`, `text` built-ins.
 *
 * Focus: each shape registers under the right kind, computes a sensible
 * local-space AABB (via the renderer's hit-test), and accepts add/update.
 * Visual fidelity is out of scope for these tests — that's covered in the
 * storybook playground (Step 5+).
 */

import { Container, Texture } from 'pixi.js';
import { describe, expect, it } from 'vitest';

import { Camera } from '../../../src/camera/Camera';
import { CanvasEventBus } from '../../../src/events/CanvasEventBus';
import { SubLayer } from '../../../src/layers/SubLayer';
import { ShapesRenderer } from '../../../src/renderers/ShapesRenderer';
import type { EllipseShapeSpec } from '../../../src/renderers/shapes/EllipseShape';
import type { PolygonShapeSpec } from '../../../src/renderers/shapes/PolygonShape';
import type {
  PathCommand,
  PathShapeSpec,
} from '../../../src/renderers/shapes/PathShape';
import type { ImageShapeSpec } from '../../../src/renderers/shapes/ImageShape';
import type { TextShapeSpec } from '../../../src/renderers/shapes/TextShape';
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

describe('EllipseShape', () => {
  it('precise containment: inside ellipse hits, outside misses', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<EllipseShapeSpec>('e-1', {
      kind: 'ellipse',
      x: 50,
      y: 30,
      rx: 20,
      ry: 10,
      fill: 0xff0000,
    });
    // Center hit
    expect(renderer.hitTest(50, 30)?.id).toBe('e-1');
    // On the long axis, near the rim
    expect(renderer.hitTest(65, 30)?.id).toBe('e-1');
    // Bbox corner (70, 40) is OUTSIDE the ellipse (nx²+ny² = 2)
    expect(renderer.hitTest(70, 40)).toBeNull();
    // Far outside
    expect(renderer.hitTest(75, 30)).toBeNull();
  });

  it('updateShape re-syncs the bbox when ry changes', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<EllipseShapeSpec>('e-1', {
      kind: 'ellipse',
      x: 0,
      y: 0,
      rx: 10,
      ry: 5,
    });
    expect(renderer.hitTest(0, 8)).toBeNull();
    renderer.updateShape<EllipseShapeSpec>('e-1', { ry: 12 });
    expect(renderer.hitTest(0, 8)?.id).toBe('e-1');
  });
});

describe('PolygonShape', () => {
  it('precise containment: even-odd point-in-polygon', () => {
    const { renderer } = makeRenderer();
    // Upward-apex triangle anchored at world (100, 100).
    // Local apex (0, -10); base from (-10, 10) to (10, 10).
    renderer.addShape<PolygonShapeSpec>('p-1', {
      kind: 'polygon',
      x: 100,
      y: 100,
      points: [
        { x: -10, y: 10 },
        { x: 10, y: 10 },
        { x: 0, y: -10 },
      ],
      fill: 0x00ff00,
    });
    // Center is inside.
    expect(renderer.hitTest(100, 100)?.id).toBe('p-1');
    // Just below apex is inside.
    expect(renderer.hitTest(100, 95)?.id).toBe('p-1');
    // Bbox corner (91, 91) is in the upper-LEFT empty wedge → no hit.
    expect(renderer.hitTest(91, 91)).toBeNull();
    // Below the base is outside the bbox entirely.
    expect(renderer.hitTest(100, 120)).toBeNull();
    // Far right outside everything.
    expect(renderer.hitTest(120, 100)).toBeNull();
  });

  it('renders nothing for < 3 points but does not throw', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addShape<PolygonShapeSpec>('p-1', {
        kind: 'polygon',
        x: 0,
        y: 0,
        points: [{ x: 0, y: 0 }],
      }),
    ).not.toThrow();
    expect(renderer.shapeCount).toBe(1);
  });
});

describe('PathShape', () => {
  it('bbox covers all on-curve endpoints', () => {
    const { renderer } = makeRenderer();
    const commands: PathCommand[] = [
      { kind: 'moveTo', x: 0, y: 0 },
      { kind: 'lineTo', x: 30, y: 0 },
      { kind: 'lineTo', x: 30, y: 20 },
      { kind: 'lineTo', x: 0, y: 20 },
      { kind: 'close' },
    ];
    renderer.addShape<PathShapeSpec>('pa-1', {
      kind: 'path',
      x: 100,
      y: 200,
      commands,
      stroke: 0xff00ff,
      strokeWidth: 1,
    });
    // Local bbox is { x:0, y:0, w:30, h:20 }; world span x∈[100,130], y∈[200,220].
    expect(renderer.hitTest(100, 200)?.id).toBe('pa-1');
    expect(renderer.hitTest(130, 220)?.id).toBe('pa-1');
    expect(renderer.hitTest(99, 200)).toBeNull();
    expect(renderer.hitTest(131, 200)).toBeNull();
  });

  it('handles curve commands without throwing', () => {
    const { renderer } = makeRenderer();
    expect(() =>
      renderer.addShape<PathShapeSpec>('pa-1', {
        kind: 'path',
        x: 0,
        y: 0,
        commands: [
          { kind: 'moveTo', x: 0, y: 0 },
          { kind: 'quadTo', cpx: 5, cpy: 10, x: 10, y: 0 },
          { kind: 'cubicTo', cp1x: 15, cp1y: 10, cp2x: 20, cp2y: -10, x: 25, y: 0 },
        ],
        stroke: 0,
        strokeWidth: 1,
      }),
    ).not.toThrow();
  });
});

describe('ImageShape', () => {
  it('renders with a preloaded texture; bbox = (width × height) centered on (x, y)', () => {
    const { renderer } = makeRenderer();
    const texture = Texture.WHITE;
    renderer.addShape<ImageShapeSpec>('i-1', {
      kind: 'image',
      x: 50,
      y: 50,
      width: 40,
      height: 20,
      texture,
    });
    expect(renderer.hitTest(50, 50)?.id).toBe('i-1');
    expect(renderer.hitTest(31, 41)?.id).toBe('i-1');
    expect(renderer.hitTest(70, 50)?.id).toBe('i-1');
    expect(renderer.hitTest(75, 50)).toBeNull();
  });

  it('updateShape can swap the texture', () => {
    const { renderer } = makeRenderer();
    const t1 = Texture.WHITE;
    const t2 = Texture.EMPTY;
    renderer.addShape<ImageShapeSpec>('i-1', {
      kind: 'image',
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      texture: t1,
    });
    expect(() =>
      renderer.updateShape<ImageShapeSpec>('i-1', { texture: t2 }),
    ).not.toThrow();
  });
});

describe('TextShape', () => {
  it('renders text and produces non-zero bounds', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<TextShapeSpec>('t-1', {
      kind: 'text',
      x: 100,
      y: 100,
      text: 'Hello',
      style: { fontSize: 14, fill: 0x000000 },
    });
    // Hit at the center should land on this text.
    expect(renderer.hitTest(100, 100)?.id).toBe('t-1');
  });

  it('updateShape changing text re-syncs bounds', () => {
    const { renderer } = makeRenderer();
    renderer.addShape<TextShapeSpec>('t-1', {
      kind: 'text',
      x: 0,
      y: 0,
      text: 'A',
      style: { fontSize: 14, fill: 0x000000 },
    });
    expect(() =>
      renderer.updateShape<TextShapeSpec>('t-1', { text: 'AAAAAAAAAAAAAAAAAA' }),
    ).not.toThrow();
  });
});

describe('All built-ins co-exist', () => {
  it('all seven shape kinds register out of the box', () => {
    const { renderer } = makeRenderer();
    renderer.addShape('c', { kind: 'circle', x: 0, y: 0, r: 5 } as never);
    renderer.addShape('r', { kind: 'rect', x: 20, y: 0, width: 10, height: 10 } as never);
    renderer.addShape('e', { kind: 'ellipse', x: 40, y: 0, rx: 5, ry: 3 } as never);
    renderer.addShape('p', {
      kind: 'polygon',
      x: 60,
      y: 0,
      points: [
        { x: -3, y: 3 },
        { x: 3, y: 3 },
        { x: 0, y: -3 },
      ],
    } as never);
    renderer.addShape('pa', {
      kind: 'path',
      x: 80,
      y: 0,
      commands: [
        { kind: 'moveTo', x: 0, y: 0 },
        { kind: 'lineTo', x: 5, y: 5 },
      ],
      stroke: 0,
      strokeWidth: 1,
    } as never);
    renderer.addShape('i', {
      kind: 'image',
      x: 100,
      y: 0,
      width: 10,
      height: 10,
      texture: Texture.WHITE,
    } as never);
    renderer.addShape('t', {
      kind: 'text',
      x: 120,
      y: 0,
      text: 'X',
      style: { fontSize: 12, fill: 0 },
    } as never);
    expect(renderer.getRenderStats().shapes).toBe(7);
  });
});
