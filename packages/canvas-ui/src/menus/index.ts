// Graph context menus — target-scoped right-click menus that wire a
// `ContextMenuBehaviour` + `ContextMenuOverlay` into a single declarative
// component. One per target (node / edge / background); compose freely.

export { GraphContextMenu } from './GraphContextMenu';
export type { GraphContextMenuProps } from './GraphContextMenu';

export { GraphNodeContextMenu } from './GraphNodeContextMenu';
export type { GraphNodeContextMenuProps, GraphNodeMenuContext } from './GraphNodeContextMenu';

export { GraphEdgeContextMenu } from './GraphEdgeContextMenu';
export type { GraphEdgeContextMenuProps, GraphEdgeMenuContext } from './GraphEdgeContextMenu';

export { GraphBackgroundContextMenu } from './GraphBackgroundContextMenu';
export type {
  GraphBackgroundContextMenuProps,
  GraphBackgroundMenuContext,
} from './GraphBackgroundContextMenu';

export type {
  GraphContextMenuCommonProps,
  GraphContextMenuContext,
  GraphTargetMenuContext,
} from './GraphContextMenuBase';
