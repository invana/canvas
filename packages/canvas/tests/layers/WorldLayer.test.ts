import { describe, expect, it } from 'vitest';
import { WorldLayer } from '../../src/layers/WorldLayer';
import { CanvasEventBus } from '../../src/events/CanvasEventBus';
import { Camera } from '../../src/camera/Camera';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import type { CanvasContext } from '../../src/context/CanvasContext';
import { makeTestScene } from '../_helpers/makeWorld';

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
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = { events: bus, world, stage, camera, layers, behaviours };
  return ctx;
}

describe('WorldLayer — sub-layer lifecycle', () => {
  it('mount creates a SubLayer rooted under ctx.world; unmount destroys it', () => {
    const ctx = makeContext();
    const layer = new TestWorldLayer({ id: 'graph-1', options: { hits: [] } });
    layer.mount(ctx);
    const root = layer.subLayer;
    expect(root.id).toBe('graph-1');
    expect(root.container.label).toBe('graph-1');
    expect(root.container.isRenderGroup).toBe(true);
    expect(ctx.world.children).toContain(root.container);

    layer.unmount();
    expect(root.container.destroyed).toBe(true);
  });

  it('hitTest returns subclass result', () => {
    const ctx = makeContext();
    const layer = new TestWorldLayer({
      id: 'graph-1',
      options: { hits: [{ x: 100, y: 50, id: 'n-1' }] },
    });
    layer.mount(ctx);
    expect(layer.hitTest(100, 50)).toEqual({ id: 'n-1' });
    expect(layer.hitTest(0, 0)).toBeNull();
  });

  it('initial zIndex propagates to the SubLayer container', () => {
    const ctx = makeContext();
    const layer = new TestWorldLayer({
      id: 'graph-1',
      options: { hits: [] },
      zIndex: 7,
    });
    layer.mount(ctx);
    expect(layer.subLayer.container.zIndex).toBe(7);
    expect(ctx.world.sortableChildren).toBe(true);
  });

  it('createSubLayer (via subLayer) yields hierarchical ids', () => {
    const ctx = makeContext();
    const layer = new TestWorldLayer({ id: 'graph-1', options: { hits: [] } });
    layer.mount(ctx);
    const edges = layer.subLayer.createSubLayer('edges');
    const edgeLabels = edges.createSubLayer('labels');
    expect(edges.id).toBe('graph-1:edges');
    expect(edgeLabels.id).toBe('graph-1:edges:labels');
    expect(edgeLabels.container.label).toBe('graph-1:edges:labels');
    expect(edgeLabels.container.isRenderGroup).toBe(true);
  });

  it('subLayer is publicly readable for cross-layer access via the registry', () => {
    const ctx = makeContext();
    const a = new TestWorldLayer({ id: 'graph-1', options: { hits: [] } });
    const b = new TestWorldLayer({ id: 'mini', options: { hits: [] } });
    ctx.layers.add(a);
    ctx.layers.add(b);

    // From layer "b"'s perspective, look up peer "graph-1" and read its subLayer
    const peer = ctx.layers.get<TestWorldLayer>('graph-1');
    expect(peer).toBeDefined();
    expect(peer!.subLayer.id).toBe('graph-1');
  });

  it('subLayer access throws before mount', () => {
    const layer = new TestWorldLayer({ id: 'unmounted', options: { hits: [] } });
    expect(() => layer.subLayer).toThrow(/accessed before mount/);
  });
});
