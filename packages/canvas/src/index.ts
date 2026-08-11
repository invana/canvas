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

// ─── Store port (kernel reactive-store reads + writes) ───────────────────────
// Re-exported so layers/behaviours can subscribe to `ctx.store.view` slices
// without a direct `@invana/canvas-store` dependency (mirrors the events block).
//
// `createReactiveStore` is also what backs `Layer.state`: there is **one** state
// contract in the repo and it is the kernel's port, so a layer's writes emit
// patches like every other store and history / telemetry / a future CRDT backend
// can observe them. The former `createLayerStore` — a second, raw-zustand
// container — is gone; see
// `docs/rfcs/fix/2026-08-10-zustand-imported-outside-canvas-store.md`.
export {
  select,
  shallowEqual,
  defaultEqual,
  createReactiveStore,
  createMemoryStore,
  type Selected,
  type ReactiveStore,
  type StoreChange,
  type Update,
  type Recipe,
  type DeepPartial,
  type CanvasView,
} from '@invana/canvas-store';

// ─── Spec geometry (P4) ──────────────────────────────────────────────────────
// Picking and bounds computed from a spec, with no backend involved — which is
// what makes hit-testing headlessly testable and identical across renderers.

// The whole spec vocabulary — types *and* the pure geometry over them
// (`containsSpec`, `boundsOfSpec`, `hasSilhouetteFill`, and the per-kind helpers a
// backend needs to draw each silhouette). Exported wholesale because a hand-picked
// subset breaks the moment a backend needs one more entry, and this vocabulary is
// precisely the shared language of kernel, engine, domain package and renderer.
//
// It is *defined* in `@invana/canvas-store` — specs are plain data, so they sit
// with the store that holds them and the index that picks them. Re-exported here
// because every existing consumer imports it from the engine.
export * from '@invana/canvas-store/specs';

// ─── The renderer seam ───────────────────────────────────────────────────────
// `IRenderer` lives here rather than in the kernel because it is made of spec
// vocabulary. The pixi implementation lives in `@invana/renderer-pixijs`; this
// package holds only the contract and the headless double.
// The headless backend (§7) — draws nothing, implements everything. Lets a
// consumer test layouts, picking and projection with no GPU and no DOM.
export {
  HeadlessRenderer,
  HeadlessSurface,
  HeadlessElementRenderer,
} from './renderer/HeadlessRenderer';
export { HeadlessCameraBinding } from './camera/HeadlessCameraBinding';
export type {
  IRenderer,
  RendererCapabilities,
  RendererMountOptions,
} from './renderer/IRenderer';

// ─── Picking (D5) ────────────────────────────────────────────────────────────
// Picking is interaction, not drawing, so the index and the narrow-phase geometry
// live outside any backend. They now sit in the kernel beside the spec vocabulary
// they hit-test — that move is what let this package shed its last third-party
// dependency. A rendering package implements `HitGeometrySource` — the three facts
// a spec can't carry (visual scale, routed polyline, custom-kind silhouette) — and
// the index answers the picks. Re-exported here so `@invana/renderer-pixijs` and
// domain layers keep importing it from the engine.
export { PickingIndex, connectorHitBoxes } from '@invana/canvas-store';
export type {
  ConnectorHitRecord,
  HitGeometrySource,
  HitPolyline,
  PickingCamera,
  PickingIndexOptions,
  ShapeHitRecord,
} from '@invana/canvas-store';

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
// The full device a domain layer drives: spec projection plus the per-frame
// commands and geometry answers it still calls directly. Pixi-free, so
// `@invana/graph` targets a backend it never imports.
export type { IElementRenderer, MountedDecoration, CustomElementCtor } from './renderer/IElementRenderer';
export type {
  ISurface,
  ISurfaceHost,
  SurfaceBackdrop,
  SurfaceOptions,
  SurfaceSpace,
} from './renderer/ISurface';
export type { ElementEventMap } from '@invana/canvas-store';

// ─── Specs as state (P1) ─────────────────────────────────────────────────────
// The durable visual description a layer publishes and a renderer projects.
// Re-exported so domain layers reach it without a direct kernel dependency.
export { SpecStore, type SpecFlush } from '@invana/canvas-store';


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
export type { CameraOptions, CameraTransform, Rect, Point } from './camera/Camera';
export type {
  CameraChangeKind,
  CameraTransformValue,
  ICameraBinding,
} from './camera/ICameraBinding';

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

// ─── Engine-side geometry + time (P6 split) ──────────────────────────────
// Routers, path styles, anchors, path sampling, badge placement and tweens
// answer *geometry* and *timing* questions — a spec goes in, a path or a number
// comes out, with no display object anywhere. §5 requires that such answers not
// need a backend (the same rule that put picking and bounds engine-side), so
// these stay in `@invana/canvas` when `primitives/` leaves for the pixi package
// and a second backend reuses them unchanged.
export {
  centerAnchor,
  boundaryAnchor,
  perpendicularAnchor,
  edgePortAnchor,
  silhouettePortAnchor,
  straightRouter,
  orthRouter,
  manhattanRouter,
  metroRouter,
  erRouter,
  oneSideRouter,
  normalPathStyle,
  roundedPathStyle,
  bezierPathStyle,
  quadraticPathStyle,
  bumpRadialPathStyle,
  bumpHorizontalPathStyle,
  smoothPathStyle,
  stepRadialPathStyle,
  bundlePathStyle,
  loopPolylinePathStyle,
  loopCurvePathStyle,
  LOOP_CURVE_PRESETS,
  samplePath,
  samplePathAt,
  tangentAt,
  pathBounds,
  trimPathEnds,
  distanceToPolylineSq,
  type LoopCurvePresetName,
} from './connectors';

export {
  DEFAULT_ENDPOINT_BADGE_GAP_PX,
  resolveBadgePosition,
  originToBadgeLocal,
  resolveConnectorBadgePosition,
} from './badges';
export type { BadgeOptions, BadgePlacement, NamedBadgePlacement, ConnectorBadgePlacement } from './badges';

export { Tween } from './animation';
export type { TweenOptions } from './animation';

// ─── Animation easings (reusable by layouts / effects / consumers) ────────
export {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuad,
  resolveEasing,
  EASING_NAMES,
} from './animation/easings';
export type { Easing, EasingName } from './animation/easings';

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
