import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Canvas as EngineCanvas, type CanvasOptions } from '@invana/canvas';

import { CanvasContext } from './CanvasContext';

export interface CanvasProps extends Omit<CanvasOptions, 'container'> {
  /**
   * JSX children — layer / behaviour / layout wrappers. They aren't mounted
   * until the engine has finished initialising, so child effects can assume
   * `useCanvas()` returns a live, initialised engine.
   */
  children?: ReactNode;
  /** Inline style on the host `<div>`. Defaults to `width: '100%', height: '100%'`. */
  style?: CSSProperties;
  /** Class name on the host `<div>`. */
  className?: string;
}

/**
 * React root for the canvas engine. Renders a sized host `<div>`, creates an
 * `EngineCanvas` once on mount, calls `init({ container, ...opts })`, and
 * provides the initialised instance to descendants via {@link CanvasContext}.
 *
 * The component is `forwardRef`'d — `ref.current` is the underlying
 * `EngineCanvas` (or `null` until init resolves). Use it as the imperative
 * escape hatch: `ref.current?.layers.get(...)`, `ref.current?.events.tap(...)`,
 * `ref.current?.camera.fitContent(...)`.
 *
 * StrictMode-safe: the init promise is guarded by a cancelled flag so a
 * double-mount cleans up the partially-initialised engine.
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<EngineCanvas>(null);
 *
 * <Canvas ref={canvasRef} autoResize>
 *   <DragPanBehaviour />
 *   <WheelZoomBehaviour />
 *   <GraphLayer id="graph" data={data} />
 *   <D3ForceLayout targetLayerId="graph" />
 * </Canvas>
 * ```
 */
export const Canvas = forwardRef<EngineCanvas, CanvasProps>(function Canvas(
  { children, style, className, ...engineOpts },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<EngineCanvas | null>(null);

  // Engine options change rarely; we only read them on first init. Capture
  // them in a ref so the init effect runs exactly once (StrictMode aside).
  const optsRef = useRef(engineOpts);
  optsRef.current = engineOpts;

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let cancelled = false;
    const engine = new EngineCanvas();

    void engine
      .init({ container, ...optsRef.current })
      .then(() => {
        if (cancelled) {
          engine.destroy();
          return;
        }
        setCanvas(engine);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // Surface init failures to the console — there's no React-idiomatic
          // way to throw from a useEffect promise.
          // eslint-disable-next-line no-console
          console.error('[canvas-react] Canvas.init() failed:', err);
        }
      });

    return () => {
      cancelled = true;
      setCanvas(null);
      if (engine.isInitialised) engine.destroy();
    };
    // Init is intentionally one-shot. Reactive props (other than `children`)
    // are not supported in v0 — recreate the <Canvas> with a key to re-init.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `ref.current` is typed as `EngineCanvas | null` because React's `Ref<T>`
  // already permits null on `.current`; we surface the live value (null until
  // init resolves, then the initialised engine) with a cast that satisfies
  // useImperativeHandle's `R extends T` constraint.
  useImperativeHandle(ref, () => canvas as EngineCanvas, [canvas]);

  return (
    <div
      ref={hostRef}
      className={className}
      // `position: relative` makes the host the positioned ancestor that child
      // overlays (`<Panel>`, `<CanvasControlsToolbar>`, the turnkey toolbars) pin to.
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      {canvas && <CanvasContext.Provider value={canvas}>{children}</CanvasContext.Provider>}
    </div>
  );
});
