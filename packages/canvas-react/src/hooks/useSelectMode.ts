import { useCallback, useEffect, useRef, useState } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseSelectModeOptions {
  /** Initially-active mode key. Default: first key of `behaviourIds`. */
  initial?: string;
  /** Optional key → human label map for a picker. Default: identity. */
  labels?: Record<string, string>;
}

export interface UseSelectModeResult {
  /** Currently-active mode key. */
  mode: string;
  /** Key → label map for a picker. */
  modeOptions: Record<string, string>;
  /** Switch mode: enables that mode's behaviour, disables the others. */
  setMode: (mode: string) => void;
}

/**
 * Mutually-exclusive selection-mode switch. Maps mode keys to behaviour ids
 * (e.g. `{ click: 'click-select', brush: 'brush-select', lasso: 'lasso-select' }`)
 * and toggles their `enabled` so exactly one is active. The consumer must have
 * registered those behaviours; this hook can't be turnkey.
 *
 * The initial mode is enabled on mount. Memoize `behaviourIds` (module scope or
 * `useMemo`) so `setMode` stays stable.
 */
export function useSelectMode(
  behaviourIds: Record<string, string>,
  options: UseSelectModeOptions = {},
  canvas?: EngineCanvas | null,
): UseSelectModeResult {
  const resolved = useResolvedCanvas(canvas);
  const keys = Object.keys(behaviourIds);
  const [mode, setModeState] = useState(options.initial ?? keys[0] ?? '');
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const setMode = useCallback(
    (next: string) => {
      for (const [key, id] of Object.entries(behaviourIds)) {
        const behaviour = resolved.behaviours.get(id);
        if (!behaviour) continue;
        if (key === next) behaviour.enable();
        else behaviour.disable();
      }
      setModeState(next);
    },
    [resolved, behaviourIds],
  );

  // Enable the initial mode (and disable the rest) once the canvas is resolved.
  useEffect(() => {
    setMode(modeRef.current);
    // setMode is recreated when behaviourIds identity changes; re-syncing then
    // is harmless. Intentionally not depending on `mode`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMode]);

  const modeOptions = options.labels ?? Object.fromEntries(keys.map((k) => [k, k]));

  return { mode, modeOptions, setMode };
}
