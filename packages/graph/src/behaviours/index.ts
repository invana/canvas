/**
 * Graph-domain behaviours. Each composes `@invana/canvas` `Behaviour` with
 * `GraphLayer` state mutation. None auto-enable — the developer registers
 * + enables explicitly (proposal §2.2).
 */

export { HoverActivateBehaviour } from './HoverActivateBehaviour';
export type {
  HoverActivateBehaviourOptions,
  HoverableElement,
  HoverableElementType,
  HoverDirection,
} from './HoverActivateBehaviour';

export { ClickSelectBehaviour } from './ClickSelectBehaviour';
export type {
  ClickSelectBehaviourOptions,
  SelectableElement,
  SelectableElementType,
  SelectDirection,
  SelectModifierKey,
  SelectionSnapshot,
} from './ClickSelectBehaviour';

export { BrushSelectBehaviour } from './BrushSelectBehaviour';
export type {
  BrushSelectBehaviourOptions,
  BrushSelectElementType,
  BrushSelectStyle,
  BrushModifierKey,
} from './BrushSelectBehaviour';

export { LassoSelectBehaviour } from './LassoSelectBehaviour';
export type {
  LassoSelectBehaviourOptions,
  LassoSelectElementType,
  LassoSelectStyle,
  LassoModifierKey,
} from './LassoSelectBehaviour';

export { DragNodeBehaviour } from './DragNodeBehaviour';
export type { DragNodeBehaviourOptions } from './DragNodeBehaviour';

export { LabelCollisionBehaviour } from './LabelCollisionBehaviour';
export type {
  LabelCollisionBehaviourOptions,
  LabelCollisionStrategy,
  LabelPriorityResolver,
} from './LabelCollisionBehaviour';

export { LabelResolutionLODBehaviour } from './LabelResolutionLODBehaviour';
export type { LabelResolutionLODBehaviourOptions } from './LabelResolutionLODBehaviour';

export { NodeSizeLODBehaviour } from './NodeSizeLODBehaviour';
export type {
  NodeSizeLODBehaviourOptions,
  NodeSizeLODConfig,
} from './NodeSizeLODBehaviour';

export { EdgeSizeLODBehaviour } from './EdgeSizeLODBehaviour';
export type {
  EdgeSizeLODBehaviourOptions,
  EdgeSizeLODConfig,
} from './EdgeSizeLODBehaviour';

export {
  ParallelEdgeBehaviour,
  centeredRanksPolicy,
} from './ParallelEdgeBehaviour';
export type {
  ParallelEdgeBasis,
  ParallelEdgeBehaviourOptions,
  ParallelEdgeDistribute,
  ParallelEdgeDistributeContext,
  ParallelEdgeGroup,
  ParallelEdgePatch,
} from './ParallelEdgeBehaviour';
