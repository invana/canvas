/**
 * An `enabled` toggle applied through a behaviour's base `setOptions` — which
 * is what `canvas.update({ behaviours: { id: { enabled } } })` reaches — fires
 * `scene:behaviour:enable` / `disable` and the gesture-conflict warning, like
 * the registry's own `setEnabled` (O3 of
 * rfc:feat-2026-09-29-commands-stop-at-saved-control-panels).
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
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

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  canvas.layers.add(new GraphLayer({ id: 'graph', options: {} }));
  canvas.layers.mountAll();
  const drag = new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' });
  canvas.behaviours.register(drag);
  const enabled = vi.fn();
  const disabled = vi.fn();
  canvas.events.on('scene:behaviour:enable', enabled);
  canvas.events.on('scene:behaviour:disable', disabled);
  return { canvas, drag, enabled, disabled };
}

describe('Behaviour.setOptions({ enabled })', () => {
  it('canvas.update fires enable / disable exactly once each', () => {
    const { canvas, drag, enabled, disabled } = makeCanvas();
    canvas.update({ behaviours: { 'drag-node': { enabled: true } } });
    expect(drag.enabled).toBe(true);
    expect(enabled).toHaveBeenCalledTimes(1);
    expect(enabled).toHaveBeenCalledWith({ id: 'drag-node' });
    canvas.update({ behaviours: { 'drag-node': { enabled: false } } });
    expect(drag.enabled).toBe(false);
    expect(disabled).toHaveBeenCalledTimes(1);
    canvas.destroy();
  });

  it('a direct setOptions on the mounted instance goes through the registry', () => {
    const { canvas, drag, enabled, disabled } = makeCanvas();
    drag.setOptions({ enabled: true });
    expect(enabled).toHaveBeenCalledTimes(1);
    drag.setOptions({ enabled: true }); // no change → no event
    expect(enabled).toHaveBeenCalledTimes(1);
    drag.setOptions({ enabled: false });
    expect(disabled).toHaveBeenCalledTimes(1);
    canvas.destroy();
  });

  it('runs the gesture-conflict check', () => {
    const { canvas } = makeCanvas();
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node-2', targetLayerId: 'graph', enabled: true }),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    canvas.update({ behaviours: { 'drag-node': { enabled: true } } });
    expect(warn.mock.calls.some((c) => String(c[0]).includes('node+drag'))).toBe(true);
    warn.mockRestore();
    canvas.destroy();
  });

  it('an unmounted instance toggles itself', () => {
    const drag = new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' });
    drag.setOptions({ enabled: true });
    expect(drag.enabled).toBe(true);
  });
});
