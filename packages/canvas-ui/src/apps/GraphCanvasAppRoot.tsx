/**
 * The **engine half** of `<GraphCanvasApp>`, usable on its own.
 *
 * `GraphCanvasApp` does two jobs: it owns a graph engine (the default bundle,
 * the config merge, telemetry, the lifted context, the theme + keyboard scope)
 * and it lays that engine out in `AppLayoutV2`. A board, a split view or any
 * other host wants the first without the second, so the first lives here:
 *
 * ```tsx
 * <GraphCanvasAppRoot data={graph}>          // owns the engine + context + scope
 *   <MyLayout
 *     main={<GraphCanvasAppSurface />}       // draws the engine, exactly once
 *     side={<Inspector />}                   // resolves the same engine via context
 *   />
 * </GraphCanvasAppRoot>
 * ```
 *
 * It is a root **and** a surface, not one provider, because of where things
 * render: the engine element must sit inside the layout's main cell, while the
 * context it publishes must wrap that cell's siblings. The root publishes; the
 * surface is placed. See rfc:feat-2026-10-05-graph-canvas-app-engine-is-welded-to-its-layout.
 */

import {
  type CSSProperties,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { deepMerge, type CanvasConfig, type CanvasTelemetryConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { useTheme } from '@invana/themes';

// Aliased: the engine type `GraphCanvas` (from `@invana/graph`) is used in this
// file's public signatures (`onReady`), so the React root component takes a
// distinct local name.
import { CanvasThemeSync, GraphCanvas as GraphCanvasHost, type RenderPreference } from '@invana/canvas-react';
import { CanvasContext } from '@invana/canvas-react';
import { GraphCanvasContext, useGraphCanvas } from '@invana/canvas-react';
import { BackgroundLayer } from '@invana/canvas-react';
import { GraphLayer } from '@invana/canvas-react';
import { D3ForceLayout } from '@invana/canvas-react';
import { DragPanBehaviour } from '@invana/canvas-react';
import { WheelZoomBehaviour } from '@invana/canvas-react';
import { DragNodeBehaviour } from '@invana/canvas-react';
import { HoverActivateBehaviour } from '@invana/canvas-react';
import { ClickSelectBehaviour } from '@invana/canvas-react';
import { BrushSelectBehaviour } from '@invana/canvas-react';
import { LassoSelectBehaviour } from '@invana/canvas-react';
import { EntranceBehaviour } from '@invana/canvas-react';
import { ColorByBehaviour } from '@invana/canvas-react';
import { ThemeBehaviour } from '@invana/canvas-react';
import { ControlPanels, type ControlPanelsProps } from '../control-panels';

// ─── Cross-cutting types ──────────────────────────────────────────────────────

/** Light / dark colour scheme for the shell + engine theme patches. */
export type ThemeKind = 'light' | 'dark';

/**
 * The live state the orchestrator owns and threads to header controls — a custom
 * `toolbar` / `themeToggle` slot is handed this so it can drive the genuinely
 * cross-region wiring (theme: shell class + engine patch) without prop-drill.
 * Everything else (backend, hover-magnet, dev overlay, …) is a plain `config`
 * setting or a composed layer — none is special-cased here.
 */
export interface GraphCanvasAppControlContext {
  /** Live engine, or `null` until every layer / behaviour has registered. */
  canvas: GraphCanvas | null;
  /** Active colour scheme. */
  themeKind: ThemeKind;
  /** Flip {@link themeKind} (shell class + engine patch follow). */
  toggleTheme: () => void;
}

// ─── Baked defaults (the opinionated graph bundle) ────────────────────────────

/** Id of the registered active layout, pointed at by `activeLayout`. */
const ACTIVE_LAYOUT_ID = 'graph-force';

/**
 * The bundle's default config — **every** per-instance setting lives here, keyed
 * by the id the bundle registers each class under, and is deep-merged under any
 * consumer `config`. So a consumer tunes the graph **entirely** through `config`
 * (styles, resolver functions, force params, behaviour options, which are
 * enabled, the active layout, …) — there are no bespoke app props for any of it.
 * Theme colours are pushed separately by the in-app light/dark toggle.
 *
 * **Exported as `graphCanvasAppBaseConfig`** so you can define shared defaults
 * once and reuse them across canvases — `deepMerge(graphCanvasAppBaseConfig, {…})`
 * → pass as `config` to any `<GraphCanvasApp>`. Note it's keyed by the bundle's
 * ids (`graph` · `hover` · `graph-force` · …), so it only applies to a canvas that
 * registers those same ids (i.e. the app bundle) — a differently-composed
 * `<GraphCanvas>` needs config keyed by *its* ids. Treat as read-only (merge,
 * don't mutate).
 */
export const BASE_CONFIG: CanvasConfig = {
  activeLayout: ACTIVE_LAYOUT_ID,
  // Centre the graph once on load (engine one-shot). Consumers opt out with
  // `config={{ fitOnLoad: false }}`.
  fitOnLoad: true,
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 8 },
          // Neutral default fill so nodes stay visible when nothing tints them
          // (e.g. the `color` behaviour is off). The colour-by-label behaviour
          // overrides `bgFill` per category while enabled, and restores to this
          // default on disable.
          bgFill: 0x94a3b8,
          bgStrokeWidth: 1.5,
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 4,
        },
      },
      edge: { style: { strokeWidth: 1, arrowTargetShape: 'none' } },
    },
  },
  layouts: {
    [ACTIVE_LAYOUT_ID]: {
      charge: { strength: -160 },
      // Link force on, but no fixed `distance` — a hardcoded length pulls large
      // nodes / composite cards to a center gap smaller than their own width, so
      // they overlap. Let collision set the spacing instead.
      link: {},
      // Size-aware collision: leave `radius` unset so `D3ForceLayout` derives it
      // per node from the render footprint (`max(width, height) / 2`). A fixed
      // radius treats every node as one disc size, so anything bigger overlaps.
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
    color: {
      enabled: true,
      colorEdges: false,
      // Distinct colour per node category (its `type`).
      palette: [
        0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
        0x14b8a6, 0xa3e635,
      ],
    },
    'click-select': { enabled: true, multiple: true },
    // Registered but disarmed — the toolbar's select-mode picker arms one at a time.
    'brush-select': { enabled: false },
    'lasso-select': { enabled: false },
    // Also registered disarmed: the staggered load animation. Registering it is
    // what puts it in the settings editor (which introspects the live registries
    // by `kind`); leaving it off is rule 7, and keeps an entrance nobody asked
    // for from becoming a tax on every embedding. Turn it on per canvas — in the
    // settings panel, or with `behaviours: { entrance: { enabled: true } }`.
    entrance: { enabled: false },
    // The sole theme publisher. Reads the host page's theme itself (`document`),
    // so the canvas is correct on first paint and stays correct even without the
    // bridge below; `CanvasThemeSync`
    // immediately pins it to the host theme's resolved mode + family, and the
    // accent role tracks the design-kit `--color-primary`. The published palette
    // recolours background, nodes, edges, labels and group frames — every layer
    // subscribes, so a theme switch repaints the whole canvas, not just the bg.
    theme: { enabled: true, mode: 'document', active: 'default', accent: 'css-var' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The `data-theme` + class names for a shell theme variant (design-kit tokens),
 * applied to the app's **own** layout root — so the theme switch themes *this*
 * app, scoped, without touching `document` or following the OS.
 *
 * Both halves of the variant matter: `family` selects the palette (`default` ·
 * `tailwind` · `vite` · `gold` · `ocean` · `forest` · `rose` · `minimal`) and
 * `kind` its light/dark block. The family used to be hardcoded to `default`,
 * which meant a host on a preset theme got a correctly-themed page and a
 * `default`-themed app inside it — the scoped root overrode the document.
 */
function shellThemeAttrs(family: string, kind: ThemeKind): { dataTheme: string; className: string } {
  const variantId = `${family}-${kind}`;
  return { dataTheme: variantId, className: `theme-${variantId} ${kind}` };
}

/** Join truthy class names. */
function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

// ─── Internal bridges (null-rendering <Canvas> children) ──────────────────────

/** Publishes the initialised engine up to the orchestrator's lifted context. */
function CanvasReady({ onReady }: { onReady: (canvas: GraphCanvas | null) => void }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}

// ─── Region: Main ─────────────────────────────────────────────────────────────

/**
 * The main region — the `<Canvas>` host plus, when `bundle` is on, the default
 * graph bundle: each class registered by a fixed id (`background` · `graph` ·
 * `color` · `graph-force` · the camera / selection behaviours), with **every
 * setting coming from `config`** (deep-merged over {@link BASE_CONFIG}) — styles,
 * resolver functions, palette, force params, which behaviours are enabled. The
 * active layout auto-runs itself (the engine wires `config.activeLayout`). Pass
 * `bundle={false}` + your own `children` to host a different graph shape.
 *
 * Internal region — all props are injected by the orchestrator; consumers drive
 * it through `GraphCanvasAppProps` (`config` / `bundle` / `children`).
 */
function GraphCanvasAppMain({
  data,
  config,
  bundle,
  instanceKey,
  onReady,
  telemetry,
  preference,
  controlPanels,
  children,
}: {
  data: GraphData;
  config: CanvasConfig;
  bundle: boolean;
  instanceKey?: string | number;
  onReady: (canvas: GraphCanvas | null) => void;
  telemetry?: CanvasTelemetryConfig;
  preference?: RenderPreference;
  controlPanels?: Pick<ControlPanelsProps, 'icons' | 'widgets'>;
  children?: ReactNode;
}) {
  return (
    // The `<Canvas>` host fills its parent (`100%/100%`); the layout's main cell
    // bounds it. Keyed on instanceKey so a reset remounts the engine. The render
    // backend is auto-resolved unless `preference` pins it.
    <GraphCanvasHost
      key={instanceKey}
      autoResize
      config={config}
      telemetry={telemetry}
      {...(preference ? { preference } : {})}
    >
      {bundle ? (
        <>
          {/* Every class registers by id; ALL its options come from `config`
              (`config.layers.*`, `config.behaviours.*`, `config.layouts.*`) —
              styles, resolver functions, palette, hover degree, force params, and
              which behaviours are enabled. To turn one off: its `enabled` flag. */}
          <BackgroundLayer id="background" />
          <GraphLayer id="graph" data={data} />
          <ColorByBehaviour id="color" targetLayerId="graph" />
          {/* fitPadding={null} disables the wrapper's own end-fit — the engine's
              `config.fitOnLoad` one-shot is the single fitter (and centres even
              when no layout runs). */}
          <D3ForceLayout id={ACTIVE_LAYOUT_ID} targetLayerId="graph" fitPadding={null} />
          {/* The sole theme publisher + the shared host-theme sync that drives its
              mode/active from the host `<ThemeProvider>`. Every theme-aware layer
              recolours off the published palette. */}
          <ThemeBehaviour id="theme" />
          <CanvasThemeSync />
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
          <HoverActivateBehaviour id="hover" targetLayerId="graph" />
          <ClickSelectBehaviour id="click-select" targetLayerId="graph" />
          <BrushSelectBehaviour id="brush-select" targetLayerId="graph" />
          <LassoSelectBehaviour id="lasso-select" targetLayerId="graph" />
          {/* `enabled={false}` explicitly, not left to `BASE_CONFIG` to switch
              off after the fact: the wrapper defaults to enabled, and an
              entrance that registers armed can play its one shot before the
              config lands. The other disarmed behaviours tolerate that race
              because arming them does nothing visible; this one would fade. */}
          <EntranceBehaviour id="entrance" targetLayerId="graph" enabled={false} />
        </>
      ) : null}

      {/* Consumer extras (appended bundle extras, or — with `bundle={false}` — the
          whole replacement graph). A dev overlay is just `<DevInfoLayer/>` dropped
          in here, like any other layer. */}
      {children}

      {/* Draws every `definition.controlPanels` spec (from <ControlPanel>
          children, config, an import, …) over the canvas host. Nothing
          renders while there are none. */}
      <ControlPanels {...controlPanels} />

      {/* Last child: publishes the live engine to the lifted context. */}
      <CanvasReady onReady={onReady} />
    </GraphCanvasHost>
  );
}

// ─── Root + surface ───────────────────────────────────────────────────────────

/** What the root hands its surface: everything `GraphCanvasAppMain` needs. */
interface SurfaceValue {
  data: GraphData;
  config: CanvasConfig;
  bundle: boolean;
  instanceKey?: string | number;
  onReady: (canvas: GraphCanvas | null) => void;
  telemetry?: CanvasTelemetryConfig;
  preference?: RenderPreference;
  controlPanels?: Pick<ControlPanelsProps, 'icons' | 'widgets'>;
}

const SurfaceContext = createContext<SurfaceValue | null>(null);
const AppContext = createContext<GraphCanvasAppControlContext | null>(null);

/** Props of {@link GraphCanvasAppRoot}: the engine, and the box it scopes. */
export interface GraphCanvasAppRootProps {
  /** The graph to render. Reactive — a new reference re-seeds + re-lays-out. */
  data: GraphData;
  /**
   * **The single settings surface.** Serialisable canvas config keyed by id,
   * deep-merged over {@link BASE_CONFIG} (or used as-is when `bundle` is
   * `false`). Keep the reference stable.
   */
  config?: CanvasConfig;
  /**
   * Mount the default graph bundle (background · graph · colour · d3-force · the
   * camera / selection behaviours). Default `true`. `false` = compose your own
   * graph from the surface's `children`.
   */
  bundle?: boolean;
  /** Re-key token (e.g. a streaming reset) — remounts the engine on change. */
  instanceKey?: string | number;
  /** Receives the live engine once every layer / behaviour has registered (or `null`). */
  onReady?: (canvas: GraphCanvas | null) => void;
  /** Per-frame performance metrics sink — see `GraphCanvasAppProps.telemetry`. */
  telemetry?: CanvasTelemetryConfig;
  /** Pin the render backend. Read once at init — re-key with {@link instanceKey}. */
  preference?: RenderPreference;
  /** `true` = console performance metrics, unless {@link telemetry} is given. */
  debug?: boolean;
  /** Extra icons / widgets the control panels may name (merged over the defaults). */
  controlPanels?: Pick<ControlPanelsProps, 'icons' | 'widgets'>;
  /** Convenience width (number → px). Default: fill the parent. */
  width?: number | string;
  /** Convenience height (number → px). Default: fill the parent. */
  height?: number | string;
  /** Inline style on the scoped root (merged over the size defaults). */
  style?: CSSProperties;
  /** Class on the scoped root. */
  className?: string;
  /**
   * Wrap the whole tree (above the lifted context) — hoist providers here. The
   * required `<ThemeProvider>` must sit *above* the root itself.
   */
  wrap?: (node: ReactNode) => ReactNode;
  /**
   * The layout. Place one {@link GraphCanvasAppSurface} somewhere inside it;
   * everything else here resolves the engine via context or {@link useGraphCanvasApp}.
   */
  children?: ReactNode;
}

/**
 * Owns one graph engine and scopes it: the live `canvas` state, the config
 * merge, telemetry, the lifted `CanvasContext` / `GraphCanvasContext` (so every
 * sibling of the surface resolves the same instance), and a theme- and
 * keyboard-scoped root box. It draws nothing itself; a
 * {@link GraphCanvasAppSurface} placed inside draws the engine.
 *
 * Reads light/dark from the host `@invana/themes` `<ThemeProvider>`, a required
 * ancestor.
 */
export function GraphCanvasAppRoot({
  data,
  config,
  bundle = true,
  instanceKey,
  onReady,
  telemetry: telemetryProp,
  preference,
  debug,
  controlPanels,
  width,
  height,
  style,
  className,
  wrap,
  children,
}: GraphCanvasAppRootProps) {
  // Live engine, lifted out of <Canvas> by the surface's ready-bridge.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

  // Theme comes from the host's <ThemeProvider> (a required ancestor): `isDark`
  // resolves light/dark (including `system` mode) and `toggleMode` flips it. The
  // canvas colours follow via <CanvasThemeSync>, the shell classes via the scoped
  // root below. `useTheme()` throws without a provider; rethrow with an
  // actionable message so the contract is obvious at the call site.
  let theme: ReturnType<typeof useTheme>;
  try {
    theme = useTheme();
  } catch {
    throw new Error(
      '<GraphCanvasApp> / <GraphCanvasAppRoot> must be rendered inside a <ThemeProvider> from ' +
        '@invana/themes — it reads the active light/dark theme via useTheme(). ' +
        'Wrap it: <ThemeProvider><GraphCanvasApp … /></ThemeProvider>.',
    );
  }
  const { isDark, toggleMode } = theme;
  const themeKind: ThemeKind = isDark ? 'dark' : 'light';

  const handleReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      onReady?.(c);
    },
    [onReady],
  );

  // Debug shortcut → console performance metrics, unless an explicit telemetry
  // config is given (which always wins — e.g. an OTLP meter for a real backend).
  const telemetry = useMemo<CanvasTelemetryConfig | undefined>(
    () => telemetryProp ?? (debug ? { metrics: true } : undefined),
    [telemetryProp, debug],
  );

  const ctx: GraphCanvasAppControlContext = useMemo(
    () => ({ canvas, themeKind, toggleTheme: toggleMode }),
    [canvas, themeKind, toggleMode],
  );

  // Bundle on → merge defaults; off → the arrangement owns the whole config.
  // `deepMerge` (the engine's own) returns `unknown` and replaces on a non-object
  // patch, so guard the no-config case rather than feeding it `undefined`.
  const mergedConfig = useMemo(
    () =>
      bundle
        ? config
          ? (deepMerge(BASE_CONFIG, config) as CanvasConfig)
          : BASE_CONFIG
        : (config ?? {}),
    [bundle, config],
  );

  const surface = useMemo<SurfaceValue>(
    () => ({
      data,
      config: mergedConfig,
      bundle,
      instanceKey,
      onReady: handleReady,
      telemetry,
      preference,
      controlPanels,
    }),
    [data, mergedConfig, bundle, instanceKey, handleReady, telemetry, preference, controlPanels],
  );

  // The root box is sized to fill its parent by default, so the same engine works
  // full-page, in a story, and bounded inside a board panel. Theme classes live on
  // **this** root only — scoped to the app, never the document or the OS — and use
  // the host's active family, so a host on `ocean` gets an ocean-tinted app.
  const { dataTheme, className: themeClass } = shellThemeAttrs(theme.theme, themeKind);
  const rootStyle: CSSProperties = { width: width ?? '100%', height: height ?? '100%', ...style };

  // Lifted context so every region (siblings of the surface) resolves the same
  // live engine. `wrap` sits outermost — above the lifted context — so an
  // arrangement can hoist its own providers above every region alike.
  const tree = (
    <AppContext.Provider value={ctx}>
      <SurfaceContext.Provider value={surface}>
        <CanvasContext.Provider value={canvas}>
          <GraphCanvasContext.Provider value={canvas}>
            <div
              data-theme={dataTheme}
              // One keyboard scope: a `KeyboardShortcutsBehaviour` on this canvas
              // hears keys after a click anywhere in it (a header button, a side
              // panel), not only on the canvas itself.
              data-canvas-scope=""
              // `overflow-hidden`: the scoped box must never paint outside itself.
              // Resizable layouts can momentarily overshoot; without this clip an
              // embedder that doesn't clip its own slot (e.g. an absolutely-
              // positioned board) shows the spill.
              className={cx('bg-background text-foreground overflow-hidden', themeClass, className)}
              style={rootStyle}
            >
              {children}
            </div>
          </GraphCanvasContext.Provider>
        </CanvasContext.Provider>
      </SurfaceContext.Provider>
    </AppContext.Provider>
  );

  return <>{wrap ? wrap(tree) : tree}</>;
}

/** Props of {@link GraphCanvasAppSurface}. */
export interface GraphCanvasAppSurfaceProps {
  /**
   * Extra in-canvas children. With the default bundle they're **appended**; with
   * `bundle={false}` on the root they're the replacement graph.
   */
  children?: ReactNode;
}

/**
 * Draws the engine owned by the nearest {@link GraphCanvasAppRoot}: the `<Canvas>`
 * host, the default bundle, the control panels, and the ready-bridge that lifts
 * the live engine to the root. Place exactly one per root; it fills its parent.
 */
export function GraphCanvasAppSurface({ children }: GraphCanvasAppSurfaceProps) {
  const surface = useContext(SurfaceContext);
  if (!surface) {
    throw new Error('<GraphCanvasAppSurface> must be rendered inside a <GraphCanvasAppRoot>.');
  }
  return (
    <GraphCanvasAppMain
      data={surface.data}
      config={surface.config}
      bundle={surface.bundle}
      instanceKey={surface.instanceKey}
      onReady={surface.onReady}
      telemetry={surface.telemetry}
      preference={surface.preference}
      {...(surface.controlPanels ? { controlPanels: surface.controlPanels } : {})}
    >
      {children}
    </GraphCanvasAppMain>
  );
}

/**
 * The nearest {@link GraphCanvasAppRoot}'s control context — the live `canvas`
 * (`null` until ready), the theme kind and its toggle. The same object
 * `GraphCanvasApp` hands its header / footer / region slots.
 */
export function useGraphCanvasApp(): GraphCanvasAppControlContext {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useGraphCanvasApp() must be called inside a <GraphCanvasAppRoot>.');
  }
  return ctx;
}
