import { describe, expect, it, vi } from 'vitest';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { CanvasEventBus } from '@invana/canvas-store';
import { Camera } from '../../src/camera/Camera';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import type { ILayer } from '../../src/layers/Layer';
import type { CanvasContext } from '../../src/context/CanvasContext';
import { makeTestScene } from '../_helpers/makeWorld';
import { createCanvasStore } from '@invana/canvas-store';

// ─── Test helpers ──────────────────────────────────────────────────────────

function makeContext() {
  const bus = new CanvasEventBus();
  const { stage, world } = makeTestScene();
  const camera = new Camera({
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = { events: bus, store: createCanvasStore(), world, stage, camera, layers, behaviours, theme: { current: () => null, set: () => {} }, showMessage: () => {}, clearMessage: () => {} };
  return ctx;
}

class FakeLayer implements ILayer {
  readonly id: string;
  visible = true;
  hittable = true;
  zIndex = 0;
  cullable = true;
  mountCount = 0;
  unmountCount = 0;
  flushCount = 0;
  pendingValue = false;
  mounted = false;

  constructor(id: string, zIndex = 0) {
    this.id = id;
    this.zIndex = zIndex;
  }

  mount(_ctx: CanvasContext): void {
    this.mountCount++;
    this.mounted = true;
  }
  unmount(): void {
    this.unmountCount++;
    this.mounted = false;
  }
  flush(): void {
    this.flushCount++;
  }
  hasPending(): boolean {
    return this.pendingValue;
  }
  redraw(): void {}
  setVisible(visible: boolean): void {
    this.visible = visible;
  }
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('LayerRegistry — basic CRUD', () => {
  it('add() mounts the layer + fires layer:added on the bus', () => {
    const ctx = makeContext();
    const layer = new FakeLayer('a');
    const handler = vi.fn();
    ctx.events.on('scene:layer:add', handler);

    ctx.layers.add(layer);

    expect(layer.mountCount).toBe(1);
    expect(handler).toHaveBeenCalledWith({ id: 'a' });
    expect(ctx.layers.size).toBe(1);
    expect(ctx.layers.has('a')).toBe(true);
  });

  it('throws on duplicate id', () => {
    const ctx = makeContext();
    ctx.layers.add(new FakeLayer('a'));
    expect(() => ctx.layers.add(new FakeLayer('a'))).toThrow(/already registered/);
  });

  it('remove() unmounts + fires layer:removed', () => {
    const ctx = makeContext();
    const layer = new FakeLayer('a');
    ctx.layers.add(layer);
    const handler = vi.fn();
    ctx.events.on('scene:layer:remove', handler);

    ctx.layers.remove('a');

    expect(layer.unmountCount).toBe(1);
    expect(handler).toHaveBeenCalledWith({ id: 'a' });
    expect(ctx.layers.has('a')).toBe(false);
  });

  it('remove() on missing id is a no-op', () => {
    const ctx = makeContext();
    expect(() => ctx.layers.remove('missing')).not.toThrow();
  });

  it('get() returns the layer by id, undefined otherwise', () => {
    const ctx = makeContext();
    const layer = new FakeLayer('a');
    ctx.layers.add(layer);
    expect(ctx.layers.get('a')).toBe(layer);
    expect(ctx.layers.get('missing')).toBeUndefined();
  });
});

describe('LayerRegistry — z-order', () => {
  it('byZOrder sorts ascending by zIndex', () => {
    const ctx = makeContext();
    ctx.layers.add(new FakeLayer('a', 30));
    ctx.layers.add(new FakeLayer('b', 10));
    ctx.layers.add(new FakeLayer('c', 20));
    const ids = ctx.layers.byZOrder().map((l) => l.id);
    expect(ids).toEqual(['b', 'c', 'a']);
  });

  it('caches the sorted list; setZIndex invalidates', () => {
    const ctx = makeContext();
    ctx.layers.add(new FakeLayer('a', 0));
    ctx.layers.add(new FakeLayer('b', 1));
    const first = ctx.layers.byZOrder();
    expect(ctx.layers.byZOrder()).toBe(first); // same reference

    ctx.layers.setZIndex('a', 10);
    expect(ctx.layers.byZOrder()).not.toBe(first); // re-sorted
    expect(ctx.layers.byZOrder().map((l) => l.id)).toEqual(['b', 'a']);
  });
});

describe('LayerRegistry — clear', () => {
  it('clear() removes all layers and unmounts each', () => {
    const ctx = makeContext();
    const a = new FakeLayer('a');
    const b = new FakeLayer('b');
    ctx.layers.add(a);
    ctx.layers.add(b);
    ctx.layers.clear();
    expect(ctx.layers.size).toBe(0);
    expect(a.unmountCount).toBe(1);
    expect(b.unmountCount).toBe(1);
  });
});
