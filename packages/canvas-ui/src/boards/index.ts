// @invana/canvas-ui/boards — canvas panels for the design kit's `@invana/boards`.
// A separate entry point so the main barrel never imports `@invana/boards`
// (an optional peer). See rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas and
// rfc:feat-2026-10-05-canvas-board-is-a-separate-package.

export { CanvasBoard, CANVAS_PANELS } from './CanvasBoard';
export type { CanvasBoardProps } from './CanvasBoard';

export { CanvasBoardProvider, useBoardCanvas } from './provider';
export type { CanvasBoardProviderProps, ResolveCanvasData } from './provider';

export { CanvasPanel } from './panels/CanvasPanel';
export { CanvasInspectorPanel } from './panels/CanvasInspectorPanel';
export { CanvasLayersPanel } from './panels/CanvasLayersPanel';
export { CanvasTablePanel } from './panels/CanvasTablePanel';

export { DEFAULT_CANVAS_ID } from './types';
export type {
  CanvasPanelKinds,
  CanvasPanelOptions,
  CanvasInspectorPanelOptions,
  CanvasLayersPanelOptions,
  CanvasTablePanelOptions,
  CanvasTableColumn,
} from './types';
