/**
 * `GraphLayer.getBounds()` must be **deterministic on the first call** — the
 * autofit fix (`docs/autofit-bounds-rfc.md` §7).
 *
 * The failure this pins: a one-shot layout writes final positions with
 * `setPositionsBulk` and fires `end` → `fitView` **synchronously**. With
 * `flushMode: 'frame'` the store buffers the granular events until the next
 * rAF, so the renderer's projected specs still hold the pre-layout (stacked)
 * positions at measurement time. `getBounds()` used to union the *projected*
 * shape bounds → a near-zero box → the camera fits one node → 4400 % zoom
 * ("the nodes aren't rendering"). It now derives node boxes from the store
 * (typed-array positions + the pure `boundsOfNode` footprint), so the very
 * first measurement after a bulk write is correct — no frame ordering involved.
 *
 * Headless: `Canvas.initWithRenderer` + `HeadlessRenderer` (no GPU, no rAF —
 * which is exactly the point: nothing here may depend on a frame happening).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';

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

function mountGraph(): { canvas: Canvas; layer: GraphLayer } {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  return { canvas, layer };
}

function settle(layer: GraphLayer): void {
  layer.store.flush();
  layer.flush();
}

/** Every node stacked at the origin — the pre-layout state of a one-shot run. */
const STACKED = {
  nodes: [
    { id: 'a', type: 'thing', position: { x: 0, y: 0 } },
    { id: 'b', type: 'thing', position: { x: 0, y: 0 } },
    { id: 'c', type: 'thing', position: { x: 0, y: 0 } },
  ],
  edges: [],
};

describe('GraphLayer.getBounds — store-derived, frame-order independent', () => {
  it('control: stacked nodes measure a near-zero box', () => {
    const { layer } = mountGraph();
    layer.setData(STACKED);
    settle(layer);

    const b = layer.getBounds();
    expect(b).not.toBeNull();
    // Three stacked default nodes ≈ one node footprint.
    expect(b!.width).toBeLessThan(60);
    expect(b!.height).toBeLessThan(60);
  });

  it('the FIRST getBounds() after a bulk position write sees the spread — while the projected specs are still stale', () => {
    const { canvas, layer } = mountGraph();
    layer.setData(STACKED);
    settle(layer);

    // A one-shot layout's final write: spread the nodes ±200 world units.
    // Deliberately NOT settled — the granular flush is still pending, exactly
    // like the synchronous `end → fitView` call path.
    layer.store.setPositionsBulk(
      ['a', 'b', 'c'],
      new Float32Array([-200, -150, 0, 0, 200, 150]),
    );

    const b = layer.getBounds();
    expect(b).not.toBeNull();
    // The box must span the spread (±200 x, ±150 y) plus node footprints.
    expect(b!.width).toBeGreaterThan(390);
    expect(b!.height).toBeGreaterThan(290);
    expect(b!.x).toBeLessThan(-190);
    expect(b!.x + b!.width).toBeGreaterThan(190);

    // Pin the mechanism: the *projected* spec STILL holds the stale stacked
    // position — the layer's dirty batch hasn't applied (no frame ran). The
    // correct box above can therefore only have come from the store. This is
    // the assertion that fails against the old projection-derived getBounds.
    const spec = canvas.store.specs['graph']!.get('a') as { x: number; y: number };
    expect(spec.x).toBe(0);
  });

  it('hidden nodes stay excluded from the store-derived box', () => {
    const { layer } = mountGraph();
    layer.setData(STACKED);
    settle(layer);
    layer.store.setPositionsBulk(['a', 'b', 'c'], new Float32Array([-200, 0, 0, 0, 200, 0]));
    settle(layer);

    layer.store.hideNode('c'); // the +200 outlier
    settle(layer);

    const b = layer.getBounds();
    expect(b).not.toBeNull();
    expect(b!.x + b!.width).toBeLessThan(100); // right edge no longer at +200
    const withHidden = layer.getBounds({ includeHidden: true });
    expect(withHidden!.x + withHidden!.width).toBeGreaterThan(190);
  });
});
