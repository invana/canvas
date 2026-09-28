/**
 * V6 (log half) of `rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`:
 * behaviours that write presentation derived from content (Entrance's fade,
 * NodeCentrality's size, ParallelEdge's offsets, EdgeLOD's thinning) write
 * through `store.internal`, so the log holds only content — and after undo they
 * recompute rather than fight it. (CollapseExpand's count badge takes the same
 * path but needs a DOM canvas element, which the headless double lacks.)
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessRenderer, type DataLogPart } from '@invana/canvas';

import { GraphLayer } from '../../src/layer/GraphLayer';
import { EntranceBehaviour } from '../../src/behaviours/EntranceBehaviour';
import { NodeCentralityBehaviour } from '../../src/behaviours/NodeCentralityBehaviour';
import { ParallelEdgeBehaviour } from '../../src/behaviours/ParallelEdgeBehaviour';
import { EdgeLODBehaviour } from '../../src/behaviours/EdgeLODBehaviour';
import type { HistoryOp } from '../../src/history/types';
import type { NodeStyle } from '../../src/layer/types';

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
    { id: 'h-a1', type: 'rel', source: 'hub', target: 'a' },
    { id: 'h-a2', type: 'rel', source: 'hub', target: 'a' }, // a parallel pair
    { id: 'h-b', type: 'rel', source: 'hub', target: 'b' },
    { id: 'h-c', type: 'rel', source: 'hub', target: 'c' },
  ],
};

function mount() {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const t = 'graph';
  canvas.behaviours.register(new EntranceBehaviour({ id: 'entrance', targetLayerId: t, enabled: true }));
  canvas.behaviours.register(new NodeCentralityBehaviour({ id: 'centrality', targetLayerId: t, enabled: true }));
  canvas.behaviours.register(new ParallelEdgeBehaviour({ id: 'parallel', targetLayerId: t, enabled: true }));
  canvas.behaviours.register(new EdgeLODBehaviour({ id: 'edge-lod', targetLayerId: t, enabled: true }));
  // NodeCentrality recomputes on a microtask; give it one, then flush what it wrote.
  const settle = async (): Promise<void> => {
    layer.store.flush();
    layer.flush();
    await new Promise((r) => setTimeout(r, 0));
    layer.store.flush();
    layer.flush();
  };
  return { canvas, layer, settle };
}

/** Every op the log holds, flattened. */
function loggedOps(canvas: Canvas): HistoryOp[] {
  return canvas.history
    .entries()
    .flatMap((e) => e.parts.flatMap((p) => (p.kind === 'data' ? ((p as DataLogPart).ops as HistoryOp[]) : [])));
}

/** A style-only update is what a derived write would look like had it leaked into the log. */
const isStyleOnlyUpdate = (op: HistoryOp): boolean =>
  (op.kind === 'updateNode' || op.kind === 'updateEdge') && Object.keys(op.after).every((k) => k === 'style');

describe('derived writes stay out of the log (V6)', () => {
  it('loading data records one content entry; the behaviours reacting to it record nothing', async () => {
    const { canvas, layer, settle } = mount();
    layer.setData(DATA);
    await settle();
    expect(canvas.history.entries()).toHaveLength(1);
    expect(loggedOps(canvas).some(isStyleOnlyUpdate)).toBe(false);
    // The behaviours did write: centrality sized the hub.
    expect((layer.store.getNode('hub')?.style as NodeStyle | undefined)?.size).toBeDefined();
    canvas.destroy();
  });

  it('a content edit is one entry; undo reverts it and the behaviours recompute without recording', async () => {
    const { canvas, layer, settle } = mount();
    layer.setData(DATA);
    await settle();
    canvas.history.clear();

    layer.store.removeNode('c');
    await settle();
    expect(canvas.history.entries()).toHaveLength(1);

    canvas.history.undo();
    await settle();
    expect(layer.store.hasNode('c')).toBe(true);
    expect(canvas.history.entries()).toHaveLength(0);
    expect(canvas.history.canRedo()).toBe(true);
    // Recomputed after the undo, as a behaviour-owned slot — not restored from the log.
    expect((layer.store.getNode('hub')?.style as NodeStyle | undefined)?.size).toBeDefined();
    canvas.destroy();
  });
});
