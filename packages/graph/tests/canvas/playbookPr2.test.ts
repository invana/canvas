/**
 * PR 2 of RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`:
 * the canvas follows store state (F8, F10), draws the focus (F9), re-runs the
 * active layout on hide / show with `onData` (F7), awaits commands (F11), and
 * plays JSON steps through `canvas.playbook` (F13). A React `data`-prop load is
 * the baseline (F24). Lives here because `packages/canvas` carries no tests.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  HeadlessRenderer,
  Layout,
  PlaybookStepError,
  exportCanvasState,
  importCanvasState,
  type LayoutRunOptions
} from '@invana/canvas';

import type { GraphData } from '../../src/layer/types';

import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';
import { ClickViewBehaviour } from '../../src/behaviours/ClickViewBehaviour';
import { FocusBehaviour } from '../../src/behaviours/FocusBehaviour';

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

/** Count view-store changes that touched `interaction.<slice>`. */
function countWrites(canvas: GraphCanvas, slice: string): () => number {
  let n = 0;
  canvas.store.view.subscribeChanges((c) => {
    if (c.patches.some((p) => p.path[0] === 'interaction' && p.path[1] === slice)) n++;
  });
  return () => n;
}

describe('F7 — the active layout re-runs on hide / show, per onData', () => {
  it('V7: an explicit hide and a show each re-run the layout; collapse-derived hiding does not', () => {
    const { canvas, layer, flush, layout } = makeCanvas({ layout: true });
    layer.store.hideNodes(['c']);
    flush();
    expect(layout!.runs).toHaveLength(1);
    layer.store.showNodes(['c']);
    flush();
    expect(layout!.runs).toHaveLength(2);
    layer.store.setCollapseHidden(['d']);
    flush();
    expect(layout!.runs).toHaveLength(2);
    canvas.destroy();
  });

  it('V7: a throttled layout runs once per window (leading + trailing) and keeps the camera', () => {
    vi.useFakeTimers();
    const { canvas, layer, flush, layout } = makeCanvas({ layout: true });
    layout!.onData = { throttleMs: 500, preserveCamera: true };
    vi.advanceTimersByTime(1000); // past the activation run's window
    const camera = canvas.store.view.getState().interaction.camera;
    layer.store.hideNodes(['a']);
    flush();
    layer.store.hideNodes(['b']);
    flush();
    layer.store.showNodes(['a']);
    flush();
    expect(layout!.runs).toHaveLength(1); // the leading run
    vi.advanceTimersByTime(500);
    expect(layout!.runs).toHaveLength(2); // one trailing run for the rest
    expect(layout!.runs.every((r) => r.preserveCamera === true)).toBe(true);
    expect(canvas.store.view.getState().interaction.camera).toEqual(camera);
    canvas.destroy();
  });

  it('F11: commands.runAsync awaits layout.run; a missing command resolves false', async () => {
    const { canvas, layout } = makeCanvas({ layout: true });
    let done = false;
    const run = canvas.commands.runAsync('layout.run', {}).then((ok) => {
      done = true;
      return ok;
    });
    expect(await run).toBe(true);
    expect(done).toBe(true);
    expect(layout!.runs).toHaveLength(1);
    expect(await canvas.commands.runAsync('no.such' as never)).toBe(false);
    canvas.destroy();
  });
});

describe('F8 — ClickSelectBehaviour follows interaction.selection', () => {
  it('V8: a store write selects on screen with exactly one selection write (no echo)', () => {
    const { canvas, layer, flush } = makeCanvas();
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'sel', targetLayerId: 'graph', enabled: true }));
    const writes = countWrites(canvas, 'selection');
    canvas.store.actions.selection.set(['a', 'bc']);
    flush();
    expect(layer.store.hasNodeState('a', 'selected')).toBe(true);
    expect(layer.store.hasEdgeState('bc', 'selected')).toBe(true);
    expect(layer.store.hasNodeState('b', 'selected')).toBe(false);
    expect(writes()).toBe(1);

    canvas.store.actions.selection.clear();
    flush();
    expect(layer.store.hasNodeState('a', 'selected')).toBe(false);
    expect(writes()).toBe(2);
    canvas.destroy();
  });

  it('V8: two layers share the canvas-wide selection; each mirrors and follows only its own ids', () => {
    const { canvas, layer } = makeCanvas();
    const other = new GraphLayer({ id: 'other', options: { initData: { nodes: [{ id: 'o1', type: 'node' }], edges: [] } } });
    canvas.layers.add(other);
    canvas.layers.mountAll();
    const selGraph = new ClickSelectBehaviour({ id: 'sel-graph', targetLayerId: 'graph', enabled: true });
    const selOther = new ClickSelectBehaviour({ id: 'sel-other', targetLayerId: 'other', enabled: true });
    canvas.behaviours.register(selGraph);
    canvas.behaviours.register(selOther);
    selGraph.select('a');
    selOther.select('o1');
    expect(new Set(canvas.store.view.getState().interaction.selection)).toEqual(new Set(['a', 'o1']));
    layer.store.flush();
    expect(layer.store.hasNodeState('a', 'selected')).toBe(true);
    selGraph.clearSelection();
    expect([...canvas.store.view.getState().interaction.selection]).toEqual(['o1']);
    canvas.destroy();
  });

  it('V8: the behaviour\'s own selection still mirrors into the store once', () => {
    const { canvas } = makeCanvas();
    const sel = new ClickSelectBehaviour({ id: 'sel', targetLayerId: 'graph', enabled: true });
    canvas.behaviours.register(sel);
    const writes = countWrites(canvas, 'selection');
    sel.selectMultiple([{ id: 'c' }]);
    expect([...canvas.store.view.getState().interaction.selection]).toEqual(['c']);
    expect(writes()).toBe(1);
    canvas.destroy();
  });
});

describe('F9 — FocusBehaviour draws interaction.focus', () => {
  it('V9: focus emphasises the ids, dims the rest through store.internal, and clears', () => {
    const { canvas, layer, flush } = makeCanvas();
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', enabled: true }));
    canvas.history.clear();
    canvas.store.actions.focus.set(['a', 'b']);
    flush();
    expect(layer.store.hasNodeState('a', 'highlighted')).toBe(true);
    expect(layer.store.hasEdgeState('ab', 'highlighted')).toBe(true);
    expect(layer.store.hasNodeState('c', 'dimmed')).toBe(true);
    expect(layer.store.hasEdgeState('cd', 'dimmed')).toBe(true);
    expect(layer.store.hasNodeState('a', 'dimmed')).toBe(false);
    // Only the focus intent is recorded — never the states it drew.
    const entries = canvas.history.entries();
    expect(entries).toHaveLength(1);
    expect(entries[0]!.parts.every((p) => p.kind === 'view')).toBe(true);

    canvas.store.actions.focus.set(['a'], false); // no dimming
    flush();
    expect(layer.store.hasNodeState('c', 'dimmed')).toBe(false);
    expect(layer.store.hasNodeState('b', 'highlighted')).toBe(false);

    canvas.store.actions.focus.clear();
    flush();
    expect(layer.store.hasNodeState('a', 'highlighted')).toBe(false);
    canvas.destroy();
  });

  it('V9: disabling clears what it drew; setOptions re-draws under the new state name', () => {
    const { canvas, layer, flush } = makeCanvas();
    const focus = new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', enabled: true });
    canvas.behaviours.register(focus);
    canvas.store.actions.focus.set(['a']);
    focus.setOptions({ focusState: 'selected' });
    flush();
    expect(layer.store.hasNodeState('a', 'highlighted')).toBe(false);
    expect(layer.store.hasNodeState('a', 'selected')).toBe(true);
    canvas.behaviours.setEnabled('focus', false);
    flush();
    expect(layer.store.hasNodeState('a', 'selected')).toBe(false);
    expect(layer.store.hasNodeState('b', 'dimmed')).toBe(false);
    canvas.destroy();
  });

  it('V9: a focus camera intent frames the focused nodes once the canvas settles', async () => {
    const { canvas, flush } = makeCanvas();
    canvas.behaviours.register(
      new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', enabled: true, frameDurationMs: 0 }),
    );
    flush();
    const before = { x: canvas.camera.x, y: canvas.camera.y, zoom: canvas.camera.scale };
    canvas.store.actions.focus.set(['c', 'd']);
    canvas.store.actions.cameraIntent.request('focus');
    await new Promise((r) => setTimeout(r, 60));
    const after = { x: canvas.camera.x, y: canvas.camera.y, zoom: canvas.camera.scale };
    expect(after).not.toEqual(before);
    canvas.destroy();
  });
});

describe('F10 — inspect and camera intent', () => {
  it('ClickViewBehaviour follows interaction.inspect and writes its own target back', () => {
    const { canvas } = makeCanvas();
    const view = new ClickViewBehaviour({ id: 'view', targetLayerId: 'graph', enabled: true });
    canvas.behaviours.register(view);
    canvas.store.actions.inspect.set('b');
    expect(view.getTarget()).toEqual({ kind: 'node', id: 'b' });
    canvas.store.actions.inspect.set('cd');
    expect(view.getTarget()).toEqual({ kind: 'edge', id: 'cd' });
    canvas.store.actions.inspect.clear();
    expect(view.getTarget()).toBeNull();
    view.setTarget({ kind: 'node', id: 'a' });
    expect(canvas.store.view.getState().interaction.inspect).toBe('a');
    view.clear();
    expect(canvas.store.view.getState().interaction.inspect).toBeNull();
    canvas.destroy();
  });

  it('inspect and camera intent are recorded but plain undo steps over them; the canvas frames "all"', async () => {
    const { canvas, flush } = makeCanvas();
    flush();
    canvas.camera.setTransform({ x: 0, y: 0, zoom: 4 });
    canvas.history.clear();
    canvas.store.actions.inspect.set('a');
    canvas.store.actions.cameraIntent.request('all');
    expect(canvas.history.entries()).toHaveLength(2);
    expect(canvas.history.canUndo()).toBe(false);
    await new Promise((r) => setTimeout(r, 60)); // settle
    expect(canvas.camera.isAnimating).toBe(true); // the glide to the fit
    canvas.tickOnce(1000); // headless: no render loop, so advance it by hand
    expect(canvas.camera.scale).not.toBe(4);
    canvas.destroy();
  });
});

describe('F10 — state export carries inspect and camera intent', () => {
  it('round-trips both fields; an import restores the intent without re-framing', async () => {
    const { canvas } = makeCanvas();
    canvas.store.actions.inspect.set('b');
    canvas.store.actions.cameraIntent.request('visible');
    const snapshot = exportCanvasState(canvas);
    expect(snapshot.view.interaction.inspect).toBe('b');
    expect(snapshot.view.interaction.cameraIntent).toEqual({ intent: 'visible', seq: 1 });

    const { canvas: other } = makeCanvas();
    other.camera.setTransform({ x: 5, y: 5, zoom: 3 });
    importCanvasState(other, { ...snapshot, view: { ...snapshot.view, interaction: { ...snapshot.view.interaction, camera: { x: 5, y: 5, zoom: 3 } } } });
    expect(other.store.view.getState().interaction.inspect).toBe('b');
    expect(other.store.view.getState().interaction.cameraIntent).toEqual({ intent: 'visible', seq: 1 });
    await new Promise((r) => setTimeout(r, 60));
    expect(other.camera.isAnimating).toBe(false);
    expect(other.camera.scale).toBe(3);
    canvas.destroy();
    other.destroy();
  });

  it('an older snapshot without the fields imports as null', () => {
    const { canvas } = makeCanvas();
    const snapshot = exportCanvasState(canvas);
    const { inspect: _i, cameraIntent: _c, ...older } = snapshot.view.interaction;
    canvas.store.actions.inspect.set('a');
    importCanvasState(canvas, { ...snapshot, view: { ...snapshot.view, interaction: older } });
    expect(canvas.store.view.getState().interaction.inspect).toBeNull();
    canvas.destroy();
  });
});

describe('F13 — canvas.playbook plays JSON steps', () => {
  it('V11: a step writes data + view as one entry; previous reverts it; next replays it', async () => {
    const { canvas, layer, flush } = makeCanvas();
    canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', enabled: true }));
    canvas.history.clear();
    await canvas.playbook.load({ version: 1, title: 'Walk', source: 'graph', steps: [] });
    canvas.playbook.addStep({
      id: 'narrow',
      title: 'Narrow to a–b',
      actor: 'assistant',
      data: { hidden: { nodeIds: ['c', 'd'] }, added: { nodes: [{ id: 'e' }] } },
      view: { focus: { ids: ['a', 'e'] }, select: ['a'] },
    });
    expect(layer.store.hasNode('e')).toBe(false); // addStep doesn't change the canvas

    await canvas.playbook.next();
    flush();
    expect(layer.store.isNodeHidden('c')).toBe(true);
    expect(layer.store.hasNode('e')).toBe(true);
    expect(layer.store.hasNodeState('a', 'highlighted')).toBe(true);
    const entries = canvas.history.entries({ stepId: 'narrow' });
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ actor: 'assistant', title: 'Narrow to a–b' });

    await canvas.playbook.previous();
    flush();
    expect(layer.store.isNodeHidden('c')).toBe(false);
    expect(layer.store.hasNode('e')).toBe(false);
    expect(canvas.store.view.getState().interaction.focus).toBeNull();
    expect(layer.store.hasNodeState('a', 'highlighted')).toBe(false);

    await canvas.playbook.next();
    flush();
    expect(layer.store.hasNode('e')).toBe(true);
    expect(canvas.history.entries({ stepId: 'narrow' })).toHaveLength(1);
    canvas.destroy();
  });

  it('V11: a bad id or an unknown command writes nothing', async () => {
    const { canvas, layer } = makeCanvas();
    canvas.history.clear();
    canvas.playbook.addStep({
      id: 'bad',
      title: 'Bad',
      source: 'graph',
      data: { hidden: { nodeIds: ['a'] } },
      view: { focus: { ids: ['ghost'] } },
      do: [{ command: 'no.such' }],
    });
    const err = await canvas.playbook.next().catch((e: unknown) => e);
    expect(err).toBeInstanceOf(PlaybookStepError);
    expect((err as PlaybookStepError).problems).toEqual([
      'view.focus: unknown id "ghost"',
      'do: unknown command "no.such"',
    ]);
    expect(layer.store.isNodeHidden('a')).toBe(false);
    expect(canvas.history.entries()).toHaveLength(0);
    canvas.destroy();
  });

  it('settings in a step are an edit: plain undo takes them back', async () => {
    const { canvas } = makeCanvas({ layout: true });
    canvas.history.clear();
    canvas.layouts.add(new CountingLayout({ id: 'l2', targetLayerId: 'graph' }) as never);
    canvas.playbook.addStep({ id: 's', title: 'Switch layout', settings: { activeLayout: 'l2' } });
    await canvas.playbook.next();
    expect(canvas.get().activeLayout).toBe('l2');
    const l = canvas.layouts.get<CountingLayout>('l')!;
    const before = l.runs.length;
    canvas.history.undo();
    expect(canvas.get().activeLayout).toBe('l');
    // The reverted layout is wired again and runs.
    expect(l.runs.length).toBe(before + 1);
    canvas.destroy();
  });
});

describe('F24 — a data-prop load is the baseline', () => {
  it('V16: loadData leaves nothing to undo; setData from code records one entry', () => {
    const { canvas, layer } = makeCanvas();
    layer.store.addNode({ id: 'x', type: 'node' });
    expect(canvas.history.canUndo()).toBe(true);
    layer.loadData({ nodes: [{ id: 'p', type: 'node' }, { id: 'q', type: 'node' }], edges: [] });
    expect(canvas.history.canUndo()).toBe(false);
    expect(layer.store.nodeCount()).toBe(2);
    layer.setData({ nodes: [{ id: 'r', type: 'node' }], edges: [] });
    expect(canvas.history.entries()).toHaveLength(1);
    canvas.history.undo();
    expect(layer.store.hasNode('p')).toBe(true);
    canvas.destroy();
  });
});
