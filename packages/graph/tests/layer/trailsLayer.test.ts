/**
 * `TrailsLayer` against the headless canvas: accepted fixes in → banded `path`
 * specs out, rebuilt only for ids that received a fix.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';

import { GraphLayer } from '../../src/layer/GraphLayer';
import { TrailsLayer } from '../../src/layer/TrailsLayer';
import { TrackingBehaviour } from '../../src/behaviours/TrackingBehaviour';
import type { Fix } from '../../src/behaviours/tracking/motion';

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
    getContext: () => ({
      font: '',
      measureText: (t: string) => ({ width: t.length * 7, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 3 }),
    }),
  });
  g['document'] ??= { createElement: element };
});

const fix = (id: string, t: number, x: number, y: number): Fix => ({ id, t, x, y });

function mount(options: Record<string, unknown> = {}) {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  canvas.layers.add(
    new GraphLayer({
      id: 'graph',
      options: { initData: { nodes: [{ id: 'a', type: 'v', position: { x: 0, y: 0 } }, { id: 'b', type: 'v', position: { x: 0, y: 0 } }], edges: [] } },
    }),
  );
  const trails = new TrailsLayer({
    id: 'trails',
    options: { trackingBehaviourId: 'tracking', publishDebounceMs: 0, fadeBands: 4, maxPoints: 8, ...options },
  });
  canvas.layers.add(trails);
  canvas.layers.mountAll();
  // The behaviour is registered AFTER the layer — the layer must pick it up.
  const tracking = new TrackingBehaviour({ id: 'tracking', targetLayerId: 'graph', enabled: true });
  canvas.behaviours.register(tracking);
  return { canvas, trails, tracking };
}

const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 5));
const run = (id: string, n: number, t0 = 0): Fix[] => Array.from({ length: n }, (_, i) => fix(id, t0 + i * 1000, i * 10, 0));

describe('TrailsLayer', () => {
  it('attaches to a behaviour registered after it and publishes banded paths', async () => {
    const { trails, tracking } = mount();
    tracking.pushFixes(run('a', 9), 8000);
    await flush();
    expect(trails.publishedCount).toBe(4); // 4 bands
  });

  it('keeps at most maxPoints and honours maxAgeMs from the newest fix', async () => {
    const { trails, tracking } = mount({ maxPoints: 3, fadeBands: 5 });
    tracking.pushFixes(run('a', 20), 19_000);
    await flush();
    // 3 points → 2 segments, so 2 bands however many were asked.
    expect(trails.publishedCount).toBe(2);
    const age = mount({ maxAgeMs: 1500 });
    age.tracking.pushFixes(run('a', 20), 19_000);
    await flush();
    expect(age.trails.publishedCount).toBe(1); // only the last 2 fixes are within 1.5 s → one segment
  });

  it('draws nothing for one point, and nothing for an id outside `ids`', async () => {
    const { trails, tracking } = mount({ ids: ['a'] });
    tracking.pushFixes([fix('a', 0, 0, 0), fix('b', 0, 0, 0), fix('b', 1000, 5, 5)], 1000);
    await flush();
    expect(trails.publishedCount).toBe(0); // a has 1 point; b is not wanted
  });

  it('draws the whole track for fullTrackIds, and drops it again', async () => {
    const { trails, tracking } = mount({ ids: [], fullTrackIds: ['a'] });
    tracking.pushFixes(run('a', 12), 11_000);
    await flush();
    expect(trails.publishedCount).toBe(1); // one solid line
    trails.setFullTrackIds([]);
    await flush();
    expect(trails.publishedCount).toBe(0);
  });

  it('rebuilds only the ids that received a fix', async () => {
    const { trails, tracking } = mount();
    tracking.pushFixes([...run('a', 5), ...run('b', 5)], 4000);
    await flush();
    const spy = vi.spyOn(trails as unknown as { retire(id: string): void }, 'retire');
    tracking.pushFixes([fix('a', 5000, 50, 0)], 5000);
    await flush();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('a');
  });

  it('applies a config patch without retargeting the behaviour', async () => {
    const { trails } = mount();
    trails.setOptions({ color: 0xff0000, trackingBehaviourId: 'other' });
    expect(trails.options.color).toBe(0xff0000);
    expect(trails.options.trackingBehaviourId).toBe('tracking');
  });
});
