import { describe, expect, it, vi } from 'vitest';
import { CanvasEventBus } from '../../src/events/CanvasEventBus';
import { makeCanvasEvent } from '../../src/events/CanvasEvent';

describe('CanvasEventBus — typed canvas-wide events', () => {
  it('inherits EventEmitter behaviour for typed events', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.on('layer:added', handler);
    bus.emit('layer:added', { id: 'graph-1' });
    expect(handler).toHaveBeenCalledWith({ id: 'graph-1' });
  });

  it('camera:zoom event delivers expected payload shape', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.on('camera:zoom', handler);
    bus.emit('camera:zoom', { scale: 1.5, centerX: 100, centerY: 50 });
    expect(handler).toHaveBeenCalledWith({ scale: 1.5, centerX: 100, centerY: 50 });
  });

  it('bus.emit() auto-publishes a canvas-source envelope to tap subscribers', () => {
    const bus = new CanvasEventBus();
    const tapHandler = vi.fn();
    bus.tap(tapHandler);
    bus.emit('layer:added', { id: 'graph-1' });
    expect(tapHandler).toHaveBeenCalledTimes(1);
    const env = tapHandler.mock.calls[0]![0];
    expect(env.type).toBe('canvas:canvas:layer:added');
    expect(env.source).toEqual({ kind: 'canvas', id: 'canvas' });
    expect(env.payload).toEqual({ id: 'graph-1' });
  });

  it('custom source identity flows into envelopes published from bus.emit()', () => {
    const bus = new CanvasEventBus({ source: { kind: 'canvas', id: 'main-canvas' } });
    const tapHandler = vi.fn();
    bus.tap(tapHandler);
    bus.emit('layer:added', { id: 'graph-1' });
    const env = tapHandler.mock.calls[0]![0];
    expect(env.type).toBe('canvas:main-canvas:layer:added');
    expect(env.source).toEqual({ kind: 'canvas', id: 'main-canvas' });
  });
});

describe('CanvasEventBus — tap channel', () => {
  it('publish() fans out to every tap subscriber', () => {
    const bus = new CanvasEventBus();
    const a = vi.fn();
    const b = vi.fn();
    bus.tap(a);
    bus.tap(b);

    const ev = makeCanvasEvent({ kind: 'layer', id: 'g1' }, 'node:click', { id: 'n-1' });
    bus.publish(ev);

    expect(a).toHaveBeenCalledWith(ev);
    expect(b).toHaveBeenCalledWith(ev);
  });

  it('tap returns an unsubscribe function', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    const off = bus.tap(handler);
    bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'x', {}));
    off();
    bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'x', {}));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('default exclude filters high-frequency events', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.tap(handler);
    bus.publish(
      makeCanvasEvent({ kind: 'layer', id: 'g1' }, 'shape:pointermove', { x: 1 }),
    );
    expect(handler).not.toHaveBeenCalled();
  });

  it('exclude: [] receives everything (including high-frequency)', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.tap(handler, { exclude: [] });
    bus.publish(
      makeCanvasEvent({ kind: 'layer', id: 'g1' }, 'shape:pointermove', { x: 1 }),
    );
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('custom exclude list overrides the default', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.tap(handler, { exclude: ['camera:zoom'] });
    // 'pointermove' would normally be excluded by default — but our custom list doesn't have it.
    bus.publish(
      makeCanvasEvent({ kind: 'layer', id: 'g1' }, 'shape:pointermove', {}),
    );
    expect(handler).toHaveBeenCalledTimes(1);

    bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'camera:zoom', {}));
    // camera:zoom IS in our custom exclude — filtered.
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('sampleRate filters probabilistically; sampleRate=0 drops everything', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.tap(handler, { sampleRate: 0 });
    for (let i = 0; i < 100; i++) {
      bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'x', { i }));
    }
    expect(handler).not.toHaveBeenCalled();
  });

  it('sampleRate=1 (default) delivers everything', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.tap(handler);
    for (let i = 0; i < 50; i++) {
      bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'foo', { i }));
    }
    expect(handler).toHaveBeenCalledTimes(50);
  });

  it('sampleRate=0.5 delivers roughly half (sanity check)', () => {
    const bus = new CanvasEventBus();
    const handler = vi.fn();
    bus.tap(handler, { sampleRate: 0.5 });
    for (let i = 0; i < 1000; i++) {
      bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'foo', { i }));
    }
    const calls = handler.mock.calls.length;
    // Wide bounds; this is a sanity test, not a statistical proof.
    expect(calls).toBeGreaterThan(350);
    expect(calls).toBeLessThan(650);
  });

  it('a throwing tap handler does not break sibling taps', () => {
    const bus = new CanvasEventBus();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const a = vi.fn(() => {
      throw new Error('boom');
    });
    const b = vi.fn();
    bus.tap(a);
    bus.tap(b);
    bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'foo', {}));
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('tapCount() and clearTaps() report correctly', () => {
    const bus = new CanvasEventBus();
    bus.tap(vi.fn());
    bus.tap(vi.fn());
    expect(bus.tapCount()).toBe(2);
    bus.clearTaps();
    expect(bus.tapCount()).toBe(0);
  });

  it('publish on a bus with zero taps is a cheap no-op', () => {
    const bus = new CanvasEventBus();
    expect(() =>
      bus.publish(makeCanvasEvent({ kind: 'canvas', id: 'c' }, 'foo', {})),
    ).not.toThrow();
  });
});
