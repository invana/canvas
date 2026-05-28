import { useEffect, useRef } from 'react';
import type { Canvas as EngineCanvas, CanvasGlobalEvents } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

/**
 * Subscribe to a typed canvas-wide event (`camera:zoom`, `camera:pan`,
 * `layer:added`, …) for the lifetime of the calling component. Fully typed off
 * the engine's exported {@link CanvasGlobalEvents} map.
 *
 * The handler is held in a ref so changing it between renders does **not** tear
 * down and re-create the subscription; only a change of the resolved `canvas`
 * (or the `event` name) does. That keeps subscriptions stable and — because the
 * effect is keyed on the resolved instance — correct across multiple canvases.
 *
 * @param event   Event name from {@link CanvasGlobalEvents}.
 * @param handler Fired with the event payload.
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
export function useCanvasEvent<E extends keyof CanvasGlobalEvents>(
  event: E,
  handler: (payload: CanvasGlobalEvents[E]) => void,
  canvas?: EngineCanvas | null,
): void {
  const resolved = useResolvedCanvas(canvas);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    // `on` returns an unsubscribe fn — return it straight as the cleanup.
    return resolved.events.on(event, (payload) => handlerRef.current(payload));
  }, [resolved, event]);
}
