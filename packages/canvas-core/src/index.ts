// @invana/canvas-core — the contracts + abstracts of the canvas engine.
//
// What lives here is exactly the surface a package that is *not* the engine
// programs against:
//   - a rendering backend (`@invana/renderer-pixijs`, a future
//     `@invana/renderer-threejs`) **implements** `contracts/`;
//   - an extension package (`@invana/graph`, `graph-layout-*`, `graph-layer-*`)
//     **extends** `abstracts/` (Layer / Behaviour / Layout) and calls the pure
//     geometry, animation and svg helpers;
//   - `@invana/canvas` — the orchestrator — wires both sides together.
//
// **Depends on nothing** — no workspace package, no third-party library, not
// even at the type level. This is the floor of the stack: `@invana/canvas-store`
// (the state machinery) and `@invana/canvas` (the orchestrator) both build on
// it, never the reverse. It also owns the whole *vocabulary*: the spec types
// describing shapes/connectors/decorations/effects, the pure geometry over
// them, the event bus + emitters, the theme signal, the data primitives, and
// the `ReactiveStore` port contract the store machinery implements.

// ─── Contracts: what a rendering backend implements ──────────────────────────
export type {
  IRenderer,
  RendererCapabilities,
  RendererMountOptions,
} from './contracts/IRenderer';
export type {
  ISurface,
  ISurfaceHost,
  SurfaceBackdrop,
  SurfaceOptions,
  SurfaceSpace,
} from './contracts/ISurface';
export type {
  IElementRenderer,
  MountedDecoration,
  CustomElementCtor,
} from './contracts/IElementRenderer';
export type {
  IOverlayDevice,
  OverlayFill,
  OverlayFillLike,
  OverlayStroke,
  OverlaySpace,
} from './contracts/IOverlayDevice';
export type {
  CameraChangeKind,
  CameraTransformValue,
  ICameraBinding,
} from './contracts/ICameraBinding';

// Spec projection — drives a renderer from a SpecStore. Every drawing layer
// uses this, so "the renderer is a projection of state" holds engine-wide.
export { SpecProjector } from './contracts/SpecProjector';
export type { SpecProjectionTarget, SpecProjectorOptions } from './contracts/SpecProjector';

// ─── Abstracts: what an extension package extends ────────────────────────────
export { Layer } from './abstracts/Layer';
export type { ILayer, LayerOptions } from './abstracts/Layer';

export { Behaviour } from './abstracts/Behaviour';
export type { IBehaviour, BehaviourOptions } from './abstracts/Behaviour';

export { Layout } from './abstracts/Layout';
export type { LayoutEvents, LayoutEndReason, LayoutOptions } from './abstracts/Layout';

// The shared service surface every Layer / Behaviour / Layout receives at
// mount/register time. An interface — the engine builds the concrete object.
export type { CanvasContext } from './abstracts/CanvasContext';

// Gesture arbitration — one gesture owns the pointer at a time; camera
// behaviours yield to it.
export { DefaultGestureArbiter } from './abstracts/GestureArbiter';
export type { GestureArbiter, GestureClaimOptions } from './abstracts/GestureArbiter';

// ─── Camera semantics (renderer-free; the binding realises them) ─────────────
export { Camera } from './abstracts/Camera';
// (`Point` / `Rect` arrive via the specs star below — one route per name)
export type { CameraOptions, CameraTransform } from './abstracts/Camera';
export type {
  CameraInputConfig,
  CameraInputModifier,
  WheelInputOptions,
  PinchInputOptions,
} from './abstracts/Camera';

// ─── Registries (reached as ctx.layers / ctx.behaviours; layouts on Canvas) ──
export { LayerRegistry } from './abstracts/registries/LayerRegistry';
export type { LayerRegistryOptions } from './abstracts/registries/LayerRegistry';

export { BehaviourRegistry } from './abstracts/registries/BehaviourRegistry';
export type { BehaviourRegistryOptions } from './abstracts/registries/BehaviourRegistry';

export { LayoutRegistry } from './abstracts/registries/LayoutRegistry';
export type { LayoutRegistryOptions } from './abstracts/registries/LayoutRegistry';

// ─── Headless reference implementation (test double, not a product renderer) ─
export {
  HeadlessRenderer,
  HeadlessSurface,
  HeadlessElementRenderer,
} from './headless/HeadlessRenderer';
export { HeadlessCameraBinding } from './headless/HeadlessCameraBinding';

// ─── Geometry: connectors (spec in → path/point out; no display object) ──────
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
} from './lib/geometry/connectors';

// ─── Geometry: badge placement ───────────────────────────────────────────────
export {
  DEFAULT_ENDPOINT_BADGE_GAP_PX,
  resolveBadgePosition,
  originToBadgeLocal,
  resolveConnectorBadgePosition,
} from './lib/geometry/badges';
export type {
  BadgeOptions,
  BadgePlacement,
  NamedBadgePlacement,
  ConnectorBadgePlacement,
} from './lib/geometry/badges';

// ─── Animation: tweens, easings, position transitions ────────────────────────
export { Tween } from './lib/animation';
export type { TweenOptions } from './lib/animation';
export {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuad,
  resolveEasing,
  EASING_NAMES,
} from './lib/animation/easings';
export type { Easing, EasingName } from './lib/animation/easings';
export { animatePositions, DEFAULT_POSITION_TRANSITION_MS } from './lib/animation/animatePositions';
export type { PositionTransition, PositionTransitionOptions } from './lib/animation/animatePositions';

// ─── SVG: pure spec → markup serialisers ─────────────────────────────────────
export {
  pathToSvgD,
  shapeSpecToSvg,
  connectorToSvg,
  attrs,
  esc,
  svgNum,
  pointsAttr,
  hexToCss,
  fillPaint,
  strokePaint,
  textContent,
} from './lib/svg';

// ─── Geometry vocabulary ─────────────────────────────────────────────────────
// (`Point` / `Rect` are exported above via `./Camera`; `CameraTransform` too —
// the geom alias is the same shape. `Vec2` / `Size` come via the specs star.)

// ─── The spec vocabulary — what to draw, as plain data + pure geometry ───────
export * from './specs';

// ─── The store contract (implemented by @invana/canvas-store) ────────────────
export type { CanvasStore } from './state/CanvasStore';

// ─── ReactiveStore port (the contract; the engine lives in canvas-store) ─────
export type {
  ReactiveStore,
  Update,
  Recipe,
  DeepPartial,
  StoreChange,
  StateCell,
  Patch,
} from './state/port/types';
export { select, shallowEqual, defaultEqual, type Selected } from './state/port/select';

// ─── View: the state shape + the named command API over it ───────────────────
export { defaultCanvasView, type CanvasView, type CanvasSceneOptions } from './state/view/CanvasView';
export { createActions, type CanvasActions } from './state/view/createActions';

// ─── Events: the bus + emitters (instantiated by the store) ──────────────────
export { EventEmitter, type Listener, type EventMap } from './state/events/EventEmitter';
export {
  type CanvasEvent,
  type EventSource,
  type EventSourceKind,
  CANVAS_SOURCE,
} from './state/events/CanvasEvent';
export {
  CanvasEventBus,
  type CanvasGlobalEvents,
  type Tap,
  type TapOptions,
} from './state/events/CanvasEventBus';
export { SourceEmitter } from './state/events/SourceEmitter';

// ─── Theme signal ────────────────────────────────────────────────────────────
export type { ResolvedTheme, ThemeState, ThemeMode, ThemeKind } from './state/theme/types';
export { CanvasThemeState } from './state/theme/CanvasThemeState';

// ─── Data primitives (dep-free; the machine-rate lane's building blocks) ─────
export { scheduleFlush, type FlushMode } from './state/data/flush';
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
} from './state/data/LayerData';
export {
  ColumnStore,
  type ColumnType,
  type ColumnSchema,
  type ColumnArray,
  type ColumnValue,
  type RowOf,
  type ColumnStoreOptions,
} from './state/data/ColumnStore';
export { DirtyBatcher, type DirtySnapshot } from './state/data/DirtyBatcher';
export type { DataSource } from './state/data/DataSource';

// ─── Renderer seam: the device-shaped half ───────────────────────────────────
export type { RendererBackend } from './contracts/backend';
export type { RendererInitOptions } from './contracts/RendererInitOptions';

// ─── Frame observability contract ────────────────────────────────────────────
export type {
  InteractionKind,
  FramePhase,
  FramePhaseTimings,
  FrameTick,
  FrameStats,
} from './state/frame';
