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
 *
 * Pass an `action` starting with `edit:` (e.g. `'edit:settings:layers:background'`)
 * to mark the write as a **user edit**, which `canvas.history` records so it can
 * be undone. Without one the write is programmatic config and isn't recorded.
 */
export function useGraphCanvasUpdate(): (patch: CanvasConfig, action?: string) => void {
  const canvas = useCanvas();
  return useCallback((patch: CanvasConfig, action?: string) => canvas.update(patch, action), [canvas]);
}
