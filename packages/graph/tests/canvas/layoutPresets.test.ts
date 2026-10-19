/**
 * Layout presets: one switch writes the layout, its options, the edge type and
 * the preset's name in one undoable step, and runs the layout once.
 *
 * Headless: `Canvas.initWithRenderer` with the shipped `HeadlessRenderer`. The
 * layouts are recorders — they place nothing, they log each run and each
 * option patch — because what is under test is the switch, not a solver.
 */
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  HeadlessRenderer,
  Layout,
  exportCanvasState,
  importCanvasState,
  type LayoutRunOptions,
  type LayoutSetOptions,
} from '@invana/canvas';

import { GraphCanvas } from '../../src/canvas/GraphCanvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import type { GraphData } from '../../src/layer/types';

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

afterEach(() => {
  vi.useRealTimers();
});

/** Records runs and option patches; re-runs on a patch the way real layouts do. */
class RecordingLayout extends Layout {
  readonly runs: LayoutRunOptions[] = [];
  options: Record<string, unknown> = {};
  private ran = false;
  async apply(_layer: unknown, run: LayoutRunOptions = {}): Promise<void> {
    this.ran = true;
    this.runOptions = run;
    this.runs.push(run);
  }
  override setOptions(patch: Record<string, unknown>, opts?: LayoutSetOptions): void {
    this.options = { ...this.options, ...patch };
    if (this.ran && opts?.rerun !== false) void this.apply(null);
  }
}

const DATA: GraphData = {
  nodes: [
    { id: 'a', type: 'n', position: { x: 0, y: 0 } },
    { id: 'b', type: 'n', position: { x: 100, y: 0 } },
    { id: 'c', type: 'n', position: { x: 200, y: 50 } },
  ],
  edges: [
    { id: 'ab', type: 'r', source: 'a', target: 'b' },
    { id: 'bc', type: 'r', source: 'b', target: 'c' },
  ],
};

function makeCanvas() {
  const canvas = new GraphCanvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: { initData: DATA } });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  layer.store.flush();
  const network = new RecordingLayout({ id: 'network', targetLayerId: 'graph' });
  const elk = new RecordingLayout({ id: 'elk', targetLayerId: 'graph' });
  canvas.layouts.add(network as never);
  canvas.layouts.add(elk as never);
  return { canvas, layer, network, elk };
}

const shapeOpts = (layer: GraphLayer) => (layer.edgeDefaults as { shape?: { pathStyleOpts?: unknown } }).shape?.pathStyleOpts;
const pathType = (layer: GraphLayer) => (layer.edgeDefaults as { shape?: { pathType?: string } }).shape?.pathType;

describe('applyLayoutPreset', () => {
  it('writes the expanded slices in one step and runs the layout once', () => {
    const { canvas, layer, elk } = makeCanvas();
    canvas.applyLayoutPreset('tree', { direction: 'right', spacing: 'roomy' });

    expect(elk.runs).toHaveLength(1);
    expect(elk.runs[0]).toMatchObject({ fitCamera: true });
    expect(elk.options).toMatchObject({
      algorithm: 'layered',
      direction: 'RIGHT',
      edgeRouting: 'ORTHOGONAL',
      nodeSpacing: 70,
      layerSpacing: 130,
      root: 'auto',
    });
    expect(pathType(layer)).toBe('orth');
    expect(canvas.get().layoutPreset).toEqual({ id: 'tree', overrides: { direction: 'right', spacing: 'roomy' } });

    // Curved follows the direction: a left-to-right tree curves horizontally.
    canvas.applyLayoutPreset('tree', { direction: 'right', edges: 'curved' });
    expect(elk.runs).toHaveLength(2);
    expect(elk.options['edgeRouting']).toBeUndefined();
    expect(pathType(layer)).toBe('bezier');
    expect(shapeOpts(layer)).toEqual({ axis: 'h' });
  });

  it("clears the previous preset's options, and undo restores them", () => {
    // Edits closer than the history's merge window are one step; two clicks aren't.
    vi.useFakeTimers({ toFake: ['performance'] });
    const { canvas, layer, elk } = makeCanvas();
    canvas.applyLayoutPreset('tree');
    vi.advanceTimersByTime(1000);
    canvas.applyLayoutPreset('radial');
    expect(elk.options).toMatchObject({ algorithm: 'radial', ringSpacing: 120 });
    expect(elk.options['direction']).toBeUndefined();
    expect(elk.options['edgeRouting']).toBeUndefined();
    expect(pathType(layer)).toBe('bump-radial');
    expect(shapeOpts(layer)).toBeUndefined();

    canvas.history.undo();
    expect(canvas.get().layoutPreset).toEqual({ id: 'tree' });
    expect(elk.options).toMatchObject({ algorithm: 'layered', direction: 'DOWN', edgeRouting: 'ORTHOGONAL' });
    expect(pathType(layer)).toBe('orth');
  });

  it('reseeds a switch into Network and its Run again', async () => {
    const { canvas, network } = makeCanvas();
    canvas.applyLayoutPreset('network', { spacing: 'compact' });
    expect(network.runs).toEqual([{ fitCamera: true, reseed: true }]);
    expect(network.options).toMatchObject({ link: { distance: 40 }, charge: { strength: -150 } });

    await canvas.runLayoutPreset();
    expect(network.runs).toHaveLength(2);
    expect(network.runs[1]).toMatchObject({ reseed: true });
  });
});

describe('a preset in config', () => {
  it('expands over the config it arrives with, and survives export and import', () => {
    const { canvas, network } = makeCanvas();
    canvas.update({
      layouts: { network: { charge: { strength: -160, distanceMax: 500 } } },
      layoutPreset: { id: 'network', overrides: { spacing: 'roomy', edges: 'straight' } },
    });
    expect(network.options).toMatchObject({ charge: { strength: -700, distanceMax: 500 }, link: { distance: 140 } });
    expect(canvas.get().layoutPreset).toEqual({ id: 'network', overrides: { spacing: 'roomy' } });

    const snapshot = exportCanvasState(canvas);
    const { canvas: other, network: otherNetwork } = makeCanvas();
    other.applyLayoutPreset('radial');
    importCanvasState(other, snapshot);
    expect(other.get().layoutPreset).toEqual({ id: 'network', overrides: { spacing: 'roomy' } });
    expect(other.get().activeLayout).toBe('network');
    expect(otherNetwork.options).toMatchObject({ link: { distance: 140 } });
    expect(otherNetwork.runs).toHaveLength(1);
  });
});

describe('layout.preset command', () => {
  it('offers a preset whose layout is missing, or which the board outgrows, disabled with the reason', () => {
    const canvas = new GraphCanvas({
      layoutPresets: [
        { id: 'network', label: 'Network', layoutId: 'network', defaults: {}, options: {} },
        { id: 'tree', label: 'Tree ↓', layoutId: 'elk', defaults: {}, options: {}, maxNodes: 2 },
        { id: 'web', label: 'Web', layoutId: 'cola', defaults: {}, options: {} },
      ],
    });
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
    const layer = new GraphLayer({ id: 'graph', options: { initData: DATA } });
    canvas.layers.add(layer);
    canvas.layers.mountAll();
    layer.store.flush();
    canvas.layouts.add(new RecordingLayout({ id: 'network', targetLayerId: 'graph' }) as never);
    canvas.layouts.add(new RecordingLayout({ id: 'elk', targetLayerId: 'graph' }) as never);

    const options = canvas.commands.get('layout.preset')!.options!(canvas);
    expect(options.map((o) => [o.value, o.disabled ?? false])).toEqual([
      ['network', false],
      ['tree', true],
      ['web', true],
    ]);
    expect(options[1]!.description).toBe('Draws up to 2 nodes · this board has 3');
    expect(options[2]!.description).toBe('Needs the `cola` layout');

    canvas.commands.run('layout.preset', { value: 'tree' });
    expect(canvas.get().layoutPreset).toBeUndefined();
  });
});
