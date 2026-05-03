import { describe, expect, it, vi } from 'vitest';
import { SourceEmitter } from '../../src/events/SourceEmitter';
import { CanvasEventBus } from '../../src/events/CanvasEventBus';

type LayerEvents = {
  'node:click': { id: string };
  'selection:changed': { ids: ReadonlySet<string> };
};

describe('SourceEmitter', () => {
  it('delivers to local subscribers (clean payload)', () => {
    const ee = new SourceEmitter<LayerEvents>({ kind: 'layer', id: 'g1' });
    const handler = vi.fn();
    ee.on('node:click', handler);
    ee.emit('node:click', { id: 'n-42' });
    expect(handler).toHaveBeenCalledWith({ id: 'n-42' });
  });

  it('forwards an envelope to the bus tap when present', () => {
    const bus = new CanvasEventBus();
    const tapHandler = vi.fn();
    bus.tap(tapHandler);

    const ee = new SourceEmitter<LayerEvents>({ kind: 'layer', id: 'g1' }, bus);
    ee.emit('node:click', { id: 'n-42' });

    expect(tapHandler).toHaveBeenCalledTimes(1);
    const env = tapHandler.mock.calls[0]![0];
    expect(env.type).toBe('layer:g1:node:click');
    expect(env.source).toEqual({ kind: 'layer', id: 'g1' });
    expect(env.payload).toEqual({ id: 'n-42' });
    expect(typeof env.timestamp).toBe('number');
  });

  it('does NOT publish when no bus is provided', () => {
    const ee = new SourceEmitter<LayerEvents>({ kind: 'layer', id: 'g1' });
    const handler = vi.fn();
    ee.on('node:click', handler);
    ee.emit('node:click', { id: 'a' });
    // Local handler still works; no bus interaction to test, but no crash either.
    expect(handler).toHaveBeenCalled();
  });

  it('local subscribers fire BEFORE the bus tap (deterministic ordering)', () => {
    const bus = new CanvasEventBus();
    const order: string[] = [];
    bus.tap(() => order.push('tap'));

    const ee = new SourceEmitter<LayerEvents>({ kind: 'layer', id: 'g1' }, bus);
    ee.on('node:click', () => order.push('local'));

    ee.emit('node:click', { id: 'a' });
    expect(order).toEqual(['local', 'tap']);
  });

  it('a throwing local handler does not block the bus publish', () => {
    const bus = new CanvasEventBus();
    const tapHandler = vi.fn();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    bus.tap(tapHandler);

    const ee = new SourceEmitter<LayerEvents>({ kind: 'layer', id: 'g1' }, bus);
    ee.on('node:click', () => {
      throw new Error('boom');
    });

    ee.emit('node:click', { id: 'a' });
    expect(tapHandler).toHaveBeenCalledTimes(1);
    errSpy.mockRestore();
  });

  it('warns in dev when a payload is non-serialisable (class instance)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    class Foo {}
    const ee = new SourceEmitter<{ x: { foo: Foo } }>({ kind: 'layer', id: 'g1' });
    ee.emit('x', { foo: new Foo() });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('sourceInfo exposes the source identity', () => {
    const ee = new SourceEmitter<LayerEvents>({ kind: 'layer', id: 'g1' });
    expect(ee.sourceInfo).toEqual({ kind: 'layer', id: 'g1' });
  });

  it('per-tap exclude still applies to forwarded events', () => {
    const bus = new CanvasEventBus();
    const tapHandler = vi.fn();
    bus.tap(tapHandler); // default exclude includes 'shape:pointermove'

    const ee = new SourceEmitter<{ 'shape:pointermove': { x: number } }>(
      { kind: 'layer', id: 'g1' },
      bus,
    );
    ee.emit('shape:pointermove', { x: 1 });
    expect(tapHandler).not.toHaveBeenCalled();
  });
});
