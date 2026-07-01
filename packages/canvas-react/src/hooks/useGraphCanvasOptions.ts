import { useCallback, useMemo } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { CanvasView } from '@invana/canvas-store';

import { useCanvas } from '../CanvasContext';
import { useStore } from './useStore';

/** Module-scope (stable) selector — the syncable config slice. */
const selectDefinition = (s: CanvasView) => s.definition;

/**
 * Subscribe to the canvas's serialisable config. Returns `[options, update]` —
 * `options` is the current {@link CanvasConfig}, read **reactively** from
 * `store.view.definition` (the source of truth) via {@link useStore}, so the
 * component re-renders only when the config slice actually changes (no coarse
 * `options:change` bus copy). `update` is the same patcher as
 * {@link useGraphCanvasUpdate}. Drive a settings UI from this.
 */
export function useGraphCanvasOptions(): [CanvasConfig, (patch: CanvasConfig) => void] {
  const canvas = useCanvas();
  const definition = useStore(canvas.store.view, selectDefinition);

  const options = useMemo<CanvasConfig>(
    () => ({
      layers: definition.layers,
      behaviours: definition.behaviours,
      layouts: definition.layouts,
      ...(definition.activeLayout !== null ? { activeLayout: definition.activeLayout } : {}),
    }),
    [definition],
  );

  const update = useCallback((patch: CanvasConfig) => canvas.update(patch), [canvas]);
  return [options, update];
}
