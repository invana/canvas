import { HeadlessCameraBinding } from '../../src/camera/HeadlessCameraBinding';
import { HeadlessSurface } from '../../src/renderer/HeadlessRenderer';
import { describe, expect, it } from 'vitest';
import { WorldLayer } from '../../src/layers/WorldLayer';
import { CanvasEventBus } from '@invana/canvas-store';
import { Camera } from '../../src/camera/Camera';
import { DefaultGestureArbiter } from '../../src/input/GestureArbiter';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import type { CanvasContext } from '../../src/context/CanvasContext';
import { createCanvasStore } from '@invana/canvas-store';

class TestWorldLayer extends WorldLayer<{ readonly hits: { x: number; y: number; id: string }[] }> {
  protected createState(): object {
    return {};
  }
  hitTest(worldX: number, worldY: number) {
    const hit = this.options.hits.find(
      (h) => Math.abs(h.x - worldX) < 5 && Math.abs(h.y - worldY) < 5,
    );
    return hit ? { id: hit.id } : null;
  }
}

function makeContext() {
  const bus = new CanvasEventBus();
  const camera = new Camera({
    binding: new HeadlessCameraBinding(),
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = { events: bus, store: createCanvasStore(), camera, gestures: new DefaultGestureArbiter(), layers, behaviours, theme: { current: () => null, set: () => {} }, showMessage: () => {}, clearMessage: () => {}, createOverlay: () => ({}) as never, createSurface: (space, id) => new HeadlessSurface(id, space) };
  // The surfaces the layer asks for, so a test can assert lifecycle without a
  // scene graph — `ctx` carries no display object any more.
  const surfaces = new Map<string, HeadlessSurface>();
  const create = ctx.createSurface;
  ctx = {
    ...ctx,
    createSurface: (space, id, opts) => {
      const s = create(space, id, opts) as HeadlessSurface;
      surfaces.set(id, s);
      return s;
    },
  };
  return { ctx, surfaces };
}

describe('WorldLayer — surface lifecycle', () => {
  it('mount takes a world surface named for the layer; unmount destroys it', () => {
    const { ctx, surfaces } = makeContext();
    const layer = new TestWorldLayer({ id: 'graph-1', options: { hits: [] } });
    expect(surfaces.size).toBe(0);

    layer.mount(ctx);
    expect(surfaces.size).toBe(1);
    const root = surfaces.get('graph-1')!;
    expect(root.id).toBe('graph-1');
    expect(root.space).toBe('world');

    layer.unmount();
    expect(root.destroyed).toBe(true);
  });

  it('hitTest returns subclass result', () => {
    const { ctx } = makeContext();
    const layer = new TestWorldLayer({
      id: 'graph-1',
      options: { hits: [{ x: 100, y: 50, id: 'n-1' }] },
    });
    layer.mount(ctx);
    expect(layer.hitTest(100, 50)).toEqual({ id: 'n-1' });
    expect(layer.hitTest(0, 0)).toBeNull();
  });

  it('initial zIndex propagates to the surface', () => {
    const { ctx, surfaces } = makeContext();
    const layer = new TestWorldLayer({
      id: 'graph-1',
      options: { hits: [] },
      zIndex: 7,
    });
    layer.mount(ctx);
    expect(surfaces.get('graph-1')!.zIndex).toBe(7);
  });

  it('two layers mount as separate surfaces', () => {
    const { ctx, surfaces } = makeContext();
    const a = new TestWorldLayer({ id: 'layer-a', options: { hits: [] } });
    const b = new TestWorldLayer({ id: 'layer-b', options: { hits: [] } });
    ctx.layers.add(a);
    ctx.layers.add(b);
    expect(surfaces.size).toBe(2);
    expect([...surfaces.keys()]).toEqual(['layer-a', 'layer-b']);
  });
});
