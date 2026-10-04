/**
 * Behaviours that override `setOptions` with their own apply logic keep
 * `getOptions()` current through `recordOptions` — the seed a settings editor
 * reads and the value the engine's undo baseline copies
 * (rfc:feat-2026-09-29-command-controls-go-stale-or-fail-silently, F1 / F2).
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer, type IBehaviour } from '@invana/canvas';
import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { BrushSelectBehaviour } from '../../src/behaviours/BrushSelectBehaviour';
import { ClickSelectBehaviour } from '../../src/behaviours/ClickSelectBehaviour';
import { ContextMenuBehaviour } from '../../src/behaviours/ContextMenuBehaviour';
import { EdgeLODBehaviour } from '../../src/behaviours/EdgeLODBehaviour';
import { HoverActivateBehaviour } from '../../src/behaviours/HoverActivateBehaviour';
import { HoverElementPreviewBehaviour } from '../../src/behaviours/HoverElementPreviewBehaviour';
import { IconLODBehaviour } from '../../src/behaviours/IconLODBehaviour';
import { NodeLabelLODBehaviour } from '../../src/behaviours/NodeLabelLODBehaviour';
import { EdgeLabelLODBehaviour } from '../../src/behaviours/EdgeLabelLODBehaviour';
import { LassoSelectBehaviour } from '../../src/behaviours/LassoSelectBehaviour';
import { NodeCentralityBehaviour } from '../../src/behaviours/NodeCentralityBehaviour';
import { ParallelEdgeBehaviour } from '../../src/behaviours/ParallelEdgeBehaviour';
import { ThemeBehaviour } from '../../src/behaviours/ThemeBehaviour';

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
  return canvas;
}

const t = 'graph';
/** What this test needs of a behaviour, whatever its options type. */
type WithOptions = IBehaviour & { getOptions(): unknown };
/** Each behaviour with `setOptions` of its own, plus a patch its options accept. */
const CASES: Array<[string, () => WithOptions, Record<string, unknown>]> = [
  ['BrushSelect', () => new BrushSelectBehaviour({ id: 'b', targetLayerId: t }), { immediately: true }],
  ['LassoSelect', () => new LassoSelectBehaviour({ id: 'b', targetLayerId: t }), { immediately: true }],
  ['ClickSelect', () => new ClickSelectBehaviour({ id: 'b', targetLayerId: t }), { excludeNodeTypes: ['x'] }],
  ['HoverActivate', () => new HoverActivateBehaviour({ id: 'b', targetLayerId: t }), { hoverEdges: false }],
  ['HoverElementPreview', () => new HoverElementPreviewBehaviour({ id: 'b', targetLayerId: t }), { openDelay: 42 }],
  ['ContextMenu', () => new ContextMenuBehaviour({ id: 'b', targetLayerId: t }), { state: 'menu' }],
  ['NodeCentrality', () => new NodeCentralityBehaviour({ id: 'b', targetLayerId: t }), { minSize: 7 }],
  ['ParallelEdge', () => new ParallelEdgeBehaviour({ id: 'b', targetLayerId: t }), { spacing: 9 }],
  ['EdgeLOD', () => new EdgeLODBehaviour({ id: 'b', targetLayerId: t }), { minZoom: 0.3 }],
  ['ContentLOD (IconLOD)', () => new IconLODBehaviour({ id: 'b', targetLayerId: t }), { minZoom: 0.4 }],
  ['NodeLabelLOD', () => new NodeLabelLODBehaviour({ id: 'b', targetLayerId: t }), { maxFontPx: 18, alwaysShowTop: 0.1 }],
  ['EdgeLabelLOD', () => new EdgeLabelLODBehaviour({ id: 'b', targetLayerId: t }), { zoomGrowth: 0, minZoom: 1.2 }],
  ['Theme', () => new ThemeBehaviour({ id: 'b' }), { accentVar: '--x' }],
];

describe('getOptions() after setOptions()', () => {
  it.each(CASES)('%s reports the patched value', (_name, make, patch) => {
    const canvas = makeCanvas();
    const b = make();
    canvas.behaviours.register(b);
    b.setOptions(patch);
    expect(b.getOptions()).toMatchObject(patch);
    // Through the engine too — the path CanvasSettingsEditorPanel applies with.
    canvas.update({ behaviours: { b: patch } });
    expect(b.getOptions()).toMatchObject(patch);
    canvas.destroy();
  });

  it('an `enabled` toggle through canvas.update still fires the registry events (no `super.setOptions`)', () => {
    const canvas = makeCanvas();
    canvas.behaviours.register(new BrushSelectBehaviour({ id: 'brush-select', targetLayerId: t, enabled: false }));
    const onEnable = vi.fn();
    const onDisable = vi.fn();
    canvas.events.on('scene:behaviour:enable', onEnable);
    canvas.events.on('scene:behaviour:disable', onDisable);
    canvas.update({ behaviours: { 'brush-select': { enabled: true } } });
    expect(onEnable).toHaveBeenCalledWith({ id: 'brush-select' });
    canvas.update({ behaviours: { 'brush-select': { enabled: false } } });
    expect(onDisable).toHaveBeenCalledWith({ id: 'brush-select' });
    expect(canvas.behaviours.get<BrushSelectBehaviour>('brush-select')?.getOptions()).toMatchObject({ enabled: false });
    canvas.destroy();
  });
});
