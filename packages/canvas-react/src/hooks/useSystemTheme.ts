import { useEffect } from 'react';
import type { CanvasConfig } from '@invana/canvas';

import { useCanvas } from '../CanvasContext';

/**
 * Watch `prefers-color-scheme` and push the matching config patch on each flip.
 *
 * The engine is theme-agnostic — it holds one concrete config and knows nothing
 * about light/dark. This hook is the *external* piece: give it two
 * {@link CanvasConfig} patches and it calls `canvas.update(prefersDark ? dark :
 * light)` immediately and on every OS-scheme change. Replaces the deleted
 * in-engine `mode:'auto'` / `{light,dark}` machinery.
 *
 * `light` / `dark` should be stable (module-level or memoised) — the effect
 * re-subscribes when they change identity.
 */
export function useSystemTheme(light: CanvasConfig, dark: CanvasConfig): void {
  const canvas = useCanvas();
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const run = (): void => canvas.update(mq.matches ? dark : light);
    run();
    mq.addEventListener('change', run);
    return () => mq.removeEventListener('change', run);
  }, [canvas, light, dark]);
}
