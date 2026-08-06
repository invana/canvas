// @invana/canvas — public API surface
//
// Architecture: see `architecture-proposal.md` (long-term vision),
// `primitives-redesign-plan.md` (macro renderer redesign), and
// `primitives-v0-plan.md` (this v0 slice) at the repo root.

// ─── Events (the bus + emitters now live in the kernel — @invana/canvas-store) ──
// The engine converged onto the single kernel bus (`store.events`); its own
// duplicate event module was deleted. These re-exports keep the public surface
// (`@invana/canvas`'s `EventEmitter` / `CanvasEventBus` / `CanvasGlobalEvents` …)
// stable for consumers (graph, canvas-react).
export {
  EventEmitter,
  SourceEmitter,
  CanvasEventBus,
  type Listener,
  type EventMap,
  type CanvasEvent,
  type EventSource,
  type EventSourceKind,
  type CanvasGlobalEvents,
  type Tap,
  type TapOptions,
} from '@invana/canvas-store';

export {
  assertSerialisableInDev,
  findSerialisationViolations,
} from './events/assertSerialisable';

// ─── Store port (kernel reactive-store reads) ────────────────────────────────
// Re-exported so layers/behaviours can subscribe to `ctx.store.view` slices
// without a direct `@invana/canvas-store` dependency (mirrors the events block).
export {
  select,
  shallowEqual,
  defaultEqual,
  type Selected,
  type ReactiveStore,
  type CanvasView,
} from '@invana/canvas-store';

// ─── Spec geometry (P4) ──────────────────────────────────────────────────────
// Picking and bounds computed from a spec, with no backend involved — which is
// what makes hit-testing headlessly testable and identical across renderers.
export {
  containsSpec,
  boundsOfSpec,
  scaleSpec,
  collapsedSpec,
  fitSpecToContent,
  strokeBandOf,
  tabbedRectOutline,
  tabbedRectFoldLine,
} from './specs/shapeGeometry';
// Lives with the fill vocabulary rather than the geometry — a spec with no
// silhouette fill is hollow, and picking honours that.
export { hasSilhouetteFill } from './specs/style';
export type { ShapeSpec } from './specs';

// ─── Gesture arbitration (P5) ────────────────────────────────────────────────
// One gesture owns the pointer at a time; camera behaviours yield to it. This
// replaces behaviours reaching into pixi-viewport's plugin registry to pause it.
export { DefaultGestureArbiter } from './input/GestureArbiter';
export type { GestureArbiter, GestureClaimOptions } from './input/GestureArbiter';
export type {
  CameraInputConfig,
  CameraInputModifier,
  WheelInputOptions,
  PinchInputOptions,
} from './camera/Camera';

// ─── Transient overlays (P3) ─────────────────────────────────────────────────
// Immediate-mode drawing for gesture visuals that must never become state.
export type { IOverlayDevice, OverlayFill, OverlayFillLike, OverlayStroke, OverlaySpace } from './renderer/IOverlayDevice';

// ─── Spec projection (P2) ────────────────────────────────────────────────────
// Drives a renderer from a SpecStore. Every drawing layer uses this, so
// "the renderer is a projection of state" holds engine-wide.
export { SpecProjector } from './renderer/SpecProjector';
export type { SpecProjectionTarget, SpecProjectorOptions } from './renderer/SpecProjector';

// ─── Specs as state (P1) ─────────────────────────────────────────────────────
// The durable visual description a layer publishes and a renderer projects.
// Re-exported so domain layers reach it without a direct kernel dependency.
export { SpecStore, type SpecFlush } from '@invana/canvas-store';

// ─── State ──────────────────────────────────────────────────────────────
export { createLayerStore } from './state/Store';
export type { Store, StoreApi, CreateLayerStoreOptions } from './state/Store';

// `ColumnStore` + `DirtyBatcher` are owned by the renderer-free kernel
// (`@invana/canvas-store`, decision D1). Re-exported here for back-compat so
// existing `@invana/canvas` importers (e.g. `@invana/graph`'s `GraphStore`)
// keep working unchanged.
export {
  ColumnStore,
  DirtyBatcher,
  type ColumnType,
  type ColumnSchema,
  type ColumnValue,
  type ColumnArray,
  type RowOf,
  type ColumnStoreOptions,
  type DirtySnapshot,
  // Data-source contract + flush types — so domain stores (e.g. `@invana/graph`'s
  // `GraphStore`) can `implements DataSource` and register via `CanvasStore.setSource` (D13).
  type DataSource,
  type FlushMode,
  type LayerFlush,
  type NodeDelta,
  type KindDelta,
} from '@invana/canvas-store';

// Telemetry config + dep-free reference meters (kernel-owned). Re-exported so
// `new Canvas({ telemetry })` consumers can pick a sink (console for a quick
// debug view, HTTP for a local collector) without a direct
// `@invana/canvas-store` dependency. A real OTLP meter comes from the opt-in
// `@invana/canvas-telemetry-otel` package.
export {
  createConsoleMeter,
  createHttpMeter,
  type CanvasTelemetryConfig,
  type Meter,
  type HttpMeterOptions,
  type HttpMetricRecord,
} from '@invana/canvas-store';

// ─── Camera ─────────────────────────────────────────────────────────────
export { Camera } from './camera/Camera';
export type { CameraOptions, Rect, Point } from './camera/Camera';

// ─── Context ────────────────────────────────────────────────────────────
export type { CanvasContext } from './context/CanvasContext';

// ─── Theme signal ───────────────────────────────────────────────────────
export type { ResolvedTheme, ThemeState } from './theme/types';
export { CanvasThemeState } from './theme/CanvasThemeState';

// ─── Layers ─────────────────────────────────────────────────────────────
export { Layer } from './layers/Layer';
export type { ILayer, LayerOptions } from './layers/Layer';

export { WorldLayer } from './layers/WorldLayer';
export type { WorldLayerHit } from './layers/WorldLayer';

export { ScreenLayer } from './layers/ScreenLayer';
export type { ScreenLayerHit } from './layers/ScreenLayer';

export { DevInfoLayer } from './layers/DevInfoLayer';
export type {
  DevInfoLayerOptions,
  DevInfoLayerCtorOptions,
  DevInfoCorner,
} from './layers/DevInfoLayer';

export { BackgroundLayer } from './layers/BackgroundLayer';
export type {
  BackgroundLayerOptions,
  BackgroundType,
  BackgroundPatternType,
  BackgroundMode,
  BackgroundKind,
  BackgroundColor,
} from './layers/BackgroundLayer';

export { LayersPanelLayer } from './layers/LayersPanelLayer';
export type {
  LayersPanelLayerOptions,
  LayersPanelLayerCtorOptions,
  LayersPanelCorner,
} from './layers/LayersPanelLayer';

// ─── Behaviours ─────────────────────────────────────────────────────────
export { Behaviour } from './behaviours/Behaviour';
export type { IBehaviour, BehaviourOptions } from './behaviours/Behaviour';

export { DragPanBehaviour } from './behaviours/DragPanBehaviour';
export type { DragPanBehaviourOptions, DragModifier } from './behaviours/DragPanBehaviour';

export { DragShapeBehaviour } from './behaviours/DragShapeBehaviour';
export type { DragShapeBehaviourOptions } from './behaviours/DragShapeBehaviour';

export { WheelZoomBehaviour } from './behaviours/WheelZoomBehaviour';
export type { WheelZoomBehaviourOptions } from './behaviours/WheelZoomBehaviour';

export { PinchZoomBehaviour } from './behaviours/PinchZoomBehaviour';
export type { PinchZoomBehaviourOptions } from './behaviours/PinchZoomBehaviour';

export { KeyboardCameraInputBehaviour } from './behaviours/KeyboardCameraInputBehaviour';
export type {
  KeyboardCameraInputBehaviourOptions,
  KeyboardCameraKeymap,
} from './behaviours/KeyboardCameraInputBehaviour';

export {
  ElementScaleLODBehaviour,
  resolveNumberOrGetter,
} from './behaviours/ElementScaleLODBehaviour';
export type {
  ElementScaleLODBehaviourOptions,
  NumberOrGetter,
} from './behaviours/ElementScaleLODBehaviour';

// ─── Layouts ────────────────────────────────────────────────────────────
export { Layout } from './layouts/Layout';
export type { LayoutEvents, LayoutEndReason, LayoutOptions } from './layouts/Layout';

export { animatePositions, DEFAULT_POSITION_TRANSITION_MS } from './layouts/animatePositions';
export type { PositionTransition, PositionTransitionOptions } from './layouts/animatePositions';

// ─── Animation easings (reusable by layouts / effects / consumers) ────────
export {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuad,
  resolveEasing,
  EASING_NAMES,
} from './primitives/animation/easings';
export type { Easing, EasingName } from './primitives/animation/easings';

// ─── Registries ─────────────────────────────────────────────────────────
export { LayerRegistry } from './registries/LayerRegistry';
export type { LayerRegistryOptions } from './registries/LayerRegistry';

export { BehaviourRegistry } from './registries/BehaviourRegistry';
export type { BehaviourRegistryOptions } from './registries/BehaviourRegistry';

export { LayoutRegistry } from './registries/LayoutRegistry';
export type { LayoutRegistryOptions } from './registries/LayoutRegistry';

// ─── Engine ─────────────────────────────────────────────────────────────
export { Canvas } from './engine/Canvas';
export type { CanvasOptions } from './engine/Canvas';
// Frame-performance recorder exposed via `canvas.frames`. Frame data *types*
// (`FrameTick` / `FrameStats` / `InteractionKind`) come from `@invana/canvas-store`.
export { FrameMeter } from './engine/FrameMeter';
export { InteractionTracker } from './engine/InteractionTracker';
export type { CanvasConfig } from './engine/CanvasConfig';
// The config-merge the engine itself uses for `update()` — exported so consumers
// building config (deep-merging defaults under overrides) merge identically.
export { deepMerge } from './engine/CanvasConfig';

// Renderer backend capability detection (WebGPU/WebGL support).
export {
  hasWebGPUApi,
  hasWebGL,
  canUseWebGPU,
  resolveRenderPreference,
  bestRenderPreference,
} from './engine/rendererSupport';
export type { RenderPreference } from './engine/rendererSupport';

// Raster export (viewport / whole-diagram → PNG / JPEG / WebP). `Canvas.export`
// / `Canvas.exportDataURL` delegate here; the standalone functions are exported
// for callers holding a bare `Canvas` in a util.
export { exportImage, exportImageDataURL } from './export/imageExport';
export type {
  ExportImageOptions,
  ExportRasterFormat,
  ExportArea,
  ExportBackground,
} from './export/imageExport';

// True vector SVG export — a second projection of the scene into scalable
// markup. `Canvas.exportSVGString` / `Canvas.export({ format: 'svg' })` delegate
// to `exportSVG`; the per-spec serialisers are exported for advanced callers.
export {
  exportSVG,
  shapeSpecToSvg,
  connectorToSvg,
  pathToSvgD,
} from './export/svgExport';
export type { ExportSvgOptions, SvgExportableLayer } from './export/svgExport';

// Full-state JSON export/import — serialise the canvas's view definition +
// interaction + per-layer data to a plain document and restore it. `Canvas.
// exportState` / `Canvas.importState` delegate here; the standalone functions
// are exported for callers holding a bare `Canvas` in a util.
export {
  exportCanvasState,
  importCanvasState,
  canvasStateToJSON,
  downloadCanvasState,
  importCanvasStateFromFile,
  jsonSafe,
  CANVAS_STATE_VERSION,
} from './export/stateExport';
export type {
  CanvasStateSnapshot,
  CanvasInteractionSnapshot,
  CanvasStateSource,
  ImportCanvasStateOptions,
  DataSerializableLayer,
  DefinitionSerializable,
} from './export/stateExport';

// ─── Primitives (renderer + base classes + built-ins + types) ──────────
//
// The full primitives surface is also available via the `@invana/canvas/primitives`
// subpath export for finer-grained imports / tree-shaking.
export * from './primitives';

// ─── Infra services (used by primitives) ───────────────────────────────
export { TextureRegistry } from './textures/TextureRegistry';

// ─── Font helpers ─────────────────────────────────────────────────────
export { loadIconFont } from './fonts/loadIconFont';

// ─── Pixi re-export for paint callbacks ────────────────────────────────
//
// `Graphics` is re-exported so consumers writing `paint(g => ...)` style
// callbacks can type the parameter without a raw `pixi.js` import.
export type { Graphics } from 'pixi.js';
