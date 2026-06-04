import { useCallback, useEffect, useState } from 'react';
import type { Canvas as EngineCanvas, BackgroundLayer, BackgroundLayerOptions } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

type PatternType = NonNullable<BackgroundLayerOptions['patternType']>;

export interface UseGridOptions {
  /** Id of the `BackgroundLayer` to toggle. Default `'background'`. */
  backgroundLayerId?: string;
  /**
   * Pattern to switch to when the grid is shown. When omitted, the layer's
   * existing `patternType` is preserved (only `type` is toggled).
   */
  patternType?: PatternType;
}

export interface UseGridResult {
  /** Whether the background pattern (grid/dots/lines) is currently shown. */
  showGrid: boolean;
  /** Toggle the grid on/off. */
  toggleGrid: () => void;
  /** Set the grid on/off explicitly. */
  setGrid: (on: boolean) => void;
}

/**
 * Toggle a `BackgroundLayer`'s pattern on/off. "Grid shown" maps to
 * `type: 'pattern'`, "hidden" to `type: 'solid'`. Pass `patternType` to force a
 * specific pattern (e.g. `'grid'`) when turning it on; otherwise the layer's
 * configured pattern is kept.
 *
 * State is owned by the hook (the background layer emits no option-change event)
 * and seeded from `getOptions()` on mount.
 */
export function useGrid(
  options: UseGridOptions = {},
  canvas?: EngineCanvas | null,
): UseGridResult {
  const { backgroundLayerId = 'background', patternType } = options;
  const resolved = useResolvedCanvas(canvas);
  const [showGrid, setShowGrid] = useState(false);

  useEffect(() => {
    const layer = resolved.layers.get<BackgroundLayer>(backgroundLayerId);
    if (layer) setShowGrid(layer.getOptions().type === 'pattern');
  }, [resolved, backgroundLayerId]);

  const setGrid = useCallback(
    (on: boolean) => {
      const layer = resolved.layers.get<BackgroundLayer>(backgroundLayerId);
      if (!layer) return;
      const next: Partial<BackgroundLayerOptions> = { type: on ? 'pattern' : 'solid' };
      if (on && patternType) next.patternType = patternType;
      layer.setOptions(next);
      setShowGrid(on);
    },
    [resolved, backgroundLayerId, patternType],
  );

  const toggleGrid = useCallback(() => setGrid(!showGrid), [setGrid, showGrid]);

  return { showGrid, toggleGrid, setGrid };
}
