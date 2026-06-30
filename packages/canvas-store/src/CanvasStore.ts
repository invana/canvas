import { createActions, type CanvasActions } from './actions/createActions';
import { createReactiveStore } from './adapters/zustand/createReactiveStore';
import { CanvasEventBus } from './events/CanvasEventBus';
import { createMemoryStore } from './port/createMemoryStore';
import { changedPaths } from './port/patch';
import type { ReactiveStore } from './port/types';
import { LayerData } from './data/LayerData';
import type { DataSource } from './data/DataSource';
import { withTelemetry, type TelemetrySink } from './telemetry/withTelemetry';
import { CanvasThemeState } from './theme/CanvasThemeState';
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
  /** Owned data, keyed by **source** id (D13 — each a {@link DataSource}). */
  readonly data: Record<string, DataSource>;
  /** Canvas-wide event bus + tap channel (state:change + data:flush). */
  readonly events: CanvasEventBus;
  /** Resolved-theme channel (`theme.current()` / `theme.set(...)` → `theme:change`). */
  readonly theme: CanvasThemeState;
  /**
   * Register a domain {@link DataSource} under `id` (D13) — e.g. `@invana/graph`'s
   * `GraphStore`. Its {@link DataSource.onFlush} is bridged onto {@link events} as
   * `data:flush`. Replaces any source previously registered (or lazily created) for `id`.
   */
  setSource(id: string, source: DataSource): void;
  /** The {@link DataSource} registered for `id`, or `undefined`. */
  source(id: string): DataSource | undefined;
  /**
   * Get (lazily creating) the **default** {@link LayerData} for `id`; its flush is
   * bridged onto {@link events}. Throws if a non-`LayerData` source was registered
   * for `id` via {@link setSource} — use {@link source} / {@link data} for those.
   */
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
  const theme = new CanvasThemeState(events);

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

  const actions = createActions(view, layer, events);

  return { view, data, events, theme, setSource, source, layer, actions };
}
