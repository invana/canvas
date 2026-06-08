// Canvas-aware hooks — resolve the engine from instance-scoped CanvasContext
// (or an explicit instance) and subscribe to engine events. These are what let
// presets / custom toolbars "just work" from context, multi-canvas-safe.

export { useCamera } from './useCamera';
export type { UseCameraResult } from './useCamera';
export { useZoom } from './useZoom';
export type { UseZoomResult } from './useZoom';
export { useFitContent } from './useFitContent';
export type { UseFitContentResult } from './useFitContent';
export { useCanvasEvent } from './useCanvasEvent';
export { useClearGraph } from './useClearGraph';
export type { UseClearGraphResult } from './useClearGraph';
export { useSelection } from './useSelection';
export type { UseSelectionOptions, UseSelectionResult } from './useSelection';
export { useInspectTarget } from './useInspectTarget';
export type { UseInspectTargetOptions } from './useInspectTarget';
export { useViewTarget } from './useViewTarget';
export type { UseViewTargetOptions } from './useViewTarget';
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
export { useTheme } from './useTheme';
export type { UseThemeOptions, UseThemeResult } from './useTheme';
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

// Section hooks — each returns the `ToolbarItem[]` for one logical toolbar
// section (off the raw operation hooks). Concatenate sections with `divider`s
// and render via `ToolbarItems`; or skip these and hand-build items from the
// raw hooks for full control.
export { useHistorySection } from './useHistorySection';
export type { UseHistorySectionOptions } from './useHistorySection';
export { useEditorSection } from './useEditorSection';
export type { UseEditorSectionOptions } from './useEditorSection';
export { useViewSection } from './useViewSection';
export type { UseViewSectionOptions, UseViewSectionIconSet } from './useViewSection';
export { useLayoutsSection } from './useLayoutsSection';
export type { UseLayoutsSectionOptions } from './useLayoutsSection';
export { useStyleEditorSection } from './useStyleEditorSection';
export type { UseStyleEditorSectionOptions } from './useStyleEditorSection';
