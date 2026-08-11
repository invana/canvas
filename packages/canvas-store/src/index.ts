/**
 * `@invana/canvas-store` — the renderer-free kernel: **state** (the `ReactiveStore`
 * port + view/data stores), **events** (the canvas-wide bus + tap), **telemetry**,
 * **history**, the **spec vocabulary** (what to draw, as plain data), and
 * **picking** (the spatial index over it). The engine (`@invana/canvas`) is a
 * renderer-agnostic orchestrator that writes to this kernel and subscribes to it
 * to render.
 *
 * Program against the {@link ReactiveStore} port, not a backend. zustand is one
 * adapter ({@link createReactiveStore}); {@link createMemoryStore} is a dep-free
 * reference. Telemetry + history hang off the one declarative-patch seam.
 *
 * **The hard rule this package keeps:** it imports no drawing library. Specs
 * describe drawing; they do not perform it.
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

// ── Renderer seam: the device-shaped half only ────────────────────────────────
// `IRenderer` itself lives in `@invana/canvas` — it is made of spec vocabulary,
// which the kernel does not own. See `renderer/IRenderer.ts` for the full note.
export type { RendererBackend } from './renderer/IRenderer';
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
// Metrics adapters (dep-free — inject an OpenTelemetry Meter; it satisfies these).
// Turn the engine's per-frame stream into OTel histograms/counters + gesture spans.
export {
  createFrameMetrics,
  createInteractionTracer,
  createConsoleMeter,
  createHttpMeter,
  type Meter,
  type Histogram,
  type Counter,
  type MetricAttributes,
  type FrameMetricsOptions,
  type InteractionTracerOptions,
  type HttpMeterOptions,
  type HttpMetricRecord,
} from './telemetry/metrics';
// Logging adapters (dep-free — inject a Logger; console default ships built in).
export {
  createLogBridge,
  createConsoleLogger,
  createCollectorLogger,
  type Logger,
  type LogLevel,
  type LogRecord,
  type LogAttributes,
} from './telemetry/logging';
// Unified telemetry config + engine-agnostic wiring (the on/off toggle surface).
export {
  wireTelemetry,
  type CanvasTelemetryConfig,
  type TelemetryTarget,
} from './telemetry/config';

// ── Performance (frame observability contract) ──────────────────────────────────
// Vendor-neutral shape of the engine's per-frame signal (the `render:loop:tick`
// event payload). The engine measures; an app-side adapter maps to OTel.
export type {
  InteractionKind,
  FramePhase,
  FramePhaseTimings,
  FrameTick,
  FrameStats,
} from './perf/frame';

// ── History ───────────────────────────────────────────────────────────────────
export { createHistory, type History } from './history/createHistory';

// ── Actions (named, action-typed command API) ─────────────────────────────────
export { createActions, type CanvasActions } from './actions/createActions';

// ── Kernel façade ─────────────────────────────────────────────────────────────
export {
  createCanvasStore,
  onCanvasStoreCreated,
  type CanvasStore,
  type CanvasStoreObserver,
  type CreateCanvasStoreOptions,
} from './CanvasStore';

// Durable visual description — layers publish, renderers project (P1).
// ── Spec vocabulary + picking ─────────────────────────────────────────────────
// The pixi-free description of what to draw, the pure geometry over it, and the
// spatial index that hit-tests it. All three are drawing-library-free by
// construction, which is what lets picking and bounds be tested headlessly and
// stay identical across backends. `SpecStore` (specs as state) ships with them.
export * from './specs';
export { PickingIndex, connectorHitBoxes } from './hit/PickingIndex';
export type {
  ConnectorHitRecord,
  HitGeometrySource,
  HitPolyline,
  PickingCamera,
  PickingIndexOptions,
  ShapeHitRecord,
} from './hit/PickingIndex';
export { HitIndex, type HitEntry } from './hit/HitIndex';
