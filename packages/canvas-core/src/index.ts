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
// Depends only on `@invana/canvas-store` (the renderer-free kernel). No drawing
// library, no third-party library, no engine import — `@invana/canvas` depends
// on this package, never the reverse.

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
export { Camera } from './Camera';
export type { CameraOptions, CameraTransform, Rect, Point } from './Camera';
export type {
  CameraInputConfig,
  CameraInputModifier,
  WheelInputOptions,
  PinchInputOptions,
} from './Camera';

// ─── Registries (reached as ctx.layers / ctx.behaviours; layouts on Canvas) ──
export { LayerRegistry } from './registries/LayerRegistry';
export type { LayerRegistryOptions } from './registries/LayerRegistry';

export { BehaviourRegistry } from './registries/BehaviourRegistry';
export type { BehaviourRegistryOptions } from './registries/BehaviourRegistry';

export { LayoutRegistry } from './registries/LayoutRegistry';
export type { LayoutRegistryOptions } from './registries/LayoutRegistry';

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
} from './geometry/connectors';

// ─── Geometry: badge placement ───────────────────────────────────────────────
export {
  DEFAULT_ENDPOINT_BADGE_GAP_PX,
  resolveBadgePosition,
  originToBadgeLocal,
  resolveConnectorBadgePosition,
} from './geometry/badges';
export type {
  BadgeOptions,
  BadgePlacement,
  NamedBadgePlacement,
  ConnectorBadgePlacement,
} from './geometry/badges';

// ─── Animation: tweens, easings, position transitions ────────────────────────
export { Tween } from './animation';
export type { TweenOptions } from './animation';
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
export { animatePositions, DEFAULT_POSITION_TRANSITION_MS } from './animation/animatePositions';
export type { PositionTransition, PositionTransitionOptions } from './animation/animatePositions';

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
} from './svg';
