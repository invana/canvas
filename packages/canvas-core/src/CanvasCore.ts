import { createReactiveStore } from './adapters/zustand/createReactiveStore';
import { CanvasEventBus } from './events/CanvasEventBus';
import { createMemoryStore } from './port/createMemoryStore';
import { changedPaths } from './port/patch';
import type { ReactiveStore } from './port/types';
import { DataStore, type Record_ } from './data/DataStore';
import { withTelemetry, type TelemetrySink } from './telemetry/withTelemetry';
import { defaultCanvasView, type CanvasView } from './view/CanvasView';

/**
 * `CanvasCore` — the renderer-free kernel, one per `Canvas`. The single hub the
 * engine writes to *and* subscribes from:
 *
 * - {@link view} — reactive `ReactiveStore<CanvasView>` (config + interaction state).
 * - {@link data} — owned, keyed `DataStore`s (the bulk graph; typed-array later).
 * - {@link events} — the canvas-wide `CanvasEventBus` (tap channel for telemetry /
 *   collaboration). The engine feeds pixi input events into this; layers subscribe
 *   to it (and to `view`/`data`) to render.
 *
 * State changes are **bridged onto the bus** (`state:change`), so one `events.tap(…)`
 * sees the whole loop — input → state change → render.
 */
export interface CanvasCore {
  /** Reactive config + interaction store. */
  readonly view: ReactiveStore<CanvasView>;
  /** Owned data sources keyed by source id. Prefer {@link source} for lazy access. */
  readonly data: Record<string, DataStore>;
  /** Canvas-wide event bus + tap channel. */
  readonly events: CanvasEventBus;
  /** Get (lazily creating) the data source for `id`. */
  source<R extends Record_ = Record_>(id: string): DataStore<R>;
}

export interface CreateCanvasCoreOptions {
  /** Attach a telemetry sink to the view store (one event per `update`). */
  telemetry?: TelemetrySink;
  /** View-store backend. Default `'zustand'`; `'memory'` is dependency-free. */
  backend?: 'zustand' | 'memory';
}

/** Create a fresh {@link CanvasCore}. */
export function createCanvasCore(opts: CreateCanvasCoreOptions = {}): CanvasCore {
  const view =
    opts.backend === 'memory'
      ? createMemoryStore<CanvasView>(defaultCanvasView())
      : createReactiveStore<CanvasView>(defaultCanvasView());

  const events = new CanvasEventBus();

  // Bridge state changes onto the bus so the tap sees state mutations alongside
  // input/lifecycle/render events (one stream → telemetry + collaboration).
  view.subscribeChanges((change) => {
    events.emit(
      'state:change',
      { action: change.action, changedPaths: changedPaths(change.patches) },
      { kind: 'store', id: 'view' },
    );
  });

  if (opts.telemetry) withTelemetry(view, opts.telemetry);

  const data: Record<string, DataStore> = {};

  return {
    view,
    data,
    events,
    source<R extends Record_ = Record_>(id: string): DataStore<R> {
      let store = data[id] as DataStore<R> | undefined;
      if (!store) {
        store = new DataStore<R>();
        data[id] = store as unknown as DataStore;
      }
      return store;
    },
  };
}
