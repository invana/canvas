import { createContext, useContext } from 'react';
import type { Canvas } from '@invana/canvas';

/**
 * Holds the initialised engine `Canvas` for all descendant child wrappers.
 * `<Canvas>` only renders children once the engine is ready, so the context
 * value inside a wrapper is always non-null.
 */
export const CanvasContext = createContext<Canvas | null>(null);

/**
 * Read the engine `Canvas` from context. Throws when used outside a
 * `<Canvas>` so misuse fails loudly during render instead of silently
 * skipping the effect that would have registered a layer or behaviour.
 */
export function useCanvas(): Canvas {
  const canvas = useContext(CanvasContext);
  if (!canvas) {
    throw new Error('useCanvas() must be called inside a <Canvas> component');
  }
  return canvas;
}
