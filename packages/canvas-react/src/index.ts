// @invana/canvas-react — public API surface
//
// Declarative React bindings for `@invana/canvas`. The package itself is a
// thin layer: `<Canvas>` owns the engine instance, child components register
// layers / behaviours / layouts via React context.
//
// See `CLAUDE.md` in this package for the wrapper-authoring pattern.

export { Canvas } from './Canvas';
export type { CanvasProps } from './Canvas';
export { GraphCanvas } from './GraphCanvas';
export type { GraphCanvasProps } from './GraphCanvas';
export type { CanvasRootProps } from './useCanvasEngine';

// ─── App (batteries-included composition) ────────────────────────────────────
// `GraphCanvasApp` — one composable graph app. The header / main / footer
// regions are an internal detail; configure them through the `header` / `main`
// / `footer` option bags (+ slots) on `GraphCanvasAppProps` — never by rendering
// the regions yourself, so the orchestrator's runtime wiring stays private.
export { GraphCanvasApp } from './apps/GraphCanvasApp';
export type {
  GraphCanvasAppProps,
  GraphCanvasAppControlContext,
  GraphCanvasAppSectionOptions,
  RegionSlot,
  ThemeKind,
  BottomSpan,
} from './apps/GraphCanvasApp';
export type { GraphCanvasAppHeaderOptions } from './apps/GraphCanvasAppHeader';
export type { GraphCanvasAppFooterOptions } from './apps/GraphCanvasAppFooter';

export { CanvasContext, useCanvas } from './CanvasContext';
export { GraphCanvasContext, useGraphCanvas } from './GraphCanvasContext';
// Re-exported for `<Canvas config={…}>` consumers — the serialisable, id-keyed
// settings shape (same as the imperative engine's `canvasOptions`).
export type { CanvasConfig } from '@invana/canvas';
// Renderer backend capability detection — re-exported from `@invana/canvas` so
// React consumers can gate a backend toggle / show a "WebGPU unavailable" notice
// without reaching past the bindings. The engine already auto-resolves the
// backend (`<Canvas preference>` downgrades off WebGPU when the API is absent);
// these are for UI that wants to reflect that. See `rendererSupport.ts` in
// `@invana/canvas`.
export {
  hasWebGPUApi,
  hasWebGL,
  canUseWebGPU,
  resolveRenderPreference,
  bestRenderPreference,
} from '@invana/canvas';
export type { RenderPreference } from '@invana/canvas';
export { HistoryContext } from './HistoryContext';
export { ClipboardContext } from './ClipboardContext';
export { ToolContext } from './ToolContext';
export type { GraphTool, ToolContextValue } from './ToolContext';

// ─── Providers ─────────────────────────────────────────────────────────────
// Construct engine-owned `GraphHistory` / `GraphClipboard` over a layer's store
// and surface them to descendant hooks / buttons via context. `GraphToolProvider`
// holds the active modelling tool (pure React state — no engine reference).
export { GraphHistoryProvider, GraphClipboardProvider, GraphToolProvider } from './providers';
export type {
  GraphHistoryProviderProps,
  GraphClipboardProviderProps,
  GraphToolProviderProps,
} from './providers';

// ─── Layers ──────────────────────────────────────────────────────────────
export { GraphLayer } from './layers/GraphLayer';
export type { GraphLayerProps } from './layers/GraphLayer';

export { BackgroundLayer } from './layers/BackgroundLayer';
export type { BackgroundLayerProps } from './layers/BackgroundLayer';

export { DevInfoLayer } from './layers/DevInfoLayer';
export type { DevInfoLayerProps } from './layers/DevInfoLayer';

export { MiniMapLayer } from './layers/MiniMapLayer';
export type { MiniMapLayerProps } from './layers/MiniMapLayer';

// ─── Behaviours ──────────────────────────────────────────────────────────
// Camera / canvas-scoped
export { DragPanBehaviour } from './behaviours/DragPanBehaviour';
export type { DragPanBehaviourProps } from './behaviours/DragPanBehaviour';

export { WheelZoomBehaviour } from './behaviours/WheelZoomBehaviour';
export type { WheelZoomBehaviourProps } from './behaviours/WheelZoomBehaviour';

export { PinchZoomBehaviour } from './behaviours/PinchZoomBehaviour';
export type { PinchZoomBehaviourProps } from './behaviours/PinchZoomBehaviour';

export { KeyboardCameraInputBehaviour } from './behaviours/KeyboardCameraInputBehaviour';
export type { KeyboardCameraInputBehaviourProps } from './behaviours/KeyboardCameraInputBehaviour';

// Graph-scoped
export { DragNodeBehaviour } from './behaviours/DragNodeBehaviour';
export type { DragNodeBehaviourProps } from './behaviours/DragNodeBehaviour';

export { ContextMenuBehaviour } from './behaviours/ContextMenuBehaviour';
export type { ContextMenuBehaviourProps } from './behaviours/ContextMenuBehaviour';

export { CreateNodeBehaviour } from './behaviours/CreateNodeBehaviour';
export type { CreateNodeBehaviourProps } from './behaviours/CreateNodeBehaviour';

export { DrawEdgeBehaviour } from './behaviours/DrawEdgeBehaviour';
export type { DrawEdgeBehaviourProps } from './behaviours/DrawEdgeBehaviour';

export { EraseBehaviour } from './behaviours/EraseBehaviour';
export type { EraseBehaviourProps } from './behaviours/EraseBehaviour';

export { HoverActivateBehaviour } from './behaviours/HoverActivateBehaviour';
export type { HoverActivateBehaviourProps } from './behaviours/HoverActivateBehaviour';

export { ClickSelectBehaviour } from './behaviours/ClickSelectBehaviour';
export type { ClickSelectBehaviourProps } from './behaviours/ClickSelectBehaviour';

export { ClickInspectBehaviour } from './behaviours/ClickInspectBehaviour';
export type { ClickInspectBehaviourProps } from './behaviours/ClickInspectBehaviour';
export { ClickViewBehaviour } from './behaviours/ClickViewBehaviour';
export type { ClickViewBehaviourProps } from './behaviours/ClickViewBehaviour';
export { HoverElementPreviewBehaviour } from './behaviours/HoverElementPreviewBehaviour';
export type { HoverElementPreviewBehaviourProps } from './behaviours/HoverElementPreviewBehaviour';
export { ColorByLabelBehaviour } from './behaviours/ColorByLabelBehaviour';
export type { ColorByLabelBehaviourProps } from './behaviours/ColorByLabelBehaviour';

export { ThemeBehaviour } from './behaviours/ThemeBehaviour';
export type { ThemeBehaviourProps } from './behaviours/ThemeBehaviour';

export { BrushSelectBehaviour } from './behaviours/BrushSelectBehaviour';
export type { BrushSelectBehaviourProps } from './behaviours/BrushSelectBehaviour';

export { LassoSelectBehaviour } from './behaviours/LassoSelectBehaviour';
export type { LassoSelectBehaviourProps } from './behaviours/LassoSelectBehaviour';

export { CollapseExpandBehaviour } from './behaviours/CollapseExpandBehaviour';
export type { CollapseExpandBehaviourProps } from './behaviours/CollapseExpandBehaviour';

export { NodeResizeBehaviour } from './behaviours/NodeResizeBehaviour';
export type { NodeResizeBehaviourProps } from './behaviours/NodeResizeBehaviour';

export { LabelCollisionBehaviour } from './behaviours/LabelCollisionBehaviour';
export type { LabelCollisionBehaviourProps } from './behaviours/LabelCollisionBehaviour';

export { TextResolutionLODBehaviour } from './behaviours/TextResolutionLODBehaviour';
export type { TextResolutionLODBehaviourProps } from './behaviours/TextResolutionLODBehaviour';

export { NodeScaleLODBehaviour } from './behaviours/NodeScaleLODBehaviour';
export type { NodeScaleLODBehaviourProps } from './behaviours/NodeScaleLODBehaviour';

export { EdgeScaleLODBehaviour } from './behaviours/EdgeScaleLODBehaviour';
export type { EdgeScaleLODBehaviourProps } from './behaviours/EdgeScaleLODBehaviour';

export { ParallelEdgeBehaviour } from './behaviours/ParallelEdgeBehaviour';
export type { ParallelEdgeBehaviourProps } from './behaviours/ParallelEdgeBehaviour';

export { NodeCentralityBehaviour } from './behaviours/NodeCentralityBehaviour';
export type { NodeCentralityBehaviourProps } from './behaviours/NodeCentralityBehaviour';
export { TextLODBehaviour } from './behaviours/TextLODBehaviour';
export type { TextLODBehaviourProps } from './behaviours/TextLODBehaviour';
export { IconLODBehaviour } from './behaviours/IconLODBehaviour';
export type { IconLODBehaviourProps } from './behaviours/IconLODBehaviour';
export { ImageLODBehaviour } from './behaviours/ImageLODBehaviour';
export type { ImageLODBehaviourProps } from './behaviours/ImageLODBehaviour';
export { EdgeLODBehaviour } from './behaviours/EdgeLODBehaviour';
export type { EdgeLODBehaviourProps } from './behaviours/EdgeLODBehaviour';

// ─── Layouts ─────────────────────────────────────────────────────────────
export { D3ForceLayout } from './layouts/D3ForceLayout';
export type { D3ForceLayoutProps } from './layouts/D3ForceLayout';

// ─── Hooks ───────────────────────────────────────────────────────────────
// Canvas-aware hooks for building custom toolbars / panels. Resolve the engine
// from CanvasContext (or an explicit instance) and subscribe to engine events.
export {
  useCamera,
  useZoom,
  useFitContent,
  useCanvasImageExport,
  useCanvasEvent,
  useGraphEvent,
  useStore,
  useClearGraph,
  useSelection,
  useInspectTarget,
  useViewTarget,
  useHoverElementPreview,
  useViewData,
  useViewContext,
  useHistory,
  useClipboard,
  useGrid,
  useLayout,
  useSelectMode,
  useEdgeType,
  DEFAULT_EDGE_TYPES,
  DEFAULT_EDGE_TYPE_LABELS,
  useLock,
  useTool,
  useDrawHistory,
  useEntityEditor,
  useContextMenu,
  useHistorySection,
  useEditorSection,
  useViewSection,
  useLayoutsSection,
  useStyleEditorSection,
  useGraphCanvasUpdate,
  useGraphCanvasOptions,
  useDevTool,
  useMiniMap,
  useCanvasMessage,
} from './hooks';
export type {
  GraphEventMap,
  UseGraphEventOptions,
  UseCameraResult,
  UseZoomResult,
  UseFitContentResult,
  UseCanvasImageExportResult,
  DownloadImageExportOptions,
  UseClearGraphResult,
  UseSelectionOptions,
  UseSelectionResult,
  UseInspectTargetOptions,
  UseViewTargetOptions,
  UseHoverElementPreviewOptions,
  UseViewDataOptions,
  ViewData,
  ViewContext,
  UseHistoryOptions,
  UseHistoryResult,
  UseClipboardOptions,
  UseClipboardResult,
  UseGridOptions,
  UseGridResult,
  UseLayoutOptions,
  UseLayoutResult,
  ApplicableLayout,
  LayoutFactory,
  UseSelectModeOptions,
  UseSelectModeResult,
  UseEdgeTypeOptions,
  UseEdgeTypeResult,
  UseLockOptions,
  UseLockResult,
  UseDrawHistoryResult,
  UseEntityEditorOptions,
  EntityEditorTarget,
  ContextMenuState,
  UseContextMenuResult,
  UseHistorySectionOptions,
  UseEditorSectionOptions,
  EditorItemKey,
  UseViewSectionOptions,
  UseLayoutsSectionOptions,
  UseStyleEditorSectionOptions,
  UseCanvasMessageResult,
  UseDevToolOptions,
  UseDevToolResult,
  UseMiniMapOptions,
  UseMiniMapResult,
} from './hooks';

// ─── Toolbars ──────────────────────────────────────────────────────────────
// `CanvasControlsToolbar` self-wires from context (React Flow's `<Controls>`);
// `GraphToolbar` is a turnkey layout/select/clear bar. Toolbar components carry
// the `*Toolbar` suffix.
export {
  CanvasControlsToolbar,
  GraphToolbar,
  GraphControlsToolbar,
  GraphControlsToolbarLite,
  HistoryToolbar,
  EditToolbar,
  ViewToolbar,
  GridToolbar,
  GraphLayoutToolbar,
  ModellerToolbar,
  ExportImageToolbar,
  ExportStateToolbar,
  ClearCanvasToolbar,
  InspectorPanel,
  NodeDetailView,
  EdgeDetailView,
  dockCardClassName,
  ThemeToggle,
} from './toolbars';
export type {
  CanvasControlsToolbarProps,
  GraphToolbarProps,
  GraphControlsToolbarProps,
  GraphControlsSections,
  HistoryToolbarProps,
  EditToolbarProps,
  ViewToolbarProps,
  GridToolbarProps,
  GraphLayoutToolbarProps,
  ModellerToolbarProps,
  ExportImageToolbarProps,
  ExportImageFormatKey,
  ExportStateToolbarProps,
  ClearCanvasToolbarProps,
  InspectorPanelProps,
  NodeDetailViewProps,
  EdgeDetailViewProps,
  BaseDetailViewProps,
  ThemeToggleProps,
} from './toolbars';

// ─── UI components (building blocks) ───────────────────────────────────────
// The toolbar layer is data-driven: the `ToolbarItems` renderer compiles
// `ToolbarItem[]` (from the builder hooks) straight to `@invana/ui` chrome — no
// per-control wrapper components. `Panel` positions overlays; `Tooltipped` is
// the shared tooltip helper; the rest are standalone panels.
export {
  Panel,
  PanelContent,
  ToolbarItems,
  applyIconOverrides,
  Tooltipped,
  ExportImagePanel,
  EXPORT_IMAGE_FORMAT_OPTIONS,
  EXPORT_IMAGE_AREA_OPTIONS,
  EXPORT_IMAGE_BACKGROUND_OPTIONS,
  EXPORT_IMAGE_SCALE_OPTIONS,
  EXPORT_IMAGE_RATIO_OPTIONS,
  ExportStatePanel,
  CanvasMessageBar,
  GraphStatusBar,
  PropertiesEditor,
  DetailCard,
  PropertyDetailView,
  EdgeEndpoints,
  defaultPropertyRenderers,
  resolvePropertyRenderer,
  renderPropertyValue,
  isSafeHref,
  isImageUrl,
  ContextMenuOverlay,
  HoverElementPreviewCard,
  CanvasSettingsBrowser,
} from './components';
export type {
  PanelProps,
  PanelContentProps,
  PanelPosition,
  CanvasSettingsBrowserProps,
  SettingsEditorDescriptor,
  SettingsEditorContext,
  SettingsSection,
  ToolbarItemsProps,
  ToolbarItem,
  ToolbarButtonItem,
  ToolbarToggleItem,
  ToolbarSelectItem,
  ToolbarDividerItem,
  ToolbarCustomItem,
  TooltippedProps,
  TooltipSide,
  ExportImagePanelProps,
  ExportImagePanelValue,
  ExportImagePanelOption,
  ExportImageAreaKey,
  ExportStatePanelProps,
  CanvasMessageBarProps,
  GraphStatusBarProps,
  PropertiesEditorProps,
  PropertiesEditorValues,
  DetailCardProps,
  DetailRow,
  PropertyDetailViewProps,
  EdgeEndpointsProps,
  EdgeEndpoint,
  PropertyRenderer,
  PropertyRenderContext,
  PropertyKind,
  ContextMenuOverlayProps,
  HoverElementPreviewCardProps,
  ToolbarIcon,
} from './components';

// ─── Context menus ───────────────────────────────────────────────────────────
// Target-scoped right-click menus — one per target (node / edge / background),
// each wiring a `ContextMenuBehaviour` + `ContextMenuOverlay`. Pass an `items`
// builder; dismissal + auto-close are handled internally. Compose freely.
export {
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
} from './menus';
export type {
  GraphNodeContextMenuProps,
  GraphNodeMenuContext,
  GraphEdgeContextMenuProps,
  GraphEdgeMenuContext,
  GraphBackgroundContextMenuProps,
  GraphBackgroundMenuContext,
  GraphContextMenuCommonProps,
  GraphContextMenuContext,
  GraphTargetMenuContext,
} from './menus';
