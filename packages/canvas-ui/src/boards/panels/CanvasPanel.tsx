import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PanelRendererProps } from '@invana/boards';
import type { GraphCanvas } from '@invana/graph';

import { GraphBoard } from '../../board/GraphBoard';
import type { TypeStylingPatch } from '../../view-panels/styling/types';
import { useCanvasBoardContext } from '../provider';
import { DEFAULT_CANVAS_ID, type CanvasPanelOptions } from '../types';

/**
 * `kind: "canvas"` — the whole {@link GraphBoard} as one panel of a board: its
 * modes, rail, minimap, menus and keys, sized by the panel.
 *
 * Resolves its graph from `dataRef` and registers its engine under `canvasId`,
 * so the board's `canvas-inspector` / `canvas-layers` / `canvas-table` panels
 * bind to it. It has no height of its own: put it in a `fill` row and it takes
 * what the board's other rows leave.
 *
 * `styling` is where the board starts — each type's colour and label, an edge
 * type dashed. What a viewer changes in the Styling rail stays on this panel
 * and is not written back to the spec.
 */
export function CanvasPanel({ options }: PanelRendererProps<CanvasPanelOptions>) {
  const board = useCanvasBoardContext('canvas');
  const canvasId = options.canvasId ?? DEFAULT_CANVAS_ID;
  const { resolveData, register } = board;
  const data = useMemo(() => resolveData(options.dataRef), [resolveData, options.dataRef]);
  const onReady = useCallback((canvas: GraphCanvas | null) => register(canvasId, canvas), [register, canvasId]);

  // The spec's styling seeds the board; a new spec styling replaces the viewer's.
  const seed = JSON.stringify(options.styling ?? {});
  const [styling, setStyling] = useState<TypeStylingPatch>(() => options.styling ?? {});
  useEffect(() => setStyling(JSON.parse(seed) as TypeStylingPatch), [seed]);

  if (!data) {
    return (
      <p className="text-muted-foreground p-3 text-base">
        No graph for <span className="font-mono">{options.dataRef}</span>.
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1">
      <GraphBoard
        data={data}
        styling={styling}
        onStylingChange={setStyling}
        defaultPanel={options.defaultPanel ?? null}
        onReady={onReady}
        {...(options.config ? { config: options.config } : {})}
        {...(options.preference ? { preference: options.preference } : {})}
      />
    </div>
  );
}
