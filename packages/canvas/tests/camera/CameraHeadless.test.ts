/**
 * `Camera` with **no renderer behind it** — the P6 seam proof.
 *
 * Every test here runs against {@link HeadlessCameraBinding}: no pixi, no GPU, no
 * DOM. If any of these start needing a real `Viewport`, a backend type has
 * leaked back into `Camera` and the P6 extraction has regressed.
 */

import { describe, expect, it, vi } from 'vitest';
import { Camera, type CameraOptions } from '../../src/camera/Camera';
import { CanvasEventBus } from '@invana/canvas-store';
import { HeadlessCameraBinding } from '../../src/camera/HeadlessCameraBinding';

function makeCamera(opts: Partial<CameraOptions> = {}) {
  const binding = new HeadlessCameraBinding();
  const bus = new CanvasEventBus();
  const camera = new Camera({ binding, screenWidth: 800, screenHeight: 600, bus, ...opts });
  return { camera, binding, bus };
}

describe('Camera — headless semantics', () => {
  it('pans, zooms and projects with no backend', () => {
    const { camera } = makeCamera();
    camera.pan(50, -25);
    expect([camera.x, camera.y]).toEqual([50, -25]);

    camera.setZoom(2);
    expect(camera.scale).toBe(2);

    const world = camera.toWorld(200, 100);
    const back = camera.toScreen(world.x, world.y);
    expect(back.x).toBeCloseTo(200);
    expect(back.y).toBeCloseTo(100);
  });

  it('zoomAt holds the world point under the cursor still', () => {
    const { camera } = makeCamera();
    const before = camera.toWorld(200, 100);
    camera.zoomAt(2, 200, 100);
    const after = camera.toScreen(before.x, before.y);
    expect(after.x).toBeCloseTo(200);
    expect(after.y).toBeCloseTo(100);
  });

  it('fitContent scales and centres a world rect', () => {
    const { camera } = makeCamera();
    camera.fitContent({ x: 0, y: 0, width: 1000, height: 500 });
    expect(camera.scale).toBeCloseTo(0.752, 2);
    const c = camera.toScreen(500, 250);
    expect(c.x).toBeCloseTo(400, 1);
    expect(c.y).toBeCloseTo(300, 1);
  });
});

describe('Camera — the binding is the source of truth', () => {
  it('reads a transform the backend changed underneath it', () => {
    const { camera, binding } = makeCamera();
    binding.emitTransformChange({ x: 10, y: 20, zoom: 3 }, 'zoom');
    expect(camera.x).toBe(10);
    expect(camera.scale).toBe(3);
  });

  it('bridges a backend-driven gesture onto the bus', () => {
    const { binding, bus } = makeCamera();
    const zoom = vi.fn();
    const pan = vi.fn();
    bus.on('input:camera:zoom', zoom);
    bus.on('input:camera:pan', pan);

    // A wheel tick inside the backend.
    binding.emitTransformChange({ x: 5, y: 5, zoom: 1.1 }, 'zoom');
    expect(zoom).toHaveBeenCalledTimes(1);
    expect(pan).toHaveBeenCalledTimes(1);

    // A drag: pan only — the O(N) zoom listeners must stay asleep.
    binding.emitTransformChange({ x: 40, y: 5, zoom: 1.1 }, 'pan');
    expect(zoom).toHaveBeenCalledTimes(1);
    expect(pan).toHaveBeenCalledTimes(2);
  });

  it('does not double-emit for its own writes', () => {
    const { camera, bus } = makeCamera();
    const pan = vi.fn();
    bus.on('input:camera:pan', pan);
    camera.pan(10, 10);
    // Exactly one: Camera's own emit. The binding must not echo it back.
    expect(pan).toHaveBeenCalledTimes(1);
  });
});

describe('Camera — input configuration is semantic', () => {
  it('forwards patches verbatim; no plugin vocabulary reaches the behaviour', () => {
    const { camera, binding } = makeCamera();
    camera.configureInput({ wheel: { percent: 0.2, modifier: 'control' } });
    camera.configureInput({ drag: { mouseButtons: 'middle', modifier: 'space' } });
    camera.configureInput({ wheel: null });

    expect(binding.inputConfigs).toEqual([
      { wheel: { percent: 0.2, modifier: 'control' } },
      { drag: { mouseButtons: 'middle', modifier: 'space' } },
      { wheel: null },
    ]);
  });

  it('suspends drag edge-triggered, and re-arming clears the suspension', () => {
    const { camera, binding } = makeCamera();
    camera.setDragSuspended(true);
    expect(binding.dragSuspended).toBe(true);
    camera.setDragSuspended(false);
    expect(binding.dragSuspended).toBe(false);

    // Suspended, then the input is re-armed: the fresh input is not suspended,
    // so Camera's cached flag has to reset or the next suspend would no-op.
    camera.setDragSuspended(true);
    camera.configureInput({ drag: { mouseButtons: 'left' } });
    camera.setDragSuspended(true);
    expect(binding.dragSuspended).toBe(true);
  });

  it('relays drag-start to subscribers and unsubscribes cleanly', () => {
    const { camera, binding } = makeCamera();
    const fn = vi.fn();
    const off = camera.onDragStart(fn);
    binding.emitDragStart();
    expect(fn).toHaveBeenCalledTimes(1);
    off();
    binding.emitDragStart();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('Camera — the engine owns the clock (G3)', () => {
  it('forwards tick time to the binding', () => {
    const { camera, binding } = makeCamera();
    camera.tick(16);
    camera.tick(16);
    expect(binding.tickedMs).toBe(32);
  });
});
