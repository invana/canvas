import { useCallback, useMemo } from 'react';
import type { Canvas, BackgroundLayerOptions } from '@invana/canvas';

import { useCommandStates } from './useCommandStates';
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
 * Background grid toggle, through the `background.grid` command — the same
 * command a saved control panel binds to, so a toolbar and a panel always agree.
 * `showGrid` follows the definition (every write path), not hook-local state.
 */
export function useGrid(
  options: UseGridOptions = {},
  canvas?: Canvas | null,
): UseGridResult {
  const { backgroundLayerId = 'background', patternType } = options;
  const resolved = useResolvedCanvas(canvas);
  const args = useMemo(
    () => ({ layerId: backgroundLayerId, ...(patternType ? { patternType } : {}) }),
    [backgroundLayerId, patternType],
  );
  const refs = useMemo(() => [{ command: 'background.grid', args }], [args]);
  const { states, run } = useCommandStates(refs, resolved);
  const showGrid = states[0]?.active ?? false;

  const setGrid = useCallback(
    (on: boolean) => {
      // The command toggles; only run it when the state would change.
      if (resolved.commands.isActive('background.grid', args) !== on) run('background.grid', args);
    },
    [resolved, run, args],
  );
  const toggleGrid = useCallback(() => void run('background.grid', args), [run, args]);

  return { showGrid, toggleGrid, setGrid };
}
