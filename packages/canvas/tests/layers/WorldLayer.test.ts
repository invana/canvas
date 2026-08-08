import { describe, expect, it } from 'vitest';
import { PixiSurface } from '../../src/renderer/PixiSurface';
import { WorldLayer } from '../../src/layers/WorldLayer';
import { CanvasEventBus } from '@invana/canvas-store';
import { Camera } from '../../src/camera/Camera';
import { PixiViewportBinding } from '../../src/camera/PixiViewportBinding';
import { DefaultGestureArbiter } from '../../src/input/GestureArbiter';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import type { CanvasContext } from '../../src/context/CanvasContext';
import { makeTestScene } from '../_helpers/makeWorld';
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
  const { stage, world } = makeTestScene();
  const camera = new Camera({
    binding: new PixiViewportBinding(world),
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = { events: bus, store: createCanvasStore(), camera, gestures: new DefaultGestureArbiter(), layers, behaviours, theme: { current: () => null, set: () => {} }, showMessage: () => {}, clearMessage: () => {}, createOverlay: () => ({}) as never, createSurface: (space, id) =>
      new PixiSurface({ id, space, parent: space === 'screen' ? stage : world, camera }) };
  // `ctx` no longer carries the scene root (it was the context's last pixi
  // type), so the helper hands it back for the assertions below.
  return { ctx, world };
}

describe('WorldLayer — container lifecycle', () => {
  it('mount creates a RenderGroup container under world; unmount destroys it', () => {
    const { ctx, world } = makeContext();
    const layer = new TestWorldLayer({ id: 'graph-1', options: { hits: [] } });
    expect(world.children.length).toBe(0);

    layer.mount(ctx);
    expect(world.children.length).toBe(1);
    const root = world.children[0]!;
    expect(root.label).toBe('graph-1');
    expect(root.isRenderGroup).toBe(true);

    layer.unmount();
    expect(root.destroyed).toBe(true);
    expect(world.children.length).toBe(0);
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

  it('initial zIndex propagates to the root container', () => {
    const { ctx, world } = makeContext();
    const layer = new TestWorldLayer({
      id: 'graph-1',
      options: { hits: [] },
      zIndex: 7,
    });
    layer.mount(ctx);
    const root = world.children[0]!;
    expect(root.zIndex).toBe(7);
    expect(world.sortableChildren).toBe(true);
  });

  it('two layers mount as separate containers on world', () => {
    const { ctx, world } = makeContext();
    const a = new TestWorldLayer({ id: 'layer-a', options: { hits: [] } });
    const b = new TestWorldLayer({ id: 'layer-b', options: { hits: [] } });
    ctx.layers.add(a);
    ctx.layers.add(b);
    expect(world.children.length).toBe(2);
    expect(world.children[0]!.label).toBe('layer-a');
    expect(world.children[1]!.label).toBe('layer-b');
  });
});
