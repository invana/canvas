// `@invana/canvas/renderers/shapes` — public ShapesRenderer surface.
//
// Architecture: see `architecture-proposal.md` §2.6 + `decorations-plan.md`.

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

// ─── Marker spec builders ───────────────────────────────────────────────
// Markers are not a separate primitive: they're shapes painted into the
// connector's Graphics via `ShapeCtor.paintInto`. These builders return
// ready-to-use sub-shape specs for the four common marker shapes; custom
// markers just pass any registered shape spec to the connector.
export {
  arrowMarkerSpec,
  circleMarkerSpec,
  squareMarkerSpec,
  diamondMarkerSpec,
} from './markers/markers';
export type { MarkerStyle } from './markers/markers';

// ─── Built-in routers ───────────────────────────────────────────────────
export { straightRouter } from './routers/straight';
export { orthogonalRouter } from './routers/orthogonal';
export { bezierRouter } from './routers/bezier';

// ─── Built-in decorations ───────────────────────────────────────────────
export { RingDecoration } from './decorations/RingDecoration';
export type { RingStyle } from './decorations/RingDecoration';
export { GlowDecoration } from './decorations/GlowDecoration';
export type { GlowStyle } from './decorations/GlowDecoration';
export { PulseRingDecoration } from './decorations/PulseRingDecoration';
export type { PulseRingStyle } from './decorations/PulseRingDecoration';
export { MarchingAntsDecoration } from './decorations/MarchingAntsDecoration';
export type { MarchingAntsStyle } from './decorations/MarchingAntsDecoration';
export { BreathingDecoration } from './decorations/BreathingDecoration';
export type { BreathingStyle } from './decorations/BreathingDecoration';
export { MarchingAntsConnectorDecoration } from './decorations/MarchingAntsConnectorDecoration';
export type {
  MarchingAntsConnectorStyle,
} from './decorations/MarchingAntsConnectorDecoration';
export { PulsatingGlowConnectorDecoration } from './decorations/PulsatingGlowConnectorDecoration';
export type {
  PulsatingGlowConnectorStyle,
} from './decorations/PulsatingGlowConnectorDecoration';

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
  MarkerShapeSpec,
  // primitive interfaces
  IShape,
  IConnector,
  IRouter,
  IShapeDecoration,
  IConnectorDecoration,
  IDecorationBase,
  // host info
  ShapeHostInfo,
  ConnectorHostInfo,
  ShapeDecorationHostInfo,
  ConnectorDecorationHostInfo,
  // styles
  ShapePaintStyle,
  ConnectorPaintStyle,
  // ctors / registry
  ShapeCtor,
  ConnectorCtor,
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
