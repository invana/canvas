/**
 * `<GraphCanvasApp>` — one composable, batteries-included graph application.
 *
 * The engine lives in {@link GraphCanvasAppRoot} (owner + scope + lifted
 * context) and draws through {@link GraphCanvasAppSurface}; this component lays
 * them out in the `@invana/themes` **`AppLayoutV2`** shell: a **header** rail, a **main** canvas region, an
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
 * layout root) while {@link CanvasThemeSync} pushes the resolved mode + theme
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

import { type CSSProperties, type ReactNode, useCallback, useSyncExternalStore } from 'react';
import type { CanvasConfig, CanvasTelemetryConfig } from '@invana/canvas';
import type { GraphCanvas, GraphData } from '@invana/graph';
import { AppLayoutV2, type BottomSpan, type SectionConfig } from '@invana/themes';
import type { RenderPreference } from '@invana/canvas-react';

import { buildHeaderNav, type GraphCanvasAppHeaderOptions } from './GraphCanvasAppHeader';
import { buildFooterNav, type GraphCanvasAppFooterOptions } from './GraphCanvasAppFooter';
import { hasRailControlPanels, type ControlPanelsProps } from '../control-panels';
import {
  GraphCanvasAppRoot,
  GraphCanvasAppSurface,
  useGraphCanvasApp,
  type GraphCanvasAppControlContext,
} from './GraphCanvasAppRoot';

// Re-export the layout's bottom-span union so consumers can type the `bottomSpan`
// prop without reaching into `@invana/themes` directly.
export type { BottomSpan } from '@invana/themes';

// ─── Region types ─────────────────────────────────────────────────────────────

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

/** Join truthy class names. */
function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
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
   * Pin the render backend (`'webgl'` where WebGPU is known to crash, e.g.
   * WebKit). Read once at init — re-key with {@link instanceKey} to change it.
   * Default: auto-resolved (WebGPU, falling back to WebGL).
   */
  preference?: RenderPreference;
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
   * automatically when you pass a `footer` bag or the canvas saves a visible
   * control panel with a `footer-*` placement; set `true` to render an empty
   * rail, or `false` to suppress it even then. Default: auto.
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
  /**
   * Extra icons / widgets the control panels may name (merged over the
   * defaults). Declare panels as `<ControlPanel>` children or via
   * `config.controlPanels`; the app draws them over the canvas.
   */
  controlPanels?: Pick<ControlPanelsProps, 'icons' | 'widgets'>;
}

/**
 * Whether the canvas saves a visible control panel placed in the footer rail —
 * re-read on view-store writes; `false` until the engine is ready.
 */
function useHasFooterPanels(canvas: GraphCanvas | null): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => (canvas ? canvas.store.view.subscribe(onChange) : () => {}),
    [canvas],
  );
  const read = useCallback(
    () => (canvas ? hasRailControlPanels(canvas.store.view.getState().definition.controlPanels, 'footer') : false),
    [canvas],
  );
  return useSyncExternalStore(subscribe, read, read);
}

/**
 * The layout half: `AppLayoutV2` with the surface in its main cell. Rendered
 * inside the root, so it reads the live engine + theme from {@link useGraphCanvasApp}.
 */
function GraphCanvasAppLayout({
  showHeader,
  showFooter,
  header,
  footer,
  right,
  bottom,
  bottomSpan,
  children,
}: Pick<
  GraphCanvasAppProps,
  'showHeader' | 'showFooter' | 'header' | 'footer' | 'right' | 'bottom' | 'bottomSpan' | 'children'
>) {
  const ctx = useGraphCanvasApp();
  const hasFooterPanels = useHasFooterPanels(ctx.canvas);

  // `AppLayoutV2.header` is required — when hidden, hand it a display-`hidden`
  // bar rather than omitting it. When shown, the header builder folds the slot
  // bag (+ the default brand) into the balanced `NavHorizontal` bar.
  const headerNav = showHeader
    ? buildHeaderNav(header ?? {}, ctx)
    : { className: 'hidden' as const };
  // Footer is auto: shown when a `footer` bag is given or a saved panel is placed
  // in it, unless `showFooter` forces it. When hidden, hand `AppLayoutV2` a
  // display-`hidden` bar rather than letting it fall back to an empty 25px rail
  // (its `footer ?? {…}` default always paints).
  const footerNav = (showFooter ?? (footer !== undefined || hasFooterPanels))
    ? buildFooterNav(footer ?? {}, ctx)
    : { className: 'hidden' };

  // Map the side-region bags → `AppLayoutV2` sections (undefined ⇒ region hidden).
  const rightSection = toSection(right, ctx);
  const bottomSection = toSection(bottom, ctx);

  return (
    // `AppLayoutV2` is `h-screen` by default; force `h-full` (tailwind-merge lets
    // the later `h-full` win) so it fills the root's sized box instead.
    <AppLayoutV2
      className="h-full"
      header={headerNav}
      footer={footerNav}
      // `AppLayoutV2` wraps the main region in an `overflow-auto` container
      // (built for scrollable editor content). The canvas manages its own
      // pan/zoom, so clip here (`overflow-hidden`, exact `h-full w-full`):
      // otherwise a trackpad wheel/pinch the viewport doesn't fully swallow —
      // or a sub-pixel canvas overflow — scrolls the whole shell instead.
      mainSection={{
        content: (
          <div className="h-full w-full overflow-hidden">
            <GraphCanvasAppSurface>{children}</GraphCanvasAppSurface>
          </div>
        ),
      }}
      rightSection={rightSection}
      bottomSection={bottomSection}
      bottomSpan={bottomSpan}
    />
  );
}

export function GraphCanvasApp({
  data,
  config,
  bundle = true,
  instanceKey,
  onReady,
  telemetry,
  preference,
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
  controlPanels,
  children,
}: GraphCanvasAppProps) {
  return (
    <GraphCanvasAppRoot
      data={data}
      config={config}
      bundle={bundle}
      instanceKey={instanceKey}
      onReady={onReady}
      telemetry={telemetry}
      preference={preference}
      debug={debug}
      controlPanels={controlPanels}
      width={width}
      height={height}
      style={style}
      className={className}
      wrap={wrap}
    >
      <GraphCanvasAppLayout
        showHeader={showHeader}
        showFooter={showFooter}
        header={header}
        footer={footer}
        right={right}
        bottom={bottom}
        bottomSpan={bottomSpan}
      >
        {children}
      </GraphCanvasAppLayout>
    </GraphCanvasAppRoot>
  );
}
