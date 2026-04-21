// spec/index.ts — barrel re-export of all ShapePlugin spec types
export type { FillSpec, SolidFill, LinearFill, RadialFill, TextureFill, IconFill, ColorStop } from './fills.js';
export type { BorderSpec, HaloSpec } from './border-halo.js';
export type {
  ShapeAnimations,
  BorderAnimation, MarchingAntsAnimation, DashedFlowAnimation, BorderGlowPulseAnimation,
  BodyAnimation, PulseAnimation, BreatheAnimation, ColorCycleAnimation, FadeInAnimation,
} from './animations.js';
export type { ShapeEventType, ShapeEventPayload, DragPayload, ShapeHandler, DragHandler } from './events.js';
export type {
  BaseShapeSpec, ShapeSpec, ShapeType, ShapeBBox,
  CircleSpec, EllipseSpec, RectSpec, PolygonSpec, StarSpec,
  DashedCircleSpec, DashedRectSpec,
  LineSpec, BezierSpec, AutoBezierSpec, OrthogonalSpec,
  CircleGlowSpec, RippleRingSpec,
  LabelSpec, ArrowSpec,
} from './shapes.js';
export { computeBBox } from './shapes.js';
