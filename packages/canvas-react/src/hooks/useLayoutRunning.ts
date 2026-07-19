import type { Canvas } from '@invana/canvas';
import type { CanvasView } from '@invana/canvas-store';

import { useResolvedCanvas } from './useResolvedCanvas';
import { useStore } from './useStore';

/** Module-scope (stable) selector — the reactive layout-run flag. */
const selectLayoutRunning = (s: CanvasView) => s.runtime.layout.running;

/**
 * Subscribe to whether a layout is **currently running** on the canvas, read
 * reactively from `store.view.runtime.layout.running` (the engine's source of
 * truth, written by {@link Canvas.runLayout} around every run — the initial
 * `config.activeLayout` load run included). Re-renders only when the flag flips.
 *
 * This is the engine-wide status, so it's `true` while the load-time layout is
 * still settling — unlike a UI's own local "did I just apply a layout" state.
 * Use it to keep a run/stop control consistent with what the engine is actually
 * doing. Pair with {@link Canvas.stopLayout} to cancel the active run.
 *
 * Resolves the engine from `CanvasContext` or an explicit `canvas` arg
 * (multi-canvas-safe), mirroring the other hooks.
 */
export function useLayoutRunning(canvas?: Canvas | null): boolean {
  const resolved = useResolvedCanvas(canvas);
  return useStore(resolved.store.view, selectLayoutRunning);
}
