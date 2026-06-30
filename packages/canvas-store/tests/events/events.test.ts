import { describe, expect, it, vi } from 'vitest';

import { CanvasEventBus } from '../../src/events/CanvasEventBus';
import { EventEmitter } from '../../src/events/EventEmitter';
import { SourceEmitter } from '../../src/events/SourceEmitter';
import type { CanvasEvent } from '../../src/events/CanvasEvent';

interface M extends Record<string, unknown> {
  ping: { n: number };
  pong: string;
}

describe('EventEmitter', () => {
  it('on / emit / off', () => {
    const e = new EventEmitter<M>();
    const fn = vi.fn();
    const off = e.on('ping', fn);
    e.emit('ping', { n: 1 });
    e.emit('pong', 'x'); // unrelated
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ n: 1 });
    off();
    e.emit('ping', { n: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('once fires a single time', () => {
    const e = new EventEmitter<M>();
    const fn = vi.fn();
    e.once('pong', fn);
    e.emit('pong', 'a');
    e.emit('pong', 'b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });
});

describe('CanvasEventBus', () => {
  it('tap receives a structured envelope; typed listeners fire', () => {
    const bus = new CanvasEventBus({ now: () => 123 });
    const seen: CanvasEvent[] = [];
    const onState = vi.fn();
    bus.tap((e) => seen.push(e));
    bus.on('state:change', onState);

    bus.emit('state:change', { action: 'a', changedPaths: ['view'] }, { kind: 'store', id: 'view' });

    expect(onState).toHaveBeenCalledOnce();
    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual({
      type: 'state:change',
      timestamp: 123,
      source: { kind: 'store', id: 'view' },
      payload: { action: 'a', changedPaths: ['view'] },
    });
  });

  it('tap honours exclude + sampleRate', () => {
    const bus = new CanvasEventBus({ random: () => 0.9 });
    const all = vi.fn();
    const filtered = vi.fn();
    bus.tap(all);
    bus.tap(filtered, { exclude: ['state:change'] });
    bus.emit('state:change', { changedPaths: [] });
    expect(all).toHaveBeenCalledOnce();
    expect(filtered).not.toHaveBeenCalled();

    const sampled = vi.fn();
    bus.tap(sampled, { sampleRate: 0.5 }); // rand()=0.9 > 0.5 → dropped
    bus.emit('state:change', { changedPaths: [] });
    expect(sampled).not.toHaveBeenCalled();
  });
});

describe('SourceEmitter', () => {
  it('emits locally and forwards to the bus tap, stamped with its source', () => {
    const bus = new CanvasEventBus({ now: () => 7 });
    const taps: CanvasEvent[] = [];
    bus.tap((e) => taps.push(e));

    const emitter = new SourceEmitter<M>({ kind: 'layer', id: 'graph' });
    const local = vi.fn();
    emitter.on('ping', local);

    emitter.emit('ping', { n: 5 }); // not connected yet → no bus forward
    expect(local).toHaveBeenCalledOnce();
    expect(taps).toHaveLength(0);

    emitter.setBus(bus);
    emitter.emit('ping', { n: 6 });
    expect(taps).toHaveLength(1);
    expect(taps[0]).toEqual({
      type: 'ping',
      timestamp: 7,
      source: { kind: 'layer', id: 'graph' },
      payload: { n: 6 },
    });
  });
});
