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
