// ── @invana/plugins-graph-data public exports ─────────────────────────────────

// Internal rendering plugin
export { GraphPlugin } from './GraphPlugin.js';
export type { GraphPluginOptions, NodeCtor, EdgeCtor } from './GraphPlugin.js';

// Base classes
export { BaseNode, LOD } from './BaseNode.js';
export type { AnimSlot } from './BaseNode.js';
export { BaseEdge } from './BaseEdge.js';

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

// Concrete node types
export { CircleNode }   from './nodes/CircleNode.js';
export { RectNode }     from './nodes/RectNode.js';
export { EllipseNode }  from './nodes/EllipseNode.js';
export { PolygonNode }  from './nodes/PolygonNode.js';
export { DiamondNode }  from './nodes/DiamondNode.js';
export { StarNode }     from './nodes/StarNode.js';
export { HexagonNode }  from './nodes/HexagonNode.js';
export type { CircleNodeSpec }  from './nodes/CircleNode.js';
export type { RectNodeSpec }    from './nodes/RectNode.js';
export type { EllipseNodeSpec } from './nodes/EllipseNode.js';
export type { PolygonNodeSpec } from './nodes/PolygonNode.js';
export type { DiamondNodeSpec } from './nodes/DiamondNode.js';
export type { StarNodeSpec }    from './nodes/StarNode.js';
export type { HexagonNodeSpec } from './nodes/HexagonNode.js';

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
} from './GraphEvents.js';
export type {
  GraphEventFields,
  GraphDragEventFields,
  GraphStateChangeFields,
  GraphLifecycleFields,
} from './GraphEvents.js';

// GraphObject (for advanced use — e.g. plugin-graph hit-testing)
export { GraphObject } from './GraphObject.js';
export type { AnyGraphObject } from './GraphObject.js';

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
