import { describe, expect, it, vi } from 'vitest';
import { EventEmitter } from '../../src/events/EventEmitter';

type TestEvents = {
  'foo': { value: number };
  'bar': string;
};

describe('EventEmitter', () => {
  it('delivers payloads to subscribers', () => {
    const ee = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    ee.on('foo', handler);
    ee.emit('foo', { value: 42 });
    expect(handler).toHaveBeenCalledWith({ value: 42 });
  });

  it('returns an unsubscribe function from on()', () => {
    const ee = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    const off = ee.on('foo', handler);
    ee.emit('foo', { value: 1 });
    off();
    ee.emit('foo', { value: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('off() removes a specific handler only', () => {
    const ee = new EventEmitter<TestEvents>();
    const a = vi.fn();
    const b = vi.fn();
    ee.on('foo', a);
    ee.on('foo', b);
    ee.off('foo', a);
    ee.emit('foo', { value: 1 });
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
  });

  it('once() fires at most once', () => {
    const ee = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    ee.once('foo', handler);
    ee.emit('foo', { value: 1 });
    ee.emit('foo', { value: 2 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('once() unsubscribe cancels before firing', () => {
    const ee = new EventEmitter<TestEvents>();
    const handler = vi.fn();
    const off = ee.once('foo', handler);
    off();
    ee.emit('foo', { value: 1 });
    expect(handler).not.toHaveBeenCalled();
  });

  it('removeAllListeners(event) clears one event', () => {
    const ee = new EventEmitter<TestEvents>();
    ee.on('foo', vi.fn());
    ee.on('bar', vi.fn());
    ee.removeAllListeners('foo');
    expect(ee.listenerCount('foo')).toBe(0);
    expect(ee.listenerCount('bar')).toBe(1);
  });

  it('removeAllListeners() clears every event when called with no args', () => {
    const ee = new EventEmitter<TestEvents>();
    ee.on('foo', vi.fn());
    ee.on('bar', vi.fn());
    ee.removeAllListeners();
    expect(ee.listenerCount('foo')).toBe(0);
    expect(ee.listenerCount('bar')).toBe(0);
  });

  it('iteration is mutation-safe (handler can off()/on() during emit)', () => {
    const ee = new EventEmitter<TestEvents>();
    const seen: string[] = [];
    const a = vi.fn(() => seen.push('a'));
    const b = vi.fn(() => {
      seen.push('b');
      ee.off('foo', a);
    });
    const c = vi.fn(() => seen.push('c'));
    ee.on('foo', a);
    ee.on('foo', b);
    ee.on('foo', c);
    ee.emit('foo', { value: 1 });
    // First emit fires all three despite b removing a mid-emit.
    expect(seen).toEqual(['a', 'b', 'c']);

    seen.length = 0;
    ee.emit('foo', { value: 2 });
    // Second emit no longer sees a.
    expect(seen).toEqual(['b', 'c']);
  });

  it('a throwing handler does not break subsequent handlers in the same emit', () => {
    const ee = new EventEmitter<TestEvents>();
    const seen: string[] = [];
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    ee.on('foo', () => {
      seen.push('first');
      throw new Error('boom');
    });
    ee.on('foo', () => {
      seen.push('second');
    });
    ee.emit('foo', { value: 1 });
    expect(seen).toEqual(['first', 'second']);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('handler for event "foo" threw'),
      expect.any(Error),
    );
    errSpy.mockRestore();
  });

  it('listenerCount reports per-event counts', () => {
    const ee = new EventEmitter<TestEvents>();
    expect(ee.listenerCount('foo')).toBe(0);
    ee.on('foo', vi.fn());
    ee.on('foo', vi.fn());
    expect(ee.listenerCount('foo')).toBe(2);
  });

  it('emit on an event with no handlers is a no-op', () => {
    const ee = new EventEmitter<TestEvents>();
    expect(() => ee.emit('foo', { value: 1 })).not.toThrow();
  });
});
