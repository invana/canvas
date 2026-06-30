/**
 * `@invana/canvas-store` — the renderer-free kernel: **state** (the `ReactiveStore`
 * port + view/data stores), **events** (the canvas-wide bus + tap), **telemetry**,
 * and **history**. The engine (`@invana/canvas`) is a pixi renderer that writes to
 * this kernel and subscribes to it to render.
 *
 * Program against the {@link ReactiveStore} port, not a backend. zustand is one
 * adapter ({@link createReactiveStore}); {@link createMemoryStore} is a dep-free
 * reference. Telemetry + history hang off the one declarative-patch seam.
 */

// ── Port ──────────────────────────────────────────────────────────────────────
export type {
  ReactiveStore,
  Update,
  Recipe,
  DeepPartial,
  StoreChange,
  StateCell,
} from './port/types';
export { select, shallowEqual, defaultEqual, type Selected } from './port/select';
export { computeChange, applyDeepPartial, changedPaths } from './port/patch';
export { createStoreFromCell } from './port/store-core';

// ── Adapters ──────────────────────────────────────────────────────────────────
export { createReactiveStore } from './adapters/zustand/createReactiveStore';
export { createMemoryStore } from './port/createMemoryStore';

// ── View (state) ──────────────────────────────────────────────────────────────
export { defaultCanvasView, type CanvasView } from './view/CanvasView';

// ── Data (state) ──────────────────────────────────────────────────────────────
export { DataStore, type FlushEvent, type Record_ } from './data/DataStore';
export { scheduleFlush, type FlushMode } from './data/flush';
export {
  LayerData,
  type NodeRecord,
  type EdgeRecord,
  type GroupRecord,
  type AnnotationRecord,
  type LayerFlush,
  type NodeDelta,
  type KindDelta,
  type GraphInput,
} from './data/LayerData';

// ── Events ────────────────────────────────────────────────────────────────────
export { EventEmitter, type Listener } from './events/EventEmitter';
export {
  type CanvasEvent,
  type EventSource,
  type EventSourceKind,
  CANVAS_SOURCE,
} from './events/CanvasEvent';
export {
  CanvasEventBus,
  type CanvasGlobalEvents,
  type Tap,
  type TapOptions,
} from './events/CanvasEventBus';
export { SourceEmitter } from './events/SourceEmitter';

// ── Telemetry ─────────────────────────────────────────────────────────────────
export {
  withTelemetry,
  NoopSink,
  type TelemetrySink,
  type TelemetryEvent,
} from './telemetry/withTelemetry';

// ── History ───────────────────────────────────────────────────────────────────
export { createHistory, type History } from './history/createHistory';

// ── Actions (named, action-typed command API) ─────────────────────────────────
export { createActions, type CanvasActions } from './actions/createActions';

// ── Kernel façade ─────────────────────────────────────────────────────────────
export {
  createCanvasStore,
  type CanvasStore,
  type CreateCanvasStoreOptions,
} from './CanvasStore';
