/**
 * `Camera` with **no renderer behind it** — the P6 seam proof.
 *
 * Every test here runs against {@link HeadlessCameraBinding}: no pixi, no GPU, no
 * DOM. If any of these start needing a real `Viewport`, a backend type has
 * leaked back into `Camera` and the P6 extraction has regressed.
 */

import { describe, expect, it, vi } from 'vitest';
import { Camera, type CameraOptions } from '../src/abstracts/Camera';
import { CanvasEventBus } from '../src/state/events/CanvasEventBus';
import { HeadlessCameraBinding } from '../src/headless/HeadlessCameraBinding';

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

/**
 * C4 — `animateTo`: the eased camera glide behind `CanvasConfig.fitAnimation`.
 *
 * Time is driven by hand through `tick(dt)`, the same clock `Canvas.tickOnce`
 * turns, so these assert the state machine rather than wall-clock behaviour.
 */
describe('Camera — animateTo', () => {
  it('eases x, y and zoom together and lands exactly on the target', () => {
    const { camera } = makeCamera();
    camera.animateTo({ x: 100, y: 200, zoom: 2 }, { durationMs: 100, easing: 'linear' });
    expect(camera.isAnimating).toBe(true);

    camera.tick(50);
    // Half way along a linear curve: every channel half way, none arrived.
    expect(camera.x).toBeCloseTo(50);
    expect(camera.y).toBeCloseTo(100);
    expect(camera.scale).toBeCloseTo(1.5);
    expect(camera.isAnimating).toBe(true);

    camera.tick(50);
    expect([camera.x, camera.y, camera.scale]).toEqual([100, 200, 2]);
    expect(camera.isAnimating).toBe(false);
  });

  it('is cancelled by a user camera write, and does not fight back', () => {
    // The `fitOnResize` lesson (D7) as a test: once the user has moved the
    // camera, nothing of ours may move it back.
    const { camera } = makeCamera();
    camera.animateTo({ x: 100, y: 200, zoom: 2 }, { durationMs: 100, easing: 'linear' });
    camera.tick(50);

    camera.pan(7, 7);
    expect(camera.isAnimating).toBe(false);
    const [x, y] = [camera.x, camera.y];

    camera.tick(50);
    // The glide is dropped, not finished — the camera stays where the user left it.
    expect([camera.x, camera.y]).toEqual([x, y]);
  });

  it('applies immediately and fires onDone for a non-positive duration', () => {
    const { camera } = makeCamera();
    const onDone = vi.fn();
    camera.animateTo({ x: 10, y: 20, zoom: 3 }, { durationMs: 0, onDone });
    expect([camera.x, camera.y, camera.scale]).toEqual([10, 20, 3]);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(camera.isAnimating).toBe(false);
  });

  it('calls onDone once the glide completes naturally', () => {
    const { camera } = makeCamera();
    const onDone = vi.fn();
    camera.animateTo({ x: 10, y: 0, zoom: 1 }, { durationMs: 100, easing: 'linear', onDone });
    camera.tick(50);
    expect(onDone).not.toHaveBeenCalled();
    camera.tick(50);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('retargets from where the camera is, rather than compounding', () => {
    const { camera } = makeCamera();
    camera.animateTo({ x: 100, y: 0, zoom: 1 }, { durationMs: 100, easing: 'linear' });
    camera.tick(50);
    expect(camera.x).toBeCloseTo(50);

    camera.animateTo({ x: 0, y: 0, zoom: 1 }, { durationMs: 100, easing: 'linear' });
    camera.tick(50);
    // Half way back from 50, not from the original 0.
    expect(camera.x).toBeCloseTo(25);
  });

  it('clamps the target zoom like any other write', () => {
    const { camera } = makeCamera({ maxScale: 4 });
    camera.animateTo({ x: 0, y: 0, zoom: 99 }, { durationMs: 10, easing: 'linear' });
    camera.tick(10);
    expect(camera.scale).toBe(4);
  });

  it('leaves the camera alone when nothing asked it to animate', () => {
    const { camera } = makeCamera();
    camera.tick(16);
    expect([camera.x, camera.y, camera.scale]).toEqual([0, 0, 1]);
    expect(camera.isAnimating).toBe(false);
  });
});
