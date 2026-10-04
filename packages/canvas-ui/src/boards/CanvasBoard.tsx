import { useMemo } from 'react';
import { Board, type BoardProps, type PanelRegistry } from '@invana/boards';

import { CanvasBoardProvider, type ResolveCanvasData } from './provider';
import { CanvasInspectorPanel } from './panels/CanvasInspectorPanel';
import { CanvasLayersPanel } from './panels/CanvasLayersPanel';
import { CanvasPanel } from './panels/CanvasPanel';
import { CanvasTablePanel } from './panels/CanvasTablePanel';
import type { CanvasPanelKinds } from './types';

/**
 * Every panel kind this package adds, for a board's `registry`. Each renderer
 * needs a {@link CanvasBoardProvider} above it — {@link CanvasBoard} brings one;
 * with the kit's `BoardPages`, wrap it in a provider yourself.
 */
export const CANVAS_PANELS: PanelRegistry = {
  canvas: CanvasPanel,
  'canvas-inspector': CanvasInspectorPanel,
  'canvas-layers': CanvasLayersPanel,
  'canvas-table': CanvasTablePanel,
};

/** Props of {@link CanvasBoard}: the kit `Board`'s, plus how to resolve graphs. */
export interface CanvasBoardProps extends BoardProps<CanvasPanelKinds> {
  /** Resolves each `canvas` panel's `dataRef`. Keep the reference stable. */
  resolveData: ResolveCanvasData;
}

/**
 * A design-kit `Board` that can hold canvases: the kit's board, with
 * {@link CANVAS_PANELS} registered under any `registry` you pass, inside its own
 * {@link CanvasBoardProvider}. A board of only kit panels is a dashboard; add a
 * `canvas` panel and its inspector / layers / table panels bind to it.
 *
 * ```tsx
 * <CanvasBoard
 *   resolveData={(ref) => graphs[ref]}
 *   spec={{
 *     rows: [
 *       { panels: [{ id: 'g', kind: 'canvas', options: { dataRef: 'team', inspect: true } }] },
 *       { panels: [{ id: 't', kind: 'canvas-table', title: 'Nodes', options: {} }] },
 *     ],
 *     inspector: { spec: { rows: [{ panels: [{ id: 'i', kind: 'canvas-inspector', options: {} }] }] } },
 *   }}
 * />
 * ```
 */
export function CanvasBoard({ resolveData, registry, ...board }: CanvasBoardProps) {
  const merged = useMemo(() => ({ ...CANVAS_PANELS, ...registry }), [registry]);
  return (
    <CanvasBoardProvider resolveData={resolveData}>
      <Board<CanvasPanelKinds> registry={merged} {...board} />
    </CanvasBoardProvider>
  );
}
