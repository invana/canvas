import type { PanelRendererProps } from '@invana/boards';
import { ElementViewPanel } from '../../view-panels/element';

import { useBoardCanvas } from '../provider';
import type { CanvasInspectorPanelOptions } from '../types';

/**
 * `kind: "canvas-inspector"` — the node or edge last clicked on a board canvas,
 * read-only. canvas-ui's `ElementViewPanel`, bound to the canvas named
 * by `canvasId`; the canvas records every click.
 */
export function CanvasInspectorPanel({ options }: PanelRendererProps<CanvasInspectorPanelOptions>) {
  const canvas = useBoardCanvas(options.canvasId);
  if (!canvas) {
    return <p className="text-muted-foreground p-3 text-base">Waiting for the canvas…</p>;
  }
  return (
    <ElementViewPanel
      canvas={canvas}
      layerId={options.layerId ?? 'graph'}
      {...(options.focusZoom !== undefined ? { focusZoom: options.focusZoom } : {})}
    />
  );
}
