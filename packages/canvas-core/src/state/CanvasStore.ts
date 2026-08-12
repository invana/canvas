/**
 * `CanvasStore` — the **contract** of the renderer-free store, one per `Canvas`.
 * The single hub the engine writes to *and* subscribes from:
 *
 * - {@link CanvasStore.view} — reactive `ReactiveStore<CanvasView>` (config + interaction state).
 * - {@link CanvasStore.data} — owned, keyed `LayerData` stores (the bulk graph).
 * - {@link CanvasStore.events} — the canvas-wide `CanvasEventBus` (tap channel for
 *   telemetry / collaboration).
 *
 * The **implementation** (`createCanvasStore` — the zustand/immer-backed factory,
 * the state↔bus bridges, telemetry wiring) lives in `@invana/canvas-store`; this
 * package holds only the shape, so contracts and abstracts (`CanvasContext`,
 * `Camera`) can type against the store without depending on the machinery.
 */

import type { CanvasEventBus } from './events/CanvasEventBus';
import type { CanvasThemeState } from './theme/CanvasThemeState';
import type { DataSource } from './data/DataSource';
import type { LayerData } from './data/LayerData';
import type { ReactiveStore } from './port/types';
import type { SpecStore } from '../specs/SpecStore';
import type { CanvasActions } from './view/createActions';
import type { CanvasView } from './view/CanvasView';

export interface CanvasStore {
  /** Reactive config + interaction store (layers/behaviours/layouts settings, interaction). */
  readonly view: ReactiveStore<CanvasView>;
  /** Owned data, keyed by **source** id (D13 — each a {@link DataSource}). */
  readonly data: Record<string, DataSource>;
  /**
   * Owned **spec** collections, keyed by layer id — the durable visual
   * description each renderer projects. Populated via {@link specsFor}.
   */
  readonly specs: Record<string, SpecStore>;
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
  /**
   * Get (lazily creating) the {@link SpecStore} for layer `id`; its flush is
   * bridged onto {@link events} as `specs:flush`.
   */
  specsFor<T extends object = object>(id: string): SpecStore<T>;
  /** Named, action-typed command API (`actions.layers.setStyle`, `actions.camera.zoom`, …). */
  readonly actions: CanvasActions;
}
