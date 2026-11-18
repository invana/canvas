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

/** Engine builds attempted before a failing `init()` is reported. */
const INIT_MAX_ATTEMPTS = 3;
/** Base delay between init attempts (multiplied by the attempt number). */
const INIT_RETRY_DELAY_MS = 300;
/** Consecutive renderer-fallback remounts allowed before giving up. */
const MAX_REMOUNTS = 3;
/** An engine alive this long resets the remount count. */
const REMOUNT_STABLE_MS = 15_000;

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
): { canvas: T | null; hostRef: RefObject<HTMLDivElement | null> } {
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
  // Consecutive engine-driven remounts; capped by {@link MAX_REMOUNTS}.
  const remountsRef = useRef(0);

  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;

    let cancelled = false;
    let offFallback: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stableTimer: ReturnType<typeof setTimeout> | undefined;
    let instance: T | undefined;
    // Force WebGL after a WebGPU render-crash fallback; otherwise honour the prop.
    const preference = forcedPreferenceRef.current ?? optsRef.current.preference;

    // One attempt = one fresh engine. Init can fail transiently (the GPU context
    // was evicted or lost while the backend was still starting), so a failed
    // attempt is torn down and retried a bounded number of times before the
    // error is surfaced.
    const start = (attempt: number): void => {
      // Telemetry rides the constructor (it builds the store); everything else
      // goes to `init()`.
      const inst = makeInstance(
        optsRef.current.telemetry ? { telemetry: optsRef.current.telemetry } : {},
      );
      instance = inst;
      void inst
        .init({ container, ...optsRef.current, ...(preference ? { preference } : {}) })
        .then(() => {
          if (cancelled) {
            inst.destroy();
            return;
          }
          // The engine emits this once if the renderer cannot continue (a WebGPU
          // render crash, or a WebGL context that was lost and not restored),
          // having already halted its render loop. Pin WebGL and remount — a
          // clean re-init. Capped, so a browser that cannot hold a context at all
          // stops here instead of flickering forever.
          offFallback = inst.events.on('canvas:renderer:fallback', () => {
            if (remountsRef.current >= MAX_REMOUNTS) {
              // eslint-disable-next-line no-console
              console.error(
                `[canvas-react] The renderer failed ${MAX_REMOUNTS} times in a row; not remounting again.`,
              );
              return;
            }
            remountsRef.current += 1;
            forcedPreferenceRef.current = 'webgl';
            setRemountNonce((n) => n + 1);
          });
          // A remount that holds for a while was a recovery, not a loop.
          stableTimer = setTimeout(() => {
            remountsRef.current = 0;
          }, REMOUNT_STABLE_MS);
          setCanvas(inst);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          // Release whatever the failed attempt acquired before trying again.
          try {
            if (inst.isInitialised) inst.destroy();
          } catch {
            /* a half-built engine may not tear down cleanly — nothing to recover */
          }
          if (attempt + 1 < INIT_MAX_ATTEMPTS) {
            retryTimer = setTimeout(() => {
              if (!cancelled) start(attempt + 1);
            }, INIT_RETRY_DELAY_MS * (attempt + 1));
            return;
          }
          // Surface init failures to the console — there's no React-idiomatic
          // way to throw from a useEffect promise.
          // eslint-disable-next-line no-console
          console.error('[canvas-react] Canvas.init() failed:', err);
        });
    };
    start(0);

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      clearTimeout(stableTimer);
      offFallback?.();
      setCanvas(null);
      if (instance?.isInitialised) instance.destroy();
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

  // An instance that registers after the config landed gets its slice back.
  // StrictMode remounts a newly mounted child — unregisters it and registers a
  // fresh instance built from props — but not this root, so the effect above
  // does not run again; a `key` change on a child does the same. The slice is
  // read from the definition, which also holds what was edited since. It lands
  // a microtask late, after the wrapper's own `enabled` write in the same flush.
  useEffect(() => {
    if (!canvas) return;
    const replay = (section: 'layers' | 'behaviours' | 'layouts', id: string): void => {
      queueMicrotask(() => {
        if (!canvas.isInitialised) return;
        const definition = canvas.store.view.getState().definition;
        const slice = definition[section][id];
        // The active layout is wired to an instance, so a new instance of it
        // is wired again — the old one was removed with its wiring.
        const active = section === 'layouts' && definition.activeLayout === id;
        if ((slice && Object.keys(slice).length > 0) || active) {
          canvas.update({
            ...(slice && Object.keys(slice).length > 0 ? { [section]: { [id]: slice } } : {}),
            ...(active ? { activeLayout: id } : {}),
          });
        }
      });
    };
    const offs = [
      canvas.events.on('scene:layer:add', ({ id }) => replay('layers', id)),
      canvas.events.on('scene:behaviour:register', ({ id }) => replay('behaviours', id)),
      canvas.events.on('scene:layout:add', ({ id }) => replay('layouts', id)),
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [canvas]);

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
  hostRef: RefObject<HTMLDivElement | null>;
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
