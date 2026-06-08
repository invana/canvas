// UI building blocks. The toolbar layer is now data-driven: the `ToolbarItems`
// renderer compiles `ToolbarItem[]` (produced by the builder hooks) straight to
// `@invana/ui` chrome — there are no per-control wrapper components anymore.
// `Panel` positions overlays; `Tooltipped` is the shared tooltip helper;
// `PropertiesEditor` / `PropertiesViewer` / `GraphHintBar` / `ContextMenuOverlay`
// are standalone panels, not toolbar controls.

export { Panel } from './Panel';
export type { PanelProps } from './Panel';
export { ToolbarItems } from './ToolbarItems';
export type { ToolbarItemsProps } from './ToolbarItems';
export type {
  ToolbarItem,
  ToolbarButtonItem,
  ToolbarToggleItem,
  ToolbarSelectItem,
  ToolbarDividerItem,
  ToolbarCustomItem,
} from './ToolbarItem';
export { Tooltipped } from './Tooltipped';
export type { TooltippedProps } from './Tooltipped';
export { PropertiesEditor } from './PropertiesEditor';
export type { PropertiesEditorProps, PropertiesEditorValues } from './PropertiesEditor';
export { PropertiesViewer } from './PropertiesViewer';
export type { PropertiesViewerProps, PropertiesViewerRow } from './PropertiesViewer';
export { GraphHintBar, DEFAULT_GRAPH_HINTS, DEFAULT_MAGNET_HINTS } from './GraphHintBar';
export type { GraphHintBarProps } from './GraphHintBar';
export { StatusBar } from './StatusBar';
export type { StatusBarProps } from './StatusBar';
export { ContextMenuOverlay } from './ContextMenuOverlay';
export type { ContextMenuOverlayProps } from './ContextMenuOverlay';

export type { ToolbarIcon, PanelPosition, TooltipSide } from './types';
