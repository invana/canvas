// ── element-plugin public exports ─────────────────────────────────────────────

// Main plugin
export { ElementPlugin } from './ElementPlugin.js';
export type { GraphPluginOptions, NodeCtor, EdgeCtor } from './ElementPlugin.js';

// Base classes
export { BaseNode, LOD } from './BaseSolid.js';
export type { AnimSlot } from './BaseSolid.js';
export { BaseEdge } from './BaseConnector.js';

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

// DrawContext (interface only — PixiDrawContext is internal)
export type { DrawContext } from './DrawContext.js';

// Spec types
export type {
  Point,
  BBox,
  PathCommand,
  ArrowSpec,
  RouterFn,
  ConnectorFn,
  RouterContext,
  DrawStyle,
  PathStyle,
  BaseNodeSpec,
  BaseEdgeSpec,
} from './spec/index.js';
// Legacy aliases (for backward compat with stories importing from @invana/canvas)
export type { Point as ElementPoint, BBox as ElementBBox } from './spec/index.js';

// Concrete solid elements
export { CircleElement }   from './elements/CircleElement.js';
export { RectElement }     from './elements/RectElement.js';
export { EllipseElement }  from './elements/EllipseElement.js';
export { PolygonElement }  from './elements/PolygonElement.js';
export { DiamondElement }  from './elements/DiamondElement.js';
export { StarElement }     from './elements/StarElement.js';
export { HexagonElement }  from './elements/HexagonElement.js';
export type { CircleElementSpec }  from './elements/CircleElement.js';
export type { RectElementSpec }    from './elements/RectElement.js';
export type { EllipseElementSpec } from './elements/EllipseElement.js';
export type { PolygonElementSpec } from './elements/PolygonElement.js';
export type { DiamondElementSpec } from './elements/DiamondElement.js';
export type { StarElementSpec }    from './elements/StarElement.js';
export type { HexagonElementSpec } from './elements/HexagonElement.js';

// Concrete connectors
export { StraightConnector }   from './connectors/StraightConnector.js';
export { BezierConnector }     from './connectors/BezierConnector.js';
export { OrthogonalConnector } from './connectors/OrthogonalConnector.js';
export { QuadraticConnector }  from './connectors/QuadraticConnector.js';
export { RoundedConnector }    from './connectors/RoundedConnector.js';
export { SmoothConnector }     from './connectors/SmoothConnector.js';
export type { BezierConnectorSpec }       from './connectors/BezierConnector.js';
export type { OrthogonalConnectorSpec, OrthogonalRouteDirection } from './connectors/OrthogonalConnector.js';
export type { QuadraticConnectorSpec } from './connectors/QuadraticConnector.js';
export type { RoundedConnectorSpec }   from './connectors/RoundedConnector.js';
export type { SmoothConnectorSpec }    from './connectors/SmoothConnector.js';

// Built-in routers
export { normalRouter }  from './routers/NormalRouter.js';
export { orthRouter }    from './routers/OrthRouter.js';
export { oneSideRouter } from './routers/OneSideRouter.js';
export { erRouter }      from './routers/ErRouter.js';
export { BUILTIN_ROUTERS } from './routers/builtins.js';
export type { OrthRouterArgs }    from './routers/OrthRouter.js';
export type { OneSideRouterArgs } from './routers/OneSideRouter.js';
export type { ErRouterArgs }      from './routers/ErRouter.js';

// Event classes (base + concrete)
export {
  ElementBaseEvent,
  ElementDragBaseEvent,
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
} from './ElementEvents.js';
export type {
  ElementEventFields,
  ElementDragEventFields,
  ElementStateChangeFields,
  ElementLifecycleFields,
} from './ElementEvents.js';

// ElementObject (for advanced use — e.g. plugin-graph hit-testing)
export { ElementObject } from './ElementObject.js';
export type { AnyElement } from './ElementObject.js';

// ── GraphDataPlugin (high-level API) ──────────────────────────────────────────
export { GraphDataPlugin } from './GraphDataPlugin.js';
export type {
  INodeData,
  IEdgeData,
  ICanvasData,
  IGraphStyles,
  INodeStyle,
  IEdgeStyle,
  GraphDataPluginOptions,
  NodeShape,
  EdgePathType,
} from './graph-types.js';

// ── CanvasEventMap augmentation ───────────────────────────────────────────────
// Extends @invana/canvas CanvasEventMap with graph:* events.
export {} from './events-augment.js';
