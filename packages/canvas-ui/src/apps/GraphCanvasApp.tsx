/**
 * `<GraphCanvasApp>` — one composable, batteries-included graph application.
 *
 * A thin orchestrator that owns the engine and drives the `@invana/themes`
 * **`AppLayoutV2`** shell: a **header** rail, a **main** canvas region, an
 * optional **footer** rail, and two optional resizable/collapsible side regions —
 * a **`right`** section (settings / detail / editors) and a **`bottom`** section
 * (data tables). There is deliberately **no left rail** — a single-canvas graph
 * app doesn't need nav/file-tree chrome.
 *
 * ```tsx
 * <GraphCanvasApp data={graph} />                                 // lean explorer
 * <GraphCanvasApp data={graph} style={{ height: 400 }} />         // bounded widget
 * <GraphCanvasApp data={graph} right={{ content: <Inspector/> }}/>// right panel
 * <GraphCanvasApp data={graph} bottom={{ content: <Table/> }} />  // bottom table
 * ```
 *
 * The default one-liner stays trivial; the breadth lives in **`config`** (the
 * single settings surface) plus the `header` / `footer` / `right` / `bottom` slot
 * bags. `AppLayoutV2` is viewport-height by default (`h-screen`); the orchestrator
 * wraps it in its **own sized, theme-scoped root** and forces `h-full` so the same
 * component works as a full-page app, a Storybook story, **and** a bounded /
 * embeddable widget (`width` / `height` / `style`) — not just fill-the-viewport.
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
 * **Lifted context.** The header / footer / side regions are siblings of
 * `<Canvas>` (under the layout), outside its `CanvasContext`. The orchestrator
 * publishes the live engine — fed by Main's ready-bridge — up to a lifted
 * `CanvasContext` / `GraphCanvasContext` wrapping the whole layout, so every
 * control resolves the same instance. **`wrap`** sits *outermost* (above that
 * lifted context) so an arrangement can hoist providers above every region alike.
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
import type { GraphCanvas, GraphData } from '@invana/graph';
import { AppLayoutV2, useTheme, type BottomSpan, type SectionConfig } from '@invana/themes';

// Aliased: the engine type `GraphCanvas` (from `@invana/graph`) is used in this
// file's public signatures (`onReady`), so the React root component takes a
// distinct local name.
import { GraphCanvas as GraphCanvasRoot } from '@invana/canvas-react';
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
import { ColorByLabelBehaviour } from '@invana/canvas-react';
import { ThemeBehaviour } from '@invana/canvas-react';
import { buildHeaderNav, type GraphCanvasAppHeaderOptions } from './GraphCanvasAppHeader';
import { buildFooterNav, type GraphCanvasAppFooterOptions } from './GraphCanvasAppFooter';
import { CanvasThemeSync } from './CanvasThemeSync';

// Re-export the layout's bottom-span union so consumers can type the `bottomSpan`
// prop without reaching into `@invana/themes` directly.
export type { BottomSpan } from '@invana/themes';

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

/**
 * Content for a slot in one of the app's regions (header / footer): a static
 * node, or a render fn handed the live {@link GraphCanvasAppControlContext}.
 * Providing the slot **replaces** that region's default content (no append).
 */
export type RegionSlot = ReactNode | ((ctx: GraphCanvasAppControlContext) => ReactNode);

/**
 * Config for one of the app's **resizable side regions** (`right` / `bottom`) —
 * an `AppLayoutV2` section. `content` is the panel body (a node or a render-fn
 * handed the live {@link GraphCanvasAppControlContext}); the size fields drive the
 * initial / min / max split (percent numbers or CSS sizes) and `collapsible` lets
 * the drag handle collapse it. Providing the bag mounts the region; omitting it
 * (the default) hides it and the canvas takes the space.
 */
export interface GraphCanvasAppSectionOptions {
  /** Panel body — a node, or `(ctx) => node` (note `ctx.canvas` may be `null` before ready). */
  content?: RegionSlot;
  /** Initial size of the panel (percent number, or a CSS size string). */
  defaultSize?: number | string;
  /**
   * Minimum size the drag handle allows (percent number, or a CSS size string).
   * Defaults to `'0px'` — the panel can shrink all the way — instead of the
   * layout's built-in per-region minimum. Set it to impose a floor.
   */
  minSize?: number | string;
  /** Maximum size the drag handle allows. */
  maxSize?: number | string;
  /** Allow the drag handle to fully collapse the panel. Default `true`. */
  collapsible?: boolean;
  /** Class on the panel body wrapper. */
  className?: string;
}

/** Resolve a {@link RegionSlot} against the control context (side regions). */
function resolveSlot(slot: RegionSlot | undefined, ctx: GraphCanvasAppControlContext): ReactNode {
  return typeof slot === 'function'
    ? (slot as (c: GraphCanvasAppControlContext) => ReactNode)(ctx)
    : (slot ?? null);
}

/**
 * Map a public {@link GraphCanvasAppSectionOptions} bag → the layout's
 * {@link SectionConfig}, resolving the slot and defaulting `collapsible` on. Its
 * body is wrapped in a `h-full` div only when a `className` is supplied (else the
 * layout's own panel wrapper is enough). Returns `undefined` when no bag is given
 * so the region stays unmounted.
 */
function toSection(
  bag: GraphCanvasAppSectionOptions | undefined,
  ctx: GraphCanvasAppControlContext,
): SectionConfig | undefined {
  if (!bag) return undefined;
  const body = resolveSlot(bag.content, ctx);
  return {
    content: bag.className ? <div className={cx('h-full', bag.className)}>{body}</div> : body,
    defaultSize: bag.defaultSize,
    // Default the floor to 0 (panel can shrink fully) rather than the layout's
    // built-in per-region minimum; a consumer-set `minSize` overrides it.
    minSize: bag.minSize ?? '0px',
    maxSize: bag.maxSize,
    collapsible: bag.collapsible ?? true,
  };
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
    // The sole theme publisher. Starts following the OS; `CanvasThemeSync`
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
  children,
}: {
  data: GraphData;
  config: CanvasConfig;
  bundle: boolean;
  instanceKey?: string | number;
  onReady: (canvas: GraphCanvas | null) => void;
  telemetry?: CanvasTelemetryConfig;
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

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export interface GraphCanvasAppProps {
  /** The graph to render. Reactive — a new reference re-seeds + re-lays-out. */
  data: GraphData;
  /**
   * **The single settings surface.** Serialisable canvas config keyed by id —
   * styles, behaviour options, resolver functions, force params, the active
   * layout, which behaviours are `enabled`, … — deep-merged over the baked bundle
   * defaults (or used as-is when `bundle` is `false`). Keep the reference stable.
   *
   * Includes the engine's `fitOnLoad` (default `true` here via the bundle) —
   * centre the graph once on load. Set `config={{ fitOnLoad: false }}` to opt out.
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
  /** Footer region — `left` / `center` / `right` slots. Auto-shown when given. */
  footer?: GraphCanvasAppFooterOptions;

  // ── Side regions (resizable / collapsible `AppLayoutV2` sections) ───────────
  /**
   * The **right** region — a resizable/collapsible panel beside the canvas, the
   * natural home for settings / node-edge detail / editors. Omit to hide it (the
   * canvas takes the width). There is no left region by design.
   */
  right?: GraphCanvasAppSectionOptions;
  /**
   * The **bottom** region — a resizable/collapsible panel under the canvas, e.g. a
   * data table projecting the graph's `DataStore`. Omit to hide it. Spans per
   * {@link bottomSpan}.
   */
  bottom?: GraphCanvasAppSectionOptions;
  /**
   * Which columns the {@link bottom} panel spans: `'main-right'` (default — under
   * the canvas **and** the right panel), `'main'` (canvas only; right panel full
   * height beside it), or `'full'` (entire width). `'left-main'` is also accepted
   * but equals `'main'` here since there's no left region.
   */
  bottomSpan?: BottomSpan;

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
  showHeader = true,
  showFooter,
  width,
  height,
  style,
  className,
  header,
  footer,
  right,
  bottom,
  bottomSpan = 'main-right',
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
    >
      {children}
    </GraphCanvasAppMain>
  );

  // `AppLayoutV2.header` is required — when hidden, hand it a display-`hidden`
  // bar rather than omitting it. When shown, the header builder folds the slot
  // bag (+ the default brand) into the balanced `NavHorizontal` bar.
  const headerNav = showHeader
    ? buildHeaderNav(header ?? {}, ctx)
    : { className: 'hidden' as const };
  // Footer is auto: shown when a `footer` bag is given, unless `showFooter` forces
  // it. When hidden, hand `AppLayoutV2` a display-`hidden` bar rather than letting
  // it fall back to an empty 25px rail (its `footer ?? {…}` default always paints).
  const footerNav = (showFooter ?? footer !== undefined)
    ? buildFooterNav(footer ?? {}, ctx)
    : { className: 'hidden' };

  // Map the side-region bags → `AppLayoutV2` sections (undefined ⇒ region hidden).
  const rightSection = toSection(right, ctx);
  const bottomSection = toSection(bottom, ctx);

  // `AppLayoutV2` is `h-screen` by default; wrap it in our own sized, theme-scoped
  // root and force `h-full` (tailwind-merge lets the later `h-full` win) so the
  // app also works bounded / embedded, not just full-viewport. Theme classes live
  // on **this** root only — scoped to the app, never the document or the OS.
  const { dataTheme, className: themeClass } = shellThemeAttrs(themeKind);
  const rootStyle: CSSProperties = { width: width ?? '100%', height: height ?? '100%', ...style };

  // Lifted context so every region (siblings of <Canvas>) resolves the same live
  // engine. `wrap` sits outermost — above the lifted context — so an arrangement
  // can hoist its own providers above every region alike.
  const tree = (
    <CanvasContext.Provider value={canvas}>
      <GraphCanvasContext.Provider value={canvas}>
        <div
          data-theme={dataTheme}
          // `overflow-hidden`: the app shell must never paint outside its own box.
          // `AppLayoutV2` is `h-screen` by default (we force `h-full`), and its
          // resizable panels can momentarily overshoot; without this clip an
          // embedder that doesn't clip its own slot (e.g. an absolutely-positioned
          // board) shows the spill. Bounds the canvas + panels to the app rect.
          className={cx('bg-background text-foreground overflow-hidden', themeClass, className)}
          style={rootStyle}
        >
          <AppLayoutV2
            className="h-full"
            header={headerNav}
            footer={footerNav}
            // `AppLayoutV2` wraps the main region in an `overflow-auto` container
            // (built for scrollable editor content). The canvas manages its own
            // pan/zoom, so clip here (`overflow-hidden`, exact `h-full w-full`):
            // otherwise a trackpad wheel/pinch the viewport doesn't fully swallow —
            // or a sub-pixel canvas overflow — scrolls the whole shell instead.
            mainSection={{ content: <div className="h-full w-full overflow-hidden">{mainNode}</div> }}
            rightSection={rightSection}
            bottomSection={bottomSection}
            bottomSpan={bottomSpan}
          />
        </div>
      </GraphCanvasContext.Provider>
    </CanvasContext.Provider>
  );

  return <>{wrap ? wrap(tree) : tree}</>;
}
