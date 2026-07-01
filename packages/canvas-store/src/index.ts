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

// ── Geometry vocabulary ─────────────────────────────────────────────────────────
export type { Point, Vec2, Size, Rect, CameraTransform } from './geom/types';

// ── View (state) ──────────────────────────────────────────────────────────────
export { defaultCanvasView, type CanvasView, type CanvasSceneOptions } from './view/CanvasView';

// ── Data (state) ──────────────────────────────────────────────────────────────
export { scheduleFlush, type FlushMode } from './data/flush';
export {
  LayerData,
  NODE_FLAG,
  type NodeRecord,
  type EdgeRecord,
  type GroupRecord,
  type AnnotationRecord,
  type LayerFlush,
  type NodeDelta,
  type KindDelta,
  type GraphInput,
  type PosSchema,
  type QueryStatus,
  type IntentLogEntry,
} from './data/LayerData';
// Typed-array hot lane + dirty batching (relocated from the engine — decision D1).
export {
  ColumnStore,
  type ColumnType,
  type ColumnSchema,
  type ColumnArray,
  type ColumnValue,
  type RowOf,
  type ColumnStoreOptions,
} from './data/ColumnStore';
export { DirtyBatcher, type DirtySnapshot } from './data/DirtyBatcher';
export type { DataSource } from './data/DataSource';

// ── Renderer seam (types only — implemented by a rendering package, e.g. @invana/renderer-pixijs) ──
export type { IRenderer, RendererBackend } from './renderer/IRenderer';
export type { RendererInitOptions } from './renderer/RendererInitOptions';

// ── Events ────────────────────────────────────────────────────────────────────
export { EventEmitter, type Listener, type EventMap } from './events/EventEmitter';
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

// ── Theme (resolved-theme state) ────────────────────────────────────────────────
export type { ResolvedTheme, ThemeState, ThemeMode, ThemeKind } from './theme/types';
export { CanvasThemeState } from './theme/CanvasThemeState';

// ── Telemetry ─────────────────────────────────────────────────────────────────
export {
  withTelemetry,
  NoopSink,
  type TelemetrySink,
  type TelemetryEvent,
} from './telemetry/withTelemetry';
// Tracing adapters (dep-free — inject an OpenTelemetry Tracer; it satisfies these).
export {
  createTracingSink,
  createTapTracer,
  tapAttributes,
  traceActions,
  createConsoleTracer,
  createCollectorTracer,
  type Tracer,
  type TraceSpan,
  type SpanAttributes,
  type SpanAttrValue,
  type CollectedSpan,
} from './telemetry/tracing';

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
