/**
 * The graph commands `GraphCanvas` registers — the pick-one controls a saved
 * control panel binds to. `select.mode` reads and switches the selection
 * behaviours; `graph.edgeType` reads and patches the layer's edge defaults.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer, exportCanvasState, importCanvasState } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { BrushSelectBehaviour } from '../../src/behaviours/BrushSelectBehaviour';
import { LassoSelectBehaviour } from '../../src/behaviours/LassoSelectBehaviour';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';
import { GraphClipboard } from '../../src/clipboard/GraphClipboard';
import { eraseCommand, registerGraphEditCommands } from '../../src/canvas/graphCommands';

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

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  canvas.behaviours.register(new BrushSelectBehaviour({ id: 'brush-select', targetLayerId: 'graph', enabled: false }));
  canvas.behaviours.register(new LassoSelectBehaviour({ id: 'lasso-select', targetLayerId: 'graph', enabled: false }));
  return { canvas, layer };
}

describe('graph commands', () => {
  it('select.mode reports click while no mode behaviour is enabled, and switches exclusively', () => {
    const { canvas } = makeCanvas();
    const c = canvas.commands;
    expect(c.value('select.mode')).toBe('click');
    expect(c.options('select.mode').map((o) => o.value)).toEqual(['click', 'brush', 'lasso']);

    c.run('select.mode', { value: 'lasso' });
    expect(c.value('select.mode')).toBe('lasso');
    expect(canvas.behaviours.get('lasso-select')?.enabled).toBe(true);
    expect(canvas.behaviours.get('brush-select')?.enabled).toBe(false);
    // …through `canvas.update`, so the definition moved too.
    expect(canvas.store.view.getState().definition.behaviours['lasso-select']).toMatchObject({ enabled: true });

    c.run('select.mode', { value: 'click' });
    expect(c.value('select.mode')).toBe('click');
    expect(canvas.behaviours.get('lasso-select')?.enabled).toBe(false);
    canvas.destroy();
  });

  it('graph.edgeType reads the edge defaults, patches pathType only, and invalidates bound controls', () => {
    const { canvas, layer } = makeCanvas();
    const c = canvas.commands;
    layer.setEdgeDefaults({ shape: { pathType: 'straight', sourceAnchor: 'center' } });
    expect(c.value('graph.edgeType')).toBe('straight');

    const listener = vi.fn();
    c.subscribe(listener);
    c.run('graph.edgeType', { value: 'bezier' });
    expect(c.value('graph.edgeType')).toBe('bezier');
    expect(listener).toHaveBeenCalled();
    // The rest of the shape survives the patch.
    expect((layer.edgeDefaults as { shape?: Record<string, unknown> }).shape).toMatchObject({ sourceAnchor: 'center' });
    canvas.destroy();
  });

  it('graph.edgeType is disabled without its layer', () => {
    const { canvas } = makeCanvas();
    expect(canvas.commands.isEnabled('graph.edgeType', { layerId: 'missing' })).toBe(false);
    expect(canvas.commands.value('graph.edgeType', { layerId: 'missing' })).toBeNull();
    canvas.destroy();
  });

  it('tool.active / tool.nodeKind read and write the view mode, and mode-gated behaviours follow', () => {
    const { canvas } = makeCanvas();
    const c = canvas.commands;
    // Brush select stands in for a draw behaviour: enabled, but live only in 'add'.
    canvas.update({ behaviours: { 'brush-select': { enabled: true, modes: ['add'] } } });
    const brush = canvas.behaviours.get('brush-select') as unknown as { enabled: boolean; isEnabled: boolean };
    expect(c.value('tool.active')).toBe('select');
    expect(c.options('tool.active').map((o) => o.value)).toEqual(['select', 'add', 'connect', 'delete']);
    expect(c.isEnabled('tool.nodeKind')).toBe(false);
    expect(brush.isEnabled).toBe(false);

    c.run('tool.active', { value: 'add' });
    expect(canvas.store.view.getState().interaction.viewMode).toBe('add');
    expect(c.isEnabled('tool.nodeKind')).toBe(true);
    expect(brush.isEnabled).toBe(true);
    expect(brush.enabled).toBe(true);

    c.run('tool.nodeKind', { value: 'rect' });
    expect(c.value('tool.nodeKind')).toBe('rect');
    expect(c.options('tool.nodeKind', { kinds: { circle: 'Circle', rect: 'Box' } }).map((o) => o.value)).toEqual(['circle', 'rect']);

    c.run('tool.active', { value: 'select' });
    expect(brush.isEnabled).toBe(false);
    // The node kind survives a trip through Select.
    expect(c.value('tool.nodeKind')).toBe('rect');
    canvas.destroy();
  });

  it('config.defaultViewMode seeds the live mode once', () => {
    const { canvas } = makeCanvas();
    canvas.update({ defaultViewMode: 'connect' });
    expect(canvas.store.view.getState().interaction.viewMode).toBe('connect');
    canvas.commands.run('tool.active', { value: 'delete' });
    canvas.update({ defaultViewMode: 'add' });
    expect(canvas.store.view.getState().interaction.viewMode).toBe('delete');
    expect(canvas.get().defaultViewMode).toBe('add');
    canvas.destroy();
  });

  it('the tool survives export → import, and an older snapshot imports with no mode args', () => {
    const { canvas: a } = makeCanvas();
    a.commands.run('tool.active', { value: 'add' });
    a.commands.run('tool.nodeKind', { value: 'rect' });
    const snap = JSON.parse(JSON.stringify(exportCanvasState(a)));

    const { canvas: b } = makeCanvas();
    importCanvasState(b, snap);
    expect(b.commands.value('tool.active')).toBe('add');
    expect(b.commands.value('tool.nodeKind')).toBe('rect');

    delete snap.view.interaction.viewModeArgs;
    const { canvas: c } = makeCanvas();
    importCanvasState(c, snap);
    expect(c.store.view.getState().interaction.viewModeArgs).toEqual({});
    a.destroy();
    b.destroy();
    c.destroy();
  });

  it('graph.erase deletes the click-selection (undoably) when there is one, else clears', () => {
    const { canvas, layer } = makeCanvas();
    const click = new ClickSelectBehaviour({ id: 'click-select', targetLayerId: 'graph', enabled: true });
    canvas.behaviours.register(click);
    layer.store.addNode({ id: 'a', type: 'node', position: { x: 0, y: 0 } });
    layer.store.addNode({ id: 'b', type: 'node', position: { x: 50, y: 0 } });
    const c = canvas.commands;

    expect(c.isActive('graph.erase')).toBe(false);
    click.select('a');
    expect(c.isActive('graph.erase')).toBe(true);

    const off = c.register('graph.erase', eraseCommand());
    c.run('graph.erase');
    expect(layer.store.getNode('a')).toBeUndefined();
    expect(layer.store.getNode('b')).toBeDefined();
    canvas.history.undo();
    expect(layer.store.getNode('a')).toBeDefined();
    off();

    click.clearSelection();
    c.run('graph.erase');
    expect(layer.store.getNode('a')).toBeUndefined();
    expect(layer.store.getNode('b')).toBeUndefined();
    canvas.destroy();
  });

  it('registerGraphEditCommands: honours args.layerId, defaults to its layer, carries the palette metadata, and disposes back to the canvas\'s', () => {
    // An override for one layer — the clipboard provider's situation.
    const canvas = new GraphCanvas();
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
    const graph = new GraphLayer({ id: 'graph', options: {} });
    const other = new GraphLayer({ id: 'other', options: {} });
    canvas.layers.add(graph);
    canvas.layers.add(other);
    canvas.layers.mountAll();
    graph.store.addNode({ id: 'g1', type: 'node', position: { x: 0, y: 0 } });
    other.store.addNode({ id: 'o1', type: 'node', position: { x: 0, y: 0 } });
    const selGraph = new ClickSelectBehaviour({ id: 'sel-graph', targetLayerId: 'graph', enabled: true });
    const selOther = new ClickSelectBehaviour({ id: 'sel-other', targetLayerId: 'other', enabled: true });
    canvas.behaviours.register(selGraph);
    canvas.behaviours.register(selOther);
    selGraph.select('g1');
    selOther.select('o1');
    const c = canvas.commands;

    // The canvas's own: `'graph'` is the described default.
    expect(c.get('clipboard.copy')?.args?.['layerId']?.default).toBe('graph');

    const own = new GraphClipboard(other.store);
    const off = registerGraphEditCommands(
      c,
      { clipboard: (id) => (id === 'other' ? own : canvas.clipboard(id)) },
      { layerId: 'other', only: ['clipboard.copy', 'graph.clear'] },
    );

    // Metadata matches GraphCanvas's, and the default follows `layerId`.
    const copy = c.get('clipboard.copy');
    expect(copy?.category).toBe('Edit');
    expect(copy?.keywords).toContain('duplicate');
    expect(copy?.args?.['layerId']?.default).toBe('other');
    expect(c.get('graph.clear')?.category).toBe('Edit');
    // `only` left the rest alone.
    expect(c.get('clipboard.paste')?.args?.['layerId']?.default).toBe('graph');

    // Bare → the override's layer.
    c.run('clipboard.copy', { clickSelectId: 'sel-other' });
    expect(own.hasContent).toBe(true);
    expect(canvas.clipboard('graph')?.hasContent).toBe(false);

    // Named → that layer, through the canvas's own clipboard.
    c.run('clipboard.copy', { layerId: 'graph', clickSelectId: 'sel-graph' });
    expect(canvas.clipboard('graph')?.hasContent).toBe(true);

    // Disposing restores the canvas's registration.
    off();
    expect(c.get('clipboard.copy')?.args?.['layerId']?.default).toBe('graph');
    expect(c.get('clipboard.copy')?.category).toBe('Edit');
    canvas.destroy();
  });
});
