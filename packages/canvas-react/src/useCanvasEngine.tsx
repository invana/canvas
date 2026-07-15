import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import type { Canvas, CanvasConfig, CanvasOptions } from '@invana/canvas';

/**
 * Props shared by the React canvas roots (`<Canvas>` / `<GraphCanvas>`). They
 * differ only in the engine class they instantiate and the contexts they
 * provide — the prop surface is identical.
 */
export interface CanvasRootProps extends Omit<CanvasOptions, 'container' | 'config'> {
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
   * assume `useCanvas()` (and, under `<GraphCanvas>`, `useGraphCanvas()`)
   * return a live, initialised engine.
   */
  children?: ReactNode;
  /** Inline style on the host `<div>`. Defaults to `width: '100%', height: '100%'`. */
  style?: CSSProperties;
  /** Class name on the host `<div>`. */
  className?: string;
}

/**
 * Shared engine lifecycle for the React canvas roots. Instantiates `T` (a
 * `Canvas` or subclass) via `makeInstance`, runs the StrictMode-safe `init`,
 * handles the experimental-WebGPU render-crash fallback (pin WebGL + remount),
 * applies the serialisable `config` once the JSX children have registered, and
 * forwards the live instance on `ref`.
 *
 * `<Canvas>` and `<GraphCanvas>` differ **only** in the `makeInstance` factory
 * and which contexts they wrap the children in — every bit of engine plumbing
 * lives here, so the two components stay a thin factory + provider shell.
 *
 * Telemetry is passed to `makeInstance` (the engine wires it in its
 * *constructor*, which builds the store) — not via `init()`.
 */
export function useCanvasEngine<T extends Canvas>(
  makeInstance: (opts: CanvasOptions) => T,
  engineOpts: Omit<CanvasOptions, 'container' | 'config'>,
  config: CanvasConfig | undefined,
  ref: Ref<T>,
): { canvas: T | null; hostRef: RefObject<HTMLDivElement> } {
  const hostRef = useRef<HTMLDivElement>(null);
  const [canvas, setCanvas] = useState<T | null>(null);

  // Engine options change rarely; we only read them on first init. Capture them
  // in a ref so the init effect runs exactly once (StrictMode aside).
  const optsRef = useRef(engineOpts);
  optsRef.current = engineOpts;

  // Bumped to force a full re-init (destroy → new engine). Driven by the
  // experimental-WebGPU render-crash fallback below.
  const [remountNonce, setRemountNonce] = useState(0);
  // Once the engine reports a WebGPU render crash we pin the backend to WebGL
  // for every subsequent (re-)init, so we don't crash straight into it again.
  const forcedPreferenceRef = useRef<'webgl' | undefined>(undefined);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let cancelled = false;
    let offFallback: (() => void) | undefined;
    // Telemetry rides the constructor (it builds the store); everything else
    // goes to `init()`.
    const instance = makeInstance(
      optsRef.current.telemetry ? { telemetry: optsRef.current.telemetry } : {},
    );
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
    // aren't supported — recreate the root with a key to re-init; the nonce is
    // the engine-driven re-init channel (WebGPU→WebGL fallback).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remountNonce]);

  // Apply the serialisable `config` AFTER the engine is ready and the JSX
  // children have registered their instances. React flushes child effects before
  // this parent effect, so every id named in `config` already exists on the
  // engine — `update()` fans options to each instance by id (and, on a
  // `GraphCanvas`, wires `activeLayout`). `enabled` is applied authoritatively.
  useEffect(() => {
    if (!canvas || !config) return;
    canvas.update(config);
    for (const [id, opts] of Object.entries(config.behaviours ?? {})) {
      canvas.behaviours.setEnabled(id, !!(opts as { enabled?: boolean }).enabled);
    }
  }, [canvas, config]);

  // `ref.current` surfaces the live value (null until init resolves, then the
  // initialised canvas); the cast satisfies useImperativeHandle's `R extends T`.
  useImperativeHandle(ref, () => canvas as T, [canvas]);

  return { canvas, hostRef };
}

/**
 * The sized, positioned host `<div>` both roots render into. `position: relative`
 * makes it the positioned ancestor that child overlays (`<Panel>`, the toolbars)
 * pin to.
 */
export function CanvasHost({
  hostRef,
  className,
  style,
  children,
}: {
  hostRef: RefObject<HTMLDivElement>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: '100%', height: '100%', position: 'relative', ...style }}
    >
      {children}
    </div>
  );
}
