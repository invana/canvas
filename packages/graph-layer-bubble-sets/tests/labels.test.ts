/**
 * A set's `label` is a `'label'` decoration on its hull — a spec has no label field.
 * Against the headless canvas with a real `GraphLayer`.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '@invana/graph';

import { BubbleSetsLayer } from '../src/BubbleSetsLayer';
import type { BubbleSet } from '../src/types';

beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({ font: '', measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }) }),
  });
  g['document'] ??= { createElement: element };
  g['window'] ??= globalThis;
});

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 30));

const sets = (label: boolean): BubbleSet[] => [
  { id: 's', members: ['a', 'b', 'c'], ...(label ? { label: { text: 'Cluster', placement: 'centroid' as const } } : {}) },
];

/** The headless renderer's `setDecoration` is a no-op, so the calls are what we can observe. */
function mount(label: boolean, placement: 'centroid' | 'contour-end' = 'centroid') {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  canvas.layers.add(
    new GraphLayer({
      id: 'graph',
      options: {
        initData: {
          nodes: [
            { id: 'a', type: 'p', position: { x: 0, y: 0 }, data: {} },
            { id: 'b', type: 'p', position: { x: 60, y: 10 }, data: {} },
            { id: 'c', type: 'p', position: { x: 30, y: 50 }, data: {} },
          ],
          edges: [],
        },
      },
    }),
  );
  const layer = new BubbleSetsLayer({
    id: 'bs',
    options: {
      graphLayerId: 'graph',
      sets: label ? [{ id: 's', members: ['a', 'b', 'c'], label: { text: 'Cluster', placement } }] : sets(false),
      recomputeDebounceMs: 0,
    },
  });
  canvas.layers.add(layer);
  const calls: Array<{ id: string; slot: string; deco: { style?: { offset?: { x: number; y: number } } } | null }> = [];
  vi.spyOn(layer.surface.primitives, 'setDecoration').mockImplementation(((id: string, slot: string, deco: never) => {
    calls.push({ id, slot, deco });
  }) as never);
  canvas.layers.mountAll();
  return { canvas, layer, calls };
}

describe('BubbleSetsLayer labels', () => {
  it('attaches a label decoration to a labelled hull', async () => {
    const { calls } = mount(true);
    await flush();
    const attach = calls.filter((c) => c.id === 'bs:hull:s' && c.slot === 'label' && c.deco);
    expect(attach).toHaveLength(1);
    expect((attach[0]!.deco as { kind: string }).kind).toBe('label');
  });

  it('control: an unlabelled set attaches nothing', async () => {
    const { calls } = mount(false);
    await flush();
    expect(calls.filter((c) => c.slot === 'label' && c.deco)).toHaveLength(0);
  });

  it('clears the decoration when the label is removed', async () => {
    const { layer, calls } = mount(true);
    await flush();
    layer.setOptions({ sets: sets(false) });
    await flush();
    const last = calls.filter((c) => c.id === 'bs:hull:s' && c.slot === 'label').at(-1)!;
    expect(last.deco).toBeNull();
  });

  it('offsets a contour-end label in screen pixels: world gap × camera scale', async () => {
    const { canvas, layer, calls } = mount(true, 'contour-end');
    await flush();
    const first = calls.filter((c) => c.deco).at(-1)!.deco!.style!.offset!;
    canvas.camera.setTransform({ x: 0, y: 0, zoom: 4 }, { clamp: false });
    // Re-place without a member change, as a zoom settle does.
    (layer as unknown as { replaceLabels(): void }).replaceLabels();
    const second = calls.filter((c) => c.deco).at(-1)!.deco!.style!.offset!;
    expect(Math.hypot(first.x, first.y)).toBeGreaterThan(0);
    expect(second.x).toBeCloseTo(first.x * 4, 5);
    expect(second.y).toBeCloseTo(first.y * 4, 5);
  });
});
