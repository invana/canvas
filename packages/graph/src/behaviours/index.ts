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

export { ClickViewBehaviour } from './ClickViewBehaviour';
export type {
  ClickViewBehaviourOptions,
  ClickViewEventMap,
  ViewTarget,
} from './ClickViewBehaviour';

export { HoverElementPreviewBehaviour, resolvePreviewCard } from './HoverElementPreviewBehaviour';
export type {
  HoverElementPreviewBehaviourOptions,
  HoverElementPreviewCardSpec,
  HoverElementPreviewCardsByType,
  HoverElementPreviewEventMap,
  PreviewCardRow,
  PreviewFieldPath,
  PreviewImageSpec,
  PreviewPlacement,
  PreviewRowFormat,
  PreviewRowSpec,
  PreviewSnapshot,
  PreviewSubtitleSpec,
  PreviewTextSpec,
  ResolvedPreviewCard,
} from './HoverElementPreviewBehaviour';

export { ColorByBehaviour, DEFAULT_CATEGORY_PALETTE, DEFAULT_RANGE_STOPS } from './ColorByBehaviour';
export type {
  ColorByBehaviourOptions,
  ColorByLegendSection,
  ColorByMode,
  ColorByScale,
  ColorValueAccessor,
} from './ColorByBehaviour';

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

export { TextResolutionLODBehaviour } from './TextResolutionLODBehaviour';
export type { TextResolutionLODBehaviourOptions } from './TextResolutionLODBehaviour';

export { NodeScaleLODBehaviour } from './NodeScaleLODBehaviour';
export type {
  NodeScaleLODBehaviourOptions,
  NodeScaleLODConfig,
} from './NodeScaleLODBehaviour';

export { EdgeScaleLODBehaviour } from './EdgeScaleLODBehaviour';
export type {
  EdgeScaleLODBehaviourOptions,
  EdgeScaleLODConfig,
} from './EdgeScaleLODBehaviour';

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

export { NodeCentralityBehaviour } from './NodeCentralityBehaviour';
export type {
  NodeCentralityBehaviourOptions,
  NodeCentralityScale,
} from './NodeCentralityBehaviour';

export type {
  ContentLODBehaviourOptions,
  ZoomBand,
} from './ContentLODBehaviour';
export { TextLODBehaviour } from './TextLODBehaviour';
export type { TextLODBehaviourOptions } from './TextLODBehaviour';
export { IconLODBehaviour } from './IconLODBehaviour';
export type { IconLODBehaviourOptions } from './IconLODBehaviour';
export { ImageLODBehaviour } from './ImageLODBehaviour';
export type { ImageLODBehaviourOptions } from './ImageLODBehaviour';
export { EdgeLODBehaviour } from './EdgeLODBehaviour';
export type { EdgeLODBehaviourOptions, EdgeLODKeepBy } from './EdgeLODBehaviour';

export { ThemeBehaviour } from './ThemeBehaviour';
export type { ThemeBehaviourOptions } from './ThemeBehaviour';
