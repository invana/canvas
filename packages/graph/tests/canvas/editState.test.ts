/**
 * Graph edits undo through the canvas's one log with no provider mounted:
 * every `GraphLayer` journals its node drags into `canvas.history`, and
 * `GraphCanvas` owns a `GraphClipboard` per layer, so the `history.*` /
 * `clipboard.*` / undoable `graph.clear` / `graph.erase` commands work
 * (phase C of rfc:feat-2026-09-29-commands-stop-at-saved-control-panels; the
 * `GraphHistory` handle was removed by
 * rfc:feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed).
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphCanvas, type GraphCanvasOptions } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';
import { DragNodeBehaviour } from '../../src/behaviours/DragNodeBehaviour';

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

function makeCanvas(opts: GraphCanvasOptions = {}) {
  const canvas = new GraphCanvas(opts);
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const click = new ClickSelectBehaviour({ id: 'click-select', targetLayerId: 'graph', enabled: true });
  canvas.behaviours.register(click);
  layer.store.addNode({ id: 'a', type: 'node', position: { x: 0, y: 0 } });
  layer.store.addNode({ id: 'b', type: 'node', position: { x: 50, y: 0 } });
  layer.store.addEdge({ id: 'ab', type: 'edge', source: 'a', target: 'b' });
  // The setup data is the starting state, not an edit: start with empty history.
  canvas.history.clear();
  return { canvas, layer, click };
}

/** What a `DragNodeBehaviour` gesture looks like to the layer. */
function drag(layer: GraphLayer, id: string, to: { x: number; y: number }): void {
  layer.events.emit('node:drag-start', { nodeId: id, nodeIds: [id] });
  layer.store.setPosition(id, to);
  layer.events.emit('node:drag-end', { nodeId: id, nodeIds: [id] });
}

describe('GraphCanvas edit state', () => {
  it('every GraphLayer gets a clipboard, and the history / clipboard commands are registered with no provider', () => {
    const { canvas } = makeCanvas();
    expect(canvas.clipboard()).not.toBeNull();
    expect(canvas.clipboard('missing')).toBeNull();
    for (const name of ['history.undo', 'history.redo', 'clipboard.cut', 'clipboard.copy', 'clipboard.paste', 'clipboard.delete']) {
      expect(canvas.commands.has(name), name).toBe(true);
    }
    canvas.destroy();
  });

  it('a drag is one undoable "move" entry, and history.undo reverts it', () => {
    const { canvas, layer } = makeCanvas();
    expect(canvas.commands.isEnabled('history.undo')).toBe(false);
    drag(layer, 'a', { x: 100, y: 100 });
    expect(canvas.history.peekUndo()?.title).toBe('move');
    expect(canvas.commands.isEnabled('history.undo')).toBe(true);
    canvas.commands.run('history.undo');
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.commands.run('history.redo');
    expect(layer.store.getPosition('a')).toEqual({ x: 100, y: 100 });
    canvas.destroy();
  });

  it('a plain Canvas journals drags too — the layer does it, not the canvas', () => {
    const canvas = new Canvas();
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
    const layer = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(layer);
    canvas.layers.mountAll();
    layer.store.addNode({ id: 'a', type: 'node', position: { x: 0, y: 0 } });
    canvas.history.clear();
    drag(layer, 'a', { x: 7, y: 8 });
    canvas.history.undo();
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.destroy();
  });

  it('F26: a drag with pin-on-release is one entry — undo takes back the move and the pin together', () => {
    const { canvas, layer } = makeCanvas();
    const g = globalThis as Record<string, unknown>;
    g['window'] ??= { addEventListener: () => {}, removeEventListener: () => {} };
    const dragger = new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph', enabled: true, pinOnRelease: true });
    canvas.behaviours.register(dragger);
    // The gesture's middle, as `onWindowPointerMove` leaves it; then release.
    layer.events.emit('node:drag-start', { nodeId: 'a', nodeIds: ['a'] });
    layer.store.setPosition('a', { x: 30, y: 40 });
    (dragger as unknown as { state: unknown }).state = {
      primaryId: 'a', ids: ['a'], pointerWorldStart: { x: 0, y: 0 }, moveIds: ['a'], starts: new Map(), moved: true,
    };
    (dragger as unknown as { endDrag(): void }).endDrag();

    expect(layer.store.getNode('a')?.pinned).toBe(true);
    expect(canvas.history.entries()).toHaveLength(1);
    expect(canvas.history.peekUndo()?.title).toBe('move');
    canvas.history.undo();
    expect(layer.store.getNode('a')?.pinned).toBeFalsy();
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.destroy();
  });

  it('clipboard commands act on the click-selection, undoably; bound controls hear the buffer change', () => {
    const { canvas, layer, click } = makeCanvas();
    const heard = vi.fn();
    canvas.commands.subscribe(heard);
    expect(canvas.commands.isEnabled('clipboard.copy')).toBe(false);
    expect(canvas.commands.isEnabled('clipboard.paste')).toBe(false);

    click.select('a');
    canvas.commands.run('clipboard.copy');
    expect(heard).toHaveBeenCalled();
    expect(canvas.commands.isEnabled('clipboard.paste')).toBe(true);
    canvas.commands.run('clipboard.paste');
    expect(layer.store.nodeCount()).toBe(3);
    canvas.commands.run('history.undo');
    expect(layer.store.nodeCount()).toBe(2);

    click.select('b');
    canvas.commands.run('clipboard.cut');
    expect(layer.store.getNode('b')).toBeUndefined();
    canvas.commands.run('history.undo');
    expect(layer.store.getNode('b')).toBeDefined();
    canvas.destroy();
  });

  it('graph.clear and graph.erase are undoable', () => {
    const { canvas, layer, click } = makeCanvas();
    canvas.commands.run('graph.clear');
    expect(layer.store.nodeCount()).toBe(0);
    canvas.commands.run('history.undo');
    expect(layer.store.nodeCount()).toBe(2);
    expect(layer.store.getEdge('ab')).toBeDefined();

    click.select('a');
    canvas.commands.run('graph.erase');
    expect(layer.store.getNode('a')).toBeUndefined();
    canvas.commands.run('history.undo');
    expect(layer.store.getNode('a')).toBeDefined();
    canvas.destroy();
  });

  it('one log across layers: Undo takes the newest change, whatever its layer', () => {
    const { canvas, layer } = makeCanvas();
    const other = new GraphLayer({ id: 'g2', options: {} });
    canvas.layers.add(other);
    canvas.layers.mountAll();
    other.store.addNode({ id: 'x', type: 'node', position: { x: 0, y: 0 } });
    canvas.history.clear();

    drag(layer, 'a', { x: 5, y: 5 });
    drag(other, 'x', { x: 9, y: 9 });
    canvas.commands.run('history.undo');
    expect(other.store.getPosition('x')).toEqual({ x: 0, y: 0 });
    expect(layer.store.getPosition('a')).toEqual({ x: 5, y: 5 });
    canvas.commands.run('history.undo');
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.destroy();
  });

  it('removing a layer disposes its clipboard and stops its drag journal; re-adding gets fresh ones', () => {
    const { canvas } = makeCanvas();
    const other = new GraphLayer({ id: 'g2', options: {} });
    canvas.layers.add(other);
    canvas.layers.mountAll();
    const first = canvas.clipboard('g2');
    other.store.addNode({ id: 'x', type: 'node', position: { x: 0, y: 0 } });
    canvas.history.clear();
    canvas.layers.remove('g2');
    expect(canvas.clipboard('g2')).toBeNull();
    drag(other, 'x', { x: 5, y: 5 });
    expect(canvas.history.canUndo()).toBe(false);

    const again = new GraphLayer({ id: 'g2', options: {} });
    canvas.layers.add(again);
    expect(canvas.clipboard('g2')).not.toBeNull();
    expect(canvas.clipboard('g2')).not.toBe(first);
    canvas.destroy();
  });

  it('`clipboard.pasteOffset` reaches every layer', () => {
    const { canvas } = makeCanvas({ clipboard: { pasteOffset: { x: 5, y: 7 } } });
    expect(canvas.clipboard()!.offset).toEqual({ x: 5, y: 7 });
    canvas.destroy();
  });
});
