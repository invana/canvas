// @invana/graph — public API surface
//
// GraphLayer + MiniMapLayer + behaviours per `architecture-proposal.md` §5.
// GraphStore is the data layer composing `@invana/canvas` ColumnStore.

export {
  GraphStore,
  type EdgeDirection,
  type GraphEdge,
  type GraphNode,
  type GraphStoreEventMap,
  type GraphStoreOptions,
  type Vec2,
} from './store';

export {
  GraphLayer,
  MiniMapLayer,
  type MiniMapLayerOptions,
  type MiniMapPosition,
  type EdgeAnchor,
  type EdgePathType,
  type EdgeRenderHints,
  type EdgeStateConfig,
  type GraphData,
  type GraphLayerEvents,
  type GraphLayerOptions,
  type NodeRenderHints,
  type NodeShapeKind,
  type NodeStateConfig,
} from './layer';

export {
  HoverActivateBehaviour,
  type HoverActivateBehaviourOptions,
  type HoverableElement,
  type HoverableElementType,
  type HoverDirection,
  ClickSelectBehaviour,
  type ClickSelectBehaviourOptions,
  type SelectableElement,
  type SelectableElementType,
  type SelectDirection,
  type SelectModifierKey,
  type SelectionSnapshot,
  BrushSelectBehaviour,
  type BrushSelectBehaviourOptions,
  type BrushSelectElementType,
  type BrushSelectStyle,
  type BrushModifierKey,
  LassoSelectBehaviour,
  type LassoSelectBehaviourOptions,
  type LassoSelectElementType,
  type LassoSelectStyle,
  type LassoModifierKey,
  DragNodeBehaviour,
  type DragNodeBehaviourOptions,
  LabelCollisionBehaviour,
  type LabelCollisionBehaviourOptions,
  type LabelCollisionStrategy,
  type LabelPriorityResolver,
  LabelResolutionLODBehaviour,
  type LabelResolutionLODBehaviourOptions,
  NodeSizeLODBehaviour,
  type NodeSizeLODBehaviourOptions,
  type NodeSizeLODConfig,
  EdgeSizeLODBehaviour,
  type EdgeSizeLODBehaviourOptions,
  type EdgeSizeLODConfig,
} from './behaviours';

export type { NodeLabelHint, EdgeLabelHint } from './layer';
