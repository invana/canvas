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
 * owns its layout (rails / overlay / fill-parent) and a **scoped** theme (no
 * global `document` writes), rather than depending on the viewport-locked
 * `@invana/themes` `AppLayoutBase`.
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
import { deepMerge, type CanvasConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';

import { Canvas } from '../Canvas';
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
  },
};

/** Light/dark colour patches pushed on theme change (OS follow + manual toggle). */
const THEME_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#e2e8f0' },
    graph: {
      node: { style: { labelColor: 0x334155, bgStrokeColor: 0xffffff } },
      edge: { style: { strokeColor: 0x475569, arrowTargetColor: 0x475569 } },
    },
  },
};
const THEME_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#1e293b' },
    graph: {
      node: { style: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a } },
      edge: { style: { strokeColor: 0x64748b, arrowTargetColor: 0x64748b } },
    },
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

/** Pushes the matching light/dark colour patch through `update()` on theme change. */
function ShellThemeSync({ kind }: { kind: ThemeKind }) {
  const update = useGraphCanvasUpdate();
  useEffect(() => {
    update(kind === 'dark' ? THEME_DARK : THEME_LIGHT);
  }, [update, kind]);
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
  themeKind,
  children,
}: {
  data: GraphData;
  config: CanvasConfig;
  bundle: boolean;
  instanceKey?: string | number;
  onReady: (canvas: GraphCanvas | null) => void;
  themeKind?: ThemeKind;
  children?: ReactNode;
}) {
  return (
    // The `<Canvas>` host fills its parent (`100%/100%`); the layout's main cell
    // bounds it. Keyed on instanceKey so a reset remounts the engine. The render
    // backend is the engine's own setting — auto-resolved unless set in `config`.
    <Canvas key={instanceKey} autoResize config={config}>
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
          {themeKind ? <ShellThemeSync kind={themeKind} /> : null}
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
    </Canvas>
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
  /** Wrap the whole app (above the lifted context) — hoist providers here. */
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

  // The app's own light/dark, default light — NOT the OS scheme. The toggle flips
  // it; the canvas colours follow via <ShellThemeSync> (a `config` patch) and the
  // shell classes via the scoped layout root. Following the *system* theme is the
  // host's concern when this is embedded as a widget.
  const [themeKind, setThemeKind] = useState<ThemeKind>('light');
  const toggleTheme = useCallback(() => setThemeKind((k) => (k === 'dark' ? 'light' : 'dark')), []);

  const handleReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      onReady?.(c);
    },
    [onReady],
  );

  const ctx: GraphCanvasAppControlContext = useMemo(
    () => ({ canvas, themeKind, toggleTheme }),
    [canvas, themeKind, toggleTheme],
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
      themeKind={bundle ? themeKind : undefined}
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
  // live engine; `wrap` sits outermost so arrangements can hoist providers.
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
