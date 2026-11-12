/**
 * `ZoomStateBehaviour` — a runtime state on every node (or edge) while the camera
 * is inside a zoom band, cleared outside it and on disable; the style catalogue
 * turns it into a different label.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { ZoomStateBehaviour } from '../../src/behaviours/ZoomStateBehaviour';

/** Same environment gaps the other layer tests fill. */
beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({
      font: '',
      measureText: (t: string) => ({
        width: t.length * 7,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 3,
      }),
    }),
  });
  g['document'] ??= { createElement: element };
});

const DATA = {
  nodes: [
    { id: 'hub', type: 'thing', position: { x: 0, y: 0 } },
    { id: 'a', type: 'thing', position: { x: 100, y: 0 } },
    { id: 'b', type: 'thing', position: { x: 0, y: 100 } },
    { id: 'c', type: 'thing', position: { x: -100, y: 0 } },
  ],
  edges: [
    { id: 'e1', type: 'rel', source: 'hub', target: 'a' },
    { id: 'e2', type: 'rel', source: 'hub', target: 'b' },
    { id: 'e3', type: 'rel', source: 'hub', target: 'c' },
  ],
};

function mount(): { canvas: Canvas; layer: GraphLayer } {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  layer.setData(DATA);
  layer.store.flush();
  layer.flush();
  return { canvas, layer };
}

/** Let a scheduled (setTimeout-0) sweep run. */
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));


describe('ZoomStateBehaviour', () => {
  it('sets the state on every node inside the band and clears it outside', async () => {
    const { canvas, layer } = mount();
    canvas.camera.setZoom(0.5);
    canvas.behaviours.register(
      new ZoomStateBehaviour({ id: 'z', targetLayerId: 'graph', enabled: true, minZoom: 1, state: 'detail' }),
    );
    await settle();
    expect(layer.store.nodeStatesOf('hub')).not.toContain('detail');

    canvas.camera.setZoom(2);
    await settle();
    for (const id of ['hub', 'a', 'b', 'c']) expect(layer.store.nodeStatesOf(id)).toContain('detail');
    expect(layer.store.edgeStatesOf('e1')).not.toContain('detail');

    canvas.camera.setZoom(0.5);
    await settle();
    expect(layer.store.nodeStatesOf('a')).not.toContain('detail');
    canvas.destroy();
  });

  it("swaps a node's label through its own state overlay", async () => {
    const { canvas, layer } = mount();
    layer.store.updateNode('a', { style: { labelText: 'a' }, state: { detail: { labelText: 'a · Alpha' } } });
    layer.store.flush();
    canvas.camera.setZoom(2);
    canvas.behaviours.register(
      new ZoomStateBehaviour({ id: 'z', targetLayerId: 'graph', enabled: true, minZoom: 1, state: 'detail' }),
    );
    await settle();
    const node = layer.store.getNode('a')!;
    expect(layer.resolveNodeStyle(node).labelText).toBe('a · Alpha');

    canvas.update({ behaviours: { z: { enabled: false } } });
    expect(layer.resolveNodeStyle(layer.store.getNode('a')!).labelText).toBe('a');
    canvas.destroy();
  });

  it('writes edges only when targeted', async () => {
    const { canvas, layer } = mount();
    canvas.camera.setZoom(2);
    canvas.behaviours.register(
      new ZoomStateBehaviour({ id: 'z', targetLayerId: 'graph', enabled: true, minZoom: 1, target: 'edges' }),
    );
    await settle();
    expect(layer.store.edgeStatesOf('e1')).toContain('zoomed-in');
    expect(layer.store.nodeStatesOf('hub')).not.toContain('zoomed-in');
    canvas.destroy();
  });
});
