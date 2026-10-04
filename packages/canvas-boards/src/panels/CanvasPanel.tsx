import { useCallback, useMemo } from 'react';
import type { PanelRendererProps } from '@invana/boards';
import { ClickInspectBehaviour } from '@invana/canvas-react';
import { GraphCanvasAppRoot, GraphCanvasAppSurface } from '@invana/canvas-ui';
import type { GraphCanvas } from '@invana/graph';

import { useCanvasBoardContext } from '../provider';
import { DEFAULT_CANVAS_ID, type CanvasPanelOptions } from '../types';

/** Default canvas height, in px — see {@link CanvasPanelOptions.height}. */
const DEFAULT_HEIGHT = 520;

/**
 * `kind: "canvas"` — a live graph canvas on a board.
 *
 * The engine half of `GraphCanvasApp` (`GraphCanvasAppRoot` + `GraphCanvasAppSurface`):
 * the same bundle, config defaults, theme sync and keyboard scope, and none of the
 * app's chrome, because the board draws its own. Resolves its graph from
 * `dataRef` and registers its engine under `canvasId` so the board's other
 * canvas panels can bind to it.
 */
export function CanvasPanel({ options }: PanelRendererProps<CanvasPanelOptions>) {
  const board = useCanvasBoardContext('canvas');
  const canvasId = options.canvasId ?? DEFAULT_CANVAS_ID;
  const { resolveData, register } = board;
  const data = useMemo(() => resolveData(options.dataRef), [resolveData, options.dataRef]);
  const onReady = useCallback((canvas: GraphCanvas | null) => register(canvasId, canvas), [register, canvasId]);

  if (!data) {
    return (
      <p className="text-muted-foreground p-3 text-base">
        No graph for <span className="font-mono">{options.dataRef}</span>.
      </p>
    );
  }

  return (
    <GraphCanvasAppRoot
      data={data}
      config={options.config}
      bundle={options.bundle ?? true}
      onReady={onReady}
      height={options.height ?? DEFAULT_HEIGHT}
      {...(options.preference ? { preference: options.preference } : {})}
    >
      <GraphCanvasAppSurface>
        {options.inspect ? (
          <ClickInspectBehaviour id="click-inspect" targetLayerId={options.layerId ?? 'graph'} />
        ) : null}
      </GraphCanvasAppSurface>
    </GraphCanvasAppRoot>
  );
}
