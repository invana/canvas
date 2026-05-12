// Public surface for `primitives/`.
//
// Architecture: see `primitives-redesign-plan.md` (macro) and
// `primitives-v0-plan.md` (this v0 slice) at the repo root.

// ─── Renderer ──────────────────────────────────────────────────────────────
export { PrimitivesRenderer } from './PrimitivesRenderer';
export type { PrimitivesRendererOptions } from './PrimitivesRenderer';

// ─── Base classes (for custom shape / connector / decoration authors) ──────
export { PrimitiveBase } from './base/PrimitiveBase';
export { ShapeBase } from './base/ShapeBase';
export { ConnectorBase } from './base/ConnectorBase';
export { ShapeDecorationBase } from './base/ShapeDecorationBase';
export { ConnectorDecorationBase } from './base/ConnectorDecorationBase';
export { EffectBase } from './base/EffectBase';
export { ConnectorEffectBase } from './base/ConnectorEffectBase';

// ─── Animation primitive ───────────────────────────────────────────────────
export { Tween } from './animation/Tween';
export type { TweenOptions } from './animation/Tween';
export {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
} from './animation/easings';
export type { Easing } from './animation/easings';

// ─── Built-in primitives ──────────────────────────────────────────────────
export { CircleShape } from './shapes/CircleShape';
export { RectShape } from './shapes/RectShape';
export { Connector } from './connectors/Connector';
export { ArrowMarker, arrowMarkerSpec } from './markers/ArrowMarker';
export type { ArrowMarkerSpec } from './markers/ArrowMarker';

// ─── Built-in routers ──────────────────────────────────────────────────────
export { straightRouter } from './connectors/routers/straight';
export { orthRouter } from './connectors/routers/orth';
export { manhattanRouter } from './connectors/routers/manhattan';
export { metroRouter } from './connectors/routers/metro';
export { erRouter } from './connectors/routers/er';
export { oneSideRouter } from './connectors/routers/oneSide';

// ─── Built-in pathStyles ───────────────────────────────────────────────────
export { normalPathStyle } from './connectors/pathStyles/normal';
export { roundedPathStyle } from './connectors/pathStyles/rounded';
export { bezierPathStyle } from './connectors/pathStyles/bezier';
export { smoothPathStyle } from './connectors/pathStyles/smooth';

// ─── Built-in anchors ──────────────────────────────────────────────────────
export { centerAnchor } from './connectors/anchors/center';
export { boundaryAnchor } from './connectors/anchors/boundary';
export { perpendicularAnchor } from './connectors/anchors/perpendicular';

// ─── Built-in decorations ──────────────────────────────────────────────────
export { GlowDecoration } from './decorations/shape/GlowDecoration';
export type { GlowDecorationStyle } from './decorations/shape/GlowDecoration';
export { PulseRingDecoration } from './decorations/shape/PulseRingDecoration';
export type { PulseRingDecorationStyle } from './decorations/shape/PulseRingDecoration';
export { LiquidFillDecoration } from './decorations/shape/LiquidFillDecoration';
export type { LiquidFillDecorationStyle } from './decorations/shape/LiquidFillDecoration';
export { MarchingAntsDecoration } from './decorations/shape/MarchingAntsDecoration';
export type { MarchingAntsDecorationStyle } from './decorations/shape/MarchingAntsDecoration';
export { MarchingAntsConnectorDecoration } from './decorations/connector/MarchingAntsConnectorDecoration';
export type { MarchingAntsConnectorDecorationStyle } from './decorations/connector/MarchingAntsConnectorDecoration';
export { FlyMarkerConnectorDecoration } from './decorations/connector/FlyMarkerConnectorDecoration';
export type { FlyMarkerConnectorDecorationStyle } from './decorations/connector/FlyMarkerConnectorDecoration';
export { FlowParticlesConnectorDecoration } from './decorations/connector/FlowParticlesConnectorDecoration';
export type { FlowParticlesConnectorDecorationStyle } from './decorations/connector/FlowParticlesConnectorDecoration';
export { GlowConnectorDecoration } from './decorations/connector/GlowConnectorDecoration';
export type { GlowConnectorDecorationStyle } from './decorations/connector/GlowConnectorDecoration';
export { RippleConnectorDecoration } from './decorations/connector/RippleConnectorDecoration';
export type { RippleConnectorDecorationStyle } from './decorations/connector/RippleConnectorDecoration';

// ─── Built-in effects ──────────────────────────────────────────────────────
export { ShakeEffect } from './effects/shape/ShakeEffect';
export type { ShakeEffectStyle } from './effects/shape/ShakeEffect';
export { BreathingEffect } from './effects/shape/BreathingEffect';
export type { BreathingEffectStyle } from './effects/shape/BreathingEffect';
export { BreathingConnectorEffect } from './effects/connector/BreathingConnectorEffect';
export type { BreathingConnectorEffectStyle } from './effects/connector/BreathingConnectorEffect';

// ─── Badges ────────────────────────────────────────────────────────────────
export type { BadgeOptions, BadgePlacement } from './badges/types';
export {
  placementToHostAnchor,
  originToBadgeLocal,
  mirrorPlacement,
  resolveBadgePosition,
} from './badges/placement';

// ─── Path utilities ────────────────────────────────────────────────────────
export {
  samplePath,
  tangentAt,
  pathBounds,
  distanceToPolylineSq,
} from './connectors/pathSampling';

// ─── Types ─────────────────────────────────────────────────────────────────
export type {
  Point,
  Vec2,
  Rect,
  Endpoint,

  Path,
  PathCommand,
  Polyline,
  IRouter,
  IPathStyle,
  IAnchor,
  Obstacle,
  RouterCtx,
  AnchorSpec,
  AnchorCtx,
  AnchorShapeRef,

  ShapeFill,
  ShapeFillLayer,
  InsetAnchor,
  ShapeStroke,
  ShapePaintStyle,
  ConnectorPaintStyle,

  BaseShapeSpec,
  CircleSpec,
  RectSpec,
  MarkerShapeSpec,

  BaseConnectorSpec,
  ConnectorEndpointSpec,

  ShapeHostInfo,
  ConnectorHostInfo,
  ShapeDecorationHostInfo,
  ConnectorDecorationHostInfo,

  IShape,
  IConnector,
  IDecorationBase,
  IShapeDecoration,
  IConnectorDecoration,

  ShapeCtor,
  ShapeDecorationCtor,
  ConnectorDecorationCtor,
  DecorationTarget,
  RegisterDecorationOptions,
  DecorationSpec,

  EffectTarget,
  EffectTargetKind,
  TransformDelta,
  StyleOverride,
  ShapeEffectHostInfo,
  IEffectBase,
  IShapeEffect,
  ShapeEffectCtor,
  RegisterEffectOptions,
  EffectSpec,

  HitResult,
  PrimitivesRendererEventMap,
  RenderStats,
} from './types';
