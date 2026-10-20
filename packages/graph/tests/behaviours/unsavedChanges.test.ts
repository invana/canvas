/**
 * `UnsavedChangesBehaviour` — what differs from the save mark, folded from the
 * operation log: new, edited, deleted; undo / redo, saving and discarding move it.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { HeadlessRenderer } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { UnsavedChangesBehaviour, UNSAVED_COUNT_COMMAND, UNSAVED_EDITED_STATE, UNSAVED_NEW_STATE } from '../../src/behaviours/UnsavedChangesBehaviour';

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

/** Let the queued pass run: marks and `change` go out after the write has landed. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

/** A board loaded with a saved baseline of two connected nodes, tracked. */
function board() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  layer.loadData({
    nodes: [
      { id: 'a', type: 'person', data: { name: 'Ann' }, position: { x: 0, y: 0 } },
      { id: 'b', type: 'person', data: { name: 'Bo' }, position: { x: 100, y: 0 } },
    ],
    edges: [{ id: 'ab', type: 'knows', source: 'a', target: 'b' }],
  });
  const tracker = new UnsavedChangesBehaviour({ id: 'unsaved', targetLayerId: 'graph', enabled: true });
  canvas.behaviours.register(tracker);
  return { canvas, store: layer.store, tracker };
}

describe('UnsavedChangesBehaviour', () => {
  it('a loaded board is saved', () => {
    const { canvas, tracker } = board();
    expect(tracker.count).toBe(0);
    canvas.destroy();
  });

  it('marks a new node and an edited one, and an edit typed back stops counting', async () => {
    const { canvas, store, tracker } = board();
    store.addNode({ id: 'c', type: 'person', position: { x: 50, y: 50 }, pinned: true });
    store.updateNode('a', { data: { name: 'Anne' } });
    expect(tracker.current.nodes.new).toEqual(['c']);
    expect(tracker.current.nodes.edited).toEqual(['a']);
    await settle();
    expect(store.nodeStatesOf('c')).toContain(UNSAVED_NEW_STATE);
    expect(store.nodeStatesOf('a')).toContain(UNSAVED_EDITED_STATE);

    store.updateNode('a', { data: { name: 'Ann' } });
    expect(tracker.current.nodes.edited).toEqual([]);
    await settle();
    expect(store.nodeStatesOf('a')).not.toContain(UNSAVED_EDITED_STATE);
    expect(tracker.count).toBe(1);
    canvas.destroy();
  });

  it('a delete keeps the record for its ghost, and undo takes the change back', () => {
    const { canvas, store, tracker } = board();
    store.removeNode('b');
    expect(tracker.current.nodes.deleted.map((n) => n.id)).toEqual(['b']);
    expect(tracker.current.edges.deleted.map((e) => e.id)).toEqual(['ab']);
    canvas.history.undo();
    expect(tracker.count).toBe(0);
    canvas.destroy();
  });

  it('saving clears the marks; undoing past the save is unsaved again', () => {
    const { canvas, store, tracker } = board();
    store.addNode({ id: 'c', type: 'person', position: { x: 50, y: 50 } });
    tracker.markSaved();
    expect(tracker.count).toBe(0);
    canvas.history.undo();
    expect(tracker.current.nodes.deleted.map((n) => n.id)).toEqual(['c']);
    canvas.destroy();
  });

  it('discard puts the board back at the mark, as one undoable entry', () => {
    const { canvas, store, tracker } = board();
    store.addNode({ id: 'c', type: 'person', position: { x: 50, y: 50 } });
    store.updateNode('a', { type: 'author' });
    store.removeEdge('ab');
    expect(tracker.count).toBe(3);
    tracker.discard();
    expect(tracker.count).toBe(0);
    expect(store.hasNode('c')).toBe(false);
    expect(store.getNode('a')?.type).toBe('person');
    expect(store.hasEdge('ab')).toBe(true);
    canvas.history.undo();
    expect(tracker.count).toBe(3);
    canvas.destroy();
  });

  it('data from the engine, and a move, are never unsaved', () => {
    const { canvas, store, tracker } = board();
    store.applyDelta({ added: { nodes: [{ id: 'x', type: 'person' }] } }, { actor: 'engine' });
    store.applyDelta({ pinned: [{ id: 'a', x: 30, y: 30 }] });
    expect(tracker.count).toBe(0);
    canvas.destroy();
  });
  it('reverts one change at a time — a deleted node comes back with its relationship', async () => {
    const { canvas, store, tracker } = board();
    store.updateNode('a', { type: 'author' });
    store.removeNode('b');
    expect(tracker.before('node', 'a')).toEqual({ type: 'person' });
    tracker.revert('node', 'b');
    expect(store.hasNode('b')).toBe(true);
    expect(store.hasEdge('ab')).toBe(true);
    expect(tracker.current.nodes.edited).toEqual(['a']);
    await settle();
    expect(canvas.commands.value(UNSAVED_COUNT_COMMAND)).toBe('1');
    canvas.destroy();
  });

  it('the count command is empty while everything is saved', () => {
    const { canvas } = board();
    expect(canvas.commands.value(UNSAVED_COUNT_COMMAND)).toBeNull();
    canvas.destroy();
  });
});
