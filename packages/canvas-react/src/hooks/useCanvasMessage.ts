import { useCallback, useEffect, useRef, useState } from 'react';
import type { Canvas as EngineCanvas } from '@invana/canvas';

import { useResolvedCanvas } from './useResolvedCanvas';

export interface UseCanvasMessageResult {
  /** The message currently showing, or `null` when none is. */
  message: string | null;
  /** Show a message. With `timeout` (ms) it auto-clears after that delay. */
  showMessage: (text: string, timeout?: number) => void;
  /** Clear the current message. */
  clearMessage: () => void;
}

/**
 * Read + drive the shared canvas message channel from React. Subscribes to the
 * engine's `message` event (emitted by `Canvas.showMessage` — from anywhere:
 * layouts, behaviours, app code) and tracks the current line, auto-clearing it
 * when a `timeout` was given. `showMessage` / `clearMessage` delegate to the
 * engine so a push from React reaches every other subscriber too.
 *
 * Resolves the engine from the (lifted) `CanvasContext` or an explicit `canvas`
 * arg — works from a `<Canvas>` descendant or app-shell chrome.
 */
export function useCanvasMessage(canvas?: EngineCanvas | null): UseCanvasMessageResult {
  const resolved = useResolvedCanvas(canvas);
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearTimer = (): void => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    const off = resolved.events.on('message', ({ text, timeout }) => {
      clearTimer();
      setMessage(text);
      if (text !== null && timeout && timeout > 0) {
        timer.current = setTimeout(() => setMessage(null), timeout);
      }
    });
    return () => {
      clearTimer();
      off();
    };
  }, [resolved]);

  const showMessage = useCallback(
    (text: string, timeout?: number) => resolved.showMessage(text, timeout),
    [resolved],
  );
  const clearMessage = useCallback(() => resolved.clearMessage(), [resolved]);

  return { message, showMessage, clearMessage };
}
