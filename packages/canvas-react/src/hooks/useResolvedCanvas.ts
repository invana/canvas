import { useContext } from 'react';
import type { Canvas } from '@invana/canvas';

import { CanvasContext } from '../CanvasContext';

/**
 * Resolve the engine `Canvas` a hook should act on. Prefers an explicit
 * instance (for the out-of-`<Canvas>` / multi-canvas-orchestration case), and
 * otherwise reads the instance-scoped {@link CanvasContext}. Throws only when
 * neither is available — so calling a canvas hook outside any `<Canvas>` and
 * without an explicit instance fails loudly instead of silently no-op'ing.
 *
 * This is what keeps every hook multi-canvas-safe: inside a `<Canvas>` tree the
 * context yields *that* instance; passing an explicit `canvas` targets a
 * specific one. There is no global fallback.
 */
export function useResolvedCanvas(explicit?: Canvas | null): Canvas {
  const fromContext = useContext(CanvasContext);
  const canvas = explicit ?? fromContext;
  if (!canvas) {
    throw new Error(
      'Canvas hooks need a <Canvas> ancestor, or an explicit `canvas` argument.',
    );
  }
  return canvas;
}
