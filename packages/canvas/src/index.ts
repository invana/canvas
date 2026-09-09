// @invana/canvas — public API surface
//
// The engine is the **orchestrator**: `Canvas` wires the kernel
// (`@invana/canvas-store`), the contracts + abstracts (`@invana/canvas-core`)
// and a rendering backend (`@invana/renderer-pixijs` by default) together, and
// ships the built-in layers / behaviours and the io (export/import) paths.
//
// Everything a backend implements or an extension package extends lives in
// `@invana/canvas-core` and is **re-exported here wholesale**, so consumers
// keep importing the whole vocabulary from `@invana/canvas` — the package
// split is invisible at the import site.
//
// Architecture: see `architecture-proposal.md` and `docs/renderer-split-design.md`.

// ─── Events (the bus + emitters live in the kernel — @invana/canvas-store) ──
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
} from './engine/assertSerialisable';

// ─── Store port (kernel reactive-store reads + writes) ───────────────────────
// Re-exported so layers/behaviours can subscribe to `ctx.store.view` slices
// without a direct `@invana/canvas-store` dependency (mirrors the events block).
//
// `createReactiveStore` is also what backs `Layer.state`: there is **one** state
// contract in the repo and it is the kernel's port, so a layer's writes emit
// patches like every other store and history / telemetry / a future CRDT backend
// can observe them. See
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

// ─── Spec vocabulary ─────────────────────────────────────────────────────────
// The whole spec vocabulary — types *and* the pure geometry over them. Defined
// in `@invana/canvas-store` (specs are plain data, so they sit with the store
// that holds them and the index that picks them); re-exported here because
// every existing consumer imports it from the engine.
export * from '@invana/canvas-core/specs';

// ─── Contracts + abstracts (@invana/canvas-core) ─────────────────────────────
// The renderer contract (`IRenderer` / `ISurface` / `IElementRenderer` /
// `IOverlayDevice` / `ICameraBinding`), the headless double, the `Layer` /
// `Behaviour` / `Layout` base classes, `CanvasContext`, gesture arbitration,
// `Camera` semantics, the registries, connector geometry, badge placement,
// tweens/easings and the SVG serialisers — all re-exported wholesale so a
// consumer never needs to know which of the two packages a symbol lives in.
export {
  // Headless reference implementation (test double, not a product renderer)
  HeadlessRenderer,
  HeadlessSurface,
  HeadlessElementRenderer,
  HeadlessCameraBinding,
  // Spec projection — drives a renderer from a SpecStore
  SpecProjector,
  // Gesture arbitration (P5)
  DefaultGestureArbiter,
  // Camera — pan/zoom/projection semantics over ICameraBinding
  Camera,
  // Abstracts
  Layer,
  Behaviour,
  Layout,
  animatePositions,
  DEFAULT_POSITION_TRANSITION_MS,
  // Registries
  LayerRegistry,
  BehaviourRegistry,
  LayoutRegistry,
  // Connector geometry — anchors, routers, path styles, sampling
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
  // Badge placement
  DEFAULT_ENDPOINT_BADGE_GAP_PX,
  resolveBadgePosition,
  originToBadgeLocal,
  resolveConnectorBadgePosition,
  // Animation
  Tween,
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuad,
  resolveEasing,
  EASING_NAMES,
} from '@invana/canvas-core';
export type {
  IRenderer,
  RendererCapabilities,
  RendererMountOptions,
  RenderPreference,
  ISurface,
  ISurfaceHost,
  SurfaceBackdrop,
  SurfaceOptions,
  SurfaceSpace,
  IElementRenderer,
  MountedDecoration,
  CustomElementCtor,
  IOverlayDevice,
  OverlayFill,
  OverlayFillLike,
  OverlayStroke,
  OverlaySpace,
  SpecProjectionTarget,
  SpecProjectorOptions,
  ICameraBinding,
  CameraChangeKind,
  CameraTransformValue,
  GestureArbiter,
  GestureClaimOptions,
  CameraOptions,
  CameraTransform,
  CameraInputConfig,
  CameraInputModifier,
  WheelInputOptions,
  PinchInputOptions,
  // (`Point` / `Rect` arrive via the specs star below — one route per name)
  CanvasContext,
  ILayer,
  LayerOptions,
  IBehaviour,
  BehaviourOptions,
  LayoutEvents,
  LayoutEndReason,
  LayoutOptions,
  PositionTransition,
  PositionTransitionOptions,
  LayerRegistryOptions,
  BehaviourRegistryOptions,
  LayoutRegistryOptions,
  LoopCurvePresetName,
  BadgeOptions,
  BadgePlacement,
  NamedBadgePlacement,
  ConnectorBadgePlacement,
  TweenOptions,
  Easing,
  EasingName,
} from '@invana/canvas-core';

// ─── Picking (D5) ────────────────────────────────────────────────────────────
// Picking is interaction, not drawing, so the index and the narrow-phase
// geometry live in the kernel beside the spec vocabulary they hit-test.
// Re-exported here so `@invana/renderer-pixijs` and domain layers keep
// importing it from the engine.
export { PickingIndex, connectorHitBoxes } from '@invana/canvas-store';
export type {
  ConnectorHitRecord,
  HitGeometrySource,
  HitPolyline,
  PickingCamera,
  PickingIndexOptions,
  ShapeHitRecord,
} from '@invana/canvas-store';

// ─── Specs as state (P1) ─────────────────────────────────────────────────────
export { SpecStore, type SpecFlush } from '@invana/canvas-store';
export type { ElementEventMap } from '@invana/canvas-store';

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
// `new Canvas({ telemetry })` consumers can pick a sink without a direct
// `@invana/canvas-store` dependency.
export {
  createConsoleMeter,
  createHttpMeter,
  type CanvasTelemetryConfig,
  type Meter,
  type HttpMeterOptions,
  type HttpMetricRecord,
} from '@invana/canvas-store';

// ─── Theme signal (kernel-canonical) ────────────────────────────────────────
// The engine's duplicate `theme/` module was deleted — the kernel's is the one
// definition (it also carries `ThemeKind` / `ThemeMode`).
export type { ResolvedTheme, ThemeState, ThemeKind, ThemeMode } from '@invana/canvas-store';
export { CanvasThemeState } from '@invana/canvas-store';

// ─── Built-in layers ─────────────────────────────────────────────────────────
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

// ─── Built-in behaviours ─────────────────────────────────────────────────────
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

// ─── io: export / import ─────────────────────────────────────────────────────
// Raster export (viewport / whole-diagram → PNG / JPEG / WebP). `Canvas.export`
// / `Canvas.exportDataURL` delegate here; the standalone functions are exported
// for callers holding a bare `Canvas` in a util.
export { exportImage, exportImageDataURL } from './io/imageExport';
export type {
  ExportImageOptions,
  ExportRasterFormat,
  ExportArea,
  ExportBackground,
} from './io/imageExport';

// True vector SVG export — `exportSVG` assembles the document; the per-spec
// serialisers live in `@invana/canvas-core` and are re-exported for advanced
// callers.
export {
  exportSVG,
  shapeSpecToSvg,
  connectorToSvg,
  pathToSvgD,
} from './io/svgExport';
export type { ExportSvgOptions, SvgExportableLayer } from './io/svgExport';

// Full-state JSON export/import — serialise the canvas's view definition +
// interaction + per-layer data to a plain document and restore it.
export {
  exportCanvasState,
  importCanvasState,
  canvasStateToJSON,
  downloadCanvasState,
  importCanvasStateFromFile,
  jsonSafe,
  CANVAS_STATE_VERSION,
} from './io/stateExport';
export type {
  CanvasStateSnapshot,
  CanvasInteractionSnapshot,
  CanvasStateSource,
  ImportCanvasStateOptions,
  DataSerializableLayer,
  DefinitionSerializable,
} from './io/stateExport';
