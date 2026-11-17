/**
 * `TrackingBehaviour` against the headless canvas: fixes in → positions, signal
 * states, heading and follow out, driven by `step(now)` so time is ours.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { Canvas, HeadlessRenderer } from '@invana/canvas';

import { GraphLayer } from '../../src/layer/GraphLayer';
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

const fix = (id: string, t: number, x: number, y: number, extra: Partial<Fix> = {}): Fix => ({ id, t, x, y, ...extra });

function mount(options: Record<string, unknown> = {}, extra: Partial<ConstructorParameters<typeof TrackingBehaviour>[0]> = {}) {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({
    id: 'graph',
    options: {
      initData: {
        nodes: [
          { id: 'a', type: 'v', position: { x: 0, y: 0 }, data: { name: 'A' } },
          { id: 'b', type: 'v', position: { x: 50, y: 50 }, data: { name: 'B' } },
        ],
        edges: [],
      },
    },
  });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  const tracking = new TrackingBehaviour({
    id: 'tracking',
    targetLayerId: 'graph',
    enabled: true,
    renderDelayMs: 1000,
    staleAfterMs: 20_000,
    lostAfterMs: 90_000,
    ...options,
    ...extra,
  });
  canvas.behaviours.register(tracking);
  return { canvas, layer, tracking };
}

describe('TrackingBehaviour', () => {
  it('moves a node between two fixes at now − renderDelay', () => {
    const { layer, tracking } = mount();
    tracking.pushFixes([fix('a', 0, 0, 0), fix('a', 1000, 100, 0)], 1000);
    tracking.step(1500); // renderTime 500 → halfway
    expect(layer.store.getNode('a')!.position!.x).toBeCloseTo(50, 3);
    expect(tracking.getSample('a')!.mode).toBe('interpolated');
  });

  it('drops out-of-order fixes and reports unknown ids without tracking them', () => {
    const onUnknownFix = vi.fn();
    const { tracking } = mount({}, { onUnknownFix });
    expect(tracking.pushFixes([fix('a', 100, 1, 1), fix('a', 50, 2, 2), fix('zzz', 100, 0, 0)], 100)).toBe(1);
    expect(onUnknownFix).toHaveBeenCalledTimes(1);
    expect([...tracking.trackedIds()]).toEqual(['a']);
  });

  it('writes one bulk position per frame, and nothing for an object that did not move', () => {
    const { layer, tracking } = mount();
    const spy = vi.spyOn(layer.store.internal, 'setPositionsBulk');
    tracking.pushFixes([fix('a', 0, 0, 0), fix('a', 1000, 100, 0), fix('b', 0, 5, 5)], 1000);
    expect(tracking.step(1500)).toBe(2);
    expect(spy).toHaveBeenCalledTimes(1);
    // `b` holds at its only fix; `a` is still between its fixes.
    expect(tracking.step(1600)).toBe(1);
    // Nothing moves once both are held.
    tracking.step(60_000);
    spy.mockClear();
    expect(tracking.step(60_100)).toBe(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it('walks the signal states, writing each transition once', () => {
    const { layer, tracking } = mount();
    const spy = vi.spyOn(layer.store.internal, 'setNodeState');
    tracking.pushFixes([fix('a', 0, 0, 0)], 0);
    tracking.step(1000);
    expect(tracking.getSignalState('a')).toBe('moving');
    tracking.step(1100);
    expect(spy).toHaveBeenCalledTimes(1); // moving on, nothing per frame
    tracking.step(21_000);
    expect(tracking.getSignalState('a')).toBe('stale');
    tracking.step(91_000);
    expect(tracking.getSignalState('a')).toBe('lost');
    // A fresh fix brings it back.
    tracking.pushFixes([fix('a', 100_000, 1, 1)], 100_000);
    tracking.step(100_500);
    expect(tracking.getSignalState('a')).toBe('moving');
    expect(layer.store.nodeStatesOf('a')).toContain('moving');
    expect(layer.store.nodeStatesOf('a')).not.toContain('lost');
  });

  it('writes the heading only when it moved by the epsilon', () => {
    const { layer, tracking } = mount({ courseEpsilonDeg: 5 });
    const spy = vi.spyOn(layer.store.internal, 'updateNode');
    tracking.pushFixes([fix('a', 0, 0, 0, { course: 90 })], 0);
    tracking.step(2000);
    expect(layer.store.getNode('a')!.data).toMatchObject({ name: 'A', course: 90 });
    tracking.step(2100);
    expect(spy).toHaveBeenCalledTimes(1);
    tracking.pushFixes([fix('a', 3000, 1, 0, { course: 92 })], 3000);
    tracking.step(4500);
    expect(spy).toHaveBeenCalledTimes(1); // 2° < 5°
    tracking.pushFixes([fix('a', 5000, 2, 0, { course: 120 })], 5000);
    tracking.step(7000);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('writes no heading with courseKey: null', () => {
    const { layer, tracking } = mount({ courseKey: null });
    tracking.pushFixes([fix('a', 0, 0, 0, { course: 90 })], 0);
    tracking.step(2000);
    expect(layer.store.getNode('a')!.data).toEqual({ name: 'A' });
  });

  it('follows a target through the camera driver, and releases on a user gesture', () => {
    let gesture: (() => void) | null = null;
    const centerOn = vi.fn();
    const onFollowReleased = vi.fn();
    const cameraDriver = { centerOn, onUserGesture: (cb: () => void) => ((gesture = cb), () => (gesture = null)) };
    const { tracking } = mount({ follow: { targetId: 'a' } }, { cameraDriver, onFollowReleased });
    tracking.pushFixes([fix('a', 0, 10, 20)], 0);
    tracking.step(2000);
    expect(centerOn).toHaveBeenLastCalledWith(10, 20);
    gesture!();
    expect(onFollowReleased).toHaveBeenCalledWith('a');
    centerOn.mockClear();
    tracking.step(2100);
    expect(centerOn).not.toHaveBeenCalled();
  });

  it('clears its states when disabled and does nothing while disabled', () => {
    const { layer, tracking } = mount();
    tracking.pushFixes([fix('a', 0, 0, 0)], 0);
    tracking.step(1000);
    tracking.disable();
    expect(layer.store.nodeStatesOf('a')).not.toContain('moving');
  });

  it('is not recorded in the operation log', () => {
    const { canvas, tracking } = mount();
    tracking.pushFixes([fix('a', 0, 0, 0, { course: 10 })], 0);
    tracking.step(2000);
    expect(canvas.history.canUndo()).toBe(false);
  });

  it('picks up a config patch through canvas.update (what the settings editor sends)', () => {
    const { canvas, tracking } = mount();
    tracking.pushFixes([fix('a', 0, 0, 0)], 0);
    tracking.step(10_000);
    expect(tracking.getSignalState('a')).toBe('moving'); // 10 s < the 20 s stale threshold
    canvas.update({ behaviours: { tracking: { staleAfterMs: 5000 } } } as never);
    tracking.step(10_100);
    expect(tracking.getSignalState('a')).toBe('stale'); // now 10 s > 5 s
  });
});
