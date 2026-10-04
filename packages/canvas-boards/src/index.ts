// @invana/canvas-boards — canvas panels for the design kit's `@invana/boards`.
// See rfc:feat-2026-10-05-a-board-cannot-hold-a-canvas.

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
