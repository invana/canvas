import { useCallback } from 'react';
import type { CanvasConfig } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

/**
 * Returns a stable `update(patch)` bound to the canvas in context. `patch` is a
 * {@link CanvasConfig} slice keyed by instance id — deep-merged into the held
 * config and fanned to each instance's `setOptions` (and re-wires `activeLayout`
 * on a `GraphCanvas`). The serialisable counterpart to driving the engine
 * imperatively; use it for live edits (theme toggle, GUI controls) over a
 * `<Canvas config={…}>`.
 */
export function useGraphCanvasUpdate(): (patch: CanvasConfig) => void {
  const canvas = useCanvas();
  return useCallback((patch: CanvasConfig) => canvas.update(patch), [canvas]);
}
