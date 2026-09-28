/**
 * The plain graph action functions shared by `canvas-react`'s hooks and the
 * commands its providers register: the select-mode rule, clipboard actions over
 * the click-selection, clear, and the two-stack (graph + definition) undo.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { HeadlessRenderer } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { BrushSelectBehaviour } from '../../src/behaviours/BrushSelectBehaviour';
import { LassoSelectBehaviour } from '../../src/behaviours/LassoSelectBehaviour';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';
import { GraphHistory } from '../../src/history/GraphHistory';
import { GraphClipboard } from '../../src/clipboard/GraphClipboard';
import { resolveSelectMode, selectModePatch } from '../../src/canvas/selectMode';
import {
  canRedoEither,
  canUndoEither,
  clearGraphLayer,
  copySelection,
  cutSelection,
  deleteSelection,
  pasteAndSelect,
  redoNewest,
  selectedElementIds,
  undoNewest,
} from '../../src/canvas/graphActions';

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

/** Let the clock move, so two histories' `at` stamps can't tie. */
const tick = () => new Promise((r) => setTimeout(r, 2));

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const click = new ClickSelectBehaviour({ id: 'click-select', targetLayerId: 'graph', enabled: true });
  canvas.behaviours.register(click);
  canvas.behaviours.register(new BrushSelectBehaviour({ id: 'brush-select', targetLayerId: 'graph', enabled: false }));
  canvas.behaviours.register(new LassoSelectBehaviour({ id: 'lasso-select', targetLayerId: 'graph', enabled: false }));
  layer.store.addNode({ id: 'a', type: 'node', position: { x: 0, y: 0 } });
  layer.store.addNode({ id: 'b', type: 'node', position: { x: 50, y: 0 } });
  layer.store.addEdge({ id: 'ab', type: 'edge', source: 'a', target: 'b' });
  const clipboard = new GraphClipboard(layer.store);
  // The setup data is the starting state, not an edit: start with empty history.
  canvas.history.clear();
  return { canvas, layer, click, clipboard };
}

const MODES = { click: '', brush: 'brush-select', lasso: 'lasso-select' };

describe('resolveSelectMode', () => {
  it('picks the first mode whose behaviour is enabled', () => {
    expect(resolveSelectMode(MODES, (id) => id === 'lasso-select')).toBe('lasso');
    expect(resolveSelectMode(MODES, () => true)).toBe('brush');
  });

  it('falls back to the behaviour-less mode, then the first key, then null', () => {
    expect(resolveSelectMode(MODES, () => false)).toBe('click');
    expect(resolveSelectMode({ brush: 'brush-select', lasso: 'lasso-select' }, () => false)).toBe('brush');
    expect(resolveSelectMode({}, () => true)).toBeNull();
  });

  it('never asks about a behaviour-less mode', () => {
    const asked: string[] = [];
    resolveSelectMode(MODES, (id) => (asked.push(id), false));
    expect(asked).toEqual(['brush-select', 'lasso-select']);
  });
});

describe('selectModePatch', () => {
  it('enables only the chosen mode\'s behaviour and skips behaviour-less modes', () => {
    expect(selectModePatch(MODES, 'lasso')).toEqual({
      'brush-select': { enabled: false },
      'lasso-select': { enabled: true },
    });
    expect(selectModePatch(MODES, 'click')).toEqual({
      'brush-select': { enabled: false },
      'lasso-select': { enabled: false },
    });
    expect(selectModePatch({}, 'click')).toEqual({});
  });

  it('applied through canvas.update, agrees with resolveSelectMode over the live behaviours', () => {
    const { canvas } = makeCanvas();
    canvas.update({ behaviours: selectModePatch(MODES, 'brush') });
    expect(resolveSelectMode(MODES, (id) => !!canvas.behaviours.get(id)?.enabled)).toBe('brush');
    canvas.destroy();
  });
});

describe('clipboard actions', () => {
  it('selectedElementIds reads the click-selection, empty for a missing behaviour', () => {
    const { canvas, click } = makeCanvas();
    click.selectMultiple([{ id: 'a', type: 'shape' }, { id: 'ab', type: 'connector' }]);
    expect(selectedElementIds(canvas, 'click-select')).toEqual({ nodeIds: ['a'], edgeIds: ['ab'] });
    expect(selectedElementIds(canvas, 'missing')).toEqual({ nodeIds: [], edgeIds: [] });
    canvas.destroy();
  });

  it('copy fills the buffer without editing; paste adds copies and selects them', () => {
    const { canvas, layer, click, clipboard } = makeCanvas();
    click.select('a');
    copySelection(canvas, clipboard, 'click-select');
    expect(clipboard.hasContent).toBe(true);
    expect(layer.store.getNode('a')).toBeDefined();

    pasteAndSelect(canvas, clipboard, null, 'click-select');
    const { nodeIds } = selectedElementIds(canvas, 'click-select');
    expect(nodeIds).toHaveLength(1);
    expect(nodeIds[0]).not.toBe('a');
    expect(layer.store.getNode(nodeIds[0]!)).toBeDefined();
    canvas.destroy();
  });

  it('the selection is read at call time', () => {
    const { canvas, layer, click, clipboard } = makeCanvas();
    click.select('a');
    click.clearSelection();
    click.select('b');
    deleteSelection(canvas, clipboard, null, 'click-select');
    expect(layer.store.getNode('a')).toBeDefined();
    expect(layer.store.getNode('b')).toBeUndefined();
    canvas.destroy();
  });

  it('cut / delete without a history are plain edits', () => {
    const { canvas, layer, click, clipboard } = makeCanvas();
    click.select('a');
    cutSelection(canvas, clipboard, null, 'click-select');
    expect(layer.store.getNode('a')).toBeUndefined();
    expect(clipboard.hasContent).toBe(true);
    canvas.destroy();
  });

  it('cut / delete / paste with a history are each one undoable step', () => {
    const { canvas, layer, click, clipboard } = makeCanvas();
    const history = new GraphHistory(layer.store);

    click.select('a');
    cutSelection(canvas, clipboard, history, 'click-select');
    expect(layer.store.getNode('a')).toBeUndefined();
    history.undo();
    expect(layer.store.getNode('a')).toBeDefined();
    expect(layer.store.getEdge('ab')).toBeDefined();

    click.clearSelection();
    click.select('b');
    deleteSelection(canvas, clipboard, history, 'click-select');
    expect(layer.store.getNode('b')).toBeUndefined();
    history.undo();
    expect(layer.store.getNode('b')).toBeDefined();

    pasteAndSelect(canvas, clipboard, history, 'click-select');
    const [pasted] = selectedElementIds(canvas, 'click-select').nodeIds;
    expect(layer.store.getNode(pasted!)).toBeDefined();
    history.undo();
    expect(layer.store.getNode(pasted!)).toBeUndefined();
    canvas.destroy();
  });

  it('clearGraphLayer is one undoable step with a history — and without one, since the store records its own clear', () => {
    const { canvas, layer } = makeCanvas();
    const history = new GraphHistory(layer.store);
    clearGraphLayer(canvas, 'graph', history);
    expect(layer.store.getNode('a')).toBeUndefined();
    history.undo();
    expect(layer.store.getNode('a')).toBeDefined();
    expect(layer.store.getNode('b')).toBeDefined();

    clearGraphLayer(canvas, 'graph', null);
    expect(layer.store.getNode('a')).toBeUndefined();
    // The layer's `clear()` goes through the store, which records it (RFC F5).
    expect(history.canUndo).toBe(true);
    history.undo();
    expect(layer.store.getNode('a')).toBeDefined();
    clearGraphLayer(canvas, 'missing', history); // no-op
    canvas.destroy();
  });
});

describe('one-log undo (graph + definition edits in canvas.history)', () => {
  const EDIT = 'edit:settings:behaviours:brush-select';

  it('undo takes the newest change, redo the one undone last', async () => {
    const { canvas, layer } = makeCanvas();
    const brush = canvas.behaviours.get<BrushSelectBehaviour>('brush-select')!;
    const history = new GraphHistory(layer.store);
    expect(canUndoEither(canvas, history)).toBe(false);
    expect(canRedoEither(canvas, history)).toBe(false);

    // 1. a graph edit, then 2. a definition edit.
    history.transaction('add', (rec) => rec.addNode({ id: 'c', type: 'node', position: { x: 0, y: 50 } }));
    await tick();
    canvas.update({ behaviours: { 'brush-select': { enableElements: ['shape'] } } }, EDIT);
    expect(canUndoEither(canvas, history)).toBe(true);

    // Undo walks back newest → oldest: the definition edit first.
    undoNewest(canvas, history);
    expect(brush.options.enableElements).toEqual(['shape', 'connector']);
    expect(layer.store.getNode('c')).toBeDefined();
    expect(canRedoEither(canvas, history)).toBe(true);

    undoNewest(canvas, history);
    expect(layer.store.getNode('c')).toBeUndefined();
    expect(canUndoEither(canvas, history)).toBe(false);

    // Redo replays oldest → newest: the graph edit first.
    redoNewest(canvas, history);
    expect(layer.store.getNode('c')).toBeDefined();
    expect(brush.options.enableElements).toEqual(['shape', 'connector']);

    redoNewest(canvas, history);
    expect(brush.options.enableElements).toEqual(['shape']);
    expect(canRedoEither(canvas, history)).toBe(false);
    expect(canUndoEither(canvas, history)).toBe(true);
    canvas.destroy();
  });

  it('a definition edit before a graph edit is undone second', async () => {
    const { canvas, layer } = makeCanvas();
    const brush = canvas.behaviours.get<BrushSelectBehaviour>('brush-select')!;
    const history = new GraphHistory(layer.store);

    canvas.update({ behaviours: { 'brush-select': { enableElements: ['shape'] } } }, EDIT);
    await tick();
    history.transaction('add', (rec) => rec.addNode({ id: 'c', type: 'node', position: { x: 0, y: 50 } }));

    undoNewest(canvas, history);
    expect(layer.store.getNode('c')).toBeUndefined();
    expect(brush.options.enableElements).toEqual(['shape']);
    undoNewest(canvas, history);
    expect(brush.options.enableElements).toEqual(['shape', 'connector']);

    redoNewest(canvas, history);
    expect(brush.options.enableElements).toEqual(['shape']);
    expect(layer.store.getNode('c')).toBeUndefined();
    canvas.destroy();
  });

  it('a definition edit alone enables and drives undo / redo — on the graph handle too', () => {
    const { canvas, layer } = makeCanvas();
    const history = new GraphHistory(layer.store);
    canvas.update({ behaviours: { 'brush-select': { enableElements: ['shape'] } } }, EDIT);
    // One log: the layer's history handle sees the definition edit as well.
    expect(history.canUndo).toBe(true);
    expect(canUndoEither(canvas, history)).toBe(true);
    undoNewest(canvas, history);
    expect(canvas.history.canUndo()).toBe(false);
    expect(canRedoEither(canvas, history)).toBe(true);
    redoNewest(canvas, history);
    expect(canvas.history.canUndo()).toBe(true);
    canvas.destroy();
  });
});
