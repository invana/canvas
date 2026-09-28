/**
 * Command state the view store doesn't hold reaches bound controls through the
 * engine's owner-side bridges (`commands.subscribe`), not through write sites
 * remembering `invalidate()`; and the view-lock / edge-type / two-stack undo
 * rules are shared engine functions
 * (rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently).
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  Behaviour,
  HeadlessRenderer,
  Layout,
  isViewLocked,
  setViewLocked,
  type CanvasContext,
} from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import {
  canRedoEither,
  canUndoEither,
  edgePathType,
  redoNewest,
  setEdgePathType,
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

/** A do-nothing behaviour, standing in for pan / drag-node. */
class NoopBehaviour extends Behaviour {
  protected onRegister(_ctx: CanvasContext): void {}
  protected onDestroy(): void {}
}

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const heard = vi.fn();
  canvas.commands.subscribe(heard);
  return { canvas, layer, heard };
}

describe('command-state bridge', () => {
  it('layer visibility: a direct setVisible re-notifies, and layer.visible follows', () => {
    const { canvas, layer, heard } = makeCanvas();
    expect(canvas.commands.isActive('layer.visible', { id: 'graph' })).toBe(true);
    layer.setVisible(false); // what LayersViewPanel does — no command involved
    expect(heard).toHaveBeenCalled();
    expect(canvas.commands.isActive('layer.visible', { id: 'graph' })).toBe(false);
    canvas.destroy();
  });

  it('registry composition: layer add / remove, layout add, behaviour register / unregister', () => {
    const { canvas, heard } = makeCanvas();
    canvas.layers.add(new GraphLayer({ id: 'g2', options: {} }));
    expect(heard).toHaveBeenCalledTimes(1);
    canvas.layers.remove('g2');
    expect(heard).toHaveBeenCalledTimes(2);

    class L extends Layout {
      override readonly kind = 'test';
      async apply(): Promise<void> {}
    }
    canvas.layouts.add(new L({ id: 'l' }) as never);
    expect(heard).toHaveBeenCalledTimes(3);
    expect(canvas.commands.options('layout.activate').map((o) => o.value)).toContain('l');

    canvas.behaviours.register(new NoopBehaviour({ id: 'x', enabled: true }));
    const afterRegister = heard.mock.calls.length;
    expect(afterRegister).toBeGreaterThan(3);
    canvas.behaviours.unregister('x');
    expect(heard.mock.calls.length).toBeGreaterThan(afterRegister);
    expect(canvas.commands.isEnabled('behaviour.toggle', { id: 'x' })).toBe(false);
    canvas.destroy();
  });

  it('edge defaults: any setEdgeDefaults writer re-notifies, and graph.edgeType reads the layer', () => {
    const { canvas, layer, heard } = makeCanvas();
    layer.setEdgeDefaults({ shape: { pathType: 'bezier' } }); // e.g. a styling panel
    expect(heard).toHaveBeenCalled();
    expect(canvas.commands.value('graph.edgeType')).toBe('bezier');

    heard.mockClear();
    canvas.commands.run('graph.edgeType', { value: 'orth' });
    expect(heard).toHaveBeenCalled(); // via the layer's style:changed, not an inline invalidate
    expect(edgePathType(layer)).toBe('orth');
    canvas.destroy();
  });

  it('a removed graph layer is no longer bridged', () => {
    const { canvas, layer, heard } = makeCanvas();
    canvas.layers.remove('graph');
    heard.mockClear();
    layer.setEdgeDefaults({ shape: { pathType: 'bezier' } });
    expect(heard).not.toHaveBeenCalled();
    canvas.destroy();
  });
});

describe('shared engine functions', () => {
  it('setEdgePathType keeps the rest of the shape', () => {
    const { canvas, layer } = makeCanvas();
    layer.setEdgeDefaults({ shape: { pathType: 'straight', sourceAnchor: 'center' } as never });
    setEdgePathType(layer, 'rounded');
    expect(layer.edgeDefaults?.shape).toMatchObject({ pathType: 'rounded', sourceAnchor: 'center' });
    canvas.destroy();
  });

  it('view lock: the functions and view.lock agree, through registry events', () => {
    const { canvas } = makeCanvas();
    canvas.behaviours.register(new NoopBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new NoopBehaviour({ id: 'drag-node', enabled: true }));
    const onDisable = vi.fn();
    canvas.events.on('scene:behaviour:disable', onDisable);

    expect(isViewLocked(canvas)).toBe(false);
    setViewLocked(canvas, true);
    expect(onDisable).toHaveBeenCalledTimes(2);
    expect(isViewLocked(canvas)).toBe(true);
    expect(canvas.commands.isActive('view.lock')).toBe(true);

    canvas.commands.run('view.lock');
    expect(isViewLocked(canvas)).toBe(false);
    expect(canvas.behaviours.get('pan')?.enabled).toBe(true);

    // Custom targets; unregistered ids are skipped, none registered ⇒ never locked.
    expect(isViewLocked(canvas, ['nope'])).toBe(false);
    setViewLocked(canvas, true, ['pan']);
    expect(isViewLocked(canvas, ['pan'])).toBe(true);
    expect(isViewLocked(canvas)).toBe(false);
    canvas.destroy();
  });

  it('two-stack undo with no graph history = canvas.history alone', () => {
    const { canvas } = makeCanvas();
    expect(canUndoEither(canvas, null)).toBe(false);
    canvas.update({ layers: { graph: { edge: { style: { strokeWidth: 3 } } } } as never }, 'edit:test');
    expect(canUndoEither(canvas, null)).toBe(true);
    undoNewest(canvas, null);
    expect(canUndoEither(canvas, null)).toBe(false);
    expect(canRedoEither(canvas, null)).toBe(true);
    redoNewest(canvas, null);
    expect(canUndoEither(canvas, null)).toBe(true);
    canvas.destroy();
  });
});
