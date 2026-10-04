import type { PanelRendererProps } from '@invana/boards';
import { LayersViewPanel } from '../../view-panels/layers';

import { useBoardCanvas } from '../provider';
import type { CanvasLayersPanelOptions } from '../types';

/**
 * `kind: "canvas-layers"` — a board canvas's layers, element types and elements,
 * with visibility toggles. canvas-ui's `LayersViewPanel`, bound to `canvasId`.
 */
export function CanvasLayersPanel({ options }: PanelRendererProps<CanvasLayersPanelOptions>) {
  const canvas = useBoardCanvas(options.canvasId);
  if (!canvas) {
    return <p className="text-muted-foreground p-3 text-base">Waiting for the canvas…</p>;
  }
  return <LayersViewPanel canvas={canvas} />;
}
