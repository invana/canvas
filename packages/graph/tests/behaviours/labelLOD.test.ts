/**
 * `NodeLabelLODBehaviour` / `EdgeLabelLODBehaviour` — a zoom band per label
 * kind (nodes vs edges, separately) plus an on-screen size policy pushed to the
 * renderer.
 *
 * Headless: assertions read what the behaviours asked the `HeadlessElementRenderer`
 * for (`textHidden`, `labelSizePolicies`). `requestAnimationFrame` is absent, so
 * a scheduled sweep runs on a `setTimeout(0)` — {@link settle} waits it out.
 *
 * See `rfc:feat-2026-10-04-labels-balloon-on-zoom-and-edge-labels-have-no-lod`
 * rows F8–F10 (V7).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessElementRenderer, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { NodeLabelLODBehaviour } from '../../src/behaviours/NodeLabelLODBehaviour';
import { EdgeLabelLODBehaviour } from '../../src/behaviours/EdgeLabelLODBehaviour';

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

function mount(): { canvas: Canvas; renderer: HeadlessElementRenderer } {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  layer.setData(DATA);
  layer.store.flush();
  layer.flush();
  return { canvas, renderer: layer.getRenderer() as HeadlessElementRenderer };
}

/** Let a scheduled (setTimeout-0) sweep run. */
const settle = (): Promise<void> => new Promise((r) => setTimeout(r, 0));

const NODE_IDS = ['hub', 'a', 'b', 'c'];
const EDGE_IDS = ['e1', 'e2', 'e3'];

describe('NodeLabelLODBehaviour', () => {
  it('declares its settings-registry kind', () => {
    expect(new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph' }).kind).toBe('node-label-lod');
  });

  it('hides node text below the band, never edge text, and shows it again inside', async () => {
    const { canvas, renderer } = mount();
    canvas.camera.setZoom(0.5);
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true, minZoom: 1 }),
    );
    await settle();
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(true);
    for (const id of EDGE_IDS) expect(renderer.textHidden.has(id)).toBe(false);

    canvas.camera.setZoom(2);
    await settle();
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(false);
    canvas.destroy();
  });

  it('keeps the top-centrality labels shown below the band (alwaysShowTop)', async () => {
    const { canvas, renderer } = mount();
    canvas.camera.setZoom(0.5);
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true, minZoom: 1, alwaysShowTop: 0.25 }),
    );
    await settle();
    expect(renderer.textHidden.has('hub')).toBe(false);
    expect(renderer.textHidden.has('a')).toBe(true);
    canvas.destroy();
  });

  it('pushes no size policy while every size option is unset (label size untouched)', async () => {
    const { canvas, renderer } = mount();
    canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true }));
    await settle();
    expect(renderer.labelSizePolicies.shape).toBeNull();
    canvas.destroy();
  });

  it('pushes the shape size policy, retunes it live, and clears it on disable', async () => {
    const { canvas, renderer } = mount();
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true, minFontPx: 10, maxFontPx: 20 }),
    );
    await settle();
    expect(renderer.labelSizePolicies.shape).toEqual({ minFontPx: 10, maxFontPx: 20 });
    expect(renderer.labelSizePolicies.connector).toBeNull();

    canvas.update({ behaviours: { n: { zoomGrowth: 0.5, maxFontPx: 16 } } });
    await settle();
    expect(renderer.labelSizePolicies.shape).toEqual({ zoomGrowth: 0.5, minFontPx: 10, maxFontPx: 16 });

    canvas.update({ behaviours: { n: { enabled: false } } });
    expect(renderer.labelSizePolicies.shape).toBeNull();
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(false);
    canvas.destroy();
  });

  // F25: the settings editor clears an option with `null` (a cleared number
  // field arrives as `0`, which the mapping turns into `null`).
  it('treats a null or non-positive font bound as unset, and all-null as no policy', async () => {
    const { canvas, renderer } = mount();
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true, zoomGrowth: 0, maxFontPx: 20 }),
    );
    await settle();
    expect(renderer.labelSizePolicies.shape).toEqual({ zoomGrowth: 0, maxFontPx: 20 });

    canvas.update({ behaviours: { n: { maxFontPx: null, minFontPx: 0 } } });
    await settle();
    expect(renderer.labelSizePolicies.shape).toEqual({ zoomGrowth: 0 });

    canvas.update({ behaviours: { n: { zoomGrowth: null, minFontPx: null, maxFontPx: null } } });
    await settle();
    expect(renderer.labelSizePolicies.shape).toBeNull();
    canvas.destroy();
  });

  it('treats a null band bound as unbounded', async () => {
    const { canvas, renderer } = mount();
    canvas.camera.setZoom(2);
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true, maxZoom: 1 }),
    );
    await settle();
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(true);

    canvas.update({ behaviours: { n: { maxZoom: null } } });
    await settle();
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(false);
    canvas.destroy();
  });
});

describe('EdgeLabelLODBehaviour', () => {
  it('declares its settings-registry kind', () => {
    expect(new EdgeLabelLODBehaviour({ id: 'e', targetLayerId: 'graph' }).kind).toBe('edge-label-lod');
  });

  it('hides edge text below its band, never node text', async () => {
    const { canvas, renderer } = mount();
    canvas.camera.setZoom(1);
    canvas.behaviours.register(
      new EdgeLabelLODBehaviour({ id: 'e', targetLayerId: 'graph', enabled: true, minZoom: 1.2 }),
    );
    await settle();
    for (const id of EDGE_IDS) expect(renderer.textHidden.has(id)).toBe(true);
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(false);

    canvas.camera.setZoom(1.5);
    await settle();
    for (const id of EDGE_IDS) expect(renderer.textHidden.has(id)).toBe(false);
    canvas.destroy();
  });

  it('pushes the connector size policy independently of the node one', async () => {
    const { canvas, renderer } = mount();
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph', enabled: true, maxFontPx: 20 }),
    );
    canvas.behaviours.register(
      new EdgeLabelLODBehaviour({ id: 'e', targetLayerId: 'graph', enabled: true, zoomGrowth: 0 }),
    );
    await settle();
    expect(renderer.labelSizePolicies.shape).toEqual({ maxFontPx: 20 });
    expect(renderer.labelSizePolicies.connector).toEqual({ zoomGrowth: 0 });

    canvas.behaviours.setEnabled('e', false);
    expect(renderer.labelSizePolicies.connector).toBeNull();
    expect(renderer.labelSizePolicies.shape).toEqual({ maxFontPx: 20 });
    canvas.destroy();
  });
});

// F26: one content-LOD per (layer, kind). Two of one kind would overwrite each
// other's sweeps and size policy, so the second is rejected at registration.
describe('content-LOD exclusivity', () => {
  it('rejects a second instance of one kind on one layer, leaving the first working', async () => {
    const { canvas, renderer } = mount();
    canvas.camera.setZoom(0.5);
    canvas.behaviours.register(
      new NodeLabelLODBehaviour({ id: 'a', targetLayerId: 'graph', enabled: true, minZoom: 1, maxFontPx: 20 }),
    );
    expect(() =>
      canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'b', targetLayerId: 'graph', enabled: true })),
    ).toThrow(/already has node-label-lod "a"/);
    expect(canvas.behaviours.list().map((b) => b.id)).not.toContain('b');

    await settle();
    for (const id of NODE_IDS) expect(renderer.textHidden.has(id)).toBe(true);
    expect(renderer.labelSizePolicies.shape).toEqual({ maxFontPx: 20 });
    canvas.destroy();
  });

  it('allows different kinds on one layer and the same kind on different layers', () => {
    const { canvas } = mount();
    const other = new GraphLayer({ id: 'other', options: {} });
    canvas.layers.add(other);
    canvas.layers.mountAll();
    canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'n', targetLayerId: 'graph' }));
    canvas.behaviours.register(new EdgeLabelLODBehaviour({ id: 'e', targetLayerId: 'graph' }));
    canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'n2', targetLayerId: 'other' }));
    expect(canvas.behaviours.list().map((b) => b.id)).toEqual(expect.arrayContaining(['n', 'e', 'n2']));
    canvas.destroy();
  });

  it('frees the slot on unregister, so a replacement can register', () => {
    const { canvas } = mount();
    canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'a', targetLayerId: 'graph' }));
    canvas.behaviours.unregister('a');
    expect(() =>
      canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'b', targetLayerId: 'graph' })),
    ).not.toThrow();
    canvas.destroy();
  });
});
