/**
 * C7 — `GraphLayer` projects per-item `style.effects` onto the renderer.
 *
 * Until this landed, `NodeStyle.effects` was declared and read zero times:
 * `setEffect` had exactly one caller in the repo (the badge path) and
 * `EdgeStyle` had no `effects` field at all. These tests pin the channel the
 * way `specPublication.test.ts` pins spec publication — including the one place
 * the effect sync deliberately diverges from the decoration sync it mirrors.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`, whose
 * `setEffect` is a no-op; each test wraps it to record the calls.
 *
 * See `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` rows C7 / C7a.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';

/** Same two environment gaps `specPublication.test.ts` fills. */
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

/** One recorded `setEffect(targetId, slot, spec)` call. */
interface EffectCall {
  id: string;
  slot: string;
  spec: { kind: string; style: unknown } | null;
}

function mountGraph(options: Record<string, unknown> = {}): {
  canvas: Canvas;
  layer: GraphLayer;
  calls: EffectCall[];
} {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options });
  canvas.layers.add(layer);
  canvas.layers.mountAll();

  // The renderer is private by design; a test may still wrap what it holds.
  const internals = layer as unknown as {
    _renderer: { setEffect: (id: string, slot: string, spec: EffectCall['spec']) => void };
  };
  const calls: EffectCall[] = [];
  const original = internals._renderer.setEffect.bind(internals._renderer);
  internals._renderer.setEffect = (id, slot, spec) => {
    calls.push({ id, slot, spec });
    original(id, slot, spec);
  };

  return { canvas, layer, calls };
}

/** Drain both channels by hand — the graph store defers on `'frame'`. */
function settle(layer: GraphLayer): void {
  layer.store.flush();
  layer.flush();
}

const NODES_AND_EDGE = {
  nodes: [
    { id: 'a', type: 'thing', position: { x: 0, y: 0 } },
    { id: 'b', type: 'thing', position: { x: 100, y: 0 } },
  ],
  edges: [{ id: 'e1', type: 'rel', source: 'a', target: 'b' }],
};

describe('GraphLayer effect projection', () => {
  it('mounts an effect declared in a per-node style', () => {
    const { layer, calls } = mountGraph();
    layer.setData({
      nodes: [{ id: 'a', type: 'thing', position: { x: 0, y: 0 }, style: { effects: { shake: { amplitude: 2 } } } }],
      edges: [],
    });
    settle(layer);

    expect(calls).toEqual([
      { id: 'a', slot: 'shake', spec: { kind: 'shake', style: { amplitude: 2 } } },
    ]);
  });

  it('mounts an effect declared on the layer template, for every node', () => {
    const { layer, calls } = mountGraph({
      node: { style: { effects: { breathing: { amplitude: 0.2 } } } },
    });
    layer.setData(NODES_AND_EDGE);
    settle(layer);

    const mounted = calls.filter((c) => c.slot === 'breathing').map((c) => c.id);
    expect(mounted.sort()).toEqual(['a', 'b']);
  });

  it('mounts an effect declared on an edge — the side that had no `effects` field', () => {
    const { layer, calls } = mountGraph();
    layer.setData({
      nodes: NODES_AND_EDGE.nodes,
      edges: [
        {
          id: 'e1',
          type: 'rel',
          source: 'a',
          target: 'b',
          style: { effects: { 'fade-in-connector': { durationMs: 300 } } },
        },
      ],
    });
    settle(layer);

    expect(calls).toContainEqual({
      id: 'e1',
      slot: 'fade-in-connector',
      spec: { kind: 'fade-in-connector', style: { durationMs: 300 } },
    });
  });

  it('writes nothing at all when no effects are declared', () => {
    const { layer, calls } = mountGraph();
    layer.setData(NODES_AND_EDGE);
    settle(layer);

    expect(calls).toEqual([]);
  });

  it('mounts an effect when a state activates and clears it when the state goes', () => {
    // The path the two in-tree writers use (`state.error` → breathing), and the
    // reason the state-exit half is load-bearing: a node that recovers must stop.
    const { layer, calls } = mountGraph({
      node: { state: { error: { effects: { breathing: { amplitude: 0.18 } } } } },
    });
    layer.setData(NODES_AND_EDGE);
    settle(layer);
    expect(calls).toEqual([]);

    layer.store.addNodeState('a', 'error');
    settle(layer);
    expect(calls).toEqual([
      { id: 'a', slot: 'breathing', spec: { kind: 'breathing', style: { amplitude: 0.18 } } },
    ]);

    calls.length = 0;
    layer.store.removeNodeState('a', 'error');
    settle(layer);
    expect(calls).toEqual([{ id: 'a', slot: 'breathing', spec: null }]);
  });

  it('lets a higher-precedence scope remove an effect with `null`', () => {
    const { layer, calls } = mountGraph({
      node: {
        style: { effects: { breathing: { amplitude: 0.2 } } },
        state: { calm: { effects: { breathing: null } } },
      },
    });
    layer.setData(NODES_AND_EDGE);
    settle(layer);
    expect(calls.filter((c) => c.id === 'a')).toEqual([
      { id: 'a', slot: 'breathing', spec: { kind: 'breathing', style: { amplitude: 0.2 } } },
    ]);

    calls.length = 0;
    layer.store.addNodeState('a', 'calm');
    settle(layer);
    expect(calls).toEqual([{ id: 'a', slot: 'breathing', spec: null }]);
  });

  it('does NOT re-set an unchanged effect when the node re-renders (C7a)', () => {
    // `setEffect` disposes and reconstructs, so re-setting an unchanged slot
    // would restart a running animation from frame 0. A decoration survives
    // that; a one-shot fade does not.
    const { layer, calls } = mountGraph({
      node: { state: { selected: { bgStrokeWidth: 4 } } },
    });
    layer.setData({
      nodes: [
        { id: 'a', type: 'thing', position: { x: 0, y: 0 }, style: { effects: { 'fade-in': { durationMs: 320 } } } },
      ],
      edges: [],
    });
    settle(layer);
    expect(calls).toHaveLength(1);

    calls.length = 0;
    // An unrelated re-render of the same node: a state toggle that touches
    // stroke width and nothing about effects.
    layer.store.addNodeState('a', 'selected');
    settle(layer);
    expect(calls).toEqual([]);
  });

  it('re-sets an effect whose style actually changed', () => {
    const { layer, calls } = mountGraph({
      node: { state: { hot: { effects: { breathing: { amplitude: 0.9 } } } } },
    });
    layer.setData({
      nodes: [
        { id: 'a', type: 'thing', position: { x: 0, y: 0 }, style: { effects: { breathing: { amplitude: 0.2 } } } },
      ],
      edges: [],
    });
    settle(layer);
    calls.length = 0;

    layer.store.addNodeState('a', 'hot');
    settle(layer);
    expect(calls).toEqual([
      { id: 'a', slot: 'breathing', spec: { kind: 'breathing', style: { amplitude: 0.9 } } },
    ]);
  });

  it('drops its tracking when a node is removed, so a re-add mounts fresh', () => {
    const { layer, calls } = mountGraph();
    const withEffect = {
      nodes: [
        { id: 'a', type: 'thing', position: { x: 0, y: 0 }, style: { effects: { shake: { amplitude: 2 } } } },
      ],
      edges: [],
    };
    layer.setData(withEffect);
    settle(layer);

    layer.store.removeNode('a');
    settle(layer);

    calls.length = 0;
    layer.setData(withEffect);
    settle(layer);
    // A fresh mount, not a diff against ghosts — the effect is set again.
    expect(calls).toEqual([
      { id: 'a', slot: 'shake', spec: { kind: 'shake', style: { amplitude: 2 } } },
    ]);
  });
});
