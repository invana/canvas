import {
  CanvasEventBus,
  CanvasThemeState,
  LayerData,
  SpecStore,
  createActions,
  defaultCanvasView,
  type CanvasStore,
  type CanvasView,
  type DataSource,
} from '@invana/canvas-core';
import { createReactiveStore } from './adapters/zustand';
import { createMemoryStore } from './port/createMemoryStore';
import { changedPaths } from './port/patch';
import { wireTelemetry, type CanvasTelemetryConfig } from './telemetry/config';

/**
 * The **implementation** of the `CanvasStore` contract, one per `Canvas` — the
 * interface itself lives in `@invana/canvas-core` (so contracts and abstracts
 * can type against the store without depending on this machinery). This module
 * owns what the contract can't: the reactive-store backends, the state↔bus
 * bridges, and telemetry wiring.
 *
 * **Every** update is bridged onto the bus, so one `events.tap(…)` / `events.on(…)`
 * sees the whole loop: `view` mutations → `state:change`; each layer's data flush →
 * `data:flush`. The engine wires pixi input events onto this same bus.
 */
export type { CanvasStore } from '@invana/canvas-core';

export interface CreateCanvasStoreOptions {
  /**
   * Telemetry to emit — independently toggle `traces` / `metrics` / `logging`
   * (see {@link CanvasTelemetryConfig}). `true` per stream uses the dep-free
   * console adapter; inject a real port for OTLP/HyperDX export via the opt-in
   * `@invana/canvas-telemetry-otel` package. Omitted → no telemetry.
   */
  telemetry?: CanvasTelemetryConfig;
  /** View-store backend. Default `'zustand'`; `'memory'` is dependency-free. */
  backend?: 'zustand' | 'memory';
}

/** A callback invoked for **every** {@link CanvasStore} at creation. */
export type CanvasStoreObserver = (store: CanvasStore) => void;

/**
 * The observer registry lives on `globalThis` under a `Symbol.for` key so it's a
 * **true singleton** even if a bundler (e.g. Vite's `optimizeDeps`) instantiates
 * this module more than once — otherwise a consumer that registers via one copy
 * (`preview.ts`) would never see stores created through another copy (the engine).
 */
const OBSERVERS_KEY = Symbol.for('@invana/canvas-store:storeObservers');
const globalSlot = globalThis as unknown as {
  [OBSERVERS_KEY]?: Set<CanvasStoreObserver>;
};
const storeObservers: Set<CanvasStoreObserver> = (globalSlot[OBSERVERS_KEY] ??=
  new Set<CanvasStoreObserver>());

/**
 * Register a global observer fired for **every** {@link CanvasStore} created via
 * {@link createCanvasStore} — regardless of how the `Canvas` was constructed
 * (imperative `new Canvas()`, `<Canvas>`/`GraphCanvasApp`, or a bare
 * `createCanvasStore()`). The one central seam for cross-cutting instrumentation.
 *
 * Opt-in (nothing runs until you register): production is unaffected. The intended
 * use is dev/observability — e.g. Storybook wires a tracer to *every* story's bus
 * in one place:
 *
 * ```ts
 * onCanvasStoreCreated((store) => createTapTracer(store.events, getTracer()));
 * ```
 *
 * @returns an unsubscribe function.
 */
export function onCanvasStoreCreated(observer: CanvasStoreObserver): () => void {
  storeObservers.add(observer);
  return () => storeObservers.delete(observer);
}

/** Create a fresh {@link CanvasStore}. */
export function createCanvasStore(opts: CreateCanvasStoreOptions = {}): CanvasStore {
  const view =
    opts.backend === 'memory'
      ? createMemoryStore<CanvasView>(defaultCanvasView())
      : createReactiveStore<CanvasView>(defaultCanvasView());

  const events = new CanvasEventBus();
  const theme = new CanvasThemeState(events);

  // VIEW mutations → bus. Always the coarse `state:change` (for "anything changed"
  // subscribers), PLUS — when the action is a taxonomy type (`<domain>:<subject>:<action>`,
  // e.g. 'view:layer:setStyle') — the granular event on the tap for telemetry / query.
  view.subscribeChanges((change) => {
    const paths = changedPaths(change.patches);
    // Carry the update's wall-clock cost onto the bus so any tap (tracing / HyperDX)
    // can attribute time to the mutation without a separate telemetry sink.
    const payload = {
      action: change.action,
      changedPaths: paths,
      ...(change.durationMs !== undefined ? { durationMs: change.durationMs } : {}),
    };
    events.emit('state:change', payload, { kind: 'store', id: 'view' });
    if (change.action && change.action.includes(':')) {
      events.publish(change.action, payload, { kind: 'store', id: 'view' });
    }
  });

  // Attach whichever telemetry streams the config enables (traces / metrics /
  // logging). Lives for the store's lifetime — the returned disposer is only
  // needed if telemetry is torn down independently, which the kernel doesn't do.
  if (opts.telemetry) wireTelemetry({ view, events }, opts.telemetry);

  const data: Record<string, DataSource> = {};
  const unbridge: Record<string, () => void> = {};

  // DATA flush → bus (same channel as state:change), so the canvas subscribes once.
  // Re-bridging (setSource over an existing id) drops the old subscription first.
  function bridge(id: string, src: DataSource): void {
    unbridge[id]?.();
    unbridge[id] = src.onFlush((delta) =>
      events.emit('data:flush', { layerId: id, delta }, { kind: 'data', id }),
    );
  }

  function setSource(id: string, src: DataSource): void {
    data[id] = src;
    bridge(id, src);
  }

  function source(id: string): DataSource | undefined {
    return data[id];
  }

  function layer(id: string): LayerData {
    const existing = data[id];
    if (!existing) {
      const ld = new LayerData();
      setSource(id, ld);
      return ld;
    }
    if (!(existing instanceof LayerData)) {
      throw new Error(
        `CanvasStore.layer('${id}'): a custom DataSource is registered (via setSource) — use store.source('${id}') / store.data['${id}'].`,
      );
    }
    return existing;
  }

  const specs: Record<string, SpecStore> = {};

  // SPEC flush → bus, on its own channel. Kept separate from `data:flush`
  // because that payload is graph-shaped (nodes / edges / groups) while this one
  // is deliberately domain-free — the renderer subscribes here and nowhere else.
  function specsFor<T extends object = object>(id: string): SpecStore<T> {
    const existing = specs[id];
    if (existing) return existing as SpecStore<T>;
    const created = new SpecStore<T>();
    specs[id] = created as SpecStore;
    created.onFlush((delta) =>
      events.emit('specs:flush', { layerId: id, delta }, { kind: 'data', id }),
    );
    return created;
  }

  const actions = createActions(view, layer, events);

  const store: CanvasStore = {
    view,
    data,
    specs,
    events,
    theme,
    setSource,
    source,
    layer,
    specsFor,
    actions,
  };
  // Fire global observers (opt-in) — the one place every store, however its
  // Canvas was constructed, can be instrumented (e.g. Storybook-wide tracing).
  for (const observe of storeObservers) observe(store);
  return store;
}
