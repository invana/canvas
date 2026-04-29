// ── @invana/plugins-shapes public exports ─────────────────────────────────────

// Main plugin
export { ShapesPlugin, GraphPlugin } from './ShapesPlugin.js';
export type { ShapesPluginOptions, ShapeCtor, ConnectorCtor, GraphPluginOptions, NodeCtor, EdgeCtor } from './ShapesPlugin.js';
export type { RouterFn } from './ShapesPlugin.js';

// Base classes
export { BaseShape, BaseNode, LOD } from './BaseShape.js';
export type { AnimSlot } from './BaseShape.js';
export { BaseConnector, BaseEdge } from './BaseConnector.js';
export { BaseSolid } from './BaseSolid.js';

// Animation registry + default instance
export { AnimationRegistry } from './AnimationRegistry.js';
export type { AnimationHandler } from './AnimationRegistry.js';
export { defaultRegistry } from './handlers/index.js';
export type {
  BreatheOptions,
  ColorCycleOptions,
  FadeInOptions,
  PulseOptions,
  MarchingAntsOptions,
  DashedFlowOptions,
  BorderGlowOptions,
} from './handlers/index.js';
export type { ElementAnimations } from './spec/animations.js';

// DrawContext (interface only)
export type { DrawContext } from './DrawContext.js';

// Spec types
export type {
  Point,
  BBox,
  PathCommand,
  ArrowSpec,
  RouterFn as RouterFnType,
  ConnectorFn,
  RouterContext,
  DrawStyle,
  PathStyle,
  BaseShapeSpec,
  BaseConnectorSpec,
  // Backward-compat aliases
  BaseNodeSpec,
  BaseEdgeSpec,
} from './spec/index.js';

// Concrete shape types
export { CircleShape, CircleNode }   from './shapes/CircleShape.js';
export { RectShape, RectNode }       from './shapes/RectShape.js';
export { EllipseShape, EllipseNode } from './shapes/EllipseShape.js';
export { PolygonShape, PolygonNode } from './shapes/PolygonShape.js';
export { DiamondShape, DiamondNode } from './shapes/DiamondShape.js';
export { StarShape, StarNode }       from './shapes/StarShape.js';
export { HexagonShape, HexagonNode } from './shapes/HexagonShape.js';
export type { CircleShapeSpec, CircleNodeSpec }   from './shapes/CircleShape.js';
export type { RectShapeSpec, RectNodeSpec }       from './shapes/RectShape.js';
export type { EllipseShapeSpec, EllipseNodeSpec } from './shapes/EllipseShape.js';
export type { PolygonShapeSpec, PolygonNodeSpec } from './shapes/PolygonShape.js';
export type { DiamondShapeSpec, DiamondNodeSpec } from './shapes/DiamondShape.js';
export type { StarShapeSpec, StarNodeSpec }       from './shapes/StarShape.js';
export type { HexagonShapeSpec, HexagonNodeSpec } from './shapes/HexagonShape.js';

// Concrete connectors
export { StraightConnector }   from './connectors/StraightConnector.js';
export { BezierConnector }     from './connectors/BezierConnector.js';
export { OrthogonalConnector } from './connectors/OrthogonalConnector.js';
export { QuadraticConnector }  from './connectors/QuadraticConnector.js';
export { RoundedConnector }    from './connectors/RoundedConnector.js';
export { SmoothConnector }     from './connectors/SmoothConnector.js';
export type { BezierConnectorSpec }                                    from './connectors/BezierConnector.js';
export type { OrthogonalConnectorSpec, OrthogonalRouteDirection }      from './connectors/OrthogonalConnector.js';
export type { QuadraticConnectorSpec }                                 from './connectors/QuadraticConnector.js';
export type { RoundedConnectorSpec }                                   from './connectors/RoundedConnector.js';
export type { SmoothConnectorSpec }                                    from './connectors/SmoothConnector.js';

// Built-in routers
export { normalRouter }    from './routers/NormalRouter.js';
export { orthRouter }      from './routers/OrthRouter.js';
export { oneSideRouter }   from './routers/OneSideRouter.js';
export { erRouter }        from './routers/ErRouter.js';
export { BUILTIN_ROUTERS } from './routers/builtins.js';
export type { OrthRouterArgs }    from './routers/OrthRouter.js';
export type { OneSideRouterArgs } from './routers/OneSideRouter.js';
export type { ErRouterArgs }      from './routers/ErRouter.js';

// Event classes
export {
  ShapeBaseEvent,
  ShapeDragBaseEvent,
  ShapeClickEvent,
  ShapeDblClickEvent,
  ShapeContextMenuEvent,
  ShapePointerOverEvent,
  ShapePointerOutEvent,
  ShapePointerMoveEvent,
  ShapePointerDownEvent,
  ShapePointerUpEvent,
  ShapeDragStartEvent,
  ShapeDragMoveEvent,
  ShapeDragEndEvent,
  ShapeStateChangeEvent,
  ShapeAddedEvent,
  ShapeRemovedEvent,
  // Backward-compat graph:* aliases
  GraphBaseEvent,
  GraphDragBaseEvent,
  GraphClickEvent,
  GraphDblClickEvent,
  GraphContextMenuEvent,
  GraphPointerOverEvent,
  GraphPointerOutEvent,
  GraphPointerMoveEvent,
  GraphPointerDownEvent,
  GraphPointerUpEvent,
  GraphDragStartEvent,
  GraphDragMoveEvent,
  GraphDragEndEvent,
  GraphStateChangeEvent,
  GraphAddedEvent,
  GraphRemovedEvent,
} from './ShapeEvents.js';
export type {
  ShapeEventFields,
  ShapeDragEventFields,
  ShapeStateChangeFields,
  ShapeLifecycleFields,
  GraphEventFields,
  GraphDragEventFields,
  GraphStateChangeFields,
  GraphLifecycleFields,
} from './ShapeEvents.js';

// ShapeObject (for advanced use)
export { ShapeObject, GraphObject } from './ShapeObject.js';
export type { AnyShapeObject, AnyGraphObject } from './ShapeObject.js';

// ── CanvasEventMap augmentation ───────────────────────────────────────────────
export {} from './events-augment.js';
