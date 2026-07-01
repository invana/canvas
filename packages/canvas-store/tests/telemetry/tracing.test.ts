import { describe, expect, it } from 'vitest';

import {
  createCanvasStore,
  createCollectorTracer,
  createTapTracer,
  createTracingSink,
} from '../../src/index';

/** Tracing adapters — TelemetrySink→spans (view updates) + tap→spans (whole loop). */
describe('tracing — createTracingSink (view updates → spans)', () => {
  it('emits one action-named span per update, with diff + duration attributes', () => {
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore({ telemetry: createTracingSink(tracer) });

    store.actions.hover.set('n1');
    store.actions.layers.add('graph', { type: 'graph' });

    expect(spans.map((s) => s.name)).toEqual(['view:hover:set', 'view:layer:add']);
    const s0 = spans[0]!;
    expect(s0.attributes['canvas.changed_paths']).toBe('interaction');
    expect(typeof s0.attributes['canvas.patch_count']).toBe('number');
    // durationMs is measured in store-core and threaded through withTelemetry → the span.
    expect(typeof s0.attributes['canvas.duration_ms']).toBe('number');
  });

  it('a span prefix is applied', () => {
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore({ telemetry: createTracingSink(tracer, { prefix: 'canvas.' }) });
    store.actions.camera.zoom(1.5);
    expect(spans[0]!.name).toBe('canvas.view:camera:zoom');
  });
});

describe('tracing — createTapTracer (bus events → spans)', () => {
  it('emits a span per bus event, with source attributes', () => {
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore();
    const off = createTapTracer(store.events, tracer);

    store.actions.selection.set(['a']); // → state:change (emit) + view:selection:set (publish)
    off();

    const names = spans.map((s) => s.name);
    expect(names).toContain('state:change');
    expect(names).toContain('view:selection:set');
    const state = spans.find((s) => s.name === 'state:change')!;
    expect(state.attributes['canvas.source.kind']).toBe('store');
    expect(state.attributes['canvas.source.id']).toBe('view');
  });

  it('honours exclude', () => {
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore();
    createTapTracer(store.events, tracer, { exclude: ['state:change'] });

    store.actions.hover.set('n1');

    expect(spans.some((s) => s.name === 'state:change')).toBe(false);
    expect(spans.some((s) => s.name === 'view:hover:set')).toBe(true);
  });

  it('traces data flushes too (one span per frame)', async () => {
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore();
    createTapTracer(store.events, tracer);

    store.actions.node.add('graph', { id: 'n1' }); // data:node:add (publish, sync) + data:flush (microtask)
    await new Promise<void>((r) => queueMicrotask(r));

    expect(spans.some((s) => s.name === 'data:node:add')).toBe(true);
    expect(spans.some((s) => s.name === 'data:flush')).toBe(true);
  });
});
