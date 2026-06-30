import { describe, expect, it, vi } from 'vitest';

import { CanvasEventBus } from '../../src/events/CanvasEventBus';
import { SourceEmitter } from '../../src/events/SourceEmitter';
import type { CanvasEvent } from '../../src/events/CanvasEvent';

interface M {
  ping: { n: number };
}

describe('SourceEmitter', () => {
  it('carries its source identity', () => {
    const e = new SourceEmitter<M>({ kind: 'layer', id: 'graph' });
    expect(e.source).toEqual({ kind: 'layer', id: 'graph' });
  });

  it('emits to local listeners (inherits EventEmitter)', () => {
    const e = new SourceEmitter<M>({ kind: 'layer', id: 'graph' });
    const fn = vi.fn();
    e.on('ping', fn);
    e.emit('ping', { n: 1 });
    expect(fn).toHaveBeenCalledWith({ n: 1 });
  });

  it('does not forward to a bus until connected', () => {
    const bus = new CanvasEventBus();
    const taps: CanvasEvent[] = [];
    bus.tap((ev) => taps.push(ev));
    const e = new SourceEmitter<M>({ kind: 'layer', id: 'graph' });
    e.emit('ping', { n: 1 });
    expect(taps).toHaveLength(0);
  });

  it('once connected, forwards every emit to the bus tap, stamped with its source', () => {
    const bus = new CanvasEventBus({ now: () => 9 });
    const taps: CanvasEvent[] = [];
    bus.tap((ev) => taps.push(ev));
    const local = vi.fn();

    const e = new SourceEmitter<M>({ kind: 'data', id: 'graph' });
    e.on('ping', local);
    e.setBus(bus);
    e.emit('ping', { n: 5 });

    expect(local).toHaveBeenCalledWith({ n: 5 }); // local still fires
    expect(taps).toEqual([{ type: 'ping', timestamp: 9, source: { kind: 'data', id: 'graph' }, payload: { n: 5 } }]);
  });

  it('setBus(null) detaches the forward', () => {
    const bus = new CanvasEventBus();
    const taps: CanvasEvent[] = [];
    bus.tap((ev) => taps.push(ev));
    const e = new SourceEmitter<M>({ kind: 'data', id: 'graph' });
    e.setBus(bus);
    e.emit('ping', { n: 1 });
    e.setBus(null);
    e.emit('ping', { n: 2 });
    expect(taps).toHaveLength(1);
  });
});
