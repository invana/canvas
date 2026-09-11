/**
 * `@invana/canvas-store` — the **state machinery** of the canvas: the
 * immer-backed `ReactiveStore` engine + its adapters (zustand today, Yjs
 * later), history/undo, picking (the rbush spatial index), telemetry, and the
 * `createCanvasStore` factory that assembles the per-canvas
 * `CanvasStore { view, data, events }` hub.
 *
 * The **vocabulary** — spec types, pure geometry, the event bus + emitter
 * classes, the theme signal, the data primitives, and the `ReactiveStore`
 * *contract* — lives one floor below in `@invana/canvas-core` (dependency-free)
 * and is re-exported here so existing kernel consumers keep working unchanged.
 *
 * **The hard rule this package keeps:** it is the only home of the state
 * libraries — `zustand` and `immer` (and `rbush` for picking) are imported
 * here and nowhere else. Program against the port, never a backend.
 */

// ─── Vocabulary re-exports (defined in @invana/canvas-core) ───────────────────
// Port contract
export type {
  ReactiveStore,
  Update,
  Recipe,
  DeepPartial,
  StoreChange,
  StateCell,
  Patch,
} from '@invana/canvas-core';
export { select, shallowEqual, defaultEqual, type Selected } from '@invana/canvas-core';
// Geometry vocabulary — `Point`/`Vec2`/`Size`/`Rect` arrive via the specs star
// below (one route per name); `CameraTransform` is not in the vocabulary star.
export type { CameraTransform } from '@invana/canvas-core';
// View state shape + named command API
export {
  defaultCanvasView,
  type CanvasView,
  type CanvasSceneOptions,
  createActions,
  type CanvasActions,
} from '@invana/canvas-core';
// Data primitives
export {
  scheduleFlush,
  type FlushMode,
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
  ColumnStore,
  type ColumnType,
  type ColumnSchema,
  type ColumnArray,
  type ColumnValue,
  type RowOf,
  type ColumnStoreOptions,
  DirtyBatcher,
  type DirtySnapshot,
  type DataSource,
} from '@invana/canvas-core';
// Renderer seam (device-shaped half)
export type { RendererBackend, RendererInitOptions } from '@invana/canvas-core';
// Events
export {
  EventEmitter,
  type Listener,
  type EventMap,
  type CanvasEvent,
  type EventSource,
  type EventSourceKind,
  CANVAS_SOURCE,
  CanvasEventBus,
  type CanvasGlobalEvents,
  type Tap,
  type TapOptions,
  SourceEmitter,
} from '@invana/canvas-core';
// Theme
export {
  CanvasThemeState,
  type ResolvedTheme,
  type ThemeState,
  type ThemeMode,
  type ThemeKind,
  INHERIT,
  isInherit,
  resolveThemed,
  type Inherit,
  type Themed,
} from '@invana/canvas-core';
// Frame observability contract
export type {
  InteractionKind,
  FramePhase,
  FramePhaseTimings,
  FrameTick,
  FrameStats,
} from '@invana/canvas-core';
// The whole spec vocabulary (types + pure geometry + SpecStore)
export * from '@invana/canvas-core/specs';

// ─── The store engine (immer patch machinery + adapters) ─────────────────────
export { computeChange, applyDeepPartial, changedPaths } from './port/patch';
export { createStoreFromCell } from './port/store-core';
export { createReactiveStore } from './adapters/zustand';
export { createMemoryStore } from './port/createMemoryStore';

// ─── History ──────────────────────────────────────────────────────────────────
export { createHistory, type History } from './port/createHistory';

// ─── Picking (rbush spatial index + narrow phase over core's geometry) ────────
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

// ─── Telemetry ────────────────────────────────────────────────────────────────
export {
  withTelemetry,
  NoopSink,
  type TelemetrySink,
  type TelemetryEvent,
} from './telemetry/withTelemetry';
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
export {
  createLogBridge,
  createConsoleLogger,
  createCollectorLogger,
  type Logger,
  type LogLevel,
  type LogRecord,
  type LogAttributes,
} from './telemetry/logging';
export {
  wireTelemetry,
  type CanvasTelemetryConfig,
  type TelemetryTarget,
} from './telemetry/config';

// ─── Kernel façade ────────────────────────────────────────────────────────────
export {
  createCanvasStore,
  onCanvasStoreCreated,
  type CanvasStore,
  type CanvasStoreObserver,
  type CreateCanvasStoreOptions,
} from './CanvasStore';
