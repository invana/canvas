/**
 * `@invana/canvas/draw` — pure-function paint primitives.
 *
 * The low-level drawing API for everything that consumes the renderer:
 * graph viz, ER diagrams, swimlanes, flowcharts, server-room visualisations,
 * and any other domain layer built on top of `ShapesRenderer`.
 *
 * Primitives have ONE responsibility each:
 *   - shape primitives    : emit a shape's geometry into a Graphics
 *   - connector primitives: emit a polyline into a Graphics (no markers!)
 *   - text primitives     : mount a Text/HTMLText display object into a Container
 *   - routers             : pure (endpoints) → polyline
 *   - decorations         : emit decoration geometry given host bounds
 *
 * The draw module never composes two primitives into one — composition (a
 * node that has a label, an edge that has an arrow, a rack that has blinking
 * lights) is always a Layer concern.
 */

// ─── Types ────────────────────────────────────────────────────────────────
export type {
  FillInput,
  FillFit,
  Point,
  Vec2,
  Rect,
  Endpoint,
  BaseShapeSpec,
  BaseConnectorSpec,
  ConnectorEndpointSpec,
  ShapeKind,
  ConnectorKind,
  TextKind,
  TextHandle,
  Router,
  StaticDecorationKind,
  AnimatedDecorationCtor,
  AnimatedDecoration,
} from './types';

// ─── Fill helpers ─────────────────────────────────────────────────────────
export { textureMatrix, applyFill } from './shapes/textureMatrix';

// ─── Shape primitives ─────────────────────────────────────────────────────
export {
  drawCircle,
  circleBounds,
  circleContains,
  circleKind,
  type CircleSpec,
} from './shapes/circle';
export { drawRect, rectBounds, rectKind, type RectSpec } from './shapes/rect';
export {
  drawEllipse,
  ellipseBounds,
  ellipseContains,
  ellipseKind,
  type EllipseSpec,
} from './shapes/ellipse';
export {
  drawPolygon,
  polygonBounds,
  polygonContains,
  polygonKind,
  type PolygonSpec,
} from './shapes/polygon';
export {
  drawPath,
  pathBounds,
  pathKind,
  type PathSpec,
  type PathCommand,
} from './shapes/path';
export { drawImage, imageBounds, imageKind, type ImageSpec } from './shapes/image';
export { drawArrow, arrowBounds, arrowKind, type ArrowSpec } from './shapes/arrow';

// ─── Text primitives ──────────────────────────────────────────────────────
export {
  mountPlainText,
  plainTextBounds,
  plainTextKind,
  type PlainTextSpec,
} from './text/plain';
export {
  mountHTMLText,
  htmlTextBounds,
  htmlTextKind,
  type HTMLTextSpec,
} from './text/html';

// ─── Connector primitives (polyline only — no markers) ────────────────────
export {
  drawLineConnector,
  lineConnectorBounds,
  lineConnectorKind,
  type LineConnectorSpec,
} from './connectors/line';
export {
  drawCurveConnector,
  curveConnectorBounds,
  curveConnectorKind,
  type CurveConnectorSpec,
} from './connectors/curve';

// ─── Routers (pure functions) ─────────────────────────────────────────────
export { straightRouter } from './routers/straight';
export { orthogonalRouter } from './routers/orthogonal';
export { bezierRouter } from './routers/bezier';

// ─── Decorations — static (functions) ─────────────────────────────────────
export { drawHalo, haloKind, type HaloOpts } from './decorations/halo';
export { drawBorder, borderKind, type BorderOpts } from './decorations/border';
export {
  drawGlow,
  setupGlow,
  glowKind,
  type GlowOpts,
} from './decorations/glow';

// ─── Decorations — animated (classes) ─────────────────────────────────────
export {
  MarchingAntsDecoration,
  type MarchingAntsOpts,
} from './decorations/marching-ants';
export {
  PulseRingDecoration,
  type PulseRingOpts,
} from './decorations/pulse-ring';
export {
  DashedBorderRotatingDecoration,
  type DashedBorderRotatingOpts,
} from './decorations/dashed-rotating';
