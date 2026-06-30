import { createActions, type CanvasActions } from './actions/createActions';
import { createReactiveStore } from './adapters/zustand/createReactiveStore';
import { CanvasEventBus } from './events/CanvasEventBus';
import { createMemoryStore } from './port/createMemoryStore';
import { changedPaths } from './port/patch';
import type { ReactiveStore } from './port/types';
import { LayerData } from './data/LayerData';
import { withTelemetry, type TelemetrySink } from './telemetry/withTelemetry';
import { defaultCanvasView, type CanvasView } from './view/CanvasView';

/**
 * `CanvasStore` — the renderer-free kernel, one per `Canvas`. The single hub the
 * engine writes to *and* subscribes from:
 *
 * - {@link view} — reactive `ReactiveStore<CanvasView>` (config + interaction state).
 * - {@link data} — owned, keyed `LayerData` stores (the bulk graph; typed-array later).
 * - {@link events} — the canvas-wide `CanvasEventBus` (tap channel for telemetry /
 *   collaboration).
 *
 * **Every** update is bridged onto the bus, so one `events.tap(…)` / `events.on(…)`
 * sees the whole loop: `view` mutations → `state:change`; each layer's data flush →
 * `data:flush`. The engine wires pixi input events onto this same bus.
 */
export interface CanvasStore {
  /** Reactive config + interaction store (layers/behaviours/layouts settings, interaction). */
  readonly view: ReactiveStore<CanvasView>;
  /** Owned data, keyed by **layer** id. Prefer {@link layer} for lazy access. */
  readonly data: Record<string, LayerData>;
  /** Canvas-wide event bus + tap channel (state:change + data:flush). */
  readonly events: CanvasEventBus;
  /** Get (lazily creating) the {@link LayerData} for layer `id`; its flush is bridged onto {@link events}. */
  layer(id: string): LayerData;
  /** Named, action-typed command API (`actions.layers.setStyle`, `actions.camera.zoom`, …). */
  readonly actions: CanvasActions;
}

export interface CreateCanvasStoreOptions {
  /** Attach a telemetry sink to the view store (one event per `update`). */
  telemetry?: TelemetrySink;
  /** View-store backend. Default `'zustand'`; `'memory'` is dependency-free. */
  backend?: 'zustand' | 'memory';
}

/** Create a fresh {@link CanvasStore}. */
export function createCanvasStore(opts: CreateCanvasStoreOptions = {}): CanvasStore {
  const view =
    opts.backend === 'memory'
      ? createMemoryStore<CanvasView>(defaultCanvasView())
      : createReactiveStore<CanvasView>(defaultCanvasView());

  const events = new CanvasEventBus();

  // VIEW mutations → bus. Always the coarse `state:change` (for "anything changed"
  // subscribers), PLUS — when the action is a taxonomy type (`<domain>:<subject>:<action>`,
  // e.g. 'view:layer:setStyle') — the granular event on the tap for telemetry / query.
  view.subscribeChanges((change) => {
    const paths = changedPaths(change.patches);
    events.emit('state:change', { action: change.action, changedPaths: paths }, { kind: 'store', id: 'view' });
    if (change.action && change.action.includes(':')) {
      events.publish(change.action, { action: change.action, changedPaths: paths }, { kind: 'store', id: 'view' });
    }
  });

  if (opts.telemetry) withTelemetry(view, opts.telemetry);

  const data: Record<string, LayerData> = {};

  function layer(id: string): LayerData {
    let store = data[id];
    if (!store) {
      store = new LayerData();
      // DATA flush → bus (same channel as state:change), so the canvas subscribes once.
      store.on('flush', (delta) => events.emit('data:flush', { layerId: id, delta }, { kind: 'data', id }));
      data[id] = store;
    }
    return store;
  }

  const actions = createActions(view, layer, events);

  return { view, data, events, layer, actions };
}
