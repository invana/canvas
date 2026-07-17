// Canvas-aware hooks — resolve the engine from instance-scoped CanvasContext
// (or an explicit instance) and subscribe to engine events. These are what let
// presets / custom toolbars "just work" from context, multi-canvas-safe.

export { useCamera } from './useCamera';
export type { UseCameraResult } from './useCamera';
export { useZoom } from './useZoom';
export type { UseZoomResult } from './useZoom';
export { useFitContent } from './useFitContent';
export type { UseFitContentResult } from './useFitContent';
export { useCanvasImageExport } from './useCanvasImageExport';
export type { UseCanvasImageExportResult, DownloadImageExportOptions } from './useCanvasImageExport';
export { useCanvasStateJson } from './useCanvasStateJson';
export type { UseCanvasStateJsonResult, CanvasStateSource } from './useCanvasStateJson';
export { useCanvasEvent } from './useCanvasEvent';
export { useGraphEvent } from './useGraphEvent';
export type { GraphEventMap, UseGraphEventOptions } from './useGraphEvent';
export { useStore } from './useStore';
export { useClearGraph } from './useClearGraph';
export type { UseClearGraphResult } from './useClearGraph';
export { useSelection } from './useSelection';
export type { UseSelectionOptions, UseSelectionResult } from './useSelection';
export { useInspectTarget } from './useInspectTarget';
export type { UseInspectTargetOptions } from './useInspectTarget';
export { useViewTarget } from './useViewTarget';
export type { UseViewTargetOptions } from './useViewTarget';
export { useHoverElementPreview } from './useHoverElementPreview';
export type { UseHoverElementPreviewOptions } from './useHoverElementPreview';
export { useViewData } from './useViewData';
export type { UseViewDataOptions, ViewData } from './useViewData';
export { useViewContext } from './useViewContext';
export type { ViewContext } from './useViewContext';
export { useHistory } from './useHistory';
export type { UseHistoryOptions, UseHistoryResult } from './useHistory';
export { useClipboard } from './useClipboard';
export type { UseClipboardOptions, UseClipboardResult } from './useClipboard';
export { useGrid } from './useGrid';
export type { UseGridOptions, UseGridResult } from './useGrid';
export { useLayout } from './useLayout';
export type { ApplicableLayout, LayoutFactory, UseLayoutOptions, UseLayoutResult } from './useLayout';
export { useSelectMode } from './useSelectMode';
export type { UseSelectModeOptions, UseSelectModeResult } from './useSelectMode';
export { useEdgeType, DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS } from './useEdgeType';
export type { UseEdgeTypeOptions, UseEdgeTypeResult } from './useEdgeType';
export { useLock } from './useLock';
export type { UseLockOptions, UseLockResult } from './useLock';
export { useTool } from './useTool';
export { useDrawHistory } from './useDrawHistory';
export type { UseDrawHistoryResult } from './useDrawHistory';
export { useEntityEditor } from './useEntityEditor';
export type { UseEntityEditorOptions, EntityEditorTarget } from './useEntityEditor';
export { useContextMenu } from './useContextMenu';
export type { ContextMenuState, UseContextMenuResult } from './useContextMenu';

// Canvas-message channel — read + drive the shared footer message line. Backed
// by the engine's `Canvas.showMessage`, so a push reaches every subscriber and
// engine code (layouts / behaviours) can emit too.
export { useCanvasMessage } from './useCanvasMessage';
export type { UseCanvasMessageResult } from './useCanvasMessage';

// Serialisable-config hooks — patch / read the canvas's `CanvasConfig` by id.
// Theming is owned by the engine's `ThemeBehaviour` (the sole publisher); drive
// it via `canvas.update({ behaviours: { theme: … } })`.
export { useGraphCanvasUpdate } from './useGraphCanvasUpdate';
export { useGraphCanvasOptions } from './useGraphCanvasOptions';
export { useDevTool } from './useDevTool';
export type { UseDevToolOptions, UseDevToolResult } from './useDevTool';
export { useMiniMap } from './useMiniMap';
export type { UseMiniMapOptions, UseMiniMapResult } from './useMiniMap';

// Section hooks — each returns the `ToolbarItem[]` for one logical toolbar
// section (off the raw operation hooks). Concatenate sections with `divider`s
// and render via `ToolbarItems`; or skip these and hand-build items from the
// raw hooks for full control.
export { useHistorySection } from './useHistorySection';
export type { UseHistorySectionOptions } from './useHistorySection';
export { useEditorSection } from './useEditorSection';
export type { UseEditorSectionOptions, EditorItemKey } from './useEditorSection';
export { useViewSection } from './useViewSection';
export type { UseViewSectionOptions } from './useViewSection';
export { useLayoutsSection } from './useLayoutsSection';
export type { UseLayoutsSectionOptions } from './useLayoutsSection';
export { useStyleEditorSection } from './useStyleEditorSection';
export type { UseStyleEditorSectionOptions } from './useStyleEditorSection';
