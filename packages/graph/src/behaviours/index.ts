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
  ClickSelectEventMap,
  SelectableElement,
  SelectableElementType,
  SelectDirection,
  SelectModifierKey,
  SelectionSnapshot,
} from './ClickSelectBehaviour';

export { ClickInspectBehaviour } from './ClickInspectBehaviour';
export type {
  ClickInspectBehaviourOptions,
  ClickInspectEventMap,
  InspectTarget,
} from './ClickInspectBehaviour';

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

export { ContextMenuBehaviour } from './ContextMenuBehaviour';
export type {
  ContextMenuBehaviourOptions,
  ContextMenuEvent,
  ContextMenuTargetType,
} from './ContextMenuBehaviour';

export { CreateNodeBehaviour } from './CreateNodeBehaviour';
export type { CreateNodeBehaviourOptions } from './CreateNodeBehaviour';

export { DrawEdgeBehaviour } from './DrawEdgeBehaviour';
export type { DrawEdgeBehaviourOptions } from './DrawEdgeBehaviour';

export { EraseBehaviour } from './EraseBehaviour';
export type { EraseBehaviourOptions, EraseTargetKind, ErasedElement } from './EraseBehaviour';

export { CollapseExpandBehaviour, GROUP_TOGGLE_SLOT } from './CollapseExpandBehaviour';
export type { CollapseExpandBehaviourOptions } from './CollapseExpandBehaviour';

export { NodeResizeBehaviour } from './NodeResizeBehaviour';
export type { NodeResizeBehaviourOptions } from './NodeResizeBehaviour';

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

export { DegreeSizeBehaviour } from './DegreeSizeBehaviour';
export type {
  DegreeSizeBehaviourOptions,
  DegreeSizeScale,
} from './DegreeSizeBehaviour';
