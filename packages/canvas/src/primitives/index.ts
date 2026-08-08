// Public surface for `primitives/` — **the drawing half only**.
//
// Everything here touches a display object, which is what makes this folder the
// unit that moves to `@invana/renderer-pixijs` (§9, P6). Geometry that a second
// backend would reuse verbatim — routers, path styles, anchors, path sampling,
// badge placement, tweens — lives engine-side in `src/connectors/`,
// `src/badges/` and `src/animation/`, and is re-exported from the package root
// rather than from here.

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

// ─── Built-in primitives ──────────────────────────────────────────────────
export { CircleShape } from './shapes/CircleShape';
export { EllipseShape } from './shapes/EllipseShape';
export { RectShape } from './shapes/RectShape';
export { TabbedRectShape } from './shapes/TabbedRectShape';
export { PathShape } from './shapes/PathShape';
export { PolygonShape } from './shapes/PolygonShape';
export { RegularPolygonShape } from './shapes/RegularPolygonShape';
export { StarShape } from './shapes/StarShape';
export { ArcShape } from './shapes/ArcShape';
export { CompositeShape } from './shapes/CompositeShape';
export type { CompositeSpec, CompositePart, CompositeRootSpec } from './shapes/CompositeShape';
export { Connector } from './connectors/Connector';
export { ArrowMarker, arrowMarkerSpec } from './markers/ArrowMarker';
export type { ArrowMarkerSpec } from './markers/ArrowMarker';

// ─── Built-in decorations ──────────────────────────────────────────────────
export { GlowDecoration } from './decorations/shape/GlowDecoration';
export type { GlowDecorationStyle } from './decorations/shape/GlowDecoration';
export { PulseRingDecoration } from './decorations/shape/PulseRingDecoration';
export type { PulseRingDecorationStyle } from './decorations/shape/PulseRingDecoration';
export { LiquidFillDecoration } from './decorations/shape/LiquidFillDecoration';
export type { LiquidFillDecorationStyle } from './decorations/shape/LiquidFillDecoration';
export { MarchingAntsDecoration } from './decorations/shape/MarchingAntsDecoration';
export type { MarchingAntsDecorationStyle } from './decorations/shape/MarchingAntsDecoration';
export { RingDecoration } from './decorations/shape/RingDecoration';
export type { RingDecorationStyle } from './decorations/shape/RingDecoration';
export { MarchingAntsConnectorDecoration } from './decorations/connector/MarchingAntsConnectorDecoration';
export type { MarchingAntsConnectorDecorationStyle } from './decorations/connector/MarchingAntsConnectorDecoration';
export { RingConnectorDecoration } from './decorations/connector/RingConnectorDecoration';
export type { RingConnectorDecorationStyle } from './decorations/connector/RingConnectorDecoration';
export { FlyMarkerConnectorDecoration } from './decorations/connector/FlyMarkerConnectorDecoration';
export type { FlyMarkerConnectorDecorationStyle } from './decorations/connector/FlyMarkerConnectorDecoration';
export { FlowParticlesConnectorDecoration } from './decorations/connector/FlowParticlesConnectorDecoration';
export type { FlowParticlesConnectorDecorationStyle } from './decorations/connector/FlowParticlesConnectorDecoration';
export { GlowConnectorDecoration } from './decorations/connector/GlowConnectorDecoration';
export type { GlowConnectorDecorationStyle } from './decorations/connector/GlowConnectorDecoration';
export { RippleConnectorDecoration } from './decorations/connector/RippleConnectorDecoration';
export type { RippleConnectorDecorationStyle } from './decorations/connector/RippleConnectorDecoration';
export { RevealConnectorDecoration } from './decorations/connector/RevealConnectorDecoration';
export type {
  RevealConnectorDecorationStyle,
  RevealDirection,
  RevealEasingName,
  RevealHostStroke,
  RevealRepeat,
} from './decorations/connector/RevealConnectorDecoration';
export { LabelDecoration } from './decorations/shape/LabelDecoration';
export { LabelConnectorDecoration } from './decorations/connector/LabelConnectorDecoration';
export { ToggleDecoration } from './decorations/shape/ToggleDecoration';
export type {
  ToggleDecorationStyle,
  TogglePlacement,
  ToggleHitGeometry,
} from './decorations/shape/ToggleDecoration';
export { ResizeHandleDecoration } from './decorations/shape/ResizeHandleDecoration';
export type {
  ResizeHandleDecorationStyle,
  ResizeHandlePlacement,
  ResizeHandleHitGeometry,
} from './decorations/shape/ResizeHandleDecoration';
export { SelectionFrameDecoration } from './decorations/shape/SelectionFrameDecoration';
export type {
  SelectionFrameDecorationStyle,
  SelectionFramePlacement,
  SelectionFrameHandleHit,
  SelectionFrameBorderStyle,
  SelectionFrameHandleShape,
} from './decorations/shape/SelectionFrameDecoration';

// ─── Built-in effects ──────────────────────────────────────────────────────
export { ShakeEffect } from './effects/shape/ShakeEffect';
export type { ShakeEffectStyle } from './effects/shape/ShakeEffect';
export { BreathingEffect } from './effects/shape/BreathingEffect';
export type { BreathingEffectStyle } from './effects/shape/BreathingEffect';
export { BreathingConnectorEffect } from './effects/connector/BreathingConnectorEffect';
export type { BreathingConnectorEffectStyle } from './effects/connector/BreathingConnectorEffect';
export { FadeInConnectorEffect } from './effects/connector/FadeInConnectorEffect';
export type {
  FadeInConnectorEffectStyle,
  FadeInEasingName,
} from './effects/connector/FadeInConnectorEffect';

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
  PathStyleEndpoints,
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
  EllipseSpec,
  RectSpec,
  TabbedRectSpec,
  TabAlign,
  PolygonSpec,
  RegularPolygonSpec,
  StarSpec,
  ArcSpec,
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

  LabelContent,
  LabelBackground,
  LabelWrap,
  LabelVisibility,
  LabelStyleCommon,
  ShapeLabelPlacement,
  ShapeLabelStyle,
  ConnectorLabelPlacement,
  ConnectorLabelStyle,
  HtmlTagStyle,
} from './types';
