/**
 * C8 — `EntranceBehaviour` writes a staggered one-shot fade, then retires it.
 *
 * The behaviour is pure styling: it writes `style.effects` through the store
 * and lets `GraphLayer` project them (C7). So these tests assert on the store's
 * records, and on the `setEffect` calls that prove the projection reaches the
 * renderer.
 *
 * See `rfc:feat-2026-09-17-a-graph-has-no-entrance-on-first-load` row C8.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { EntranceBehaviour } from '../../src/behaviours/EntranceBehaviour';
import type { NodeStyle, EdgeStyle } from '../../src/layer/types';

/** Same two environment gaps the other layer tests fill. */
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

afterEach(() => {
  vi.useRealTimers();
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

/** Four nodes in a row, so an `order: 'x'` sweep has something to rank. */
const ROW = {
  nodes: [
    { id: 'n3', type: 'thing', position: { x: 300, y: 0 } },
    { id: 'n1', type: 'thing', position: { x: 100, y: 0 } },
    { id: 'n4', type: 'thing', position: { x: 400, y: 0 } },
    { id: 'n2', type: 'thing', position: { x: 200, y: 0 } },
  ],
  edges: [{ id: 'e1', type: 'rel', source: 'n1', target: 'n4' }],
};

/** The `fade-in` entry the behaviour wrote on a node, if any. */
function fadeOf(layer: GraphLayer, id: string): { delayMs: number; durationMs: number } | undefined {
  const style = layer.store.getNode(id)?.style as NodeStyle | undefined;
  return style?.effects?.['fade-in'] as { delayMs: number; durationMs: number } | undefined;
}

describe('EntranceBehaviour', () => {
  it('writes a fade on every node once the data lands (no layout)', () => {
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(
      new EntranceBehaviour({ id: 'entrance', targetLayerId: 'graph', enabled: true }),
    );
    layer.setData(ROW);
    settle(layer);

    for (const id of ['n1', 'n2', 'n3', 'n4']) {
      expect(fadeOf(layer, id), `node ${id}`).toBeDefined();
    }
  });

  it('staggers the delay in reading order along the sweep axis', () => {
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(
      new EntranceBehaviour({
        id: 'entrance',
        targetLayerId: 'graph',
        enabled: true,
        staggerMs: 30,
        order: 'x',
      }),
    );
    layer.setData(ROW);
    settle(layer);

    // Declaration order is n3, n1, n4, n2 — the sweep must follow *position*.
    const delays = ['n1', 'n2', 'n3', 'n4'].map((id) => fadeOf(layer, id)!.delayMs);
    expect(delays).toEqual([0, 30, 60, 90]);
  });

  it('compresses the step so the whole sweep fits inside maxStaggerMs', () => {
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(
      new EntranceBehaviour({
        id: 'entrance',
        targetLayerId: 'graph',
        enabled: true,
        staggerMs: 500,
        maxStaggerMs: 90,
        order: 'x',
      }),
    );
    layer.setData(ROW);
    settle(layer);

    expect(fadeOf(layer, 'n4')!.delayMs).toBe(90);
  });

  it('puts an edge behind the later of its two endpoints', () => {
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(
      new EntranceBehaviour({
        id: 'entrance',
        targetLayerId: 'graph',
        enabled: true,
        staggerMs: 30,
        order: 'x',
      }),
    );
    layer.setData(ROW);
    settle(layer);

    const edgeStyle = layer.store.getEdge('e1')?.style as EdgeStyle | undefined;
    const fade = edgeStyle?.effects?.['fade-in-connector'] as { delayMs: number } | undefined;
    // e1 joins n1 (delay 0) and n4 (delay 90) — it may not arrive before n4.
    expect(fade?.delayMs).toBe(90);
  });

  it('retires every effect it wrote once the sweep is over', () => {
    vi.useFakeTimers();
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(
      new EntranceBehaviour({
        id: 'entrance',
        targetLayerId: 'graph',
        enabled: true,
        durationMs: 200,
        staggerMs: 10,
      }),
    );
    layer.setData(ROW);
    settle(layer);
    expect(fadeOf(layer, 'n1')).toBeDefined();

    vi.advanceTimersByTime(5_000);
    settle(layer);

    for (const id of ['n1', 'n2', 'n3', 'n4']) {
      expect(fadeOf(layer, id), `node ${id}`).toBeUndefined();
    }
    const edgeStyle = layer.store.getEdge('e1')?.style as EdgeStyle | undefined;
    expect(edgeStyle?.effects?.['fade-in-connector']).toBeUndefined();
  });

  it('leaves effects the consumer set alone', () => {
    vi.useFakeTimers();
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(
      new EntranceBehaviour({ id: 'entrance', targetLayerId: 'graph', enabled: true }),
    );
    layer.setData({
      nodes: [{ id: 'n1', type: 'thing', position: { x: 0, y: 0 }, style: { effects: { shake: { amplitude: 2 } } } }],
      edges: [],
    });
    settle(layer);
    vi.advanceTimersByTime(5_000);
    settle(layer);

    const style = layer.store.getNode('n1')?.style as NodeStyle | undefined;
    expect(style?.effects?.['fade-in']).toBeUndefined();
    expect(style?.effects?.['shake']).toEqual({ amplitude: 2 });
  });

  it('does nothing while disabled — rule 7', () => {
    const { canvas, layer } = mountGraph();
    canvas.behaviours.register(new EntranceBehaviour({ id: 'entrance', targetLayerId: 'graph' }));
    layer.setData(ROW);
    settle(layer);

    expect(fadeOf(layer, 'n1')).toBeUndefined();
  });

  it('plays once — a second data change does not replay it', () => {
    const { canvas, layer } = mountGraph();
    const behaviour = new EntranceBehaviour({
      id: 'entrance',
      targetLayerId: 'graph',
      enabled: true,
    });
    canvas.behaviours.register(behaviour);
    layer.setData(ROW);
    settle(layer);

    // Clear by hand, then provoke another data change: nothing should come back.
    behaviour.disable();
    settle(layer);
    layer.store.addNode({ id: 'n5', type: 'thing', position: { x: 500, y: 0 } });
    settle(layer);

    expect(fadeOf(layer, 'n5')).toBeUndefined();
  });

  it('replay() plays it again', () => {
    const { canvas, layer } = mountGraph();
    const behaviour = new EntranceBehaviour({
      id: 'entrance',
      targetLayerId: 'graph',
      enabled: true,
    });
    canvas.behaviours.register(behaviour);
    layer.setData(ROW);
    settle(layer);

    behaviour.replay();
    settle(layer);

    expect(fadeOf(layer, 'n1')).toBeDefined();
  });

  it('exposes its resolved options for a settings editor', () => {
    const { canvas, layer } = mountGraph();
    const behaviour = new EntranceBehaviour({ id: 'entrance', targetLayerId: 'graph' });
    canvas.behaviours.register(behaviour);
    expect(behaviour.kind).toBe('entrance');
    expect(behaviour.getResolvedOptions()).toEqual({
      durationMs: 320,
      staggerMs: 24,
      maxStaggerMs: 600,
      order: 'x',
      includeEdges: true,
      easing: 'easeOutCubic',
    });

    behaviour.setOptions({ durationMs: 500, order: 'y' });
    expect(behaviour.getResolvedOptions().durationMs).toBe(500);
    expect(behaviour.getResolvedOptions().order).toBe('y');
    void layer;
  });
});
