/**
 * The graph commands `GraphCanvas` registers — the pick-one controls a saved
 * control panel binds to. `select.mode` reads and switches the selection
 * behaviours; `graph.edgeType` reads and patches the layer's edge defaults.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { BrushSelectBehaviour } from '../../src/behaviours/BrushSelectBehaviour';
import { LassoSelectBehaviour } from '../../src/behaviours/LassoSelectBehaviour';

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
});
