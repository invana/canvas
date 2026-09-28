/**
 * `Canvas.history` — undo / redo for user edits to the definition (the Studio
 * editors' `edit:*` applies), and the argument descriptors the control-panel
 * editor draws fields from. Lives here because `packages/canvas` carries no
 * tests; `GraphCanvas` is a `Canvas`.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { HeadlessRenderer, exportCanvasState, importCanvasState } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { BrushSelectBehaviour } from '../../src/behaviours/BrushSelectBehaviour';
import { LassoSelectBehaviour } from '../../src/behaviours/LassoSelectBehaviour';
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

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  canvas.behaviours.register(new ClickSelectBehaviour({ id: 'click-select', targetLayerId: 'graph' }));
  const brush = new BrushSelectBehaviour({ id: 'brush-select', targetLayerId: 'graph', enabled: false });
  canvas.behaviours.register(brush);
  canvas.behaviours.register(new LassoSelectBehaviour({ id: 'lasso-select', targetLayerId: 'graph', enabled: false }));
  return { canvas, layer, brush };
}

describe('Canvas.history', () => {
  it('records edit:* updates only — programmatic config, camera and selection stay off the stack', () => {
    const { canvas } = makeCanvas();
    canvas.update({ behaviours: { 'brush-select': { clickSelectId: 'click-select' } } });
    canvas.camera.setZoom(2);
    canvas.commands.run('select.mode', { value: 'lasso' }); // a command's own `canvas.update`
    expect(canvas.history.canUndo()).toBe(false);

    canvas.update({ behaviours: { 'brush-select': { enableElements: ['shape'] } } }, 'edit:settings:behaviours:brush-select');
    expect(canvas.history.canUndo()).toBe(true);
    expect(canvas.history.peekUndo()?.action).toBe('edit:settings:behaviours:brush-select');
    canvas.destroy();
  });

  it('undo reverts the live instance to its pre-edit value, and redo re-applies it', () => {
    const { canvas, brush } = makeCanvas();
    const before = brush.options.enableElements;
    expect(before).toEqual(['shape', 'connector']); // the resolved default

    canvas.update({ behaviours: { 'brush-select': { enableElements: ['shape'] } } }, 'edit:settings:behaviours:brush-select');
    expect(brush.options.enableElements).toEqual(['shape']);

    canvas.history.undo();
    // The baseline write captured the old value before the edit, so undo
    // restores it on the instance — not just in the store.
    expect(brush.options.enableElements).toEqual(before);
    expect(canvas.store.view.getState().definition.behaviours['brush-select']?.['enableElements']).toEqual(before);

    canvas.history.redo();
    expect(brush.options.enableElements).toEqual(['shape']);
    canvas.destroy();
  });

  it('undo re-routes a behaviour toggle through the registry', () => {
    const { canvas } = makeCanvas();
    canvas.update({ behaviours: { 'brush-select': { enabled: true } } }, 'edit:settings:behaviours:brush-select:enabled');
    expect(canvas.behaviours.get('brush-select')?.enabled).toBe(true);
    canvas.history.undo();
    expect(canvas.behaviours.get('brush-select')?.enabled).toBe(false);
    canvas.destroy();
  });

  it('merges a burst of same-action edits into one step', () => {
    const { canvas, brush } = makeCanvas();
    const before = brush.options.enableElements;
    for (const enableElements of [['shape'], ['connector'], ['shape', 'connector']]) {
      canvas.update({ behaviours: { 'brush-select': { enableElements } } }, 'edit:settings:behaviours:brush-select');
    }
    canvas.history.undo();
    expect(canvas.history.canUndo()).toBe(false);
    expect(brush.options.enableElements).toEqual(before);
    canvas.destroy();
  });

  it('undoes a control-panel edit and runs through the history.undo command', () => {
    const { canvas } = makeCanvas();
    const panel = { kind: 'control-panel' as const, items: [] };
    canvas.update({ controlPanels: { p: panel } }, 'edit:control-panels');
    expect(canvas.commands.isEnabled('history.undo')).toBe(true);
    canvas.commands.run('history.undo');
    expect(canvas.store.view.getState().definition.controlPanels['p']).toBeUndefined();
    expect(canvas.commands.isEnabled('history.redo')).toBe(true);
    canvas.destroy();
  });

  it('an import clears the history', () => {
    const { canvas } = makeCanvas();
    canvas.update({ behaviours: { 'brush-select': { enableElements: ['shape'] } } }, 'edit:settings:behaviours:brush-select');
    importCanvasState(canvas, exportCanvasState(canvas));
    expect(canvas.history.canUndo()).toBe(false);
    canvas.destroy();
  });
});

describe('layer.visible', () => {
  it('toggles a layer and reports it as active while visible', () => {
    const { canvas, layer } = makeCanvas();
    const c = canvas.commands;
    expect(c.isActive('layer.visible', { id: 'graph' })).toBe(true);
    c.run('layer.visible', { id: 'graph' });
    expect(layer.visible).toBe(false);
    expect(c.isActive('layer.visible', { id: 'graph' })).toBe(false);
    expect(c.isEnabled('layer.visible', { id: 'missing' })).toBe(false);
    canvas.destroy();
  });
});

/**
 * The args each command's TSDoc table documents (`builtinCommands.ts`,
 * `graphCommands.ts`). A descriptor that drifts from its table fails here.
 */
const DOCUMENTED_ARGS: Record<string, string[]> = {
  'camera.zoomIn': ['factor'],
  'camera.zoomOut': ['factor'],
  'camera.fit': ['padding', 'layerId'],
  'camera.pan': ['dx', 'dy'],
  'camera.zoomTo': ['value', 'levels'],
  'behaviour.toggle': ['id'],
  'view.lock': ['behaviourIds'],
  'layout.run': ['id'],
  'layout.toggle': ['id'],
  'layout.activate': ['value'],
  'background.grid': ['layerId', 'patternType'],
  'layer.visible': ['id'],
  'select.mode': ['value', 'modes', 'labels'],
  'graph.edgeType': ['layerId', 'value', 'types'],
  'graph.clear': ['layerId'],
  'graph.erase': ['layerId', 'clickSelectId'],
  'graph.redraw': ['layerId'],
  'tool.active': ['value', 'tools'],
  'tool.nodeKind': ['value', 'kinds'],
};

describe('command arg descriptors', () => {
  it('match the documented args of every built-in and graph command', () => {
    const { canvas } = makeCanvas();
    for (const [name, keys] of Object.entries(DOCUMENTED_ARGS)) {
      expect(Object.keys(canvas.commands.get(name)?.args ?? {}).sort(), name).toEqual([...keys].sort());
    }
    // Arg-less commands carry no descriptor.
    for (const name of ['camera.reset', 'layout.stop', 'history.undo', 'history.redo']) {
      expect(canvas.commands.get(name)?.args, name).toBeUndefined();
    }
    canvas.destroy();
  });

  it('marks the value a picker supplies as `pick`', () => {
    const { canvas } = makeCanvas();
    for (const name of ['select.mode', 'graph.edgeType', 'tool.active', 'tool.nodeKind', 'layout.activate', 'camera.zoomTo']) {
      expect(canvas.commands.get(name)?.args?.['value']?.pick, name).toBe(true);
    }
    canvas.destroy();
  });
});
