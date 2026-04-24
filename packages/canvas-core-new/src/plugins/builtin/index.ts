export { BackgroundPlugin } from './BackgroundPlugin.js';
export type { BackgroundOptions, BackgroundType, PatternType } from './BackgroundPlugin.js';
export { DrawingPlugin } from './DrawingPlugin.js';
export type { DrawStyle, PathStyle, BezierPoint, DashStyle, OrthogonalStyle, OrthogonalParams, ArrowStyle, ArrowParams, ArrowType, EffectStyle, CircleGlowParams, RectGlowParams, RippleParams } from './DrawingPlugin.js';
export { ShapePlugin } from './ShapePlugin.js';
export type { ShapePluginOptions, ShapeSpec, ShapeType, ShapeAnimations } from './ShapePlugin.js';
export { AnimationRegistry, defaultRegistry } from './shape-plugin/index.js';
export type { AnimationHandler, AnimSlot } from './shape-plugin/index.js';
export type { BreatheOptions, ColorCycleOptions, FadeInOptions, PulseOptions, MarchingAntsOptions, DashedFlowOptions, BorderGlowOptions } from './shape-plugin/index.js';
export { DevInfoPlugin } from './DevInfoPlugin.js';
export type { DevInfoPluginOptions, DevInfoCorner } from './DevInfoPlugin.js';

// ── ElementPlugin ─────────────────────────────────────────────────────────────
export { ElementPlugin } from './element-plugin/index.js';
export type { ElementPluginOptions, SolidCtor, ConnectorCtor } from './element-plugin/index.js';
export { BaseSolid, BaseConnector, LOD } from './element-plugin/index.js';
export type { DrawContext, Point as ElementPoint, BBox as ElementBBox, PathCommand } from './element-plugin/index.js';
export type { BaseSolidSpec, BaseConnectorSpec, ArrowSpec, DrawStyle as ElementDrawStyle, PathStyle as ElementPathStyle } from './element-plugin/index.js';
export { CircleElement, RectElement, EllipseElement, PolygonElement, DiamondElement, StarElement, HexagonElement } from './element-plugin/index.js';
export type { CircleElementSpec, RectElementSpec, EllipseElementSpec, PolygonElementSpec, DiamondElementSpec, StarElementSpec, HexagonElementSpec } from './element-plugin/index.js';
export { StraightConnector, BezierConnector, OrthogonalConnector, QuadraticConnector, RoundedConnector, SmoothConnector } from './element-plugin/index.js';
export type { BezierConnectorSpec, OrthogonalConnectorSpec, OrthogonalRouteDirection, QuadraticConnectorSpec, RoundedConnectorSpec, SmoothConnectorSpec } from './element-plugin/index.js';
export { normalRouter, orthRouter, oneSideRouter, erRouter, BUILTIN_ROUTERS } from './element-plugin/index.js';
export type { RouterFn, RouterContext, OrthRouterArgs, OneSideRouterArgs, ErRouterArgs } from './element-plugin/index.js';
export {
  ElementBaseEvent, ElementDragBaseEvent,
  ElementClickEvent, ElementDblClickEvent, ElementContextMenuEvent,
  ElementPointerOverEvent, ElementPointerOutEvent, ElementPointerMoveEvent,
  ElementPointerDownEvent, ElementPointerUpEvent,
  ElementDragStartEvent, ElementDragMoveEvent, ElementDragEndEvent,
  ElementStateChangeEvent, ElementAddedEvent, ElementRemovedEvent,
} from './element-plugin/index.js';
export type { ElementEventFields, ElementDragEventFields, ElementStateChangeFields, ElementLifecycleFields } from './element-plugin/index.js';
export { ElementObject } from './element-plugin/index.js';
export type { AnyElement } from './element-plugin/index.js';
