/**
 * P1 — `GraphLayer` publishes the visual description it resolves.
 *
 * The renderer split turns on this inversion: a layer resolves style +
 * templates into specs and puts them in the kernel, so a renderer can subscribe
 * and project rather than being pushed at. These tests pin the contract that
 * makes that possible — specs land, deltas report, and removals clean up.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`, so this runs
 * with no GPU and no DOM beyond the text-metrics stub below.
 *
 * See `docs/renderer-split-design.md` §2 and §4.2b.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas , HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';

/**
 * Two node-environment gaps to fill: pixi measures text through a 2D context,
 * and `pixi-viewport` attaches listeners to a DOM element at construction.
 */
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

/**
 * Drain both channels by hand. The graph store defers on `'frame'`, which falls
 * back to a microtask outside the browser, so a test must settle the data flush
 * before the layer's dirty batcher has anything to render.
 */
function settle(layer: GraphLayer): void {
  layer.store.flush();
  layer.flush();
}

/** The renderer is private by design; a test may still look at what it holds. */
function shapeKindOf(layer: GraphLayer, id: string): string | undefined {
  const internals = layer as unknown as {
    _renderer?: { getShapeKind(id: string): string | undefined };
  };
  return internals._renderer?.getShapeKind(id);
}

const TWO_NODES_ONE_EDGE = {
  nodes: [
    { id: 'a', type: 'thing', position: { x: 0, y: 0 } },
    { id: 'b', type: 'thing', position: { x: 100, y: 0 } },
  ],
  edges: [{ id: 'e1', type: 'rel', source: 'a', target: 'b' }],
};

describe('GraphLayer spec publication', () => {
  it('publishes a spec per rendered node and edge', () => {
    const { canvas, layer } = mountGraph();
    layer.setData(TWO_NODES_ONE_EDGE);
    settle(layer);

    const specs = canvas.store.specs['graph'];
    expect(specs).toBeDefined();
    expect([...specs!.ids()].sort()).toEqual(['a', 'b', 'e1']);
  });

  it('publishes specs that describe geometry, not display objects', () => {
    const { canvas, layer } = mountGraph();
    layer.setData(TWO_NODES_ONE_EDGE);
    settle(layer);

    const nodeSpec = canvas.store.specs['graph']!.get('a') as { kind?: string };
    expect(typeof nodeSpec.kind).toBe('string');
    // The whole point: a spec is serialisable, so it cannot hold a display object.
    expect(() => JSON.stringify(nodeSpec)).not.toThrow();
  });

  it('reports the delta on `specs:flush`, keyed by layer', () => {
    const { canvas, layer } = mountGraph();
    const seen: Array<{ layerId: string; delta: { added: readonly string[] } }> = [];
    canvas.events.on('specs:flush', (e) => seen.push(e as never));

    layer.setData(TWO_NODES_ONE_EDGE);
    settle(layer);
    canvas.store.specs['graph']!.flush();

    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0]!.layerId).toBe('graph');
    const added = seen.flatMap((e) => [...e.delta.added]);
    expect(added).toEqual(expect.arrayContaining(['a', 'b', 'e1']));
  });

  it('unpublishes a removed node', () => {
    const { canvas, layer } = mountGraph();
    layer.setData(TWO_NODES_ONE_EDGE);
    settle(layer);

    layer.store.removeNode('a');
    settle(layer);

    const specs = canvas.store.specs['graph']!;
    expect(specs.has('a')).toBe(false);
    expect(specs.has('b')).toBe(true);
  });

  it('projects a spec written directly to the store — the store drives the renderer (P2)', () => {
    const { canvas, layer } = mountGraph();
    layer.setData(TWO_NODES_ONE_EDGE);
    settle(layer);

    const specs = canvas.store.specs['graph']!;
    // Nobody calls `addShape` here: a spec appears in the store, and the
    // renderer picks it up through `specs:flush`.
    specs.set('injected', { kind: 'circle', x: 500, y: 500, radius: 8 });
    specs.flush();

    expect(shapeKindOf(layer, 'injected')).toBe('circle');

    specs.delete('injected');
    specs.flush();
    expect(shapeKindOf(layer, 'injected')).toBeUndefined();
  });

  it('does not publish specs resolved purely for measurement', () => {
    const { canvas, layer } = mountGraph();
    layer.setData({ nodes: [{ id: 'a', type: 'thing', position: { x: 0, y: 0 } }], edges: [] });
    settle(layer);

    const before = [...canvas.store.specs['graph']!.ids()];
    // `getBounds` resolves throwaway specs to measure content.
    layer.getBounds();
    expect([...canvas.store.specs['graph']!.ids()]).toEqual(before);
  });
});
