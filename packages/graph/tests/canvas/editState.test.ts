/**
 * `GraphCanvas` owns a `GraphHistory` + `GraphClipboard` per `GraphLayer`, so the
 * `history.*` / `clipboard.*` / undoable `graph.clear` / `graph.erase` commands
 * work with no React provider mounted (phase C of
 * rfc:feat-2026-09-29-commands-stop-at-saved-control-panels).
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer } from '@invana/canvas';
import { GraphCanvas, type GraphCanvasOptions } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';

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
  return { canvas, layer, click };
}

/** What a `DragNodeBehaviour` gesture looks like to the layer. */
function drag(layer: GraphLayer, id: string, to: { x: number; y: number }): void {
  layer.events.emit('node:drag-start', { nodeId: id, nodeIds: [id] });
  layer.store.setPosition(id, to);
  layer.events.emit('node:drag-end', { nodeId: id, nodeIds: [id] });
}

describe('GraphCanvas edit state', () => {
  it('every GraphLayer gets a history + clipboard, and the commands are registered with no provider', () => {
    const { canvas } = makeCanvas();
    expect(canvas.graphHistory()).not.toBeNull();
    expect(canvas.clipboard()).not.toBeNull();
    expect(canvas.graphHistory('missing')).toBeNull();
    for (const name of ['history.undo', 'history.redo', 'clipboard.cut', 'clipboard.copy', 'clipboard.paste', 'clipboard.delete']) {
      expect(canvas.commands.has(name), name).toBe(true);
    }
    canvas.destroy();
  });

  it('a drag is one undoable entry, and history.undo reverts it', () => {
    const { canvas, layer } = makeCanvas();
    expect(canvas.commands.isEnabled('history.undo')).toBe(false);
    drag(layer, 'a', { x: 100, y: 100 });
    expect(canvas.graphHistory()!.peekUndo()?.label).toBe('move');
    expect(canvas.commands.isEnabled('history.undo')).toBe(true);
    canvas.commands.run('history.undo');
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.commands.run('history.redo');
    expect(layer.store.getPosition('a')).toEqual({ x: 100, y: 100 });
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

  it('each layer has its own history; commands target `args.layerId`', () => {
    const { canvas, layer } = makeCanvas();
    const other = new GraphLayer({ id: 'g2', options: {} });
    canvas.layers.add(other);
    canvas.layers.mountAll();
    other.store.addNode({ id: 'x', type: 'node', position: { x: 0, y: 0 } });

    expect(canvas.graphHistory('g2')).not.toBe(canvas.graphHistory('graph'));
    drag(other, 'x', { x: 9, y: 9 });
    expect(canvas.graphHistory('graph')!.canUndo).toBe(false);
    expect(canvas.graphHistory('g2')!.canUndo).toBe(true);
    // The default (`'graph'`) Undo has nothing of g2's to revert.
    canvas.commands.run('history.undo');
    expect(other.store.getPosition('x')).toEqual({ x: 9, y: 9 });
    canvas.commands.run('history.undo', { layerId: 'g2' });
    expect(other.store.getPosition('x')).toEqual({ x: 0, y: 0 });
    expect(layer.store.getPosition('a')).toEqual({ x: 0, y: 0 });
    canvas.destroy();
  });

  it('removing a layer disposes its edit state; re-adding gets a fresh one', () => {
    const { canvas } = makeCanvas();
    const other = new GraphLayer({ id: 'g2', options: {} });
    canvas.layers.add(other);
    canvas.layers.mountAll();
    const first = canvas.graphHistory('g2');
    other.store.addNode({ id: 'x', type: 'node', position: { x: 0, y: 0 } });
    canvas.layers.remove('g2');
    expect(canvas.graphHistory('g2')).toBeNull();
    expect(canvas.clipboard('g2')).toBeNull();
    // The removed layer's drags no longer reach the old history.
    drag(other, 'x', { x: 5, y: 5 });
    expect(first!.canUndo).toBe(false);

    const again = new GraphLayer({ id: 'g2', options: {} });
    canvas.layers.add(again);
    expect(canvas.graphHistory('g2')).not.toBeNull();
    expect(canvas.graphHistory('g2')).not.toBe(first);
    canvas.destroy();
  });

  it('`history: false` opts out: no graph history, no drag capture; Undo covers canvas.history alone', () => {
    const { canvas, layer } = makeCanvas({ history: false });
    expect(canvas.graphHistory()).toBeNull();
    expect(canvas.clipboard()).not.toBeNull();
    drag(layer, 'a', { x: 100, y: 100 });
    expect(canvas.commands.isEnabled('history.undo')).toBe(false);
    canvas.commands.run('graph.clear');
    expect(layer.store.nodeCount()).toBe(0);
    canvas.destroy();
  });

  it('`history.limit` and `clipboard.pasteOffset` reach every layer', () => {
    const { canvas } = makeCanvas({ history: { limit: 3 }, clipboard: { pasteOffset: { x: 5, y: 7 } } });
    expect(canvas.graphHistory()!.maxDepth).toBe(3);
    expect(canvas.clipboard()!.offset).toEqual({ x: 5, y: 7 });
    canvas.destroy();
  });
});
