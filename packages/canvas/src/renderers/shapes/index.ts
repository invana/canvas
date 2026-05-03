// `@invana/canvas/renderers/shapes` — public ShapesRenderer surface.
//
// Architecture: see `architecture-proposal.md` §2.6 + `decorations-plan.md`.
//
// This barrel currently exports only the Step 1 skeleton (orchestrator +
// types + hit index). Built-in shapes/connectors/markers/routers/decorations
// land in subsequent steps and will re-export from here.

export { ShapesRenderer } from './ShapesRenderer';
export type { ShapesRendererOptions } from './ShapesRenderer';

export { HitIndex } from './HitIndex';
export type { HitEntry } from './HitIndex';

// ─── Built-in shapes ────────────────────────────────────────────────────
export { CircleShape } from './shapes/CircleShape';
export type { CircleShapeSpec } from './shapes/CircleShape';
export { RectShape } from './shapes/RectShape';
export type { RectShapeSpec } from './shapes/RectShape';
export { EllipseShape } from './shapes/EllipseShape';
export type { EllipseShapeSpec } from './shapes/EllipseShape';
export { PolygonShape } from './shapes/PolygonShape';
export type { PolygonShapeSpec } from './shapes/PolygonShape';
export { PathShape } from './shapes/PathShape';
export type { PathShapeSpec, PathCommand } from './shapes/PathShape';
export { ImageShape } from './shapes/ImageShape';
export type { ImageShapeSpec } from './shapes/ImageShape';
export { TextShape } from './shapes/TextShape';
export type { TextShapeSpec } from './shapes/TextShape';

// ─── Built-in connectors ────────────────────────────────────────────────
export { LineConnector } from './connectors/LineConnector';
export type { LineConnectorSpec } from './connectors/LineConnector';
export { CurveConnector } from './connectors/CurveConnector';
export type { CurveConnectorSpec } from './connectors/CurveConnector';

// ─── Built-in markers ───────────────────────────────────────────────────
export {
  ArrowMarker,
  CircleMarker,
  SquareMarker,
  DiamondMarker,
} from './markers/markers';

// ─── Built-in routers ───────────────────────────────────────────────────
export { straightRouter } from './routers/straight';
export { orthogonalRouter } from './routers/orthogonal';
export { bezierRouter } from './routers/bezier';

// ─── Marker types ───────────────────────────────────────────────────────
export type { MarkerOptions, MarkerHostInfo } from './types';

// ─── Built-in decorations ───────────────────────────────────────────────
export { HaloDecoration } from './decorations/HaloDecoration';
export type { HaloStyle } from './decorations/HaloDecoration';
export { BorderDecoration } from './decorations/BorderDecoration';
export type { BorderStyle } from './decorations/BorderDecoration';
export { GlowDecoration } from './decorations/GlowDecoration';
export type { GlowStyle } from './decorations/GlowDecoration';
export { PulseRingDecoration } from './decorations/PulseRingDecoration';
export type { PulseRingStyle } from './decorations/PulseRingDecoration';
export { MarchingAntsDecoration } from './decorations/MarchingAntsDecoration';
export type { MarchingAntsStyle } from './decorations/MarchingAntsDecoration';
export { DashedBorderRotatingDecoration } from './decorations/DashedBorderRotatingDecoration';
export type { DashedBorderRotatingStyle } from './decorations/DashedBorderRotatingDecoration';

export type {
  // geometry
  Point,
  Vec2,
  Rect,
  Endpoint,
  // specs
  BaseShapeSpec,
  BaseConnectorSpec,
  ConnectorEndpointSpec,
  // primitive interfaces
  IShape,
  IConnector,
  IMarker,
  IRouter,
  IShapeDecoration,
  IConnectorDecoration,
  IDecorationBase,
  // host info
  ShapeHostInfo,
  ConnectorHostInfo,
  ShapeDecorationHostInfo,
  ConnectorDecorationHostInfo,
  // ctors / registry
  ShapeCtor,
  ConnectorCtor,
  MarkerCtor,
  ShapeDecorationCtor,
  ConnectorDecorationCtor,
  DecorationTarget,
  RegisterDecorationOptions,
  DecorationSpec,
  // results
  HitResult,
  ShapesRendererEventMap,
  RenderStats,
} from './types';
