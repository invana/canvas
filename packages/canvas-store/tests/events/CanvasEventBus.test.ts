import { describe, expect, it, vi } from 'vitest';

import { CanvasEventBus } from '../../src/events/CanvasEventBus';
import { CANVAS_SOURCE, type CanvasEvent } from '../../src/events/CanvasEvent';

describe('CanvasEventBus — typed listeners', () => {
  it('emit reaches typed on() listeners with the payload', () => {
    const bus = new CanvasEventBus();
    const fn = vi.fn();
    bus.on('state:change', fn);
    bus.emit('state:change', { action: 'a', changedPaths: ['view'] });
    expect(fn).toHaveBeenCalledWith({ action: 'a', changedPaths: ['view'] });
  });
});

describe('CanvasEventBus — tap channel', () => {
  it('tap receives a structured envelope (type, timestamp, source, payload)', () => {
    const bus = new CanvasEventBus({ now: () => 123 });
    const seen: CanvasEvent[] = [];
    bus.tap((e) => seen.push(e));
    bus.emit('state:change', { action: 'a', changedPaths: ['view'] }, { kind: 'store', id: 'view' });
    expect(seen).toEqual([
      { type: 'state:change', timestamp: 123, source: { kind: 'store', id: 'view' }, payload: { action: 'a', changedPaths: ['view'] } },
    ]);
  });

  it('defaults the source to CANVAS_SOURCE when none is given', () => {
    const bus = new CanvasEventBus({ now: () => 0 });
    let source: CanvasEvent['source'] | undefined;
    bus.tap((e) => (source = e.source));
    bus.emit('state:change', { changedPaths: [] });
    expect(source).toEqual(CANVAS_SOURCE);
  });

  it('multiple taps all receive; unsubscribe stops one', () => {
    const bus = new CanvasEventBus();
    const a = vi.fn();
    const b = vi.fn();
    const offA = bus.tap(a);
    bus.tap(b);
    bus.emit('state:change', { changedPaths: [] });
    offA();
    bus.emit('state:change', { changedPaths: [] });
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
  });

  it('exclude drops the named type from that tap only', () => {
    const bus = new CanvasEventBus();
    const all = vi.fn();
    const filtered = vi.fn();
    bus.tap(all);
    bus.tap(filtered, { exclude: ['state:change'] });
    bus.emit('state:change', { changedPaths: [] });
    expect(all).toHaveBeenCalledOnce();
    expect(filtered).not.toHaveBeenCalled();
  });

  it('sampleRate keeps/drops deterministically against the injected random', () => {
    const seq = [0.4, 0.9]; // first kept (<=0.5), second dropped (>0.5)
    let i = 0;
    const bus = new CanvasEventBus({ random: () => seq[i++ % seq.length]! });
    const fn = vi.fn();
    bus.tap(fn, { sampleRate: 0.5 });
    bus.emit('state:change', { changedPaths: [] }); // rand 0.4 → kept
    bus.emit('state:change', { changedPaths: [] }); // rand 0.9 → dropped
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('publish() forwards a scoped/foreign event to taps only (not typed listeners)', () => {
    const bus = new CanvasEventBus({ now: () => 7 });
    const typed = vi.fn();
    const tapped: CanvasEvent[] = [];
    bus.on('state:change', typed);
    bus.tap((e) => tapped.push(e));
    bus.publish('shape:click', { id: 'n1' }, { kind: 'layer', id: 'graph' });
    expect(typed).not.toHaveBeenCalled();
    expect(tapped).toEqual([
      { type: 'shape:click', timestamp: 7, source: { kind: 'layer', id: 'graph' }, payload: { id: 'n1' } },
    ]);
  });

  it('clearTaps + removeAllListeners detach everything', () => {
    const bus = new CanvasEventBus();
    const tap = vi.fn();
    const on = vi.fn();
    bus.tap(tap);
    bus.on('state:change', on);
    bus.clearTaps();
    bus.emit('state:change', { changedPaths: [] });
    expect(tap).not.toHaveBeenCalled();
    expect(on).toHaveBeenCalledOnce(); // listeners survive clearTaps

    bus.removeAllListeners();
    bus.emit('state:change', { changedPaths: [] });
    expect(on).toHaveBeenCalledOnce(); // now detached too
  });
});
