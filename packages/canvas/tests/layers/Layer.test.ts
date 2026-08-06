import { describe, expect, it, vi } from 'vitest';
import { Layer } from '../../src/layers/Layer';
import { CanvasEventBus } from '@invana/canvas-store';
import { Camera } from '../../src/camera/Camera';
import { DefaultGestureArbiter } from '../../src/input/GestureArbiter';
import { LayerRegistry } from '../../src/registries/LayerRegistry';
import { BehaviourRegistry } from '../../src/registries/BehaviourRegistry';
import type { CanvasContext } from '../../src/context/CanvasContext';
import type { DirtySnapshot } from '@invana/canvas-store';
import { makeTestScene } from '../_helpers/makeWorld';
import { createCanvasStore } from '@invana/canvas-store';

type TState = { count: number };
type TEvents = { 'tick:done': { count: number } };
type TBucket = 'shape' | 'halo';

class TestLayer extends Layer<{ initial: number }, TState, TEvents, TBucket> {
  appliedSnapshots: DirtySnapshot<TBucket>[] = [];
  mountCalls = 0;
  unmountCalls = 0;

  protected createState(): TState {
    return { count: this.options.initial };
  }
  protected applyDirty(snap: DirtySnapshot<TBucket>): void {
    this.appliedSnapshots.push(snap);
  }
  protected onMount(): void {
    this.mountCalls++;
  }
  protected onUnmount(): void {
    this.unmountCalls++;
  }
}

function makeContext() {
  const bus = new CanvasEventBus();
  const { stage, world } = makeTestScene();
  const camera = new Camera({
    viewport: world,
    screenWidth: 800,
    screenHeight: 600,
    bus,
  });
  let ctx: CanvasContext;
  const layers = new LayerRegistry({ getContext: () => ctx, bus });
  const behaviours = new BehaviourRegistry({ getContext: () => ctx, bus });
  ctx = { events: bus, store: createCanvasStore(), world, stage, camera, gestures: new DefaultGestureArbiter(), layers, behaviours, theme: { current: () => null, set: () => {} }, showMessage: () => {}, clearMessage: () => {}, createOverlay: () => ({}) as never };
  return ctx;
}

describe('Layer — construction', () => {
  it('builds state via createState()', () => {
    const layer = new TestLayer({ id: 'a', options: { initial: 42 } });
    expect(layer.state.getState()).toEqual({ count: 42 });
  });

  it('honours visible/hittable/zIndex/cullable defaults', () => {
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    expect(layer.visible).toBe(true);
    expect(layer.hittable).toBe(true);
    expect(layer.zIndex).toBe(0);
    expect(layer.cullable).toBe(true);
  });

  it('events emitter has the expected source id (kind: layer)', () => {
    const layer = new TestLayer({ id: 'graph-1', options: { initial: 0 } });
    expect(layer.events.source).toEqual({ kind: 'layer', id: 'graph-1' });
  });
});

describe('Layer — lifecycle', () => {
  it('mount() sets ctx and runs onMount; unmount() reverses', () => {
    const ctx = makeContext();
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    expect(layer.mounted).toBe(false);
    layer.mount(ctx);
    expect(layer.mounted).toBe(true);
    expect(layer.mountCalls).toBe(1);
    layer.unmount();
    expect(layer.mounted).toBe(false);
    expect(layer.unmountCalls).toBe(1);
  });

  it('mount() throws on double-mount', () => {
    const ctx = makeContext();
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    layer.mount(ctx);
    expect(() => layer.mount(ctx)).toThrow(/already mounted/);
  });

  it('events forward to bus tap after mount', () => {
    const ctx = makeContext();
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    const tapHandler = vi.fn();
    ctx.events.tap(tapHandler);
    layer.mount(ctx);
    layer.events.emit('tick:done', { count: 5 });
    expect(tapHandler).toHaveBeenCalledTimes(1);
    const env = tapHandler.mock.calls[0]![0];
    expect(env.type).toBe('tick:done');
    expect(env.source).toEqual({ kind: 'layer', id: 'a' });
    expect(env.payload).toEqual({ count: 5 });
  });

  it('events DO NOT forward to bus after unmount', () => {
    const ctx = makeContext();
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    const tapHandler = vi.fn();
    ctx.events.tap(tapHandler);
    layer.mount(ctx);
    layer.unmount();
    layer.events.emit('tick:done', { count: 5 });
    expect(tapHandler).not.toHaveBeenCalled();
  });
});

describe('Layer — flush + dirty pipeline', () => {
  it('hasPending reflects dirty.hasPending', () => {
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    expect(layer.hasPending()).toBe(false);
    layer.dirty.mark('shape', 'n-1');
    expect(layer.hasPending()).toBe(true);
  });

  it('flush drains the snapshot through applyDirty()', () => {
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    layer.dirty.mark('shape', 'n-1');
    layer.dirty.mark('halo', 'n-2');
    layer.flush();
    expect(layer.appliedSnapshots).toHaveLength(1);
    const snap = layer.appliedSnapshots[0]!;
    expect([...snap.buckets.get('shape')!]).toEqual(['n-1']);
    expect([...snap.buckets.get('halo')!]).toEqual(['n-2']);
  });

  it('flush() with no pending work is a no-op', () => {
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    layer.flush();
    expect(layer.appliedSnapshots).toHaveLength(0);
  });

  it('unmount() resets the dirty batcher', () => {
    const ctx = makeContext();
    const layer = new TestLayer({ id: 'a', options: { initial: 0 } });
    layer.mount(ctx);
    layer.dirty.mark('shape', 'n-1');
    layer.unmount();
    expect(layer.hasPending()).toBe(false);
  });
});
