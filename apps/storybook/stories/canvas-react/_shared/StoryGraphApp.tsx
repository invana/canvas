/**
 * `<StoryGraphApp>` — the turnkey, fully-configurable "app shell" for
 * `@invana/canvas-react` stories. Wraps a graph in the explorer-like chrome
 * (header toolbar · `<Canvas>` · footer stats/message · context menus · right
 * inspector) every full-featured story needs, so a story is
 * `<StoryGraphApp data={…} />` instead of ~700 lines of boilerplate.
 *
 * Everything is a prop, so the *same* component drives any story:
 *
 *   - **Settings** — `config` deep-merges over the defaults (node/edge style,
 *     layer options, behaviour `enabled` flags); `preference` picks the initial
 *     render backend.
 *   - **Behaviours** — `behaviours` controls the built-in set granularly: each
 *     key is `false` (omit), `true`/omitted (include with shell defaults), or a
 *     props object (include + override). A story can run *only* the behaviours it
 *     cares about, or tweak any of them.
 *   - **Layout** — `forceOptions` tunes the active d3-force; `activeLayout`
 *     replaces it wholesale; `layouts` / `layoutLabel` drive the header picker;
 *     `autoLayout` / `fitPadding` / `activeLayoutId` tune the run.
 *   - **Layers / colour** — `showBackground` / `showMiniMap` (+ `background` /
 *     `miniMap` overrides), `palette` / `nodeColorLabel` / `colorByLabel`,
 *     `nodeLabel`.
 *   - **Chrome** — `showToolbar` (+ `toolbarSections` to show only some toolbar
 *     groups), `showFooter`, `showContextMenus`, `showInspector`
 *     (+ `inspectorPosition`), and the header / footer slot overrides.
 *   - **Escape hatches** — `nodeMenu` / `edgeMenu` / `backgroundMenu` swap the
 *     menu builders; `children` appends extra `<Canvas>` children (a behaviour /
 *     layer / layout a story is demonstrating); `onReady` exposes the live engine.
 *
 * Built on `AppLayoutBase` (`@invana/themes`). The `<Canvas>` lives inside the
 * shell's `main`, so header/footer chrome sits *outside* its `CanvasContext`; a
 * lifted `CanvasContext.Provider` (fed by `CanvasBridge`, the last `<Canvas>`
 * child) gives every control the same live engine.
 */

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
  BackgroundLayer,
  type BackgroundLayerProps,
  BrushSelectBehaviour,
  type BrushSelectBehaviourProps,
  Canvas,
  CanvasContext,
  CanvasMessageBar,
  type CanvasConfig,
  ClickSelectBehaviour,
  type ClickSelectBehaviourProps,
  ClickViewBehaviour,
  type ClickViewBehaviourProps,
  ColorByLabelBehaviour,
  type ColorByLabelBehaviourProps,
  D3ForceLayout,
  type D3ForceLayoutProps,
  DragNodeBehaviour,
  type DragNodeBehaviourProps,
  DragPanBehaviour,
  type DragPanBehaviourProps,
  GraphBackgroundContextMenu,
  type GraphBackgroundMenuContext,
  GraphClipboardProvider,
  GraphEdgeContextMenu,
  type GraphEdgeMenuContext,
  GraphLayer,
  type GraphLayerProps,
  GraphNodeContextMenu,
  type GraphNodeMenuContext,
  GraphStatusBar,
  HoverActivateBehaviour,
  type HoverActivateBehaviourProps,
  LabelResolutionLODBehaviour,
  type LabelResolutionLODBehaviourProps,
  LassoSelectBehaviour,
  type LassoSelectBehaviourProps,
  type LayoutFactory,
  MiniMapLayer,
  type MiniMapLayerProps,
  type PanelPosition,
  PinchZoomBehaviour,
  type PinchZoomBehaviourProps,
  PropertyViewerPanel,
  type ViewContext,
  WheelZoomBehaviour,
  type WheelZoomBehaviourProps,
  canUseWebGPU,
} from '@invana/canvas-react';
import { AppLayoutBase } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import type { GraphCanvas, GraphData, GraphNode } from '@invana/graph';

import { ACTIVE_LAYOUT_ID, APP_OPTIONS, type CanvasBackend, FORCE_OPTS, PALETTE } from './shell-config';
import { AutoLayoutBridge, CanvasBridge, SystemTheme, applyChromeTheme, osPrefersDark } from './shell-bridges';
import { defaultBackgroundItems, defaultEdgeItems, defaultNodeItems } from './shell-menus';
import { HeaderThemeToggle, HeaderToolbar, type ToolbarSections } from './shell-toolbar';

/**
 * Per-behaviour control: `false` omits it, `true` / omitted includes it with the
 * shell defaults, an object includes it with those props merged over the defaults.
 */
export type BehaviourSetting<P> = boolean | Partial<P>;

/** The built-in behaviours the shell registers, each individually controllable. */
export interface ShellBehaviours {
  /** Drag-to-pan the camera. */
  pan?: BehaviourSetting<DragPanBehaviourProps>;
  /** Drag a node to reposition it. */
  dragNode?: BehaviourSetting<DragNodeBehaviourProps>;
  /** Wheel to zoom. */
  wheel?: BehaviourSetting<WheelZoomBehaviourProps>;
  /** Pinch to zoom (touch / trackpad). */
  pinch?: BehaviourSetting<PinchZoomBehaviourProps>;
  /** Hover-highlight (radius driven by the magnet toggle). */
  hover?: BehaviourSetting<HoverActivateBehaviourProps>;
  /** Click / shift-click selection. */
  clickSelect?: BehaviourSetting<ClickSelectBehaviourProps>;
  /** Rectangle drag-select (armed by the toolbar select-mode picker). */
  brushSelect?: BehaviourSetting<BrushSelectBehaviourProps>;
  /** Freeform lasso drag-select (armed by the toolbar select-mode picker). */
  lassoSelect?: BehaviourSetting<LassoSelectBehaviourProps>;
  /** Click-to-view → the right inspector panel. */
  clickView?: BehaviourSetting<ClickViewBehaviourProps>;
  /** Label level-of-detail (hide labels when zoomed out). */
  labelLod?: BehaviourSetting<LabelResolutionLODBehaviourProps>;
}

export interface StoryGraphAppProps {
  // ── Data & identity ──────────────────────────────────────────────────────
  /** The graph to render. */
  data: GraphData;
  /** Header brand text. Default `'Graph'`. */
  title?: string;

  // ── Canvas settings ──────────────────────────────────────────────────────
  /** Serialisable config, deep-merged over the shell defaults ({@link APP_OPTIONS}). */
  config?: CanvasConfig;
  /** Initial render backend. Default: WebGPU when usable, else WebGL. */
  preference?: CanvasBackend;
  /** Receives the live engine once every layer / behaviour has registered (or null). */
  onReady?: (canvas: GraphCanvas | null) => void;

  // ── Graph layer / colour / labels ────────────────────────────────────────
  /** Extra `<GraphLayer>` props (e.g. non-serialisable `node` / `edge` resolvers). */
  graphLayer?: Partial<GraphLayerProps>;
  /** Node label resolver. Default `String(n.id)`. */
  nodeLabel?: (n: GraphNode) => string;
  /** Colour-by-label palette. Default {@link PALETTE}. */
  palette?: readonly number[];
  /** Category resolver for `ColorByLabelBehaviour`. Default: `node.type`. */
  nodeColorLabel?: (n: GraphNode) => string;
  /** Colour-by-label behaviour: `false` to omit, or props to override. */
  colorByLabel?: BehaviourSetting<ColorByLabelBehaviourProps>;

  // ── Layers ────────────────────────────────────────────────────────────────
  /** Show the background layer. Default true. */
  showBackground?: boolean;
  /** Extra `<BackgroundLayer>` props. */
  background?: Partial<BackgroundLayerProps>;
  /** Show the minimap. Default true. */
  showMiniMap?: boolean;
  /** Extra `<MiniMapLayer>` props. */
  miniMap?: Partial<MiniMapLayerProps>;

  // ── Behaviours ────────────────────────────────────────────────────────────
  /** Granular control of the built-in behaviour set. */
  behaviours?: ShellBehaviours;

  // ── Layout ──────────────────────────────────────────────────────────────
  /** Force options for the default active d3-force layout. Default {@link FORCE_OPTS}. */
  forceOptions?: D3ForceLayoutProps['options'];
  /** Auto-fit padding for the active layout (`null` disables). Default 80. */
  fitPadding?: number | null;
  /** Active layout id (config `activeLayout`, `<AutoLayoutBridge>`). Default {@link ACTIVE_LAYOUT_ID}. */
  activeLayoutId?: string;
  /** Replace the default `<D3ForceLayout>` active layout entirely (pass `null` for none). */
  activeLayout?: ReactNode;
  /** Mount `<AutoLayoutBridge>` to run the active layout on (re-)seed. Default true. */
  autoLayout?: boolean;
  /** Layout picker factories for the header. Default d3-force + two ELK layouts. */
  layouts?: Record<string, LayoutFactory>;
  /** Layout picker labels (keyed like {@link layouts}). */
  layoutLabel?: Record<string, string>;

  // ── Chrome ──────────────────────────────────────────────────────────────
  /** Show the header toolbar. Default true. */
  showToolbar?: boolean;
  /** Which toolbar sections to show (omitted keys default on). */
  toolbarSections?: ToolbarSections;
  /** Show the footer status + message bars. Default true. */
  showFooter?: boolean;
  /** Show the node/edge/background right-click menus. Default true. */
  showContextMenus?: boolean;
  /** Show the right-side property inspector (opened by clicking an element). Default true. */
  showInspector?: boolean;
  /** Where the inspector docks. Default `'top-right'`. */
  inspectorPosition?: PanelPosition;

  // ── Header / footer slot overrides ────────────────────────────────────────
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;

  // ── Context menus ────────────────────────────────────────────────────────
  nodeMenu?: (ctx: GraphNodeMenuContext) => MenuItem[];
  edgeMenu?: (ctx: GraphEdgeMenuContext) => MenuItem[];
  backgroundMenu?: (ctx: GraphBackgroundMenuContext) => MenuItem[];

  /**
   * Extra `<Canvas>` children, appended *before* the internal `CanvasBridge`
   * (which must stay last). A story drops in the behaviour / layer / layout it's
   * demonstrating and keeps the full shell around it.
   */
  children?: ReactNode;
}

/** Minimal recursive merge for plain config objects (arrays / scalars replace). */
function deepMerge<T>(base: T, patch?: Partial<T>): T {
  if (!patch) return base;
  const out: Record<string, unknown> = Array.isArray(base)
    ? ([...(base as unknown[])] as never)
    : { ...(base as object) };
  for (const [k, v] of Object.entries(patch)) {
    const prev = (out as Record<string, unknown>)[k];
    out[k] =
      v && typeof v === 'object' && !Array.isArray(v) && prev && typeof prev === 'object'
        ? deepMerge(prev, v as object)
        : v;
  }
  return out as T;
}

/** Resolve a {@link BehaviourSetting} to `false` (omit) or a props object (include). */
function resolveBehaviour<P extends object>(setting: BehaviourSetting<P> | undefined): false | Partial<P> {
  if (setting === false) return false;
  if (setting === undefined || setting === true) return {};
  return setting;
}

export function StoryGraphApp({
  data,
  title = 'Graph',
  config,
  preference,
  onReady,
  graphLayer,
  nodeLabel,
  palette = PALETTE,
  nodeColorLabel,
  colorByLabel,
  showBackground = true,
  background,
  showMiniMap = true,
  miniMap,
  behaviours = {},
  forceOptions,
  fitPadding,
  activeLayoutId = ACTIVE_LAYOUT_ID,
  activeLayout,
  autoLayout = true,
  layouts,
  layoutLabel,
  showToolbar = true,
  toolbarSections,
  showFooter = true,
  showContextMenus = true,
  showInspector = true,
  inspectorPosition = 'top-right',
  headerLeft,
  headerRight,
  footerLeft,
  footerRight,
  nodeMenu = defaultNodeItems,
  edgeMenu = defaultEdgeItems,
  backgroundMenu = defaultBackgroundItems,
  children,
}: StoryGraphAppProps) {
  // The live canvas, lifted out of <Canvas> by <CanvasBridge>. Null until the
  // graph is fully wired; gates the header/footer chrome that depends on it.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const handleReady = useCallback(
    (c: GraphCanvas | null) => {
      setCanvas(c);
      onReady?.(c);
    },
    [onReady],
  );

  // Magnet toggle → hover neighbour radius (degree 1 vs 0). Reactive on
  // <HoverActivateBehaviour> — no remount.
  const [magnet, setMagnet] = useState(true);
  const toggleMagnet = useCallback(() => setMagnet((m) => !m), []);

  // Render backend (PixiJS). Switching it remounts the <Canvas> (keyed on `backend`).
  const [backend, setBackend] = useState<CanvasBackend>(
    () => preference ?? (canUseWebGPU() ? 'webgpu' : 'webgl'),
  );

  // The theme toggle pins the chrome theme; restore the OS preference on unmount.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);

  const mergedConfig = useMemo(() => {
    const merged = deepMerge(APP_OPTIONS, config);
    // Point `activeLayout` at the configured id unless the story set it explicitly.
    if (!config?.activeLayout) merged.activeLayout = activeLayoutId;
    return merged;
  }, [config, activeLayoutId]);
  const labelText = useMemo(() => nodeLabel ?? ((n: GraphNode) => String(n.id)), [nodeLabel]);

  // Resolve which built-in behaviours to register (and with what props).
  const pan = resolveBehaviour(behaviours.pan);
  const dragNode = resolveBehaviour(behaviours.dragNode);
  const wheel = resolveBehaviour(behaviours.wheel);
  const pinch = resolveBehaviour(behaviours.pinch);
  const hover = resolveBehaviour(behaviours.hover);
  const clickSelect = resolveBehaviour(behaviours.clickSelect);
  const brushSelect = resolveBehaviour(behaviours.brushSelect);
  const lassoSelect = resolveBehaviour(behaviours.lassoSelect);
  const clickView = resolveBehaviour(behaviours.clickView);
  const labelLod = resolveBehaviour(behaviours.labelLod);
  const colorBy = resolveBehaviour(colorByLabel);

  return (
    // Lifted context: the engine reaches the header toolbar + footer status /
    // message bars, which live in AppLayoutBase's header/footer (siblings of
    // <Canvas>, outside its own provider).
    <CanvasContext.Provider value={canvas}>
      <AppLayoutBase
        header={{
          left:
            headerLeft ??
            (
              <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{title}</span>
            ),
          center:
            showToolbar && canvas ? (
              <HeaderToolbar
                magnet={magnet}
                onToggleMagnet={toggleMagnet}
                backend={backend}
                onBackendChange={setBackend}
                layouts={layouts}
                layoutLabel={layoutLabel}
                sections={toolbarSections}
              />
            ) : null,
          right: headerRight ?? (canvas ? <HeaderThemeToggle /> : null),
        }}
        mainClassName="relative"
        main={
          <Canvas key={backend} autoResize preference={backend} config={mergedConfig}>
            {showBackground ? <BackgroundLayer id="background" {...background} /> : null}
            <GraphLayer id="graph" data={data} node={{ style: { labelText } }} {...graphLayer} />

            {/* Colour-by-category — defaults `nodeLabel` to `node.type`. */}
            {colorBy !== false ? (
              <ColorByLabelBehaviour
                targetLayerId="graph"
                palette={palette}
                colorEdges={false}
                {...(nodeColorLabel ? { nodeLabel: nodeColorLabel } : {})}
                {...colorBy}
              />
            ) : null}

            {/* Active layout — the default config-first d3-force (run by
                <AutoLayoutBridge>), or a story-supplied replacement. */}
            {activeLayout !== undefined ? (
              activeLayout
            ) : (
              <D3ForceLayout
                id={activeLayoutId}
                targetLayerId="graph"
                options={forceOptions ?? FORCE_OPTS}
                {...(fitPadding !== undefined ? { fitPadding } : {})}
              />
            )}
            {autoLayout ? <AutoLayoutBridge data={data} layoutId={activeLayoutId} /> : null}

            {/* OS dark-mode follow — external colour patches through update(). */}
            <SystemTheme />

            {/* Camera + interaction. */}
            {pan !== false ? <DragPanBehaviour id="pan" {...pan} /> : null}
            {dragNode !== false ? (
              <DragNodeBehaviour id="drag-node" targetLayerId="graph" {...dragNode} />
            ) : null}
            {wheel !== false ? <WheelZoomBehaviour id="wheel" {...wheel} /> : null}
            {pinch !== false ? <PinchZoomBehaviour id="pinch" {...pinch} /> : null}
            {hover !== false ? (
              <HoverActivateBehaviour
                id="hover"
                targetLayerId="graph"
                state="highlighted"
                degree={magnet ? 1 : 0}
                {...hover}
              />
            ) : null}

            {/* Selection. */}
            {clickSelect !== false ? (
              <ClickSelectBehaviour id="click-select" targetLayerId="graph" multiple {...clickSelect} />
            ) : null}
            {brushSelect !== false ? (
              <BrushSelectBehaviour id="brush-select" targetLayerId="graph" {...brushSelect} />
            ) : null}
            {lassoSelect !== false ? (
              <LassoSelectBehaviour id="lasso-select" targetLayerId="graph" {...lassoSelect} />
            ) : null}

            {/* Click-to-view → the right inspector (panel omitted when off). */}
            {clickView !== false ? (
              <ClickViewBehaviour
                id="click-view"
                targetLayerId="graph"
                panel={
                  showInspector
                    ? (ctx: ViewContext) => (
                        <PropertyViewerPanel ctx={ctx} position={inspectorPosition} fullHeight />
                      )
                    : undefined
                }
                {...clickView}
              />
            ) : null}

            {labelLod !== false ? (
              <LabelResolutionLODBehaviour id="label-lod" targetLayerId="graph" {...labelLod} />
            ) : null}
            {showMiniMap ? (
              <MiniMapLayer
                id="minimap"
                graphLayerId="graph"
                // Mirror the canvas backdrop — the minimap reads its background
                // colour straight from the BackgroundLayer, so the theme lives in
                // one place and the two never drift.
                backgroundLayerId="background"
                {...miniMap}
              />
            ) : null}

            {/* Right-click menus — each owns its own behaviour + overlay. Wrapped
                in the clipboard provider so any clipboard-backed override resolves. */}
            {showContextMenus ? (
              <GraphClipboardProvider layerId="graph">
                <GraphNodeContextMenu items={nodeMenu} />
                <GraphEdgeContextMenu items={edgeMenu} />
                <GraphBackgroundContextMenu items={backgroundMenu} />
              </GraphClipboardProvider>
            ) : null}

            {/* Story-supplied extra children (behaviour / layer being demonstrated). */}
            {children}

            {/* Last child: publishes the live engine once everything registered. */}
            <CanvasBridge onReady={handleReady} />
          </Canvas>
        }
        // `AppLayoutBase.footer` is required; render an empty bar when hidden.
        footer={
          showFooter
            ? {
                left: footerLeft ?? (canvas ? <GraphStatusBar /> : null),
                right: footerRight ?? (canvas ? <CanvasMessageBar /> : null),
              }
            : { left: null, right: null }
        }
      />
    </CanvasContext.Provider>
  );
}
