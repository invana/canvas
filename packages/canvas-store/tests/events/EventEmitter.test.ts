import { describe, expect, it, vi } from 'vitest';

import { EventEmitter } from '../../src/events/EventEmitter';

interface M {
  ping: { n: number };
  pong: string;
}

describe('EventEmitter', () => {
  it('emits to a listener with the typed payload', () => {
    const e = new EventEmitter<M>();
    const fn = vi.fn();
    e.on('ping', fn);
    e.emit('ping', { n: 1 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith({ n: 1 });
  });

  it('does not cross-fire between event types', () => {
    const e = new EventEmitter<M>();
    const ping = vi.fn();
    const pong = vi.fn();
    e.on('ping', ping);
    e.on('pong', pong);
    e.emit('ping', { n: 1 });
    expect(ping).toHaveBeenCalledOnce();
    expect(pong).not.toHaveBeenCalled();
  });

  it('fans out to multiple listeners of the same type', () => {
    const e = new EventEmitter<M>();
    const a = vi.fn();
    const b = vi.fn();
    e.on('pong', a);
    e.on('pong', b);
    e.emit('pong', 'x');
    expect(a).toHaveBeenCalledWith('x');
    expect(b).toHaveBeenCalledWith('x');
  });

  it('on() returns an unsubscribe; off() also works', () => {
    const e = new EventEmitter<M>();
    const fn = vi.fn();
    const off = e.on('pong', fn);
    e.emit('pong', 'a');
    off();
    e.emit('pong', 'b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');

    const fn2 = vi.fn();
    e.on('pong', fn2);
    e.off('pong', fn2);
    e.emit('pong', 'c');
    expect(fn2).not.toHaveBeenCalled();
  });

  it('once() fires exactly once', () => {
    const e = new EventEmitter<M>();
    const fn = vi.fn();
    e.once('pong', fn);
    e.emit('pong', 'a');
    e.emit('pong', 'b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('emit with no listeners is a safe no-op', () => {
    const e = new EventEmitter<M>();
    expect(() => e.emit('ping', { n: 1 })).not.toThrow();
  });

  it('a listener unsubscribing mid-emit does not break the current dispatch', () => {
    const e = new EventEmitter<M>();
    const calls: string[] = [];
    let offB: () => void = () => {};
    e.on('pong', (p) => {
      calls.push(`a:${p}`);
      offB(); // remove b during dispatch
    });
    offB = e.on('pong', (p) => calls.push(`b:${p}`));
    e.emit('pong', '1'); // snapshot dispatch → both still run this round
    e.emit('pong', '2'); // b removed → only a
    expect(calls).toEqual(['a:1', 'b:1', 'a:2']);
  });

  it('listenerCount + removeAllListeners', () => {
    const e = new EventEmitter<M>();
    e.on('ping', vi.fn());
    e.on('ping', vi.fn());
    expect(e.listenerCount('ping')).toBe(2);
    e.removeAllListeners();
    expect(e.listenerCount('ping')).toBe(0);
  });
});
