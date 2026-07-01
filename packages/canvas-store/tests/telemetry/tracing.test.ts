import { describe, expect, it } from 'vitest';

import {
  createCanvasStore,
  createCollectorTracer,
  createTapTracer,
  createTracingSink,
  traceActions,
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
    // Enriched attributes: the update's changed paths + its wall-clock cost ride
    // on the bus payload, so the tap span carries them for dashboards.
    expect(state.attributes['canvas.changed_paths']).toBe('interaction');
    expect(typeof state.attributes['canvas.duration_ms']).toBe('number');
    const granular = spans.find((s) => s.name === 'view:selection:set')!;
    expect(granular.attributes['canvas.action']).toBe('view:selection:set');
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
    const flush = spans.find((s) => s.name === 'data:flush')!;
    expect(flush).toBeDefined();
    // The flush span carries the layer + the per-kind delta counts for dashboards.
    expect(flush.attributes['canvas.layer_id']).toBe('graph');
    expect(flush.attributes['canvas.flush.nodes_added']).toBe(1);
    const intent = spans.find((s) => s.name === 'data:node:add')!;
    expect(intent.attributes['canvas.layer_id']).toBe('graph');
    expect(intent.attributes['canvas.ids_count']).toBe(1);
  });
});

describe('tracing — traceActions (decorator: command API → spans)', () => {
  it('wraps each action call in a span named <group>.<method>, with arg attributes', () => {
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore();
    const a = traceActions(store.actions, tracer);

    a.node.add('graph', { id: 'n1', x: 1, y: 2 }); // real data manipulation
    a.camera.zoom(1.5); // real view manipulation

    const add = spans.find((s) => s.name === 'action:node.add')!;
    expect(add).toBeDefined();
    expect(add.attributes['canvas.arg.0']).toBe('graph'); // layer id
    expect(add.attributes['canvas.arg.1.id']).toBe('n1'); // record id
    const zoom = spans.find((s) => s.name === 'action:camera.zoom')!;
    expect(zoom.attributes['canvas.arg.0']).toBe(1.5);
  });

  it('nests the mutation ripple: bus spans parent under the active action span', () => {
    // The collector is flat, but ordering proves the action span opens, the tap span
    // fires inside it, and the action span ends last (start-active → inner → end).
    const { tracer, spans } = createCollectorTracer(() => 0);
    const store = createCanvasStore();
    createTapTracer(store.events, tracer);
    const a = traceActions(store.actions, tracer);

    a.selection.set(['x']);

    const names = spans.map((s) => s.name);
    // state:change (inner, ends first) is recorded before action:selection.set (ends last).
    expect(names.indexOf('state:change')).toBeLessThan(names.indexOf('action:selection.set'));
  });

  it('leaves the original actions object untouched', () => {
    const { tracer } = createCollectorTracer(() => 0);
    const store = createCanvasStore();
    const traced = traceActions(store.actions, tracer);
    expect(traced).not.toBe(store.actions);
    expect(traced.node).not.toBe(store.actions.node);
  });
});
