/**
 * PR 3 of RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`:
 * `history.sinceLastStep` turns manual work into a step and `addStep` adopts
 * it (F14), and streamed `applyDelta(…, { coalesce: true })` writes merge into
 * one entry per actor (F15). Plus the net-op helpers behind both.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer, Layout, type LayoutRunOptions } from '@invana/canvas';

import type { GraphData } from '../../src/layer/types';
import type { HistoryOp } from '../../src/history/types';

import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { GraphStore } from '../../src/store/GraphStore';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';
import { FocusBehaviour } from '../../src/behaviours/FocusBehaviour';
import { cancelOps, opsToDelta } from '../../src/history/netOps';

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {}, addEventListener: () => {}, removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({ font: '', measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }) }),
  });
  g['document'] ??= { createElement: element };
});

afterEach(() => {
  vi.useRealTimers();
});

/** A layout that records each run's options and places nothing. */
class CountingLayout extends Layout {
  override readonly kind = 'counting';
  readonly runs: LayoutRunOptions[] = [];
  async apply(_layer: unknown, run?: LayoutRunOptions): Promise<void> {
    this.runOptions = run ?? {};
    this.runs.push(run ?? {});
    this.events.emit('start', { nodeCount: 0, edgeCount: 0, animate: false });
    this.events.emit('end', { reason: 'completed' });
  }
}

const DATA: GraphData = {
  nodes: [
    { id: 'a', type: 'node', position: { x: 0, y: 0 } },
    { id: 'b', type: 'node', position: { x: 100, y: 0 } },
    { id: 'c', type: 'node', position: { x: 200, y: 50 } },
    { id: 'd', type: 'node', position: { x: 300, y: 80 } },
  ],
  edges: [
    { id: 'ab', type: 'edge', source: 'a', target: 'b' },
    { id: 'bc', type: 'edge', source: 'b', target: 'c' },
    { id: 'cd', type: 'edge', source: 'c', target: 'd' },
  ],
};

function makeCanvas(opts: { layout?: boolean } = {}) {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: { initData: DATA } });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const flush = (): void => {
    layer.store.flush();
    layer.flush();
  };
  let layout: CountingLayout | undefined;
  if (opts.layout) {
    layout = new CountingLayout({ id: 'l', targetLayerId: 'graph' });
    canvas.layouts.add(layout as never);
    canvas.update({ activeLayout: 'l' });
    layout.runs.length = 0; // the activation run
  }
  return { canvas, layer, flush, layout };
}

/** Every node / edge record in `store`, for before / after comparisons. */
function snapshot(store: GraphStore) {
  return {
    nodes: [...store.nodes()].map((n) => ({ id: n.id, hidden: store.isNodeHidden(n.id) })).sort((a, b) => a.id.localeCompare(b.id)),
    edges: [...store.edges()].map((e) => e.id).sort(),
  };
}

describe('netOps — opsToDelta (F14)', () => {
  it('folds a run of ops into the net change', () => {
    const ops: HistoryOp[] = [
      { kind: 'addNode', node: { id: 'x', type: 't' } },
      { kind: 'updateNode', id: 'x', before: {}, after: { data: { v: 1 } } },
      { kind: 'addNodes', nodes: [{ id: 'y', type: 't' }, { id: 'z', type: 't' }] },
      { kind: 'addEdge', edge: { id: 'xy', type: 'e', source: 'x', target: 'y' } },
      { kind: 'removeNode', node: { id: 'x', type: 't' }, edges: [{ id: 'xy', type: 'e', source: 'x', target: 'y' }] },
      { kind: 'updateNode', id: 'a', before: { data: {} }, after: { data: { w: 2 } } },
      { kind: 'moveNode', id: 'a', before: { x: 0, y: 0 }, after: { x: 5, y: 6 } },
      { kind: 'removeNode', node: { id: 'b', type: 't' }, edges: [] },
      { kind: 'addNode', node: { id: 'b', type: 'new' } },
      { kind: 'setHidden', element: 'node', ids: ['c', 'z'], hidden: true },
      { kind: 'setHidden', element: 'node', ids: ['c'], hidden: false },
      { kind: 'removeEdge', edge: { id: 'cd', type: 'e', source: 'c', target: 'd' } },
    ];
    expect(opsToDelta(ops)).toEqual({
      added: { nodes: [{ id: 'y', type: 't' }, { id: 'z', type: 't' }, { id: 'b', type: 'new' }] },
      updated: { nodes: [{ id: 'a', patch: { data: { w: 2 }, position: { x: 5, y: 6 } } }] },
      removed: { nodeIds: ['b'], edgeIds: ['cd'] },
      hidden: { nodeIds: ['z'] },
      shown: { nodeIds: ['c'] },
    });
  });
});

describe('netOps — cancelOps (F15)', () => {
  it('drops what is added and removed inside the run, and replays to the same states', () => {
    const store = new GraphStore();
    store.addData(DATA);
    const log: unknown[][] = [];
    // Capture the recorded ops of three writes as one run.
    const fake = {
      registerSource: () => () => {},
      recordData: (_s: string, ops: unknown[]) => void log.push(ops),
      group: <T>(_m: unknown, fn: () => T) => fn(),
      replaying: false,
    };
    store.attachLog(fake as never, 'graph');
    const before = snapshot(store);
    store.applyDelta({ added: { nodes: [{ id: 'x', type: 'node' }], edges: [{ id: 'ax', type: 'edge', source: 'a', target: 'x' }] } });
    store.applyDelta({ updated: { nodes: [{ id: 'x', patch: { data: { v: 1 } } }] }, hidden: { nodeIds: ['x', 'b'] } });
    store.applyDelta({ removed: { nodeIds: ['x', 'd'] } });
    const after = snapshot(store);
    const ops = log.flat() as HistoryOp[];
    const kept = cancelOps(ops);
    expect(kept.map((o) => o.kind)).toEqual(['setHidden', 'removeNode']);
    expect(JSON.stringify(kept)).not.toMatch(/"id":"x"|"id":"ax"|\["x"|,"x"\]/);

    const replay = store as unknown as { replayOps(ops: readonly unknown[], d: 'forward' | 'back'): void };
    replay.replayOps(kept, 'back');
    expect(snapshot(store)).toEqual(before);
    replay.replayOps(kept, 'forward');
    expect(snapshot(store)).toEqual(after);
  });
});

describe('F15 — streamed applyDelta merges per actor', () => {
  it('V13: ticks merge into one entry, add + remove cancel, plain undo skips the feed', () => {
    const { canvas, layer } = makeCanvas();
    canvas.history.clear();
    const feed = (delta: Parameters<GraphStore['applyDelta']>[0]) => layer.store.applyDelta(delta, { actor: 'feed', coalesce: true });
    feed({ added: { nodes: [{ id: 'f1', type: 'node' }] } });
    feed({ added: { nodes: [{ id: 'f2', type: 'node' }] } });
    feed({ removed: { nodeIds: ['f1'] } });
    const entries = canvas.history.entries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ actor: 'feed', coalesced: true });
    expect(JSON.stringify(entries[0]!.parts)).not.toContain('f1');

    layer.store.addNode({ id: 'mine', type: 'node' });
    feed({ added: { nodes: [{ id: 'f3', type: 'node' }] } });
    expect(canvas.history.entries().map((e) => e.actor)).toEqual(['feed', 'user', 'feed']);
    canvas.history.undo();
    expect(layer.store.hasNode('mine')).toBe(false);
    expect(layer.store.hasNode('f2')).toBe(true);
    expect(layer.store.hasNode('f3')).toBe(true);
    expect(canvas.history.canUndo()).toBe(false);
    canvas.destroy();
  });

  it('V13 control: applyDelta without coalesce still records one undoable entry per call', () => {
    const { canvas, layer } = makeCanvas();
    canvas.history.clear();
    layer.store.applyDelta({ added: { nodes: [{ id: 'p', type: 'node' }] } }, { actor: 'feed' });
    layer.store.applyDelta({ added: { nodes: [{ id: 'q', type: 'node' }] } }, { actor: 'feed' });
    expect(canvas.history.entries()).toHaveLength(2);
    canvas.history.undo();
    expect(layer.store.hasNode('q')).toBe(false);
    canvas.destroy();
  });

  it('a playbook step seals the open streamed entry', async () => {
    const { canvas, layer } = makeCanvas();
    canvas.history.clear();
    const feed = (id: string) => layer.store.applyDelta({ added: { nodes: [{ id, type: 'node' }] } }, { actor: 'feed', coalesce: true });
    feed('f1');
    canvas.playbook.addStep({ id: 's', title: 'Hide a', source: 'graph', data: { hidden: { nodeIds: ['a'] } } });
    await canvas.playbook.next();
    feed('f2');
    expect(canvas.history.entries().map((e) => e.stepId ?? e.actor)).toEqual(['feed', 's', 'feed']);
    canvas.destroy();
  });
});

describe('F14 — history.sinceLastStep on a canvas', () => {
  it('V12: manual work becomes a step — net data, settings from edits, final view', async () => {
    const { canvas, layer } = makeCanvas();
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph', enabled: true }));
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', enabled: true }));
    canvas.history.clear();
    canvas.playbook.addStep({ id: 'start', title: 'Start', source: 'graph', data: { hidden: { nodeIds: ['d'] } } });
    await canvas.playbook.next();

    layer.store.addNode({ id: 'x', type: 'node' });
    layer.store.addNode({ id: 'y', type: 'node' });
    layer.store.removeNode('x');
    canvas.update({ behaviours: { focus: { dimState: 'disabled' } } }, 'edit:user');
    canvas.update({ behaviours: { focus: { dimState: 'muted' } } }, 'edit:user');
    canvas.store.actions.selection.set(['a', 'y']);
    canvas.store.actions.focus.set(['y'], false);

    const step = canvas.history.sinceLastStep<Record<string, unknown>>('My changes');
    expect(step).toMatchObject({
      title: 'My changes',
      source: 'graph',
      data: { added: { nodes: [{ id: 'y', type: 'node' }] } },
      settings: { behaviours: { focus: { dimState: 'muted' } } },
      view: { select: ['a', 'y'], focus: { ids: ['y'], dim: false } },
    });
    expect(step.data?.removed).toBeUndefined();
    canvas.destroy();
  });

  it('V12: addStep adopts it; previous reverts the manual work; next replays it', async () => {
    const { canvas, layer, flush } = makeCanvas();
    canvas.history.clear();
    canvas.playbook.addStep({ id: 'start', title: 'Start', source: 'graph', data: { hidden: { nodeIds: ['d'] } } });
    await canvas.playbook.next();
    layer.store.addNode({ id: 'y', type: 'node' });
    layer.store.hideNodes(['a']);
    const entriesBefore = canvas.history.entries().length;

    const step = canvas.history.sinceLastStep('Manual');
    canvas.playbook.addStep(step);
    expect(canvas.playbook.index).toBe(1);
    expect(canvas.history.entries()).toHaveLength(entriesBefore);
    expect(canvas.history.entries({ stepId: step.id })).toHaveLength(2);

    await canvas.playbook.previous();
    flush();
    expect(layer.store.hasNode('y')).toBe(false);
    expect(layer.store.isNodeHidden('a')).toBe(false);
    expect(layer.store.isNodeHidden('d')).toBe(true);

    await canvas.playbook.next();
    flush();
    expect(layer.store.hasNode('y')).toBe(true);
    expect(layer.store.isNodeHidden('a')).toBe(true);
    expect(canvas.history.entries()).toHaveLength(entriesBefore);

    // The playbook's JSON carries the adopted step, so it can be saved and played elsewhere.
    expect(canvas.playbook.toJSON().steps[1]).toMatchObject({ title: 'Manual', data: { added: { nodes: [{ id: 'y' }] }, hidden: { nodeIds: ['a'] } } });
    canvas.destroy();
  });
});
