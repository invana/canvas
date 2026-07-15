import { forwardRef } from 'react';
import { Canvas as EngineCanvas } from '@invana/canvas';

import { CanvasContext } from './CanvasContext';
import { CanvasHost, useCanvasEngine, type CanvasRootProps } from './useCanvasEngine';

/** Props for {@link Canvas} — see {@link CanvasRootProps}. */
export type CanvasProps = CanvasRootProps;

/**
 * React root for the **base** canvas engine (`@invana/canvas`'s `Canvas`).
 * Renders a sized host `<div>`, creates a `Canvas` on mount, calls
 * `init({ container, ...opts })`, and provides the live instance to descendants
 * via {@link CanvasContext} (read with `useCanvas()`).
 *
 * Use this for a **non-graph** canvas — custom layers, shapes, generic
 * behaviours. Every base layer/behaviour/layout wrapper (they read `useCanvas`)
 * works under it; a `<GraphLayer>` will too, but there's **no** graph context
 * and **no** `config.activeLayout` auto-run — reach for {@link GraphCanvas} when
 * you want those (it's a strict superset).
 *
 * `forwardRef`'d — `ref.current` is the underlying `Canvas` (or `null` until
 * init resolves). StrictMode-safe (see {@link useCanvasEngine}).
 *
 * @example
 * ```tsx
 * const ref = useRef<Canvas>(null);
 * <Canvas ref={ref} autoResize>
 *   <DragPanBehaviour />
 *   <WheelZoomBehaviour />
 * </Canvas>
 * ```
 */
export const Canvas = forwardRef<EngineCanvas, CanvasProps>(function Canvas(
  { children, style, className, config, ...engineOpts },
  ref,
) {
  const { canvas, hostRef } = useCanvasEngine<EngineCanvas>(
    (opts) => new EngineCanvas(opts),
    engineOpts,
    config,
    ref,
  );

  return (
    <CanvasHost hostRef={hostRef} className={className} style={style}>
      {canvas && <CanvasContext.Provider value={canvas}>{children}</CanvasContext.Provider>}
    </CanvasHost>
  );
});
