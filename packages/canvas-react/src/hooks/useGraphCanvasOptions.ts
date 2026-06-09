import { useCallback, useEffect, useState } from 'react';
import type { CanvasConfig } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

/**
 * Subscribe to the canvas's serialisable config. Returns
 * `[options, update]` — `options` is the current {@link CanvasConfig} snapshot
 * (`canvas.get()`), kept in sync via the `options:change` bus event, and
 * `update` is the same patcher as {@link useGraphCanvasUpdate}. Drive a
 * settings UI from this.
 */
export function useGraphCanvasOptions(): [CanvasConfig, (patch: CanvasConfig) => void] {
  const canvas = useCanvas();
  const [options, setOptions] = useState<CanvasConfig>(() => canvas.get());

  useEffect(() => {
    setOptions(canvas.get());
    return canvas.events.on('options:change', () => setOptions(canvas.get()));
  }, [canvas]);

  const update = useCallback((patch: CanvasConfig) => canvas.update(patch), [canvas]);
  return [options, update];
}
