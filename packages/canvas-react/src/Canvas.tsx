import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { type CanvasConfig, type CanvasOptions } from '@invana/canvas';
import { GraphCanvas } from '@invana/graph';

import { CanvasContext } from './CanvasContext';
import { GraphCanvasContext } from './GraphCanvasContext';

export interface CanvasProps extends Omit<CanvasOptions, 'container' | 'config'> {
  /**
   * Serialisable config keyed by instance id — the same `canvasOptions` shape
   * the imperative engine uses (`{ layers, behaviours, layouts, activeLayout }`,
   * settings only, no class refs). The classes are registered by the JSX
   * `children` (one minimal wrapper per id); this object supplies all their
   * settings, applied **after** the children register and re-applied when it
   * changes. `behaviours.<id>.enabled` is authoritative (overrides the wrapper
   * default). Keep this object stable/memoised; for live edits use
   * `useGraphCanvasUpdate()`.
   */
  config?: CanvasConfig;
  /**
   * JSX children — layer / behaviour / layout wrappers, plus UI chrome
   * (panels, toolbars, providers, context menus). Engine wrappers aren't
   * mounted until the engine has finished initialising, so child effects can
   * assume `useCanvas()` / `useGraphCanvas()` return a live, initialised engine.
   */
  children?: ReactNode;
  /** Inline style on the host `<div>`. Defaults to `width: '100%', height: '100%'`. */
  style?: CSSProperties;
  /** Class name on the host `<div>`. */
  className?: string;
}

/**
 * React root for the canvas engine. Renders a sized host `<div>`, creates a
 * `GraphCanvas` once on mount, calls `init({ container, ...opts })`, and
 * provides the initialised instance to descendants via {@link CanvasContext}.
 *
 * The component is `forwardRef`'d — `ref.current` is the underlying
 * `GraphCanvas` (or `null` until init resolves). Use it as the imperative
 * escape hatch: `ref.current?.layers.get(...)`, `ref.current?.events.tap(...)`,
 * `ref.current?.camera.fitContent(...)`.
 *
 * StrictMode-safe: the init promise is guarded by a cancelled flag so a
 * double-mount cleans up the partially-initialised canvas.
 *
 * @example
 * ```tsx
 * const canvasRef = useRef<GraphCanvas>(null);
 *
 * <Canvas ref={canvasRef} autoResize>
 *   <DragPanBehaviour />
 *   <WheelZoomBehaviour />
 *   <GraphLayer id="graph" data={data} />
 *   <D3ForceLayout targetLayerId="graph" />
 * </Canvas>
 * ```
 */
export const Canvas = forwardRef<GraphCanvas, CanvasProps>(function Canvas(
  { children, style, className, config, ...engineOpts },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

  // Engine options change rarely; we only read them on first init. Capture
  // them in a ref so the init effect runs exactly once (StrictMode aside).
  const optsRef = useRef(engineOpts);
  optsRef.current = engineOpts;

  // Bumped to force a full re-init (destroy → new engine). Currently driven by
  // the experimental-WebGPU render-crash fallback below.
  const [remountNonce, setRemountNonce] = useState(0);
  // Once the engine reports a WebGPU render crash we pin the backend to WebGL
  // for every subsequent (re-)init, so we don't crash straight into it again.
  const forcedPreferenceRef = useRef<'webgl' | undefined>(undefined);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let cancelled = false;
    let offFallback: (() => void) | undefined;
    // `GraphCanvas` (a `Canvas` superset) so `config.activeLayout` auto-runs.
    // With no layouts/activeLayout it behaves exactly like the base canvas.
    const instance = new GraphCanvas();
    // Force WebGL after a WebGPU render-crash fallback; otherwise honour the prop.
    const preference = forcedPreferenceRef.current ?? optsRef.current.preference;

    void instance
      .init({ container, ...optsRef.current, ...(preference ? { preference } : {}) })
      .then(() => {
        if (cancelled) {
          instance.destroy();
          return;
        }
        // The engine emits this once if the experimental WebGPU renderer crashes
        // at render time, having already halted its render loop. Pin WebGL and
        // remount — a clean re-init on the tested single-seed path.
        offFallback = instance.events.on('canvas:renderer:fallback', () => {
          forcedPreferenceRef.current = 'webgl';
          setRemountNonce((n) => n + 1);
        });
        setCanvas(instance);
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
      offFallback?.();
      setCanvas(null);
      if (instance.isInitialised) instance.destroy();
    };
    // Init is one-shot per `remountNonce`. Reactive props (other than `children`)
    // aren't supported — recreate the <Canvas> with a key to re-init; the nonce
    // is the engine-driven re-init channel (WebGPU→WebGL fallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remountNonce]);

  // Apply the serialisable `config` AFTER the engine is ready and the JSX
  // children have registered their instances. React flushes child effects
  // before this parent effect, so every id named in `config` already exists on
  // the engine — `update()` fans options to each instance by id (and wires
  // `activeLayout`). `enabled` is applied authoritatively (the wrapper's
  // default-enabled is overridden here). Re-runs if `config` changes identity.
  useEffect(() => {
    if (!canvas || !config) return;
    canvas.update(config);
    for (const [id, opts] of Object.entries(config.behaviours ?? {})) {
      canvas.behaviours.setEnabled(id, !!(opts as { enabled?: boolean }).enabled);
    }
  }, [canvas, config]);

  // `ref.current` is typed as `GraphCanvas | null` because React's `Ref<T>`
  // already permits null on `.current`; we surface the live value (null until
  // init resolves, then the initialised canvas) with a cast that satisfies
  // useImperativeHandle's `R extends T` constraint.
  useImperativeHandle(ref, () => canvas as GraphCanvas, [canvas]);

  return (
    <div
      ref={hostRef}
      className={className}
      // `position: relative` makes the host the positioned ancestor that child
      // overlays (`<Panel>`, `<CanvasControlsToolbar>`, the turnkey toolbars) pin to.
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      {canvas && (
        <CanvasContext.Provider value={canvas}>
          <GraphCanvasContext.Provider value={canvas}>{children}</GraphCanvasContext.Provider>
        </CanvasContext.Provider>
      )}
    </div>
  );
});
