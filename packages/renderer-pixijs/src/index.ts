/**
 * `@invana/renderer-pixijs` — the PixiJS drawing backend for `@invana/canvas`.
 *
 * **Everything that touches `pixi.js` in this repo lives here.** The engine
 * orchestrates, `@invana/graph` describes, this package draws.
 *
 * ```ts
 * import { Canvas } from '@invana/canvas-core';
 * import { PixiRenderer } from '@invana/renderer-pixijs';
 *
 * const canvas = new Canvas();
 * await canvas.init({ container: el, renderer: new PixiRenderer({ events: canvas.events }) });
 * ```
 *
 * `renderer` is optional — omitting it makes `Canvas.init` resolve this package
 * with a lazy `import()`, which is why `@invana/canvas` declares it an
 * **optional peer** rather than a dependency (design D1, §4.6).
 *
 * What is *not* here, deliberately: interaction state, the hit index (picking is
 * interaction, not drawing — D5), connector routing and path styles (geometry
 * answers must not need a backend — §5), and any domain concept. If something
 * here can only be expressed in pixi terms, that is a bug in the contract.
 */

// ─── The renderer contract, realised ─────────────────────────────────────────
export { PixiRenderer, type PixiRendererOptions } from './renderer/PixiRenderer';
export { PixiSurface, type PixiSurfaceOptions } from './renderer/PixiSurface';
export { PixiOverlayDevice } from './renderer/PixiOverlayDevice';
export { PixiViewportBinding } from './renderer/PixiViewportBinding';

/**
 * Convenience factory used by `Canvas.init`'s lazy default-backend resolution.
 * Kept as a named export so the dynamic import has a stable entry point.
 */
export { createDefaultRenderer } from './createDefaultRenderer';

// ─── Drawing device + primitives ─────────────────────────────────────────────
// The extension surface for custom shape / decoration / effect authors. These
// are backend types by nature: a custom shape subclasses `ShapeBase` and paints
// into a `Graphics`, which is exactly why they live here and not in the engine.

export { PrimitivesRenderer } from './renderer/PrimitivesRenderer';
export type { PrimitivesRendererOptions } from './renderer/PrimitivesRenderer';

// ─── Base classes (for custom shape / connector / decoration authors) ──────
export { PrimitiveBase } from './primitives/base/PrimitiveBase';
export { ShapeBase } from './primitives/base/ShapeBase';
export { ConnectorBase } from './primitives/base/ConnectorBase';
export { ShapeDecorationBase } from './primitives/base/ShapeDecorationBase';
export { ConnectorDecorationBase } from './primitives/base/ConnectorDecorationBase';
export { EffectBase } from './primitives/base/EffectBase';
export { ConnectorEffectBase } from './primitives/base/ConnectorEffectBase';

// ─── Built-in primitives ──────────────────────────────────────────────────
export { CircleShape } from './primitives/shapes/CircleShape';
export { EllipseShape } from './primitives/shapes/EllipseShape';
export { RectShape } from './primitives/shapes/RectShape';
export { TabbedRectShape } from './primitives/shapes/TabbedRectShape';
export { PathShape } from './primitives/shapes/PathShape';
export { PolygonShape } from './primitives/shapes/PolygonShape';
export { RegularPolygonShape } from './primitives/shapes/RegularPolygonShape';
export { StarShape } from './primitives/shapes/StarShape';
export { ArcShape } from './primitives/shapes/ArcShape';
export { CompositeShape } from './primitives/shapes/CompositeShape';
export type { CompositeSpec, CompositePart, CompositeRootSpec } from './primitives/shapes/CompositeShape';
export { Connector } from './primitives/connectors/Connector';
export { ArrowMarker, arrowMarkerSpec } from './primitives/connectors/ArrowMarker';
export type { ArrowMarkerSpec } from './primitives/connectors/ArrowMarker';
export { DiamondMarker, diamondMarkerSpec } from './primitives/connectors/DiamondMarker';
export type { DiamondMarkerSpec } from './primitives/connectors/DiamondMarker';
export { DotMarker, dotMarkerSpec } from './primitives/connectors/DotMarker';
export type { DotMarkerSpec } from './primitives/connectors/DotMarker';

// ─── Built-in decorations ──────────────────────────────────────────────────
export { GlowDecoration } from './primitives/decorations/shape/GlowDecoration';
export type { GlowDecorationStyle } from './primitives/decorations/shape/GlowDecoration';
export { PulseRingDecoration } from './primitives/decorations/shape/PulseRingDecoration';
export type { PulseRingDecorationStyle } from './primitives/decorations/shape/PulseRingDecoration';
export { LiquidFillDecoration } from './primitives/decorations/shape/LiquidFillDecoration';
export type { LiquidFillDecorationStyle } from './primitives/decorations/shape/LiquidFillDecoration';
export { MarchingAntsDecoration } from './primitives/decorations/shape/MarchingAntsDecoration';
export type { MarchingAntsDecorationStyle } from './primitives/decorations/shape/MarchingAntsDecoration';
export { RingDecoration } from './primitives/decorations/shape/RingDecoration';
export type { RingDecorationStyle } from './primitives/decorations/shape/RingDecoration';
export { MarchingAntsConnectorDecoration } from './primitives/decorations/connector/MarchingAntsConnectorDecoration';
export type { MarchingAntsConnectorDecorationStyle } from './primitives/decorations/connector/MarchingAntsConnectorDecoration';
export { RingConnectorDecoration } from './primitives/decorations/connector/RingConnectorDecoration';
export type { RingConnectorDecorationStyle } from './primitives/decorations/connector/RingConnectorDecoration';
export { FlyMarkerConnectorDecoration } from './primitives/decorations/connector/FlyMarkerConnectorDecoration';
export type { FlyMarkerConnectorDecorationStyle } from './primitives/decorations/connector/FlyMarkerConnectorDecoration';
export { FlowParticlesConnectorDecoration } from './primitives/decorations/connector/FlowParticlesConnectorDecoration';
export type { FlowParticlesConnectorDecorationStyle } from './primitives/decorations/connector/FlowParticlesConnectorDecoration';
export { GlowConnectorDecoration } from './primitives/decorations/connector/GlowConnectorDecoration';
export type { GlowConnectorDecorationStyle } from './primitives/decorations/connector/GlowConnectorDecoration';
export { RippleConnectorDecoration } from './primitives/decorations/connector/RippleConnectorDecoration';
export type { RippleConnectorDecorationStyle } from './primitives/decorations/connector/RippleConnectorDecoration';
export { RevealConnectorDecoration } from './primitives/decorations/connector/RevealConnectorDecoration';
export type {
  RevealConnectorDecorationStyle,
  RevealDirection,
  RevealEasingName,
  RevealHostStroke,
  RevealRepeat,
} from './primitives/decorations/connector/RevealConnectorDecoration';
export { LabelDecoration } from './primitives/decorations/shape/LabelDecoration';
export { LabelConnectorDecoration } from './primitives/decorations/connector/LabelConnectorDecoration';
export { ToggleDecoration } from './primitives/decorations/shape/ToggleDecoration';
export type {
  ToggleDecorationStyle,
  TogglePlacement,
  ToggleHitGeometry,
} from './primitives/decorations/shape/ToggleDecoration';
export { ResizeHandleDecoration } from './primitives/decorations/shape/ResizeHandleDecoration';
export type {
  ResizeHandleDecorationStyle,
  ResizeHandlePlacement,
  ResizeHandleHitGeometry,
} from './primitives/decorations/shape/ResizeHandleDecoration';
export { SelectionFrameDecoration } from './primitives/decorations/shape/SelectionFrameDecoration';
export type {
  SelectionFrameDecorationStyle,
  SelectionFramePlacement,
  SelectionFrameHandleHit,
  SelectionFrameBorderStyle,
  SelectionFrameHandleShape,
} from './primitives/decorations/shape/SelectionFrameDecoration';

// ─── Built-in effects ──────────────────────────────────────────────────────
export { ShakeEffect } from './primitives/effects/ShakeEffect';
export type { ShakeEffectStyle } from './primitives/effects/ShakeEffect';
export { BreathingEffect } from './primitives/effects/BreathingEffect';
export type { BreathingEffectStyle } from './primitives/effects/BreathingEffect';
export { BreathingConnectorEffect } from './primitives/effects/BreathingConnectorEffect';
export type { BreathingConnectorEffectStyle } from './primitives/effects/BreathingConnectorEffect';
export { FadeInEffect } from './primitives/effects/FadeInEffect';
export type { FadeInEffectStyle } from './primitives/effects/FadeInEffect';
export { FadeInConnectorEffect } from './primitives/effects/FadeInConnectorEffect';
export type {
  FadeInConnectorEffectStyle,
  FadeInEasingName,
} from './primitives/effects/FadeInConnectorEffect';

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

// ─── Assets ──────────────────────────────────────────────────────────────────
export { TextureRegistry } from './assets/TextureRegistry';
export { loadIconFont } from './assets/loadIconFont';

// ─── Backend capability probing ──────────────────────────────────────────────
export {
  hasWebGPUApi,
  hasWebGL,
  canUseWebGPU,
  resolveRenderPreference,
  bestRenderPreference,
  type RenderPreference,
} from './renderer/rendererSupport';
