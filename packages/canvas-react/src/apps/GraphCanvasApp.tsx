/**
 * `<GraphCanvasApp>` — one composable, batteries-included graph application.
 *
 * A thin orchestrator that owns the engine + app shell, with three
 * replaceable regions ({@link GraphCanvasAppHeader} · {@link GraphCanvasAppMain}
 * · {@link GraphCanvasAppFooter}) and its own layout. Everything lives in this
 * one module — the regions share the baked defaults/helpers below, so co-locating
 * them avoids an import cycle.
 *
 * ```tsx
 * <GraphCanvasApp data={graph} />                          // lean explorer
 * <GraphCanvasApp data={graph} style={{ height: 400 }} />  // bounded widget
 * ```
 *
 * The default one-liner stays trivial; the breadth lives in **`config`** (the
 * single settings surface) plus the `header` / `footer` slot bags. The same
 * component is a full-page app, a Storybook story, and an embeddable widget — it
 * owns its layout (rails / overlay / fill-parent), rather than depending on the
 * viewport-locked `@invana/themes` `AppLayoutBase`.
 *
 * **Theme.** Light/dark + the active family are read from the host's
 * `@invana/themes` `<ThemeProvider>` (a **required ancestor** — `useTheme()`
 * throws without one): `isDark` drives the shell classes (scoped to this app's
 * layout root) while {@link ThemeTemplateSync} pushes the resolved mode + theme
 * family to the engine's `ThemeBehaviour`, which republishes the palette so
 * every theme-aware layer recolours. The component does **not** self-provide a
 * theme, so an app mounts it once under its own provider and the in-app toggle
 * drives the shared theme.
 *
 * **Lifted context.** The header / footer are siblings of `<Canvas>` (under the
 * layout), outside its `CanvasContext`. The orchestrator publishes the live
 * engine — fed by Main's ready-bridge — up to a lifted `CanvasContext` /
 * `GraphCanvasContext` wrapping the whole layout, so every control resolves the
 * same instance. **`wrap`** sits *outermost* (above that lifted context) so an
 * arrangement can hoist providers above header, main, and footer alike.
 */

import {
  type CSSProperties,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { deepMerge, type CanvasConfig, type CanvasTelemetryConfig } from '@invana/canvas';
import { themeFamily, type GraphCanvas, type GraphData } from '@invana/graph';
import { useTheme } from '@invana/themes';

// Aliased: the engine type `GraphCanvas` (from `@invana/graph`) is used in this
// file's public signatures (`onReady`), so the React root component takes a
// distinct local name.
import { GraphCanvas as GraphCanvasRoot } from '../GraphCanvas';
import { CanvasContext } from '../CanvasContext';
import { GraphCanvasContext, useGraphCanvas } from '../GraphCanvasContext';
import { useGraphCanvasUpdate } from '../hooks';
import { BackgroundLayer } from '../layers/BackgroundLayer';
import { GraphLayer } from '../layers/GraphLayer';
import { D3ForceLayout } from '../layouts/D3ForceLayout';
import { DragPanBehaviour } from '../behaviours/DragPanBehaviour';
import { WheelZoomBehaviour } from '../behaviours/WheelZoomBehaviour';
import { DragNodeBehaviour } from '../behaviours/DragNodeBehaviour';
import { HoverActivateBehaviour } from '../behaviours/HoverActivateBehaviour';
import { ClickSelectBehaviour } from '../behaviours/ClickSelectBehaviour';
import { BrushSelectBehaviour } from '../behaviours/BrushSelectBehaviour';
import { LassoSelectBehaviour } from '../behaviours/LassoSelectBehaviour';
import { ColorByLabelBehaviour } from '../behaviours/ColorByLabelBehaviour';
import { ThemeBehaviour } from '../behaviours/ThemeBehaviour';
import { GraphCanvasAppHeader, type GraphCanvasAppHeaderOptions } from './GraphCanvasAppHeader';
import { GraphCanvasAppFooter, type GraphCanvasAppFooterOptions } from './GraphCanvasAppFooter';

// ─── Cross-cutting types ──────────────────────────────────────────────────────

/** Light / dark colour scheme for the shell + engine theme patches. */
export type ThemeKind = 'light' | 'dark';

/**
 * How the floating chrome paints when `overlay` is on:
 * - `'blur'` — translucent + backdrop-blur (a glass bar; controls stay legible).
 * - `'transparent'` — fully see-through; only the controls themselves paint.
 */
export type OverlayStyle = 'blur' | 'transparent';

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

/**
 * Content for a slot in one of the app's regions (header / footer): a static
 * node, or a render fn handed the live {@link GraphCanvasAppControlContext}.
 * Providing the slot **replaces** that region's default content (no append).
 */
export type RegionSlot = ReactNode | ((ctx: GraphCanvasAppControlContext) => ReactNode);

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
 */
const BASE_CONFIG: CanvasConfig = {
  activeLayout: ACTIVE_LAYOUT_ID,
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 8 },
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
      link: { distance: 56 },
      collide: { radius: 14 },
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
    // The sole theme publisher. Starts following the OS; `ThemeTemplateSync`
    // immediately pins it to the host theme's resolved mode + family, and the
    // accent role tracks the design-kit `--color-primary`. The published palette
    // recolours background, nodes, edges, labels and group frames — every layer
    // subscribes, so a theme switch repaints the whole canvas, not just the bg.
    theme: { enabled: true, mode: 'system', active: 'default', accent: 'css-var' },
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * The `data-theme` + class names for a shell theme kind (design-kit tokens),
 * applied to the app's **own** layout root — so the light/dark toggle themes
 * *this* app, scoped, without touching `document` or following the OS.
 */
function shellThemeAttrs(kind: ThemeKind): { dataTheme: string; className: string } {
  return {
    dataTheme: kind === 'dark' ? 'default-dark' : 'default-light',
    className: kind === 'dark' ? 'theme-default-dark dark' : 'theme-default-light light',
  };
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

/**
 * Drives the engine `ThemeBehaviour` from the host `@invana/themes` theme: it
 * pushes the resolved mode (`light`/`dark` — the host already resolved
 * `system`) and the active theme **family** (matched by name; an unknown family
 * falls back to `default`). The behaviour republishes the palette and every
 * theme-aware layer recolours — no per-property patch list here.
 */
function ThemeTemplateSync({ active, kind }: { active: string; kind: ThemeKind }) {
  const update = useGraphCanvasUpdate();
  useEffect(() => {
    update({ behaviours: { theme: { mode: kind, active } } });
  }, [update, active, kind]);
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
  themeKind,
  themeName,
  children,
}: {
  data: GraphData;
  config: CanvasConfig;
  bundle: boolean;
  instanceKey?: string | number;
  onReady: (canvas: GraphCanvas | null) => void;
  telemetry?: CanvasTelemetryConfig;
  themeKind?: ThemeKind;
  themeName?: string;
  children?: ReactNode;
}) {
  return (
    // The `<Canvas>` host fills its parent (`100%/100%`); the layout's main cell
    // bounds it. Keyed on instanceKey so a reset remounts the engine. The render
    // backend is the engine's own setting — auto-resolved unless set in `config`.
    <GraphCanvasRoot key={instanceKey} autoResize config={config} telemetry={telemetry}>
      {bundle ? (
        <>
          {/* Every class registers by id; ALL its options come from `config`
              (`config.layers.*`, `config.behaviours.*`, `config.layouts.*`) —
              styles, resolver functions, palette, hover degree, force params, and
              which behaviours are enabled. To turn one off: its `enabled` flag. */}
          <BackgroundLayer id="background" />
          <GraphLayer id="graph" data={data} />
          <ColorByLabelBehaviour id="color" targetLayerId="graph" />
          <D3ForceLayout id={ACTIVE_LAYOUT_ID} targetLayerId="graph" />
          {/* The sole theme publisher + a sync that drives its mode/active from
              the host `<ThemeProvider>`. Every theme-aware layer recolours off
              the published palette. */}
          <ThemeBehaviour id="theme" />
          {themeKind ? <ThemeTemplateSync active={themeName ?? 'default'} kind={themeKind} /> : null}
          <DragPanBehaviour id="pan" />
          <WheelZoomBehaviour id="wheel" />
          <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
          <HoverActivateBehaviour id="hover" targetLayerId="graph" />
          <ClickSelectBehaviour id="click-select" targetLayerId="graph" />
          <BrushSelectBehaviour id="brush-select" targetLayerId="graph" />
          <LassoSelectBehaviour id="lasso-select" targetLayerId="graph" />
        </>
      ) : null}

      {/* Consumer extras (appended bundle extras, or — with `bundle={false}` — the
          whole replacement graph). A dev overlay is just `<DevInfoLayer/>` dropped
          in here, like any other layer. */}
      {children}

      {/* Last child: publishes the live engine to the lifted context. */}
      <CanvasReady onReady={onReady} />
    </GraphCanvasRoot>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * The app shell — a thin flex-column (or overlay) that `GraphCanvasApp`
 * renders instead of the viewport-locked `AppLayoutBase`. Fills its parent by
 * default; the `flex-1 min-h-0` main cell bounds the `100%`-height `<Canvas>`;
 * the light/dark theme classes live on **this** root only — scoped to the app,
 * never the document, and never OS-driven.
 */
function AppLayout({
  header,
  main,
  footer,
  overlay,
  themeKind,
  width,
  height,
  style,
  className,
}: {
  header?: ReactNode;
  main: ReactNode;
  footer?: ReactNode;
  overlay: boolean;
  themeKind: ThemeKind;
  width?: number | string;
  height?: number | string;
  style?: CSSProperties;
  className?: string;
}) {
  const { dataTheme, className: themeClass } = shellThemeAttrs(themeKind);
  const rootStyle: CSSProperties = { width: width ?? '100%', height: height ?? '100%', ...style };

  if (overlay) {
    // The canvas stays full-bleed under the floating bars; screen-fixed overlays
    // (the property dock, dev-info / minimap layers) inset themselves clear of the
    // chrome via their own explicit props.
    return (
      <div data-theme={dataTheme} className={cx('relative bg-background text-foreground', themeClass, className)} style={rootStyle}>
        <div className="absolute inset-0">{main}</div>
        {header ? <div className="absolute inset-x-0 top-0 z-10">{header}</div> : null}
        {footer ? <div className="absolute inset-x-0 bottom-0 z-10">{footer}</div> : null}
      </div>
    );
  }

  return (
    <div data-theme={dataTheme} className={cx('flex flex-col bg-background text-foreground', themeClass, className)} style={rootStyle}>
      {header ? <div className="shrink-0">{header}</div> : null}
      <div className="relative min-h-0 flex-1">{main}</div>
      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface GraphCanvasAppProps {
  /** The graph to render. Reactive — a new reference re-seeds + re-lays-out. */
  data: GraphData;
  /**
   * **The single settings surface.** Serialisable canvas config keyed by id —
   * styles, behaviour options, resolver functions, force params, the active
   * layout, which behaviours are `enabled`, … — deep-merged over the baked bundle
   * defaults (or used as-is when `bundle` is `false`). Keep the reference stable.
   */
  config?: CanvasConfig;
  /**
   * Mount the default graph bundle (background · graph · colour · d3-force · the
   * camera / selection behaviours, all configured via {@link config}). Default
   * `true`. Set `false` to compose your own graph entirely from `children` — the
   * one structural decision `config` can't express (it can't register classes).
   */
  bundle?: boolean;
  /** Re-key token (e.g. a streaming reset) — remounts the `<Canvas>` on change. */
  instanceKey?: string | number;
  /** Receives the live engine once every layer / behaviour has registered (or `null`). */
  onReady?: (canvas: GraphCanvas | null) => void;
  /**
   * Push per-frame performance metrics — FPS / frame-time / the CPU **phase
   * breakdown** (`camera` / `dataFlush` / `layers`) + dropped frames — to a
   * telemetry sink. Wires the kernel's `createFrameMetrics` speed-trace through
   * `new Canvas({ telemetry })`. `{ metrics: { meter } }` ships to a real backend
   * (OTLP → HyperDX via `@invana/canvas-telemetry-otel`, or `createHttpMeter`
   * for a local collector); `{ metrics: true }` prints to the console. See
   * {@link debug} for the shortcut.
   */
  telemetry?: CanvasTelemetryConfig;
  /**
   * Debug shortcut: `true` turns on **console** performance metrics — equivalent
   * to `telemetry={{ metrics: true }}`. An explicit {@link telemetry} always wins,
   * so pass that (e.g. an OTLP meter) to ship the same metrics to a backend.
   */
  debug?: boolean;

  // ── Layout / sizing / theme ────────────────────────────────────────────────
  /**
   * Float the header / footer over a full-bleed canvas instead of in-flow rails.
   * `true` (= `'blur'`) gives a glass bar; `'transparent'` is fully see-through;
   * `false` (default) docks them as solid rails. See {@link OverlayStyle}.
   */
  overlay?: boolean | OverlayStyle;
  /** Show the header rail (a brand shows even with no other slots). Default `true`. */
  showHeader?: boolean;
  /**
   * Force the footer rail on/off. The footer has no default content, so it shows
   * automatically when you pass a `footer` bag; set `true` to render an empty
   * rail, or `false` to suppress it even when `footer` is given. Default: auto.
   */
  showFooter?: boolean;
  /** Convenience width (number → px). Default: fill the parent. */
  width?: number | string;
  /** Convenience height (number → px). Default: fill the parent. */
  height?: number | string;
  /** Inline style on the layout root (merged over the size defaults). */
  style?: CSSProperties;
  /** Class on the layout root. */
  className?: string;

  // ── Chrome slot bags ───────────────────────────────────────────────────────
  /** Header region — `title` + `left` / `center` / `right` slots. */
  header?: GraphCanvasAppHeaderOptions;
  /** Footer region — `left` / `center` / `right` slots. */
  footer?: GraphCanvasAppFooterOptions;

  // ── Escape hatches ─────────────────────────────────────────────────────────
  /**
   * Wrap the whole app (above the lifted context) — hoist providers here. Note
   * the required `<ThemeProvider>` must sit *above* `<GraphCanvasApp>` itself
   * (the component reads `useTheme` before `wrap` runs), so it can't be supplied
   * through `wrap` — use `wrap` for any *other* providers the chrome consumes.
   */
  wrap?: (node: ReactNode) => ReactNode;
  /**
   * Extra in-canvas children. With the default bundle they're **appended**; with
   * `bundle={false}` they're the replacement graph.
   */
  children?: ReactNode;
}

export function GraphCanvasApp({
  data,
  config,
  bundle = true,
  instanceKey,
  onReady,
  telemetry: telemetryProp,
  debug,
  overlay = false,
  showHeader = true,
  showFooter,
  width,
  height,
  style,
  className,
  header,
  footer,
  wrap,
  children,
}: GraphCanvasAppProps) {
  // Live engine, lifted out of <Canvas> by Main's ready-bridge.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);

  // Theme comes from the host's <ThemeProvider> (a required ancestor — see the
  // module docs): `isDark` resolves light/dark (including `system` mode, which
  // follows the OS) and `toggleMode` flips it. The canvas colours follow via
  // <ThemeTemplateSync> (driving the engine `ThemeBehaviour`) and the shell
  // classes via the scoped layout root. `useTheme()` throws without a provider; we rethrow with
  // an actionable, component-named message so the missing-provider contract is
  // obvious at the call site rather than buried in a generic library error.
  let theme: ReturnType<typeof useTheme>;
  try {
    theme = useTheme();
  } catch {
    throw new Error(
      '<GraphCanvasApp> must be rendered inside a <ThemeProvider> from ' +
        '@invana/themes — it reads the active light/dark theme via useTheme(). ' +
        'Wrap it: <ThemeProvider><GraphCanvasApp … /></ThemeProvider>.',
    );
  }
  const { isDark, toggleMode, theme: themeId } = theme;
  const themeKind: ThemeKind = isDark ? 'dark' : 'light';
  // The canvas theme family is matched (loosely) to the host theme id; an
  // unknown family resolves to `default` inside the behaviour.
  const themeName = themeFamily(themeId);

  const handleReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      onReady?.(c);
    },
    [onReady],
  );

  // Debug shortcut → console performance metrics, unless an explicit telemetry
  // config is given (which always wins — e.g. an OTLP meter for a real backend).
  const telemetry: CanvasTelemetryConfig | undefined =
    telemetryProp ?? (debug ? { metrics: true } : undefined);

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

  const mainNode = (
    <GraphCanvasAppMain
      data={data}
      config={mergedConfig}
      bundle={bundle}
      instanceKey={instanceKey}
      onReady={handleReady}
      telemetry={telemetry}
      themeKind={bundle ? themeKind : undefined}
      themeName={themeName}
    >
      {children}
    </GraphCanvasAppMain>
  );

  // Resolve `overlay` → a paint style (`true` = glass), or `undefined` for docked.
  const overlayStyle: OverlayStyle | undefined = overlay === true ? 'blur' : overlay || undefined;

  const headerNode = showHeader ? (
    <GraphCanvasAppHeader ctx={ctx} overlay={overlayStyle} {...header} />
  ) : undefined;
  // Footer is auto: shown when a `footer` bag is given, unless `showFooter` forces it.
  const footerNode =
    (showFooter ?? footer !== undefined) ? (
      <GraphCanvasAppFooter ctx={ctx} overlay={overlayStyle} {...footer} />
    ) : undefined;

  // Lifted context so the header / footer (siblings of <Canvas>) resolve the same
  // live engine. `wrap` sits outermost — above the lifted context — so an
  // arrangement can hoist its own providers above header, main, and footer alike.
  const tree = (
    <CanvasContext.Provider value={canvas}>
      <GraphCanvasContext.Provider value={canvas}>
        <AppLayout
          overlay={overlayStyle !== undefined}
          themeKind={themeKind}
          width={width}
          height={height}
          style={style}
          className={className}
          header={headerNode}
          main={mainNode}
          footer={footerNode}
        />
      </GraphCanvasContext.Provider>
    </CanvasContext.Provider>
  );

  return <>{wrap ? wrap(tree) : tree}</>;
}
