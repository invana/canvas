import { describe, expect, it, vi } from 'vitest';
import { Camera, type CameraOptions } from '../../src/camera/Camera';
import { CanvasEventBus } from '@invana/canvas-store';
import { makeTestScene } from '../_helpers/makeWorld';

function makeCamera(opts: Partial<CameraOptions> = {}) {
  const { world } = makeTestScene();
  const bus = new CanvasEventBus();
  const camera = new Camera({
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
    ...opts,
  });
  return { camera, world, bus };
}

describe('Camera — construction & defaults', () => {
  it('starts at scale 1 / position (0,0) by default', () => {
    const { camera, world } = makeCamera();
    expect(camera.scale).toBe(1);
    expect(camera.x).toBe(0);
    expect(camera.y).toBe(0);
    expect(world.scale.x).toBe(1);
    expect(world.position.x).toBe(0);
  });

  it('honours initialScale / initialX / initialY', () => {
    const { camera } = makeCamera({ initialScale: 2, initialX: 100, initialY: -50 });
    expect(camera.scale).toBe(2);
    expect(camera.x).toBe(100);
    expect(camera.y).toBe(-50);
  });

  it('clamps initial scale to min/max', () => {
    const a = makeCamera({ initialScale: 0.001, minScale: 0.1 });
    expect(a.camera.scale).toBe(0.1);
    const b = makeCamera({ initialScale: 1000, maxScale: 10 });
    expect(b.camera.scale).toBe(10);
  });
});

describe('Camera — pan', () => {
  it('pan() shifts the world container; emits camera:pan', () => {
    const { camera, bus } = makeCamera();
    const handler = vi.fn();
    bus.on('input:camera:pan', handler);
    camera.pan(50, -25);
    expect(camera.x).toBe(50);
    expect(camera.y).toBe(-25);
    expect(handler).toHaveBeenCalledWith({ x: 50, y: -25 });
  });

  it('pan(0, 0) is a no-op (no event)', () => {
    const { camera, bus } = makeCamera();
    const handler = vi.fn();
    bus.on('input:camera:pan', handler);
    camera.pan(0, 0);
    expect(handler).not.toHaveBeenCalled();
  });

  it('setPosition with the same coords is a no-op', () => {
    const { camera, bus } = makeCamera({ initialX: 10, initialY: 20 });
    const handler = vi.fn();
    bus.on('input:camera:pan', handler);
    camera.setPosition(10, 20);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('Camera — zoom', () => {
  it('setZoom() applies absolute scale and emits camera:zoom', () => {
    const { camera, bus } = makeCamera();
    const handler = vi.fn();
    bus.on('input:camera:zoom', handler);
    camera.setZoom(2);
    expect(camera.scale).toBe(2);
    expect(handler).toHaveBeenCalledWith({ scale: 2, centerX: 400, centerY: 300 });
  });

  it('setZoom clamps to min/max', () => {
    const { camera } = makeCamera({ minScale: 0.5, maxScale: 4 });
    camera.setZoom(0.1);
    expect(camera.scale).toBe(0.5);
    camera.setZoom(10);
    expect(camera.scale).toBe(4);
  });

  it('zoomAt() keeps the world point under the screen cursor stationary', () => {
    const { camera } = makeCamera();
    // Pre-conditions: scale 1, origin (0,0). Screen cursor at (200, 100)
    // is world (200, 100). After 2x zoom around that cursor, the same world
    // point must still map back to (200, 100) in screen space.
    const beforeWorld = camera.toWorld(200, 100);
    camera.zoomAt(2, 200, 100);
    expect(camera.scale).toBe(2);
    const afterScreen = camera.toScreen(beforeWorld.x, beforeWorld.y);
    expect(afterScreen.x).toBeCloseTo(200);
    expect(afterScreen.y).toBeCloseTo(100);
  });

  it('zoomAt fires both zoom and pan events', () => {
    const { camera, bus } = makeCamera();
    const z = vi.fn();
    const p = vi.fn();
    bus.on('input:camera:zoom', z);
    bus.on('input:camera:pan', p);
    camera.zoomAt(2, 100, 50);
    expect(z).toHaveBeenCalled();
    expect(p).toHaveBeenCalled();
  });
});

describe('Camera — projection', () => {
  it('toWorld and toScreen are inverses', () => {
    const { camera } = makeCamera({ initialScale: 1.5, initialX: 30, initialY: 40 });
    const screen = { x: 250, y: 175 };
    const world = camera.toWorld(screen.x, screen.y);
    const back = camera.toScreen(world.x, world.y);
    expect(back.x).toBeCloseTo(screen.x);
    expect(back.y).toBeCloseTo(screen.y);
  });

  it('getVisibleBounds reports the world rect under the viewport', () => {
    const { camera } = makeCamera({ initialScale: 2, initialX: 0, initialY: 0 });
    // Viewport 800×600, scale 2, origin (0,0):
    // tl world = (0/2, 0/2) = (0,0)
    // br world = (800/2, 600/2) = (400, 300)
    const b = camera.getVisibleBounds();
    expect(b.x).toBeCloseTo(0);
    expect(b.y).toBeCloseTo(0);
    expect(b.width).toBeCloseTo(400);
    expect(b.height).toBeCloseTo(300);
  });
});

describe('Camera — fitContent', () => {
  it('scales + centres a world rect into the viewport', () => {
    const { camera } = makeCamera({ initialScale: 1 });
    // Viewport 800×600, padding 24 → available 752×552.
    // Rect 1000×500 → scaleX = 752/1000 = 0.752, scaleY = 552/500 = 1.104.
    // min → 0.752.
    camera.fitContent({ x: 0, y: 0, width: 1000, height: 500 });
    expect(camera.scale).toBeCloseTo(0.752, 2);

    // Rect centre at (500, 250) should map to viewport centre (400, 300).
    const c = camera.toScreen(500, 250);
    expect(c.x).toBeCloseTo(400, 1);
    expect(c.y).toBeCloseTo(300, 1);
  });
});

describe('Camera — resize', () => {
  it('resize() updates the screen dimensions', () => {
    const { camera } = makeCamera();
    camera.resize(1024, 768);
    expect(camera.screenWidth).toBe(1024);
    expect(camera.screenHeight).toBe(768);
  });
});

describe('Camera — bus interactions reach taps', () => {
  it('camera:zoom emitted via bus.emit publishes to taps as a canvas envelope', () => {
    const { camera, bus } = makeCamera();
    const tapHandler = vi.fn();
    bus.tap(tapHandler);
    camera.setZoom(2);
    expect(tapHandler).toHaveBeenCalled();
    // Find the input:camera:zoom envelope (setZoom may also emit input:camera:pan).
    const zoomCall = tapHandler.mock.calls.find(
      (c) => (c[0] as { type: string }).type === 'input:camera:zoom',
    );
    expect(zoomCall).toBeDefined();
    const env = zoomCall![0];
    expect(env.type).toBe('input:camera:zoom');
    expect(env.payload.scale).toBe(2);
  });
});

describe('Camera — without a bus', () => {
  it('works fine; just no events emitted', () => {
    const { world } = makeTestScene();
    const camera = new Camera({ viewport: world, screenWidth: 800, screenHeight: 600 });
    expect(() => {
      camera.pan(100, 50);
      camera.setZoom(2);
      camera.zoomAt(0.5, 100, 50);
    }).not.toThrow();
  });
});

describe('Camera — viewport accessor', () => {
  it('exposes the underlying Viewport for engine internals', () => {
    const { camera, world } = makeCamera();
    expect(camera.viewport).toBe(world);
  });
});
