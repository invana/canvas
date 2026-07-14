import { useCallback, useEffect, useMemo } from 'react';
import type { Canvas } from '@invana/canvas';
import type { CanvasView } from '@invana/canvas-store';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useStore } from './useStore';

/** Module-scope (stable) selector — the behaviour options slice of the definition. */
const selectBehaviours = (s: CanvasView) => s.definition.behaviours;

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
 * **Store-driven (single source of truth).** `mode` is *derived* from
 * `store.view.definition.behaviours[id].enabled` read reactively, and `setMode`
 * *writes* through `canvas.update({ behaviours })`. So the mode reflects — and
 * drives — the same state any other UI (e.g. a settings panel) reads/writes:
 * flip a tool in the panel and this picker follows, and vice-versa, with no
 * event wiring. The initial mode is enforced on mount. Memoize `behaviourIds`
 * (module scope or `useMemo`) so `setMode` stays stable.
 */
export function useSelectMode(
  behaviourIds: Record<string, string>,
  options: UseSelectModeOptions = {},
  canvas?: Canvas | null,
): UseSelectModeResult {
  const resolved = useResolvedCanvas(canvas);
  const keys = Object.keys(behaviourIds);

  // Derive the active mode from the store: the first mode whose behaviour is
  // enabled, else the mode with no behaviour (e.g. `click`), else the first key.
  const behaviours = useStore(resolved.store.view, selectBehaviours);
  const mode = useMemo(() => {
    for (const [key, id] of Object.entries(behaviourIds)) {
      if (id && (behaviours[id] as { enabled?: boolean } | undefined)?.enabled) return key;
    }
    return keys.find((k) => !behaviourIds[k]) ?? keys[0] ?? '';
  }, [behaviours, behaviourIds, keys]);

  // Switch mode by writing through `canvas.update` — updates the store
  // definition AND enables/disables the behaviours — so every observer stays in
  // sync (one write path, no direct `behaviour.enable()`).
  const setMode = useCallback(
    (next: string) => {
      const patch: Record<string, { enabled: boolean }> = {};
      for (const [key, id] of Object.entries(behaviourIds)) {
        if (id) patch[id] = { enabled: key === next };
      }
      resolved.update({ behaviours: patch });
    },
    [resolved, behaviourIds],
  );

  // Enforce the initial mode once on mount (disables the non-active tools).
  useEffect(() => {
    setMode(options.initial ?? keys[0] ?? '');
    // setMode is recreated only when behaviourIds identity changes; re-enforcing
    // then is harmless. Intentionally not depending on `mode` / `options`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setMode]);

  const modeOptions = options.labels ?? Object.fromEntries(keys.map((k) => [k, k]));

  return { mode, modeOptions, setMode };
}
