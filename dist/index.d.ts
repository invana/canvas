import * as react from 'react';
import { ReactNode, CSSProperties, ComponentType } from 'react';
import { CanvasOptions, CanvasConfig, Canvas as Canvas$1, BackgroundLayerOptions, DevInfoLayerOptions, ControlPanelSpec, ControlItemSpec, DragPanBehaviourOptions, WheelZoomBehaviourOptions, PinchZoomBehaviourOptions, KeyboardCameraInputBehaviourOptions, KeyboardShortcutsBehaviourOptions, IBehaviour, Rect, ExportImageOptions, CanvasStateSnapshot, CanvasStateSource, ImportCanvasStateOptions, CanvasGlobalEvents, Playbook, StepSpec, LogEntryFilter, LogEntry, CommandOption } from '@invana/canvas';
export { CanvasConfig } from '@invana/canvas';
import { GraphCanvas as GraphCanvas$1, GraphClipboard, Vec2, GraphLayerOptions, GraphData, MiniMapLayerOptions, DragNodeBehaviourOptions, ContextMenuBehaviourOptions, CreateNodeBehaviourOptions, DrawEdgeBehaviourOptions, EraseBehaviourOptions, HoverActivateBehaviourOptions, ClickSelectBehaviourOptions, ClickInspectBehaviourOptions, GraphNode, GraphEdge, GraphLayer as GraphLayer$1, GraphStore, ClickViewBehaviourOptions, HoverElementPreviewBehaviourOptions, PreviewSnapshot, ColorByBehaviourOptions, ThemeBehaviourOptions, BrushSelectBehaviourOptions, LassoSelectBehaviourOptions, CollapseExpandBehaviourOptions, NodeResizeBehaviourOptions, LabelCollisionBehaviourOptions, TextResolutionLODBehaviourOptions, EntranceBehaviourOptions, NodeScaleLODBehaviourOptions, EdgeScaleLODBehaviourOptions, ParallelEdgeBehaviourOptions, FocusBehaviourOptions, FisheyeBehaviourOptions, NodeCentralityBehaviourOptions, NodeLabelLODBehaviourOptions, EdgeLabelLODBehaviourOptions, IconLODBehaviourOptions, ImageLODBehaviourOptions, EdgeLODBehaviourOptions, GraphStoreEventMap, InspectTarget, ViewTarget, EdgePathType } from '@invana/graph';
export { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS } from '@invana/graph';
export { RenderPreference, bestRenderPreference, canUseWebGPU, hasWebGL, hasWebGPUApi, resolveRenderPreference } from '@invana/renderer-pixijs';
import * as contour from '@invana/graph-layer-d3-contour';
import { MapLayerOptions } from '@invana/graph-layer-maplibre';
import * as d3Force from '@invana/graph-layout-d3-force';
import * as elk from '@invana/graph-layout-elkjs';
import * as d3Sankey from '@invana/graph-layout-d3-sankey';
import { ReactiveStore } from '@invana/canvas-store';

/**
 * Props shared by the React canvas roots (`<Canvas>` / `<GraphCanvas>`). They
 * differ only in the engine class they instantiate and the contexts they
 * provide — the prop surface is identical.
 */
interface CanvasRootProps extends Omit<CanvasOptions, 'container' | 'config'> {
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

/** Props for {@link Canvas} — see {@link CanvasRootProps}. */
type CanvasProps = CanvasRootProps;
/**
 * React root for the **base** canvas engine (`@invana/canvas`'s `Canvas`).
 * Renders a sized host `<div>`, creates a `Canvas` on mount, calls
 * `init({ container, ...opts })`, and provides the live instance to descendants
 * via {@link CanvasContext} (read with `useCanvas()`).
 *
 * Use this for a **non-graph** canvas — custom layers, shapes, generic
 * behaviours. Every base layer/behaviour/layout wrapper (they read `useCanvas`)
 * works under it; a `<GraphLayer>` will too, but there's **no** graph context
 * and **no** `config.activeLayout` auto-run — reach for {@link GraphCanvas} when
 * you want those (it's a strict superset).
 *
 * `forwardRef`'d — `ref.current` is the underlying `Canvas` (or `null` until
 * init resolves). StrictMode-safe (see {@link useCanvasEngine}).
 *
 * @example
 * ```tsx
 * const ref = useRef<Canvas>(null);
 * <Canvas ref={ref} autoResize>
 *   <DragPanBehaviour />
 *   <WheelZoomBehaviour />
 * </Canvas>
 * ```
 */
declare const Canvas: react.ForwardRefExoticComponent<CanvasRootProps & react.RefAttributes<Canvas$1>>;

/** Props for {@link GraphCanvas} — identical to {@link CanvasRootProps}. */
type GraphCanvasProps = CanvasRootProps;
/**
 * React root for the **graph** canvas engine (`@invana/graph`'s `GraphCanvas`, a
 * strict `Canvas` superset). Same lifecycle as {@link Canvas} but it
 * instantiates `GraphCanvas` and provides **both** {@link CanvasContext} *and*
 * {@link GraphCanvasContext} — so base wrappers (`useCanvas`) **and** the graph
 * hooks/toolbars (`useGraphCanvas` / `useGraphCanvasUpdate` /
 * `useGraphCanvasOptions`) work under it, and `config.activeLayout` auto-runs.
 * Under a `<GraphToolProvider>` it binds the provider to this canvas's store,
 * where the modeller tool lives (`view.interaction.viewMode`).
 *
 * This is the root for graph visualisations; `GraphCanvasApp` builds on it.
 * `forwardRef`'d — `ref.current` is the underlying `GraphCanvas` (or `null`
 * until init resolves). StrictMode-safe (see {@link useCanvasEngine}).
 *
 * @example
 * ```tsx
 * const ref = useRef<GraphCanvas>(null);
 * <GraphCanvas ref={ref} autoResize config={{ activeLayout: 'force' }}>
 *   <GraphLayer id="graph" data={data} />
 *   <D3ForceLayout id="force" targetLayerId="graph" />
 * </GraphCanvas>
 * ```
 */
declare const GraphCanvas: react.ForwardRefExoticComponent<CanvasRootProps & react.RefAttributes<GraphCanvas$1>>;

interface CanvasThemeSyncProps {
    /** Id of the `ThemeBehaviour` on the target canvas to drive. Default `'theme'`. */
    behaviourId?: string;
}
/**
 * Syncs the context canvas's `ThemeBehaviour` to the host `@invana/themes` theme
 * (resolved light/dark kind + theme family). Renders `null`. Place it inside the
 * canvas whose theme should follow the host toggle.
 *
 * While a `<ThemeProvider>` is present it also registers the `theme.toggle`
 * command (active while dark), so a control panel can flip the host theme.
 */
declare function CanvasThemeSync({ behaviourId }: CanvasThemeSyncProps): null;

/**
 * Holds the initialised engine `Canvas` for all descendant child wrappers.
 * `<Canvas>` only renders children once the engine is ready, so the context
 * value inside a wrapper is always non-null.
 */
declare const CanvasContext: react.Context<Canvas$1 | null>;
/**
 * Read the engine `Canvas` from context. Throws when used outside a
 * `<Canvas>` so misuse fails loudly during render instead of silently
 * skipping the effect that would have registered a layer or behaviour.
 */
declare function useCanvas(): Canvas$1;

/**
 * Holds the initialised {@link GraphCanvas} for descendant wrappers/hooks. The
 * same instance is also provided on {@link CanvasContext} (typed as the base
 * `Canvas`) so existing wrappers keep working; this context is the graph-typed
 * view for `useGraphCanvas()` and the spec/config hooks.
 *
 * `<Canvas>` only renders children once the engine is ready, so the value
 * inside a descendant is always non-null.
 */
declare const GraphCanvasContext: react.Context<GraphCanvas$1 | null>;
/**
 * Read the {@link GraphCanvas} from context. Throws when used outside a
 * `<Canvas>` so misuse fails loudly during render.
 */
declare function useGraphCanvas(): GraphCanvas$1;

/**
 * Holds the `GraphClipboard` constructed by a `<GraphClipboardProvider>` for all
 * descendant hooks (`useClipboard`) and self-wiring buttons (Cut/Copy/Paste/
 * Delete). `null` until the provider's effect has built the instance, or when no
 * provider is present — consumers must guard.
 */
declare const ClipboardContext: react.Context<GraphClipboard | null>;

/**
 * The active modelling tool. `'select'` is the neutral pointer (drag / select);
 * `'add'` drops nodes; `'connect'` draws edges; `'delete'` erases on click.
 * A string-literal union, but consumers may treat it opaquely — the
 * {@link ModellerToolbar} only renders the tools it's told to.
 */
type GraphTool = 'select' | 'add' | 'connect' | 'delete';
/**
 * Shared modeller state surfaced by {@link GraphToolProvider} and `useTool`.
 * Backed by the canvas store (`view.interaction.viewMode` + `viewModeArgs.nodeKind`)
 * whenever a canvas is reachable; a provider with no canvas below it yet holds
 * the values locally until one mounts.
 */
interface ToolContextValue {
    /** The currently active tool. */
    tool: GraphTool;
    /** Switch the active tool. */
    setTool: (tool: GraphTool) => void;
    /**
     * The node "kind" the **Add** tool drops next (an opaque key like `'circle'`
     * / `'rect'`). The consumer maps it to a concrete `NodeStyle` in its
     * `CreateNodeBehaviour` `createNode` factory.
     */
    nodeKind: string;
    /** Choose the node kind the Add tool drops next. */
    setNodeKind: (kind: string) => void;
}
/**
 * The tool value a `<GraphToolProvider>` exposes to `useTool` / `<ModellerToolbar>`.
 * `null` when no provider is present — `useTool` then reads the enclosing
 * canvas's store directly.
 */
declare const ToolContext: react.Context<ToolContextValue | null>;

interface GraphClipboardProviderProps {
    /** Id of the `GraphLayer` whose store the clipboard reads/writes. Default `'graph'`. */
    layerId?: string;
    /** Offset applied to pasted node positions. Forwarded to `GraphClipboard`. */
    pasteOffset?: Vec2;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas$1 | null;
    children?: ReactNode;
}
/**
 * Provides the target layer's `GraphClipboard` via {@link ClipboardContext},
 * for descendant `useClipboard` / Cut-Copy-Paste-Delete buttons.
 *
 * **On a `GraphCanvas`** the canvas already owns a clipboard per graph layer,
 * with the `clipboard.*` commands registered, so this provider only **bridges**
 * that instance into the context and applies `pasteOffset` while mounted. It
 * registers nothing. Optional there: `useGraphClipboard` falls back to the
 * canvas's own.
 *
 * **Elsewhere** (a plain `Canvas`) it builds a `GraphClipboard` over the
 * layer's store and while mounted registers `clipboard.cut` / `.copy` /
 * `.paste` / `.delete` and a selection-aware `graph.erase`.
 *
 * Every edit is undoable either way: the layer's store records it into
 * `canvas.history`. Its commands are `@invana/graph`'s own
 * (`registerGraphEditCommands`) — the same args, bodies and palette metadata
 * as a `GraphCanvas`'s. They honour `args.layerId` (default: this provider's
 * `layerId`). Place it **after** the `<GraphLayer>` it targets.
 */
declare function GraphClipboardProvider({ layerId, pasteOffset, canvas, children, }: GraphClipboardProviderProps): react.JSX.Element;

interface GraphToolProviderProps {
    /** Tool the canvas starts in. Default `'select'`. */
    defaultTool?: GraphTool;
    /** Node kind the Add tool drops first. Default `'circle'`. */
    defaultNodeKind?: string;
    /**
     * Pressing <kbd>Esc</kbd> returns to the `'select'` tool (cancelling any
     * in-progress draw). Default `true`. Set `false` to handle Esc yourself.
     */
    escapeToSelect?: boolean;
    children?: ReactNode;
}
/**
 * Configures the modeller tool for the `<GraphCanvas>` below it and surfaces it
 * via {@link ToolContext} to anything in between — `useTool`, `<ModellerToolbar>`,
 * or the component that renders the canvas.
 *
 * The tool itself lives in the canvas store (`view.interaction.viewMode`, with
 * the node kind in `viewModeArgs.nodeKind`), so a saved control panel's
 * `tool.active` / `tool.nodeKind` commands and this provider always agree, and
 * behaviours declared with `modes` switch themselves. When a `<GraphCanvas>`
 * mounts below, the provider writes its current tool into that canvas's store
 * and mirrors the store from then on; until one mounts it holds the values
 * locally. One canvas per provider — a second binding takes over.
 *
 * Place it anywhere above both the toolbar and the canvas, typically wrapping
 * the whole modeller (e.g. `GraphCanvasApp`'s `wrap`).
 */
declare function GraphToolProvider({ defaultTool, defaultNodeKind, escapeToSelect, children, }: GraphToolProviderProps): react.JSX.Element;

interface GraphLayerProps extends Omit<GraphLayerOptions, 'store'> {
    /** Layer id; default `'graph'`. Changing this remounts the layer. */
    id?: string;
    /**
     * Graph data — nodes + edges. Reactive: when this prop changes the wrapper
     * calls `layer.loadData(data)`, which clears and refills the store in one
     * batch **as the baseline** — unrecorded, with the canvas history cleared.
     * Pass `undefined` to skip the initial data load.
     */
    data?: GraphData;
    /**
     * Pre-built `GraphStore`. Forwarded to the engine layer. Init-only.
     */
    store?: GraphLayerOptions['store'];
}
/**
 * Declarative wrapper for `@invana/graph` `GraphLayer`.
 *
 * Init-only: `id`, `node`, `edge`, `useDefaultStates`, `store`, etc. — change
 * the `id` (or the component's `key`) to recreate with new options.
 *
 * Reactive: `data`. The wrapper calls `layer.loadData(data)` whenever the
 * referenced `GraphData` object changes — make sure the prop is a stable
 * reference between renders unless you actually want a re-load.
 */
declare function GraphLayer({ id, data, store, ...rest }: GraphLayerProps): null;

interface BackgroundLayerProps extends BackgroundLayerOptions {
    /** Layer id; default `'background'`. Changing this remounts the layer. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/canvas` `BackgroundLayer`.
 *
 * Reactive: all style options (`type`, `patternType`, `color`,
 * `backgroundColor`, `size`, `spacing`, `alpha`, `followCamera`, `mode`) — a
 * change calls `layer.setOptions(...)` and re-renders in place (no remount).
 * Only `id` forces a remount.
 */
declare function BackgroundLayer({ id, ...options }: BackgroundLayerProps): null;

interface DevInfoLayerProps extends DevInfoLayerOptions {
    /** Layer id; default `'dev-info'`. Changing this remounts the layer. */
    id?: string;
    /** Pixi z-index inside the screen stage. Default `9999` (top). Init-only. */
    zIndex?: number;
}
/**
 * Declarative wrapper for `@invana/canvas` `DevInfoLayer` — the screen-fixed
 * dev overlay (FPS, pointer screen/world coords, camera zoom).
 *
 * Reactive: style options (`corner`, `fontSize`, `opacity`, `backgroundColor`,
 * `textColor`, `accentColor`, `enabled`) apply in place via `setOptions(...)`.
 * Only `id` / `zIndex` force a remount.
 */
declare function DevInfoLayer({ id, zIndex, ...options }: DevInfoLayerProps): null;

interface MiniMapLayerProps extends Omit<MiniMapLayerOptions, 'graphLayerId'> {
    /** Layer id; default `'minimap'`. Changing this remounts the layer. */
    id?: string;
    /** Source `GraphLayer` id this minimap mirrors; default `'graph'`. */
    graphLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `MiniMapLayer`.
 *
 * Mount/unmount toggles visibility — conditionally render this component
 * (`{showMinimap && <MiniMapLayer/>}`) to show/hide the minimap.
 *
 * Reactive: appearance options (size, colours, viewport indicator, position,
 * margin) via `layer.setOptions(...)`. `id` and `graphLayerId` are identity —
 * changing either remounts.
 */
declare function MiniMapLayer({ id, graphLayerId, ...options }: MiniMapLayerProps): null;

type FillLayerCtorOptions = ConstructorParameters<typeof contour.DensityContourFillLayer>[0]['options'];
interface DensityContourFillLayerProps extends Omit<FillLayerCtorOptions, 'graphLayerId'> {
    /** Layer id; default `'density'`. Changing this remounts the layer. */
    id?: string;
    /** Source `GraphLayer` id whose node positions feed the density estimate; default `'graph'`. */
    graphLayerId?: string;
    /**
     * Paint order. Default `-1` — behind the graph, so the bands sit under the
     * nodes they describe.
     */
    zIndex?: number;
    /**
     * Recompute the bands whenever a layout run settles. The density is derived
     * from node **positions**, and the layer's own `auto` recompute only listens
     * for `data:changed` — so without this the bands stay where the nodes started.
     * Default `true`; pass a layout id to react to just that one.
     */
    recomputeOnLayout?: boolean | string;
}
/**
 * Declarative wrapper for `@invana/graph-layer-d3-contour`
 * `DensityContourFillLayer` — filled iso-bands from a d3-contour density
 * estimate over a source `GraphLayer`'s node positions.
 *
 * Mount/unmount toggles the overlay — conditionally render it
 * (`{showDensity && <DensityContourFillLayer/>}`) to show/hide the bands.
 *
 * Reactive: appearance options (`bandwidth`, `thresholds`, `cellSize`,
 * `fillOpacity`, `palette`, `padding`) via `layer.setOptions(...)` + a
 * `recompute()`. `id`, `graphLayerId`, `zIndex` and `recomputeOnLayout` are
 * identity — changing any remounts.
 */
declare function DensityContourFillLayer({ id, graphLayerId, zIndex, recomputeOnLayout, ...options }: DensityContourFillLayerProps): null;

type StrokeLayerCtorOptions = ConstructorParameters<typeof contour.DensityContourStrokeLayer>[0]['options'];
interface DensityContourStrokeLayerProps extends Omit<StrokeLayerCtorOptions, 'graphLayerId'> {
    /** Layer id; default `'density-stroke'`. Changing this remounts the layer. */
    id?: string;
    /** Source `GraphLayer` id whose node positions feed the density estimate; default `'graph'`. */
    graphLayerId?: string;
    /** Paint order. Default `-1` — behind the graph, like the fill variant. */
    zIndex?: number;
    /**
     * Recompute the iso-lines whenever a layout run settles. The density is
     * derived from node **positions**, and the layer's own `auto` recompute only
     * listens for `data:changed`. Default `true`; pass a layout id to react to
     * just that one.
     */
    recomputeOnLayout?: boolean | string;
}
/**
 * Declarative wrapper for `@invana/graph-layer-d3-contour`
 * `DensityContourStrokeLayer` — the stroked / Observable-style iso-lines of the
 * same density estimate. Compose it with `<DensityContourFillLayer>` (same
 * `graphLayerId`, different `zIndex`) for fill + outline together.
 *
 * Reactive: appearance options via `layer.setOptions(...)` + a `recompute()`.
 * `id`, `graphLayerId`, `zIndex` and `recomputeOnLayout` are identity —
 * changing any remounts.
 */
declare function DensityContourStrokeLayer({ id, graphLayerId, zIndex, recomputeOnLayout, ...options }: DensityContourStrokeLayerProps): null;

interface MapLayerProps extends MapLayerOptions {
    /** Layer id; default `'map'`. Changing this remounts the layer. */
    id?: string;
    /**
     * Paint order. Default `-100` — the basemap sits under every domain layer.
     * (The MapLibre canvas itself lives *below* the Pixi canvas in the DOM; the
     * `zIndex` orders this layer against other engine layers.)
     */
    zIndex?: number;
}
/**
 * Declarative wrapper for `@invana/graph-layer-maplibre` `MapLayer` — a MapLibre
 * GL basemap under the canvas, whose camera the engine mirrors every frame.
 *
 * MapLibre owns pan / zoom, so **don't** also mount `<DragPanBehaviour>` /
 * `<WheelZoomBehaviour>` — the two camera drivers fight. Inside
 * `<GraphCanvasApp>` that means `bundle={false}` (the bundle registers both).
 *
 * Pin node positions with the package's standalone `projectLngLat([lng, lat])`
 * — the same mercator math as `layer.project(...)`, callable while shaping
 * `data`, before any layer exists.
 *
 * Reactive: `styleUrl` / `center` / `zoom` / the rest of `MapLayerOptions` via
 * `layer.setOptions(...)`. `id` and `zIndex` are identity — changing either
 * remounts (and rebuilds the map).
 */
declare function MapLayer({ id, zIndex, ...options }: MapLayerProps): null;

interface ControlPanelProps extends Omit<ControlPanelSpec, 'kind' | 'items'> {
    /** Panel id — its key in `definition.controlPanels`. Changing it re-registers the panel. */
    id: string;
    /** Serialisable items (commands, toggles, widgets, dividers, text). */
    items?: readonly ControlItemSpec[];
    /**
     * Arbitrary React content, rendered **after** {@link items}. Not persisted:
     * the stored spec carries a `{ type: 'slot', slot: id }` placeholder and the
     * node lives in the canvas's runtime slot registry.
     */
    children?: ReactNode;
}
/**
 * Declares a **control panel** — floating UI chrome pinned over the canvas — as
 * a child of `<Canvas>` / `<GraphCanvas>` / `<GraphCanvasApp>`, the same way
 * behaviours are declared.
 *
 * Headless: it renders `null`. On mount it writes its {@link ControlPanelSpec}
 * to `canvas.store.view.definition.controlPanels[id]` (via
 * `store.actions.controlPanels`), replaces it whenever the props change, and
 * removes it on unmount. Drawing is done by the UI kit's `<ControlPanels>`
 * projection (mounted automatically by `GraphCanvasApp`), so panels written any
 * other way — `canvas.update({ controlPanels })`, an imported state, the Studio —
 * draw identically.
 *
 * `children` render through the slot registry, under the `<Canvas>` providers
 * but not under any provider placed between `<Canvas>` and this component.
 *
 * @example
 * <ControlPanel id="view" position="bottom-right" orientation="vertical" items={[
 *   { type: 'command', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
 *   { type: 'command', command: 'camera.fit', icon: 'maximize', label: 'Fit' },
 * ]} />
 */
declare function ControlPanel({ id, items, children, ...layout }: ControlPanelProps): null;

/**
 * Per-canvas registry of **non-persisted** control-panel content — the React
 * nodes a `ControlItemSpec` of `type: 'slot'` points at by name. Specs live in
 * the store as JSON; the nodes they can't hold live here, keyed by the canvas so
 * several canvases on one page never share slots.
 */
interface ControlPanelSlots {
    /** Set (or replace) the node for `name`. */
    set(name: string, node: ReactNode): void;
    /** Remove `name` — only if it still holds `node`, so a stale cleanup can't wipe a newer registration. */
    delete(name: string, node: ReactNode): void;
    /** The node for `name`, or `undefined`. */
    get(name: string): ReactNode;
    /** Hear every change. Returns an unsubscribe. */
    subscribe(listener: () => void): () => void;
}
/** The slot registry for `canvas` (created on first use). */
declare function controlPanelSlots(canvas: Canvas$1): ControlPanelSlots;

interface DragPanBehaviourProps extends Omit<DragPanBehaviourOptions, 'id'> {
    /** Behaviour id; default `'pan'`. Changing this remounts the behaviour. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/canvas` `DragPanBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` or the component `key` to recreate with new options.
 */
declare function DragPanBehaviour({ id, enabled, ...rest }: DragPanBehaviourProps): null;

interface WheelZoomBehaviourProps extends Omit<WheelZoomBehaviourOptions, 'id'> {
    /** Behaviour id; default `'zoom'`. Changing this remounts the behaviour. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/canvas` `WheelZoomBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` or the component `key` to recreate.
 */
declare function WheelZoomBehaviour({ id, enabled, ...rest }: WheelZoomBehaviourProps): null;

interface PinchZoomBehaviourProps extends Omit<PinchZoomBehaviourOptions, 'id'> {
    /** Behaviour id; default `'pinch'`. Changing this remounts the behaviour. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/canvas` `PinchZoomBehaviour`
 * (two-finger / trackpad pinch zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `key`.
 */
declare function PinchZoomBehaviour({ id, enabled, ...rest }: PinchZoomBehaviourProps): null;

interface KeyboardCameraInputBehaviourProps extends Omit<KeyboardCameraInputBehaviourOptions, 'id'> {
    /** Behaviour id; default `'keyboard-camera'`. Changing this remounts the behaviour. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/canvas` `KeyboardCameraInputBehaviour`
 * (arrow-key pan, +/- zoom, 0 reset).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `key`.
 */
declare function KeyboardCameraInputBehaviour({ id, enabled, ...rest }: KeyboardCameraInputBehaviourProps): null;

interface KeyboardShortcutsBehaviourProps extends Omit<KeyboardShortcutsBehaviourOptions, 'id'> {
    /** Behaviour id; default `'keyboard-shortcuts'`. Changing this remounts the behaviour. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/canvas` `KeyboardShortcutsBehaviour` — key
 * bindings that run commands. Nothing is bound unless you pass `bindings`
 * (`DEFAULT_SHORTCUTS` holds the usual editor keys).
 *
 * `enabled` is reactive; `bindings` / `scope` are init-only here — change `id` /
 * `key`, or edit them live through `canvas.update({ behaviours: { [id]: { bindings } } })`.
 */
declare function KeyboardShortcutsBehaviour({ id, enabled, ...rest }: KeyboardShortcutsBehaviourProps): null;

interface DragNodeBehaviourProps extends Omit<DragNodeBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'drag-node'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id whose nodes this behaviour drags; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `DragNodeBehaviour`.
 *
 * `enabled` is reactive (toggles in place). Other options are init-only —
 * change `id` / `targetLayerId` (or the `key`) to recreate.
 */
declare function DragNodeBehaviour({ id, targetLayerId, enabled, ...rest }: DragNodeBehaviourProps): null;

interface ContextMenuBehaviourProps extends Omit<ContextMenuBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'context-menu'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id whose nodes/edges this behaviour watches; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ContextMenuBehaviour`.
 *
 * Headless — pass `onContextMenu` to receive node/edge/canvas right-click
 * events and render your own menu. `enabled` and `onContextMenu` are reactive
 * (synced in place); `id` / `targetLayerId` are identity — change them (or the
 * `key`) to recreate.
 *
 * `onContextMenu` must stay reactive: menu builders routinely close over state
 * that settles *after* mount (the active tool, a lifted panel's state, …). Freezing the first closure would leave those items
 * wired to stale `null`s, so the wrapper re-syncs it via `setOptions` on every
 * change rather than capturing it once at construction.
 */
declare function ContextMenuBehaviour({ id, targetLayerId, enabled, ...rest }: ContextMenuBehaviourProps): null;

interface CreateNodeBehaviourProps extends Omit<CreateNodeBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'create-node'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour adds nodes to; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `CreateNodeBehaviour` — click empty
 * canvas to add a node.
 *
 * `enabled` is reactive (toggle it from a tool-mode switch); other options are
 * init-only — change `id` / `targetLayerId` (or the `key`) to recreate.
 */
declare function CreateNodeBehaviour({ id, targetLayerId, enabled, ...rest }: CreateNodeBehaviourProps): null;

interface DrawEdgeBehaviourProps extends Omit<DrawEdgeBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'draw-edge'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour draws edges in; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `DrawEdgeBehaviour` — drag from a
 * source node to a target node to create an edge (rubber-band preview).
 *
 * `enabled` is reactive (toggle it from a tool-mode switch). Don't enable this
 * and `DragNodeBehaviour` at once — both start on node pointer-down. Other
 * options are init-only — change `id` / `targetLayerId` (or the `key`) to recreate.
 */
declare function DrawEdgeBehaviour({ id, targetLayerId, enabled, ...rest }: DrawEdgeBehaviourProps): null;

interface EraseBehaviourProps extends Omit<EraseBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'erase'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour erases from; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `EraseBehaviour` — click a node
 * (cascades its edges) or an edge to delete it.
 *
 * `enabled` is reactive (toggle it from a tool-mode switch); other options are
 * init-only — change `id` / `targetLayerId` (or the `key`) to recreate. Deletes
 * are undoable through `canvas.history` (the layer's store records them).
 */
declare function EraseBehaviour({ id, targetLayerId, enabled, ...rest }: EraseBehaviourProps): null;

interface HoverActivateBehaviourProps extends Omit<HoverActivateBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'hover'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `HoverActivateBehaviour`.
 *
 * `enabled` **and** `degree` are reactive; all other options are init-only —
 * change `id` / `targetLayerId` (or the component `key`) to apply them. `degree` is
 * special-cased so a toolbar can flip neighbour-highlighting on/off live (e.g. a
 * "magnet" toggle: `degree={1}` lights up 1st-degree neighbours, `degree={0}`
 * lights up only the hovered element) without remounting the behaviour.
 */
declare function HoverActivateBehaviour({ id, targetLayerId, enabled, ...rest }: HoverActivateBehaviourProps): null;

interface ClickSelectBehaviourProps extends Omit<ClickSelectBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'click-select'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ClickSelectBehaviour`.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function ClickSelectBehaviour({ id, targetLayerId, enabled, ...rest }: ClickSelectBehaviourProps): null;

interface ClickInspectBehaviourProps extends Omit<ClickInspectBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'click-inspect'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour reads clicks from; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ClickInspectBehaviour` — tracks the
 * single node/edge clicked for editing, decoupled from selection. Pair with
 * `<InspectorPanel>` (which reads this behaviour's target by id).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function ClickInspectBehaviour({ id, targetLayerId, enabled, ...rest }: ClickInspectBehaviourProps): null;

interface UseViewDataOptions {
    /** GraphLayer to read from. Default `'graph'`. */
    layerId?: string;
    /** Id of the `ClickViewBehaviour` the view target is read from. Default `'click-view'`. */
    viewId?: string;
}
/** The single viewed node/edge resolved to its display fields. Read-only. */
interface ViewData {
    kind: 'node' | 'edge';
    id: string;
    /** Effective (resolved) label text. Empty for edges (they have no label field). */
    label: string;
    /** The element's free-form `type` tag, when set. */
    type?: string;
    /**
     * Current `data` as a flat map. Values keep their original type (number,
     * string, array, object, …) so a viewer can render each property by kind —
     * `null` / `undefined` entries are dropped. See `PropertyDetailView`.
     */
    data: Record<string, unknown>;
    /** Source node id — edges only. */
    source?: string;
    /** Target node id — edges only. */
    target?: string;
}
/**
 * Click-driven, **read-only** property data for a viewer. Returns the single
 * node or edge the user clicked to view — its effective label, `type`, `data`
 * (and, for edges, `source`/`target`) — or `null` when nothing is targeted (so
 * a panel can render nothing). Reads the target via {@link useViewTarget} (needs
 * a `ClickViewBehaviour`, independent of selection).
 *
 * The read-only analogue of {@link useEntityEditor}: no `commit` — it never
 * writes to the store. The view (`<PropertyDetailView>`) and placement are the
 * consumer's — see `NodeDetailView` / `EdgeDetailView` for the turnkey wiring.
 */
declare function useViewData(options?: UseViewDataOptions, canvas?: Canvas$1 | null): ViewData | null;

/**
 * The full "info" handed to a custom viewer UI (the `panel` render-prop on
 * `<ClickViewBehaviour>`). It bundles the **resolved display fields** (from
 * {@link useViewData}), the **raw stored entity**, and **engine handles** so the
 * UI can do anything — render read-only details (visualiser) or a form editor
 * that commits through the store / history (modeller).
 *
 * `kind` is `'node' | 'edge'` today; it's intentionally the discriminator the
 * UI switches on, so new clickable data types can widen this union later without
 * changing the contract.
 */
interface ViewContext {
    kind: 'node' | 'edge';
    id: string;
    /** Raw stored node — present when `kind === 'node'`. */
    node?: GraphNode;
    /** Raw stored edge — present when `kind === 'edge'`. */
    edge?: GraphEdge;
    /** Effective (resolved) label text. Empty for edges. */
    label: string;
    /** The element's free-form `type` tag, when set. */
    type?: string;
    /**
     * Current `data` as a flat map — values keep their original type (number,
     * string, array, object, …) for type-aware rendering. See {@link useViewData}.
     */
    data: Record<string, unknown>;
    /** Source node id — edges only. */
    source?: string;
    /** Target node id — edges only. */
    target?: string;
    /** The resolved engine canvas. */
    canvas: Canvas$1;
    /** The target `GraphLayer`. */
    layer: GraphLayer$1;
    /** The layer's store — write here (spread prior `style`) to edit. */
    store: GraphStore;
    /** Dismiss the viewer (clears the `ClickViewBehaviour` target). */
    close: () => void;
}
/**
 * Resolves the single clicked node/edge to a full {@link ViewContext} — the
 * read-only display fields ({@link useViewData}) plus the raw entity and engine
 * handles — or `null` when nothing is targeted. This is what a custom viewer UI
 * receives; see `<ClickViewBehaviour panel={…}>`.
 */
declare function useViewContext(options?: UseViewDataOptions, canvas?: Canvas$1 | null): ViewContext | null;

interface ClickViewBehaviourProps extends Omit<ClickViewBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'click-view'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour reads clicks from; default `'graph'`. */
    targetLayerId?: string;
    /**
     * Viewer UI for the clicked element, as a render-prop. Receives the full
     * {@link ViewContext} — `kind` (`'node' | 'edge'` today, extensible to future
     * data types), the raw entity, resolved display fields, and engine handles
     * (including `close()`) — so you can render anything: read-only details in a
     * visualiser, a form editor in a modeller.
     *
     * **This behaviour renders `panel(ctx)` verbatim — it owns no placement, no
     * `<Panel>`, no close chrome.** Those are the consumer's: wrap the (pure)
     * `<NodeDetailView>` / `<EdgeDetailView>` in a `<Panel>` to float it in a
     * corner, drop it in your own layout, or render it entirely **outside** the
     * canvas. Wire a close button to `ctx.close` if you want one; a background
     * click clears the target regardless.
     *
     * Omit it for a **pure target-tracking behaviour** with no UI — read the target
     * elsewhere via `useViewContext` / `useViewData` (e.g. a detail panel owned
     * outside the canvas) or subscribe to the engine `view:change` event yourself.
     *
     * @example
     * ```tsx
     * <ClickViewBehaviour targetLayerId="graph" enabled
     *   panel={(ctx) => (
     *     <Panel position="top-right">
     *       {ctx.kind === 'edge' ? <EdgeDetailView ctx={ctx} /> : <NodeDetailView ctx={ctx} />}
     *     </Panel>
     *   )} />
     * ```
     */
    panel?: (ctx: ViewContext) => ReactNode;
    /**
     * Notified whenever the viewed element **changes** — the resolved
     * {@link ViewContext} (kind, id, label, type, `data`, edge `source`/`target`,
     * engine handles, `close()`), or `null` when the target is cleared. Use this to
     * render the detail viewer **outside this subtree** — even outside
     * `GraphCanvasApp`: stash the ctx in your own state and render a
     * `<NodeDetailView>` / `<EdgeDetailView>` wherever you like (the views are pure
     * and only need the ctx). Works with or without `panel`.
     *
     * @example
     * ```tsx
     * const [view, setView] = useState<ViewContext | null>(null);
     * // …inside the canvas:
     * <ClickViewBehaviour onView={setView} />
     * // …anywhere else in your app:
     * {view && (view.kind === 'edge'
     *   ? <EdgeDetailView ctx={view} onClose={view.close} />
     *   : <NodeDetailView ctx={view} onClose={view.close} />)}
     * ```
     */
    onView?: (ctx: ViewContext | null) => void;
    /**
     * Alias of {@link onView} — same signature and change-based firing (fires when
     * the clicked element *changes*; `null` on a background click). Provided as the
     * more familiar name for the common "click an element → drive my own UI" flow —
     * e.g. open a **docked right-side section** with `<NodeDetailView>` /
     * `<EdgeDetailView>` instead of the `panel` render-prop's floating overlay. If
     * both are given, `onView` wins.
     *
     * @example
     * ```tsx
     * const [sel, setSel] = useState<ViewContext | null>(null);
     * <ClickViewBehaviour onClick={setSel} />
     * // …in GraphCanvasApp's right region:
     * right={{ content: sel && (sel.kind === 'edge'
     *   ? <EdgeDetailView ctx={sel} /> : <NodeDetailView ctx={sel} />) }}
     * ```
     */
    onClick?: (ctx: ViewContext | null) => void;
}
/**
 * Declarative wrapper for `@invana/graph` `ClickViewBehaviour` — tracks the
 * single node/edge clicked for **read-only property viewing**, decoupled from
 * selection (it applies no visual effect of its own; pair it with a
 * `ClickSelectBehaviour` if you want the clicked element highlighted).
 *
 * Pass a {@link ClickViewBehaviourProps.panel} render-prop to mount viewer UI
 * for whatever was clicked — one component drives both the behaviour and its UI,
 * and the same `panel(ctx)` contract serves every use case (details vs. editor)
 * and every data `kind`. The behaviour renders `panel(ctx)` **verbatim**:
 * placement, `<Panel>`, and any close chrome are the consumer's. Without `panel`
 * it's a pure behaviour and renders nothing.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function ClickViewBehaviour({ id, targetLayerId, enabled, panel, onView, onClick, ...rest }: ClickViewBehaviourProps): react.JSX.Element | null;

interface HoverElementPreviewBehaviourProps extends Omit<HoverElementPreviewBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'element-preview'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id whose nodes/edges this behaviour watches; default `'graph'`. */
    targetLayerId?: string;
    /** Gap in px between the anchor and the card. Default `12`. */
    gap?: number;
    /** Extra x nudge in px applied after placement — e.g. to clear the node / connector. Default `0`. */
    offsetX?: number;
    /** Extra y nudge in px applied after placement. Default `0`. */
    offsetY?: number;
    /** Minimum gap in px from the container edge when clamping. Default `8`. */
    edgeMargin?: number;
    /** Stacking order of the card. Default `1000`. */
    zIndex?: number;
    /** Content for a hovered **node** — gets the live `GraphNode`. */
    renderNode?: (node: GraphNode, snapshot: PreviewSnapshot) => ReactNode;
    /** Content for a hovered **edge** — gets the live `GraphEdge` (with `source` / `target`). */
    renderEdge?: (edge: GraphEdge, snapshot: PreviewSnapshot) => ReactNode;
    /** Content for any element — takes precedence over `renderNode` / `renderEdge`. */
    renderCard?: (snapshot: PreviewSnapshot) => ReactNode;
}
/**
 * Declarative, **headless** hover preview for `@invana/canvas-react`.
 *
 * Registers `@invana/graph`'s `HoverElementPreviewBehaviour` and owns the engine
 * glue — subscription, anchoring (measure → flip → clamp), and the interactive
 * hold-open behaviour — then renders **only the content you supply** via
 * `renderNode` / `renderEdge` (or `renderCard`) inside the positioned shell. It
 * draws **no card of its own** and imports no `@invana/ui`: with no render-prop
 * matching the hovered element it renders `null`. For a batteries-included
 * default card, use `@invana/canvas-ui`'s `HoverElementPreviewBehaviour`, which
 * wraps this and supplies the default card.
 *
 * All options except `id` / `targetLayerId` are reactive (synced via
 * `setOptions`); `id` / `targetLayerId` are identity — change them (or `key`) to
 * recreate. For a fully custom overlay, read {@link useHoverElementPreview}
 * directly instead.
 *
 * ```tsx
 * <HoverElementPreviewBehaviour
 *   targetLayerId="graph"
 *   renderNode={(node) => <NodePreviewCard title={node.id} … />}
 *   renderEdge={(edge) => <EdgePreviewCard title={`${edge.source} → ${edge.target}`} … />}
 * />
 * ```
 */
declare function HoverElementPreviewBehaviour({ id, targetLayerId, enabled, gap, offsetX, offsetY, edgeMargin, zIndex, renderNode, renderEdge, renderCard, ...rest }: HoverElementPreviewBehaviourProps): react.JSX.Element | null;

/**
 * Shared registration lifecycle for behaviour wrappers. One place owns the two
 * effects every wrapper needs:
 *
 * 1. **Register / unregister** keyed on `identity` (the behaviour `id`, plus
 *    `targetLayerId` for layer-scoped behaviours). Construction options are read once
 *    via `create()` — change an identity value (or the component `key`) to
 *    recreate with new options.
 * 2. **Reactive `enabled`** — toggles via `canvas.behaviours.setEnabled(id, …)`
 *    whenever the `enabled` prop changes, *without* re-registering. This is
 *    what lets a toolbar flip a behaviour on/off declaratively.
 *
 * `setEnabled` no-ops on an unknown id and on a no-op state change, and effects
 * run top-down, so the register effect has always run before the enable effect.
 *
 * @param create   Factory that constructs the engine behaviour from current props.
 * @param id       Behaviour id (used for unregister + setEnabled).
 * @param enabled  Desired enabled state; reconciled on every change.
 * @param identity Values that force a recreate when changed (e.g. `[id]` or `[id, targetLayerId]`).
 */
declare function useBehaviourRegistration(create: () => IBehaviour, id: string, enabled: boolean, identity: readonly unknown[]): void;

interface ColorByBehaviourProps extends Omit<ColorByBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'color-by'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour colours; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ColorByBehaviour` — colours nodes and
 * edges from one addressable field, either as **categories** (a distinct colour
 * per distinct value — the default) or as a **range** (a numeric magnitude
 * mapped onto a colour ramp). Writes node `bgFill` and edge `strokeColor` /
 * `arrowTargetColor`.
 *
 * The field is a root-relative dot path — `nodeValueKey="type"` (default),
 * `nodeValueKey="data.riskScore"`, `nodeValueKey="style.shape.kind"`.
 *
 * **Order matters for precedence:** it writes its colours to the layer template
 * once on enable, so anything that patches the same fields *after* it wins —
 * the `ThemeBehaviour`'s published palette recolours the non-fill fields
 * (label / border / edge stroke) on every theme change, leaving the
 * colour-by `bgFill` to this behaviour. `enabled` is reactive; the mode / keys /
 * palette are init-only — change `id` / `targetLayerId` to recreate.
 *
 * @example
 * ```tsx
 * <ColorByBehaviour nodeValueKey="data.subject" colorEdges={false} />
 * <ColorByBehaviour mode="range" nodeValueKey="data.coverage" nodeDomain={[0, 100]} />
 * ```
 */
declare function ColorByBehaviour({ id, targetLayerId, enabled, ...rest }: ColorByBehaviourProps): null;

interface ThemeBehaviourProps extends Omit<ThemeBehaviourOptions, 'id'> {
    /** Behaviour id; default `'theme'`. Changing this remounts the behaviour. */
    id?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ThemeBehaviour` — the single
 * publisher of the canvas theme. It resolves the active named palette + mode
 * and broadcasts it on the engine theme signal; `BackgroundLayer`,
 * `MiniMapLayer` and `GraphLayer` recolour themselves from it.
 *
 * `enabled` is reactive. Most settings (`mode` / `active` / `accent`) are driven
 * live via `canvas.update({ behaviours: { theme: … } })` (the behaviour's own
 * `setOptions`), so they don't need to be wrapper props — change `id` only to
 * recreate the behaviour.
 */
declare function ThemeBehaviour({ id, enabled, ...rest }: ThemeBehaviourProps): null;

interface BrushSelectBehaviourProps extends Omit<BrushSelectBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'brush-select'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `BrushSelectBehaviour`
 * (rectangular rubber-band selection).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function BrushSelectBehaviour({ id, targetLayerId, enabled, ...rest }: BrushSelectBehaviourProps): null;

interface LassoSelectBehaviourProps extends Omit<LassoSelectBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'lasso-select'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `LassoSelectBehaviour`
 * (freeform polygon selection).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function LassoSelectBehaviour({ id, targetLayerId, enabled, ...rest }: LassoSelectBehaviourProps): null;

interface CollapseExpandBehaviourProps extends Omit<CollapseExpandBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'collapse-expand'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `CollapseExpandBehaviour`
 * (click a group's +/- toggle to collapse/expand).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function CollapseExpandBehaviour({ id, targetLayerId, enabled, ...rest }: CollapseExpandBehaviourProps): null;

interface NodeResizeBehaviourProps extends Omit<NodeResizeBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'node-resize'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `NodeResizeBehaviour`
 * (drag corner handles to resize a node).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function NodeResizeBehaviour({ id, targetLayerId, enabled, ...rest }: NodeResizeBehaviourProps): null;

interface LabelCollisionBehaviourProps extends Omit<LabelCollisionBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'label-collision'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `LabelCollisionBehaviour`
 * (hide/show overlapping labels by priority).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function LabelCollisionBehaviour({ id, targetLayerId, enabled, ...rest }: LabelCollisionBehaviourProps): null;

interface TextResolutionLODBehaviourProps extends Omit<TextResolutionLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'label-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `TextResolutionLODBehaviour`
 * (show/hide labels by camera zoom tier).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function TextResolutionLODBehaviour({ id, targetLayerId, enabled, ...rest }: TextResolutionLODBehaviourProps): null;

interface EntranceBehaviourProps extends Omit<EntranceBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'entrance'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour animates; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `EntranceBehaviour` — the graph
 * *arrives* (a short staggered fade) instead of cutting from blank to complete.
 *
 * Plays once, when the active layout reports a settled run (or on first data
 * when there is no layout), then retires the effects it wrote. Re-layouts and
 * data updates never replay it; remount the component (change `id`, or its
 * React `key`) to see it again.
 *
 * `enabled` is reactive; other options are init-only — change `id` /
 * `targetLayerId`.
 *
 * @example
 * ```tsx
 * <GraphCanvas config={CONFIG}>
 *   <GraphLayer id="graph" data={DATA} />
 *   <EntranceBehaviour staggerMs={28} order="x" />
 * </GraphCanvas>
 * ```
 */
declare function EntranceBehaviour({ id, targetLayerId, enabled, ...rest }: EntranceBehaviourProps): null;

interface NodeScaleLODBehaviourProps extends Omit<NodeScaleLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'node-scale-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `NodeScaleLODBehaviour`
 * (rescale node sizes per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function NodeScaleLODBehaviour({ id, targetLayerId, enabled, ...rest }: NodeScaleLODBehaviourProps): null;

interface EdgeScaleLODBehaviourProps extends Omit<EdgeScaleLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'edge-scale-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `EdgeScaleLODBehaviour`
 * (rescale edge stroke widths per camera zoom).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function EdgeScaleLODBehaviour({ id, targetLayerId, enabled, ...rest }: EdgeScaleLODBehaviourProps): null;

interface ParallelEdgeBehaviourProps extends Omit<ParallelEdgeBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'parallel-edge'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ParallelEdgeBehaviour`
 * (fan out edges that share the same source/target pair).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function ParallelEdgeBehaviour({ id, targetLayerId, enabled, ...rest }: ParallelEdgeBehaviourProps): null;

interface FocusBehaviourProps extends Omit<FocusBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'focus'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour draws on; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `FocusBehaviour` — draws
 * `view.interaction.focus` (emphasise the focused nodes, dim the rest) and
 * frames them on a `'focus'` camera intent.
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function FocusBehaviour({ id, targetLayerId, enabled, ...rest }: FocusBehaviourProps): null;

interface FisheyeBehaviourProps extends Omit<FisheyeBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'fisheye'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id the lens distorts; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `FisheyeBehaviour` — a focus+context
 * magnifier lens (nodes under the lens drawn spread apart, enlarged and
 * labelled; display-only, never written to the store).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`,
 * or retune live through the canvas (`canvas.update({ behaviours: { fisheye: … } })`).
 */
declare function FisheyeBehaviour({ id, targetLayerId, enabled, ...rest }: FisheyeBehaviourProps): null;

interface NodeCentralityBehaviourProps extends Omit<NodeCentralityBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'node-centrality'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `NodeCentralityBehaviour`
 * (size nodes by in/out degree).
 *
 * `enabled` is reactive; other options are init-only — change `id` / `targetLayerId`.
 */
declare function NodeCentralityBehaviour({ id, targetLayerId, enabled, ...rest }: NodeCentralityBehaviourProps): null;

interface NodeLabelLODBehaviourProps extends Omit<NodeLabelLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'node-label-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `NodeLabelLODBehaviour` — node labels
 * across camera zoom: a show / hide band (labels + composite internal text) and
 * an on-screen size policy (`zoomGrowth` / `minFontPx` / `maxFontPx`).
 *
 * `enabled` is reactive; the band and size options are init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply new ones, or retune
 * live through the canvas (`canvas.update({ behaviours: { [id]: … } })`).
 */
declare function NodeLabelLODBehaviour({ id, targetLayerId, enabled, ...rest }: NodeLabelLODBehaviourProps): null;

interface EdgeLabelLODBehaviourProps extends Omit<EdgeLabelLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'edge-label-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `EdgeLabelLODBehaviour` — edge labels
 * across camera zoom: a show / hide band and an on-screen size policy
 * (`zoomGrowth` / `minFontPx` / `maxFontPx`), tuned separately from node labels.
 *
 * `enabled` is reactive; the band and size options are init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply new ones, or retune
 * live through the canvas (`canvas.update({ behaviours: { [id]: … } })`).
 */
declare function EdgeLabelLODBehaviour({ id, targetLayerId, enabled, ...rest }: EdgeLabelLODBehaviourProps): null;

interface IconLODBehaviourProps extends Omit<IconLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'icon-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `IconLODBehaviour`
 * (show / hide node inset icons by camera zoom band).
 *
 * `enabled` is reactive; the `minZoom` / `maxZoom` band is init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply a new band, or drive
 * it live through the engine's `setOptions`.
 */
declare function IconLODBehaviour({ id, targetLayerId, enabled, ...rest }: IconLODBehaviourProps): null;

interface ImageLODBehaviourProps extends Omit<ImageLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'image-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `ImageLODBehaviour`
 * (show / hide node silhouette image fills by camera zoom band).
 *
 * `enabled` is reactive; the `minZoom` / `maxZoom` band is init-only — change
 * `id` / `targetLayerId` (or the component `key`) to apply a new band, or drive
 * it live through the engine's `setOptions`.
 */
declare function ImageLODBehaviour({ id, targetLayerId, enabled, ...rest }: ImageLODBehaviourProps): null;

interface EdgeLODBehaviourProps extends Omit<EdgeLODBehaviourOptions, 'id' | 'targetLayerId'> {
    /** Behaviour id; default `'edge-lod'`. Changing this remounts the behaviour. */
    id?: string;
    /** GraphLayer id this behaviour drives; default `'graph'`. */
    targetLayerId?: string;
}
/**
 * Declarative wrapper for `@invana/graph` `EdgeLODBehaviour`
 * (thin edges below a camera-zoom threshold for the zoomed-out hairball).
 *
 * `enabled` is reactive; the thinning options (`minZoom` / `keepFraction` /
 * `keepBy` / `weightKey`) are init-only — change `id` / `targetLayerId` (or the
 * component `key`) to apply new ones, or drive them live via `setOptions`.
 */
declare function EdgeLODBehaviour({ id, targetLayerId, enabled, ...rest }: EdgeLODBehaviourProps): null;

type D3ForceLayoutCtorOptions = ConstructorParameters<typeof d3Force.D3ForceLayout>[0];
interface D3ForceLayoutProps {
    /**
     * Layout id. When set, the layout is **registered by id** on
     * `canvas.layouts` and driven by `config.activeLayout` (config-first):
     * `GraphCanvas` runs it once data is present and re-runs on topology change —
     * no manual `apply`, no `key`-remount on data switches. When omitted, the
     * legacy behaviour applies (build + `apply(layer)` on mount).
     */
    id?: string;
    /**
     * Id of the `<GraphLayer>` this layout drives. Default `'graph'`. The
     * wrapper looks the layer up at mount time; if it isn't registered yet,
     * mount the layout *after* the layer in JSX order.
     */
    targetLayerId?: string;
    /**
     * Padding in screen pixels for the auto-fit that runs when the simulation
     * settles. `null` disables auto-fit.
     *
     * Ignored when the canvas has armed its own fitter (`config.fitOnLoad: true`,
     * which `GraphCanvasApp` ships on by default) — the engine frames on the same
     * run, and two owners writing the transform is a visible extra hop. Default
     * `80`, which then applies only when `fitOnLoad` is off.
     */
    fitPadding?: number | null;
    /**
     * D3ForceLayout constructor options (`charge`, `link`, `center`, …). In the
     * config-first path (`id` set), prefer putting these in
     * `config.layouts[id]` instead — they apply by id via `update()`.
     */
    options?: D3ForceLayoutCtorOptions;
}
/**
 * Declarative wrapper for `@invana/graph-layout-d3-force` `D3ForceLayout`.
 *
 * Two modes:
 * - **Config-first (`id` set):** register the layout on `canvas.layouts` by id;
 *   `config.activeLayout` runs it (and re-runs on data/topology change). Wires
 *   `end → camera.fitContent(...)` unless `fitPadding` is `null`.
 * - **Legacy (no `id`):** build + `apply(layer)` on mount, same `end`-fit.
 *
 * Unmount: `layout.stop()` (config-first also unregisters). The simulation
 * cancels and emits its final `end` event with `reason: 'stopped'`.
 *
 * All inputs are init-only — remount with a new `key` to reseed the sim.
 */
declare function D3ForceLayout({ id, targetLayerId, fitPadding, options, }: D3ForceLayoutProps): null;

type ElkLayoutCtorOptions = ConstructorParameters<typeof elk.ElkLayout>[0];
interface ElkLayoutProps {
    /**
     * Layout id. When set, the layout is **registered by id** on `canvas.layouts`
     * and driven by `config.activeLayout` (config-first): `GraphCanvas` runs it
     * once data is present and re-runs on topology change — no manual `apply`.
     * When omitted, the layout is built and `apply(layer)`-ed on mount.
     */
    id?: string;
    /**
     * Id of the `<GraphLayer>` this layout drives. Default `'graph'`. The wrapper
     * looks the layer up at mount time; if it isn't registered yet, mount the
     * layout *after* the layer in JSX order.
     */
    targetLayerId?: string;
    /**
     * Padding in screen pixels for the auto-fit that runs when the solve
     * completes. `null` disables auto-fit.
     *
     * Ignored when the canvas has armed its own fitter (`config.fitOnLoad: true`,
     * which `GraphCanvasApp` ships on by default) — the engine frames on the same
     * run, and two owners writing the transform is a visible extra hop. Default
     * `80`, which then applies only when `fitOnLoad` is off.
     */
    fitPadding?: number | null;
    /**
     * `ElkLayout` constructor options (`algorithm`, `direction`, `nodeSpacing`,
     * …). In the config-first path (`id` set), prefer putting these in
     * `config.layouts[id]` instead — they apply by id via `update()`.
     */
    options?: ElkLayoutCtorOptions;
}
/**
 * Declarative wrapper for `@invana/graph-layout-elkjs` `ElkLayout`.
 *
 * Two modes, matching `<D3ForceLayout>`:
 * - **Config-first (`id` set):** register the layout on `canvas.layouts` by id;
 *   `config.activeLayout` runs it (and re-runs on data/topology change).
 * - **Bare (no `id`):** build + `apply(layer)` on mount.
 *
 * Both wire `end → camera.fitContent(...)` unless `fitPadding` is `null`.
 * Unmount stops the run (config-first also unregisters).
 *
 * All inputs are init-only — remount with a new `key` to re-seed, or patch by
 * id through `canvas.update({ layouts: { [id]: … } })`.
 */
declare function ElkLayout({ id, targetLayerId, fitPadding, options, }: ElkLayoutProps): null;

type D3SankeyLayoutCtorOptions = ConstructorParameters<typeof d3Sankey.D3SankeyLayout>[0];
interface D3SankeyLayoutProps {
    /**
     * Layout id. When set, the layout is **registered by id** on `canvas.layouts`
     * and driven by `config.activeLayout` (config-first). When omitted, the
     * layout is built and `apply(layer)`-ed on mount.
     */
    id?: string;
    /**
     * Id of the `<GraphLayer>` this layout drives. Default `'graph'`. The wrapper
     * looks the layer up at mount time; if it isn't registered yet, mount the
     * layout *after* the layer in JSX order.
     */
    targetLayerId?: string;
    /**
     * Padding in screen pixels for the auto-fit that runs when the layout
     * completes. `null` disables auto-fit.
     *
     * Ignored when the canvas has armed its own fitter (`config.fitOnLoad: true`,
     * which `GraphCanvasApp` ships on by default) — the engine frames on the same
     * run, and two owners writing the transform is a visible extra hop. Default
     * `80`, which then applies only when `fitOnLoad` is off.
     */
    fitPadding?: number | null;
    /**
     * `D3SankeyLayout` constructor options (`width`, `height`, `nodeWidth`,
     * `nodePadding`, `align`, …). In the config-first path (`id` set), prefer
     * putting these in `config.layouts[id]` — they apply by id via `update()`.
     */
    options?: D3SankeyLayoutCtorOptions;
}
/**
 * Declarative wrapper for `@invana/graph-layout-d3-sankey` `D3SankeyLayout`.
 *
 * The sankey layout writes node positions **and** per-edge ribbon hints, so it
 * pairs with an edge style that reads them. Two modes, matching
 * `<D3ForceLayout>`: config-first (`id` set → registered, run by
 * `config.activeLayout`) or bare (`apply(layer)` on mount). Both wire
 * `end → camera.fitContent(...)` unless `fitPadding` is `null`.
 *
 * All inputs are init-only — remount with a new `key`, or patch by id through
 * `canvas.update({ layouts: { [id]: … } })`.
 */
declare function D3SankeyLayout({ id, targetLayerId, fitPadding, options, }: D3SankeyLayoutProps): null;

interface UseCameraResult {
    /** Multiply scale by `factor` (default 1.2), anchored at the viewport centre. */
    zoomIn: (factor?: number) => void;
    /** Divide scale by `factor` (default 1.2), anchored at the viewport centre. */
    zoomOut: (factor?: number) => void;
    /** Set an absolute scale, anchored at the viewport centre. */
    setZoom: (scale: number) => void;
    /** Set an absolute scale around an arbitrary screen point (defaults to centre). */
    zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
    /** Pan by `(dx, dy)` screen pixels. */
    pan: (dx: number, dy: number) => void;
    /** Fit a world-space rectangle into the viewport. */
    fitContent: (worldRect: Rect, padding?: number) => void;
    /** Read the current uniform scale (does not subscribe — use `useZoom` for live state). */
    getZoom: () => number;
}
/**
 * Imperative camera actions for the resolved canvas — the wiring the
 * GraphVisualiser story used to hand-write inline (`camera.zoomAt(1.2)` etc.),
 * promoted to a reusable, multi-canvas-safe hook. Pure actions, no
 * subscriptions; callbacks are stable per resolved `canvas`. For a live zoom
 * value that re-renders, use {@link useZoom}.
 *
 * @param canvas Optional explicit instance; defaults to the context canvas.
 */
declare function useCamera(canvas?: Canvas$1 | null): UseCameraResult;

interface UseZoomResult {
    /** Live uniform scale — re-renders whenever the camera zooms (interactively or programmatically). */
    zoom: number;
    zoomIn: (factor?: number) => void;
    zoomOut: (factor?: number) => void;
    setZoom: (scale: number) => void;
    zoomTo: (scale: number, centerX?: number, centerY?: number) => void;
}
/**
 * Live zoom state + zoom actions for the resolved canvas. Subscribes to
 * `camera:zoom`, so the returned `zoom` tracks wheel / pinch / programmatic
 * zoom and re-renders the component.
 *
 * Multi-canvas-safe: the subscription effect is keyed on the resolved instance,
 * so two `<Canvas>` trees (or two explicit instances) never share zoom state.
 *
 * @param canvas Optional explicit instance; defaults to the context canvas.
 */
declare function useZoom(canvas?: Canvas$1 | null): UseZoomResult;

interface UseFitContentResult {
    /** Fit the viewport to the target layer's content bounds. No-op until the layer exists. */
    fitContent: (padding?: number) => void;
    /** Whether the target layer is currently mounted (drives e.g. button disabled state). */
    hasContent: boolean;
}
/**
 * Fit-to-content (zoom-to-extent) for a specific layer on the resolved canvas.
 * The layer is resolved lazily *inside* the returned callback, so the hook
 * tolerates the layer mounting after the hook runs (common, since layer
 * wrappers register in effects). `hasContent` tracks layer mount/unmount via
 * the `layer:added` / `layer:removed` canvas events.
 *
 * @param layerId Target layer id (e.g. `'graph'`).
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
declare function useFitContent(layerId: string, canvas?: Canvas$1 | null): UseFitContentResult;

/** Extension of the engine export options with a download filename. */
interface DownloadImageExportOptions extends ExportImageOptions {
    /** File name for the download. Defaults to `canvas.<ext>` for the format. */
    filename?: string;
}
interface UseCanvasImageExportResult {
    /** Export the current view as an image `Blob` (PNG / JPEG / WebP / SVG). */
    toBlob(opts?: ExportImageOptions): Promise<Blob>;
    /** Export, then trigger a browser download of the resulting file. */
    download(opts?: DownloadImageExportOptions): Promise<void>;
}
/**
 * Export the current canvas view to an image and optionally download it.
 *
 * Thin binding over the engine's {@link Canvas.export}: `toBlob` returns the
 * raw `Blob` (for previews / uploads / custom handling); `download` saves it as
 * a file. Both take the engine {@link ExportImageOptions} — `format`
 * (`'png' | 'jpeg' | 'webp' | 'svg'`), `area` (`'viewport' | 'content'`),
 * `background`, `scale`, `quality`. Multi-canvas-safe via the optional
 * `canvas` argument (falls back to the `<Canvas>` context).
 *
 * @example
 * const { download } = useCanvasImageExport();
 * <button onClick={() => download({ format: 'png', area: 'content' })}>Save PNG</button>
 */
declare function useCanvasImageExport(canvas?: Canvas$1 | null): UseCanvasImageExportResult;

interface UseCanvasStateJsonResult {
    /** The current full canvas state as a plain, JSON-serialisable object. */
    export(): CanvasStateSnapshot;
    /** The current full canvas state stringified (pretty-printed by default). */
    toJSON(space?: string | number): string;
    /** Serialise the current state and trigger a browser download of the `.json` file. */
    download(filename?: string): void;
    /**
     * Restore the canvas from a snapshot, a JSON string, or a picked `File` / `Blob`
     * (e.g. from an `<input type="file">`). The canvas's layers/behaviours/layouts
     * must already be registered under the snapshot's ids.
     */
    import(source: CanvasStateSource, opts?: ImportCanvasStateOptions): Promise<void>;
}
/**
 * Export / import the **full canvas state** (view definition + interaction +
 * per-layer data) as JSON — the state counterpart to
 * {@link useCanvasImageExport} (which handles *images*).
 *
 * A thin React binding over the engine's framework-agnostic helpers
 * ({@link Canvas.exportState} / {@link Canvas.stateToJSON} /
 * {@link Canvas.downloadState} / {@link Canvas.importStateFrom}): `export` /
 * `toJSON` read the current state, `download` saves it as a `.json` file, and
 * `import` restores from a snapshot, a JSON string, or a picked `File`.
 * Multi-canvas-safe via the optional `canvas` argument (falls back to the
 * `<Canvas>` context).
 *
 * @example
 * const { download, import: importState } = useCanvasStateJson();
 * <button onClick={() => download('scene.json')}>Save</button>
 * <input type="file" accept="application/json"
 *        onChange={(e) => e.target.files?.[0] && importState(e.target.files[0])} />
 */
declare function useCanvasStateJson(canvas?: Canvas$1 | null): UseCanvasStateJsonResult;

/**
 * Subscribe to a typed canvas-wide event (`camera:zoom`, `camera:pan`,
 * `layer:added`, …) for the lifetime of the calling component. Fully typed off
 * the engine's exported {@link CanvasGlobalEvents} map.
 *
 * The handler is held in a ref so changing it between renders does **not** tear
 * down and re-create the subscription; only a change of the resolved `canvas`
 * (or the `event` name) does. That keeps subscriptions stable and — because the
 * effect is keyed on the resolved instance — correct across multiple canvases.
 *
 * @param event   Event name from {@link CanvasGlobalEvents}.
 * @param handler Fired with the event payload.
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
declare function useCanvasEvent<E extends keyof CanvasGlobalEvents>(event: E, handler: (payload: CanvasGlobalEvents[E]) => void, canvas?: Canvas$1 | null): void;

/**
 * The graph events a component can subscribe to via {@link useGraphEvent} — the
 * fine-grained `GraphStore` stream (`node:add`, `node:visibility`, `edge:*`, …)
 * plus the handful of `GraphLayer`-level signals a UI typically reacts to.
 *
 * The layer-level entries are declared by hand rather than pulled from
 * `GraphLayerEvents` because that interface carries a `[event: string]: unknown`
 * index signature (open for future pointer/gesture events), which would collapse
 * `keyof` to `string` and lose per-event payload typing. Add new layer events
 * here as they become worth subscribing to from React.
 */
interface GraphEventMap extends GraphStoreEventMap {
    /** A group container was hidden/shown as a unit (`hideGroup`/`showGroup`). */
    'group:visibility': {
        groupId: string;
        hidden: boolean;
    };
    /** Aggregated per-flush topology/position change on the layer. */
    'data:changed': {
        addedNodes: number;
        removedNodes: number;
        updatedNodes: number;
        addedEdges: number;
        removedEdges: number;
        updatedEdges: number;
    };
    /** The layer-level style template changed. */
    'style:changed': {
        scope: 'node' | 'edge' | 'state';
    };
}
interface UseGraphEventOptions {
    /** Explicit engine instance (out-of-`<Canvas>` / multi-canvas). Defaults to context. */
    canvas?: Canvas$1 | null;
    /** Id of the `GraphLayer` to observe. Defaults to `'graph'`. */
    layerId?: string;
}
/**
 * Subscribe to a graph event — a `GraphStore` event (`node:visibility`,
 * `edge:visibility`, `node:add`, …) or a `GraphLayer` event (`group:visibility`,
 * `data:changed`, `style:changed`) — for the lifetime of the calling component.
 *
 * Resolves the engine like the other canvas hooks (context or explicit
 * `opts.canvas`), looks up the `GraphLayer` by `opts.layerId` (default
 * `'graph'`), and attaches to the right emitter (`layer.store.events` or
 * `layer.events`). The handler is held in a ref, so changing it between renders
 * does **not** re-subscribe; only a change of the resolved canvas, layer id, or
 * event name does. No-op (until the layer exists) when the id isn't mounted yet.
 *
 * @example
 * useGraphEvent('node:visibility', () => setHidden([...layer.store.hiddenNodes()]));
 * useGraphEvent('group:visibility', ({ groupId, hidden }) => …);
 */
declare function useGraphEvent<K extends keyof GraphEventMap>(event: K, handler: (payload: GraphEventMap[K]) => void, opts?: UseGraphEventOptions): void;

/**
 * Bind a React component to **one slice** of a kernel {@link ReactiveStore} (e.g.
 * `canvas.store.view`). The component re-renders **only** when the selected slice
 * changes (by `isEqual`, default `Object.is`) — idle slices cost nothing. Backed by
 * `useSyncExternalStore` over the kernel's `select` port, so it survives a backend
 * swap (zustand → Yjs).
 *
 * **Selector stability (R4).** Pass a **stable** `selector` — a module-scope function
 * or one wrapped in `useCallback` — and have it return a **referentially-stable**
 * slice (a sub-object the store keeps identity-stable between unrelated updates, not
 * a freshly-built object each call). Deriving a new object per call throws
 * "getSnapshot should be cached"; derive in `useMemo` from a stable slice instead.
 * For derived slices that legitimately change identity, pass `shallowEqual`.
 *
 * @example
 * const selectDefinition = (s: CanvasView) => s.definition;   // module scope
 * const definition = useStore(canvas.store.view, selectDefinition);
 */
declare function useStore<T, U>(store: ReactiveStore<T>, selector: (state: T) => U, isEqual?: (a: U, b: U) => boolean): U;

interface UseClearGraphResult {
    /** Remove every node and edge from the target layer. No-op if the layer doesn't exist yet. */
    clear: () => void;
}
/**
 * Clear-graph action for a specific layer on the resolved canvas.
 *
 * The clear is one undoable `'clear'` entry in `canvas.history` — Undo
 * restores the whole graph and Redo clears it again.
 *
 * Shares its logic with the `graph.clear` command (`clearGraphLayer` in `@invana/graph`).
 *
 * @param layerId Target layer id (e.g. `'graph'`).
 * @param canvas  Optional explicit instance; defaults to the context canvas.
 */
declare function useClearGraph(layerId: string, canvas?: Canvas$1 | null): UseClearGraphResult;

interface UseSelectionOptions {
    /** Id of the `ClickSelectBehaviour` to read selection from. Default `'click-select'`. */
    clickSelectId?: string;
}
interface UseSelectionResult {
    /** Currently selected node ids. */
    selectedNodeIds: string[];
    /** Currently selected edge ids. */
    selectedEdgeIds: string[];
    /** Total selected (nodes + edges). */
    count: number;
    /** Clear the selection. */
    clear: () => void;
}
/**
 * Reactive view of the current graph selection, driven by a
 * `ClickSelectBehaviour`'s `selection:change` event (brush/lasso flow through it
 * by delegation, so all three selection modes are covered by this one hook).
 *
 * Requires a registered `ClickSelectBehaviour`; if absent, the selection is
 * empty and `clear` is a no-op.
 */
declare function useSelection(options?: UseSelectionOptions, canvas?: Canvas$1 | null): UseSelectionResult;

interface UseInspectTargetOptions {
    /** Id of the `ClickInspectBehaviour` to read the target from. Default `'click-inspect'`. */
    inspectId?: string;
}
/**
 * Reactive view of the single node/edge currently targeted for editing, driven
 * by a `ClickInspectBehaviour`'s `inspect:change` event. Returns `null` when no
 * element is targeted (or the behaviour isn't registered).
 *
 * Distinct from {@link useSelection}: selection can hold many elements (for
 * highlighting / multi-drag), whereas this is always the *one* element a
 * property editor should edit. Follows the behaviour through
 * {@link useBehaviourInstance} — late registration, removal, re-registration.
 */
declare function useInspectTarget(options?: UseInspectTargetOptions, canvas?: Canvas$1 | null): InspectTarget | null;

/**
 * The behaviour instance currently registered under `id`, or `null` — kept live
 * across registration changes.
 *
 * Re-reads on `scene:behaviour:register` **and** `scene:behaviour:unregister`
 * for that id, so a caller sees the behaviour appear late (its wrapper's effect
 * ran after the caller's), disappear, and come back as a *new* instance
 * (a wrapper remount, a key change, StrictMode's double mount). Subscribe to the
 * instance's own events in an effect keyed on the returned value: the effect
 * then drops the old instance's listeners and attaches to the new one.
 *
 * @param id The behaviour id, as registered.
 * @param canvas Explicit engine; defaults to the enclosing `<Canvas>`.
 */
declare function useBehaviourInstance<T extends IBehaviour = IBehaviour>(id: string, canvas?: Canvas$1 | null): T | null;

interface UseViewTargetOptions {
    /** Id of the `ClickViewBehaviour` to read the target from. Default `'click-view'`. */
    viewId?: string;
}
/**
 * Reactive view of the single node/edge currently targeted for **read-only
 * property viewing**, driven by a `ClickViewBehaviour`'s `view:change` event.
 * Returns `null` when no element is targeted (or the behaviour isn't
 * registered).
 *
 * The read-only counterpart of {@link useInspectTarget}: that one feeds an
 * editor (`ClickInspectBehaviour`), this one feeds a viewer
 * (`ClickViewBehaviour`). Both are distinct from {@link useSelection} (which can
 * hold many elements) — this is always the *one* element a viewer should show.
 */
declare function useViewTarget(options?: UseViewTargetOptions, canvas?: Canvas$1 | null): ViewTarget | null;

interface UseHoverElementPreviewOptions {
    /** Id of the `HoverElementPreviewBehaviour` to read previews from. Default `'element-preview'`. */
    previewId?: string;
}
/**
 * Reactive view of the **hover preview** currently surfaced by an
 * `HoverElementPreviewBehaviour` — the resolved card + its anchor — or `null` when
 * nothing is hovered (or the behaviour isn't registered yet).
 *
 * Subscribes to the behaviour's `preview:show` / `preview:move` / `preview:hide`
 * bus: `show` and `move` both publish the latest {@link PreviewSnapshot} (so the
 * card repositions as the camera pans / zooms), `hide` clears it. Pair with
 * {@link HoverElementPreviewCard} to draw it, or just use {@link HoverElementPreviewBehaviour}.
 *
 * Follows the behaviour through {@link useBehaviourInstance}: it attaches when
 * the behaviour registers after this hook mounts (its wrapper is a sibling whose
 * effect runs later), clears when it unregisters, and re-attaches to a new
 * instance registered under the same id.
 */
declare function useHoverElementPreview(options?: UseHoverElementPreviewOptions, canvas?: Canvas$1 | null): PreviewSnapshot | null;

/** The `GraphClipboard` the `GraphCanvas` itself owns for graph layer `layerId`, or `null`. */
declare function useCanvasGraphClipboard(canvas: Canvas$1 | null, layerId?: string): GraphClipboard | null;
/**
 * The `GraphClipboard`: a `<GraphClipboardProvider>` ancestor's, else the one
 * the `GraphCanvas` owns for `layerId` (default `'graph'`). `null` on a plain
 * `Canvas` with no provider.
 */
declare function useGraphClipboard(layerId?: string, canvas?: Canvas$1 | null): GraphClipboard | null;

interface UseHistoryOptions {
    /** Graph layer id whose `redraw()` the `redraw` action targets. Default `'graph'`. */
    layerId?: string;
}
interface UseHistoryResult {
    /** Revert the most recent change. No-op when `!canUndo`. */
    undo: () => void;
    /** Re-apply the most recently undone change. No-op when `!canRedo`. */
    redo: () => void;
    /** Force a full re-render of the target layer (render pass; not undoable). */
    redraw: () => void;
    canUndo: boolean;
    canRedo: boolean;
}
/**
 * Undo / redo + redraw over `canvas.history` — the canvas's **one operation
 * log**. Graph edits (every `GraphLayer`'s store records its own writes) and
 * definition edits (a Studio editor's `edit:*` applies) are entries in the same
 * log, so `undo` takes back the newest one, whichever it is. The same calls the
 * `history.undo` / `history.redo` commands make, so this hook and a saved Undo
 * button always do the same thing.
 *
 * `canUndo` / `canRedo` stay reactive via `canvas.history.subscribe`. `redraw`
 * goes straight to the layer.
 */
declare function useHistory(options?: UseHistoryOptions, canvas?: Canvas$1 | null): UseHistoryResult;

/** What {@link usePlaybook} returns — a render-time snapshot plus the moves. */
interface UsePlaybookResult {
    /** The live `canvas.playbook` (for `toJSON`, `load`, `subscribe`). */
    playbook: Playbook<CanvasConfig>;
    /** The script's title. */
    title: string;
    /** The steps, in order. */
    steps: readonly StepSpec<CanvasConfig>[];
    /** The step the canvas is at, or `undefined` before the first. */
    current: StepSpec<CanvasConfig> | undefined;
    /** Index of {@link current}; `-1` before the first. */
    index: number;
    /** Whether there is a step after {@link current}. */
    canNext: boolean;
    /** Whether there is a step to go back from. */
    canPrevious: boolean;
    /** Play the next step (`playbook.next`). */
    next: () => Promise<void>;
    /** Revert the current step (`playbook.previous`). */
    previous: () => Promise<void>;
    /** Move to a step by id (`playbook.goTo`). */
    goTo: (stepId: string) => Promise<void>;
}
/**
 * The canvas's playbook — the script of JSON steps and the position in it —
 * as reactive React state (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`,
 * F16). Re-renders when a step is added, the script is loaded, or the position
 * moves. Headless: it draws nothing; a presenter bar or a step list is built
 * on it.
 *
 * @param canvas Explicit engine instance; defaults to the nearest `<Canvas>`.
 */
declare function usePlaybook(canvas?: Canvas$1 | null): UsePlaybookResult;

/**
 * The canvas's applied history entries, oldest first, optionally filtered by
 * `actor` / `stepId` — as reactive React state (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F16).
 * Re-renders on every change to the log: a new entry, a merge into a streamed
 * entry, undo / redo, a playbook move, a clear.
 *
 * The array is a fresh snapshot per change and stable between changes, so it
 * is safe as a dependency. Entries themselves are the log's records — read
 * them, don't mutate them.
 *
 * @param filter `{ actor?, stepId? }`; compared by value, so an inline object is fine.
 * @param canvas Explicit engine instance; defaults to the nearest `<Canvas>`.
 */
declare function useHistoryEntries(filter?: LogEntryFilter, canvas?: Canvas$1 | null): readonly LogEntry[];

/**
 * The `GraphStore` behind a graph layer — the handle for **incremental** data
 * writes from React (RFC `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`,
 * F16, M13): `store.applyDelta(delta, { actor, coalesce: true })` for a feed,
 * instead of replacing the layer's whole `data` prop each tick.
 *
 * Returns `null` until the layer is added, and re-renders when it is added or
 * removed (not on data changes — subscribe to those with `useGraphEvent`).
 *
 * @example
 * const store = useGraphStore('graph');
 * useEffect(() => feed.on('tick', (delta) => store?.applyDelta(delta, { actor: 'feed', coalesce: true })), [store]);
 *
 * @param layerId The `GraphLayer` id. Default `'graph'`.
 * @param canvas Explicit engine instance; defaults to the nearest `<Canvas>`.
 */
declare function useGraphStore(layerId?: string, canvas?: Canvas$1 | null): GraphStore | null;

interface UseClipboardOptions {
    /** Id of the `ClickSelectBehaviour` selection is read from / re-applied to. Default `'click-select'`. */
    clickSelectId?: string;
    /** Graph layer whose canvas-owned clipboard is used when no provider is above. Default `'graph'`. */
    layerId?: string;
}
interface UseClipboardResult {
    /** Copy the selection to the buffer, then delete it (one undoable step). */
    cut: () => void;
    /** Copy the selection to the buffer. */
    copy: () => void;
    /** Paste the buffer (offset + re-id'd) and select the pasted items. */
    paste: () => void;
    /** Delete the selection (one undoable step). */
    remove: () => void;
    /** True iff the buffer has content to paste. */
    canPaste: boolean;
    /** True iff something is selected. */
    hasSelection: boolean;
}
/**
 * Cut / copy / paste / delete for the current selection, over the
 * `GraphClipboard` ({@link useGraphClipboard}: a `<GraphClipboardProvider>`
 * ancestor's, else the one the `GraphCanvas` owns for `layerId`). Each edit is
 * one entry in `canvas.history` (the layer's store records it), so it's
 * undoable. Reads the selection (and re-selects pasted items) via a
 * `ClickSelectBehaviour`.
 *
 * `canPaste` tracks the buffer (recomputed after each op); `hasSelection` is
 * reactive via {@link useSelection}.
 *
 * The actions are `@invana/graph`'s `cutSelection` / `copySelection` /
 * `deleteSelection` / `pasteAndSelect` — the same functions the `clipboard.*`
 * commands run — and read the click-selection at call time, so they never act
 * on a selection captured in a stale closure.
 */
declare function useClipboard(options?: UseClipboardOptions, canvas?: Canvas$1 | null): UseClipboardResult;

type PatternType = NonNullable<BackgroundLayerOptions['patternType']>;
interface UseGridOptions {
    /** Id of the `BackgroundLayer` to toggle. Default `'background'`. */
    backgroundLayerId?: string;
    /**
     * Pattern to switch to when the grid is shown. When omitted, the layer's
     * existing `patternType` is preserved (only `type` is toggled).
     */
    patternType?: PatternType;
}
interface UseGridResult {
    /** Whether the background pattern (grid/dots/lines) is currently shown. */
    showGrid: boolean;
    /** Toggle the grid on/off. */
    toggleGrid: () => void;
    /** Set the grid on/off explicitly. */
    setGrid: (on: boolean) => void;
}
/**
 * Background grid toggle, through the `background.grid` command — the same
 * command a saved control panel binds to, so a toolbar and a panel always agree.
 * `showGrid` follows the definition (every write path), not hook-local state.
 */
declare function useGrid(options?: UseGridOptions, canvas?: Canvas$1 | null): UseGridResult;

/** Minimal structural shape of a layout instance the hook can apply + stop. */
interface ApplicableLayout {
    apply(layer: unknown): Promise<void> | void;
    stop?: () => void;
}
/** Factory producing a fresh layout instance per application. */
type LayoutFactory = () => ApplicableLayout;
interface UseLayoutOptions {
    /** Target `GraphLayer` id. Default `'graph'`. */
    layerId?: string;
    /** Padding for the post-layout `camera.fitContent`. Default `80`. */
    fitPadding?: number;
    /** Initially-selected key. Default: first key of `layouts`. */
    initial?: string;
    /** Optional key → human label map for the picker. Default: identity. */
    labels?: Record<string, string>;
    /** Apply the initial layout once the target layer is mounted. Default `true`. */
    applyInitial?: boolean;
}
interface UseLayoutResult {
    /** Currently-applied layout key. */
    layout: string;
    /** Key → label map for a picker. */
    layoutOptions: Record<string, string>;
    /** Apply the layout registered under `key`, then fit the view. */
    applyLayout: (key: string) => void;
    /**
     * Cancel the in-flight layout run (calls the active instance's `stop()`, if it
     * has one) and clear {@link isRunning}. No-op when nothing is running. For an
     * animated d3-force this halts the live simulation where it stands; for a
     * one-shot layout without `stop()` it just clears the running flag.
     */
    stopLayout: () => void;
    /**
     * True while **any** layout is running on the canvas — this hook's own
     * `applyLayout` call *or* an engine-driven run (notably the initial
     * `config.activeLayout` load run, still settling). Read from the reactive
     * `runtime.layout.running` state OR the local `apply` promise, so a run/stop
     * control stays consistent with what the engine is actually doing.
     */
    isRunning: boolean;
}
/**
 * Imperative layout switching, lifting the common "instantiate → `apply(layer)`
 * → `camera.fitContent`" pattern into a hook. Layouts live in separate packages
 * (`@invana/graph-layout-*`) with no registry, so the consumer supplies a map of
 * **factories**; this hook can't be turnkey.
 *
 * Memoize the `layouts` map (module scope or `useMemo`) so `applyLayout` stays
 * stable across renders.
 */
declare function useLayout(layouts: Record<string, LayoutFactory>, options?: UseLayoutOptions, canvas?: Canvas$1 | null): UseLayoutResult;

interface UseSelectModeOptions {
    /** Initially-active mode key. Default: first key of `behaviourIds`. */
    initial?: string;
    /** Optional key → human label map for a picker. Default: identity. */
    labels?: Record<string, string>;
}
interface UseSelectModeResult {
    /** Currently-active mode key. */
    mode: string;
    /** Key → label map for a picker. */
    modeOptions: Record<string, string>;
    /** Switch mode: enables that mode's behaviour, disables the others. */
    setMode: (mode: string) => void;
}
/**
 * Mutually-exclusive selection-mode switch. Maps mode keys to behaviour ids
 * (e.g. `{ click: 'click-select', brush: 'brush-select', lasso: 'lasso-select' }`)
 * and toggles their `enabled` so exactly one is active. The consumer must have
 * registered those behaviours; this hook can't be turnkey.
 *
 * **Store-driven (single source of truth).** `mode` is *derived* from
 * `store.view.definition.behaviours[id].enabled` read reactively, and `setMode`
 * *writes* through `canvas.update({ behaviours })`. So the mode reflects — and
 * drives — the same state any other UI (e.g. a settings panel) reads/writes:
 * flip a tool in the panel and this picker follows, and vice-versa, with no
 * event wiring. The initial mode is enforced on mount. The rule and the patch
 * are `@invana/graph`'s `resolveSelectMode` / `selectModePatch`, shared with the
 * `select.mode` command (which reads the live behaviours instead of the
 * definition). Memoize `behaviourIds`
 * (module scope or `useMemo`) so `setMode` stays stable.
 */
declare function useSelectMode(behaviourIds: Record<string, string>, options?: UseSelectModeOptions, canvas?: Canvas$1 | null): UseSelectModeResult;

interface UseEdgeTypeOptions {
    /** Target `GraphLayer` id. Default `'graph'`. */
    layerId?: string;
    /**
     * The path type shown while the layer's edge template sets none. The layer's
     * own `edgeDefaults.shape.pathType` always wins; without either, the first
     * entry of `types`.
     */
    initial?: EdgePathType;
    /** Path types to expose, in order. Default {@link DEFAULT_EDGE_TYPES}. */
    types?: readonly EdgePathType[];
    /** Optional key → human label map. Default {@link DEFAULT_EDGE_TYPE_LABELS}. */
    labels?: Record<string, string>;
}
interface UseEdgeTypeResult {
    /** Currently-selected path type key. */
    edgeType: string;
    /** Key → label map for a picker. */
    edgeTypeOptions: Record<string, string>;
    /**
     * Switch the path type for **every** edge in the layer and make it the
     * default for future edges (via `GraphLayer.setEdgeDefaults`).
     */
    setEdgeType: (type: string) => void;
}
/**
 * Layer-wide edge routing switch. Patches the `GraphLayer` edge template
 * (`options.edge.style.shape.pathType`) via {@link GraphLayer.setEdgeDefaults},
 * which re-renders every edge and becomes the default for edges added later —
 * the engine-side `pathType` shorthand resolves to the right router + pathStyle
 * pair (e.g. `'orth'`, `'bezier'`, `'rounded'`).
 *
 * The rule is `@invana/graph`'s `edgePathType` / `setEdgePathType` — the same
 * functions the `graph.edgeType` command calls — so on any canvas (a
 * `GraphCanvas` or a plain `Canvas` holding a `GraphLayer`) this picker and a
 * saved panel agree. `edgeType` is the layer's actual path type, re-read on the
 * layer's `style:changed`, so it follows every writer; `initial` (then the
 * first of `types`) only fills in while the layer sets none.
 */
declare function useEdgeType(options?: UseEdgeTypeOptions, canvas?: Canvas$1 | null): UseEdgeTypeResult;

interface UseLockOptions {
    /**
     * Behaviour ids disabled while locked (re-enabled on unlock). Default
     * `['pan', 'drag-node']` — pan + node drag, leaving zoom available.
     */
    behaviourIds?: string[];
    /** Lock the view once on mount. Default `false`. */
    initialLocked?: boolean;
}
interface UseLockResult {
    locked: boolean;
    toggleLock: () => void;
    setLock: (locked: boolean) => void;
}
/**
 * View lock — disables a configurable set of behaviours (pan + node drag by
 * default) while keeping zoom available. "Lock" is app policy, not an engine
 * concept, so which behaviours it disables is configurable.
 *
 * The rule is `@invana/canvas`'s `isViewLocked` / `setViewLocked` — the same
 * functions the `view.lock` command calls — so this hook and a saved
 * `view.lock` control always agree. `locked` is read from the behaviours
 * (locked ⇔ every registered target is disabled) and follows any writer;
 * writes go through the behaviour registry, so `scene:behaviour:*` events fire.
 * `initialLocked: true` locks the view once on mount.
 */
declare function useLock(options?: UseLockOptions, canvas?: Canvas$1 | null): UseLockResult;

/**
 * Read + switch the active modelling tool (and the Add tool's node kind).
 *
 * The tool is the canvas's interaction mode (`view.interaction.viewMode`), so
 * this works under a `<GraphToolProvider>` (anywhere — even above the canvas)
 * **or** anywhere inside a canvas root with no provider at all. Behaviours
 * declared with `modes` follow it by themselves:
 * `<CreateNodeBehaviour enabled modes={['add']} />`.
 *
 * @throws with neither a `<GraphToolProvider>` above nor a canvas root around it.
 */
declare function useTool(): ToolContextValue;

/**
 * Icon component accepted by the UI controls — icon-agnostic (the consumer
 * passes e.g. a `lucide-react` glyph). Mirror of the canvas-ui `ToolbarIcon`.
 */
type ToolbarIcon = ComponentType<{
    size?: number | string;
    className?: string;
}>;
/** Side a tooltip is placed on. Mirror of the canvas-ui `TooltipSide`. */
type TooltipSide = 'top' | 'right' | 'bottom' | 'left';
/** Fields shared by every {@link ToolbarItem} variant. */
interface ToolbarItemBase {
    /** Stable React key for the rendered control. */
    key?: string;
}
/** A plain action button. */
interface ToolbarButtonItem extends ToolbarItemBase {
    type: 'button';
    icon: ToolbarIcon;
    iconClass?: string;
    label: string;
    text?: string;
    onClick: () => void;
    disabled?: boolean;
    tooltipSide?: TooltipSide;
}
/** A two-state toggle (lock view, grid, theme, modeller tool, …). */
interface ToolbarToggleItem extends ToolbarItemBase {
    type: 'toggle';
    icon: ToolbarIcon;
    activeIcon?: ToolbarIcon;
    iconClass?: string;
    label: string;
    activeLabel?: string;
    active: boolean;
    onToggle: () => void;
    disabled?: boolean;
    tooltipSide?: TooltipSide;
}
/** A single-select dropdown (layout / select-mode / edge-type / shape / zoom). */
interface ToolbarSelectItem extends ToolbarItemBase {
    type: 'select';
    label: string;
    value: string;
    options: Record<string, string>;
    icons?: Record<string, ToolbarIcon>;
    iconClass?: string;
    onChange: (value: string) => void;
    display?: 'dropdown' | 'segmented';
    className?: string;
    align?: 'start' | 'center' | 'end';
    tooltip?: string;
    tooltipSide?: TooltipSide;
    triggerLabelOnly?: boolean;
    renderTrigger?: () => ReactNode;
}
/** A visual group separator. */
interface ToolbarDividerItem extends ToolbarItemBase {
    type: 'divider';
}
/** An escape hatch for arbitrary inline content. */
interface ToolbarCustomItem extends ToolbarItemBase {
    type: 'custom';
    render: () => ReactNode;
}
/** A single declarative toolbar control. */
type ToolbarItem = ToolbarButtonItem | ToolbarToggleItem | ToolbarSelectItem | ToolbarDividerItem | ToolbarCustomItem;
/**
 * The values a properties editor edits: a label + a flat string→string data map.
 * Mirror of the canvas-ui `PropertiesEditorValues`.
 */
interface PropertiesEditorValues {
    label: string;
    type?: string;
    data: Record<string, string>;
}

interface UseEntityEditorOptions {
    /** GraphLayer to read/write. Default `'graph'`. */
    layerId?: string;
    /** Id of the `ClickInspectBehaviour` the edit target is read from. Default `'click-inspect'`. */
    inspectId?: string;
    /**
     * Modeller mode: edit a single `type` field on **both** nodes and edges whose
     * value also drives the displayed label (mirrored to `style.labelText`) — in a
     * modeller the type *is* what's drawn on the element. Off by default, in which
     * case nodes edit their `label` (`style.labelText`) and edges edit their `type`,
     * each as a separate field.
     */
    typeAsLabel?: boolean;
}
/** The single selected node/edge, its current label + data, and a commit action. */
interface EntityEditorTarget {
    kind: 'node' | 'edge';
    id: string;
    /** Effective (resolved) label text. Empty for edges (they have no label field). */
    label: string;
    /** The element's free-form `type` tag. Present for edges (`'' ` when unset). */
    type?: string;
    /** Current `data` as a flat string map (non-string values are stringified). */
    data: Record<string, string>;
    /**
     * Write the editor's values back to the store, undoable as one entry when
     * there is a graph history (a direct mutation otherwise). Replaces
     * `data` wholesale. A **node** also overwrites `style.labelText` (spreading the
     * prior style); an **edge** writes its `type` instead — edges have no label.
     */
    commit: (values: PropertiesEditorValues) => void;
    /**
     * Swap an edge's `source`/`target` (reverse its direction). Present only for
     * edges; undoable as one entry when there is a graph history.
     */
    reverse?: () => void;
}
/**
 * Click-driven property editing for an inspector. Returns the **single** node or
 * edge the user clicked to edit — its effective label + `data` and a `commit`
 * that writes edits back undoably — or `null` when nothing is targeted (so a
 * panel can render nothing). Reads the target via {@link useInspectTarget}
 * (needs a `ClickInspectBehaviour`, independent of selection); each commit is
 * one labelled entry in `canvas.history` (`'edit node'`, `'edit edge'`,
 * `'reverse edge'`).
 *
 * The view (`<PropertiesEditor>`) and placement (`<Panel>`) are the consumer's —
 * see {@link InspectorPanel} for the turnkey wiring.
 */
declare function useEntityEditor(options?: UseEntityEditorOptions, canvas?: Canvas$1 | null): EntityEditorTarget | null;

/** Open menu: where it sits (screen / canvas-relative px) + what it carries. */
interface ContextMenuState<T> {
    /** Left offset in px, relative to the positioned ancestor (the `<Canvas>` host). */
    x: number;
    /** Top offset in px, relative to the positioned ancestor. */
    y: number;
    /** Caller-defined payload — typically the per-target menu items to render. */
    items: T;
}
interface UseContextMenuResult<T> {
    /** Current open menu, or `null` when closed. */
    menu: ContextMenuState<T> | null;
    /** Open (or move) the menu at `(x, y)` carrying `items`. */
    open: (x: number, y: number, items: T) => void;
    /** Close the menu. */
    close: () => void;
}
/**
 * Headless open/close + position state for a right-click context menu, with the
 * dismissal lifecycle baked in: while a menu is open, an outside `pointerdown`
 * or `Escape` closes it.
 *
 * Pairs with `<ContextMenuBehaviour onContextMenu={…}>` (which supplies the
 * target + `screen` position) and `<ContextMenuOverlay>` (which renders the
 * menu). Feed `e.screen.x / e.screen.y` straight into {@link open}; because the
 * `<Canvas>` host is `position: relative`, those coordinates place the overlay
 * correctly when it's rendered as a `<Canvas>` descendant.
 *
 * The opening right-click's `pointerdown` fires *before* this effect's listener
 * attaches, so the menu never self-closes. `<ContextMenuOverlay>` stops
 * `pointerdown` propagation, so clicks *inside* the menu don't dismiss it —
 * leaf `onClick`s call {@link close} explicitly.
 *
 * Generic over the payload `T` so it stays UI-kit-agnostic; the graph stories
 * parameterise it as `MenuItem[]` (from `@invana/ui`).
 *
 * @example
 * ```tsx
 * const { menu, open, close } = useContextMenu<MenuItem[]>();
 * const onContextMenu = (e: ContextMenuEvent) =>
 *   open(e.screen.x, e.screen.y, buildItems(e, close));
 * // …
 * <ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
 * {menu && <ContextMenuOverlay x={menu.x} y={menu.y} items={menu.items} />}
 * ```
 */
declare function useContextMenu<T>(): UseContextMenuResult<T>;

interface UseCanvasMessageResult {
    /** The message currently showing, or `null` when none is. */
    message: string | null;
    /** Show a message. With `timeout` (ms) it auto-clears after that delay. */
    showMessage: (text: string, timeout?: number) => void;
    /** Clear the current message. */
    clearMessage: () => void;
}
/**
 * Read + drive the shared canvas message channel from React. Subscribes to the
 * engine's `message` event (emitted by `Canvas.showMessage` — from anywhere:
 * layouts, behaviours, app code) and tracks the current line, auto-clearing it
 * when a `timeout` was given. `showMessage` / `clearMessage` delegate to the
 * engine so a push from React reaches every other subscriber too.
 *
 * Resolves the engine from the (lifted) `CanvasContext` or an explicit `canvas`
 * arg — works from a `<Canvas>` descendant or app-shell chrome.
 */
declare function useCanvasMessage(canvas?: Canvas$1 | null): UseCanvasMessageResult;

/**
 * Returns a stable `update(patch)` bound to the canvas in context. `patch` is a
 * {@link CanvasConfig} slice keyed by instance id — deep-merged into the held
 * config and fanned to each instance's `setOptions` (and re-wires `activeLayout`
 * on a `GraphCanvas`). The serialisable counterpart to driving the engine
 * imperatively; use it for live edits (theme toggle, GUI controls) over a
 * `<Canvas config={…}>`.
 *
 * Pass an `action` starting with `edit:` (e.g. `'edit:settings:layers:background'`)
 * to mark the write as a **user edit**, which `canvas.history` records so it can
 * be undone. Without one the write is programmatic config and isn't recorded.
 */
declare function useGraphCanvasUpdate(): (patch: CanvasConfig, action?: string) => void;

/**
 * Subscribe to the canvas's serialisable config. Returns `[options, update]` —
 * `options` is the current {@link CanvasConfig}, read **reactively** from
 * `store.view.definition` (the source of truth) via {@link useStore}, so the
 * component re-renders only when the config slice actually changes (no coarse
 * `options:change` bus copy). `update` is the same patcher as
 * {@link useGraphCanvasUpdate}. Drive a settings UI from this.
 */
declare function useGraphCanvasOptions(): [CanvasConfig, (patch: CanvasConfig) => void];

/**
 * Resolve the engine `Canvas` a hook should act on. Prefers an explicit
 * instance (for the out-of-`<Canvas>` / multi-canvas-orchestration case), and
 * otherwise reads the instance-scoped {@link CanvasContext}. Throws only when
 * neither is available — so calling a canvas hook outside any `<Canvas>` and
 * without an explicit instance fails loudly instead of silently no-op'ing.
 *
 * This is what keeps every hook multi-canvas-safe: inside a `<Canvas>` tree the
 * context yields *that* instance; passing an explicit `canvas` targets a
 * specific one. There is no global fallback.
 */
declare function useResolvedCanvas(explicit?: Canvas$1 | null): Canvas$1;

interface UseHistorySectionOptions {
    /** Layer scope for history. Default `'graph'`. */
    layerId?: string;
    /** Override the default tooltips / accessible labels. */
    labels?: {
        undo?: string;
        redo?: string;
    };
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas$1 | null;
}
/**
 * **History** toolbar section — undo / redo {@link ToolbarItem}s built off
 * {@link useHistory}, with live `disabled` state (`!canUndo` / `!canRedo`).
 * Compose the result with other sections and render via `ToolbarItems`.
 *
 * @deprecated A second way to draw toolbar controls beside the control specs
 * `useControlItems` (in `@invana/canvas-ui`) renders. Use the `history.undo` / `history.redo` control specs (`HISTORY_CONTROL_ITEMS`), or {@link useHistory} for bespoke UI.
 * Kept for compatibility; removal waits for the next breaking release
 * (`rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` X1).
 */
declare function useHistorySection(options?: UseHistorySectionOptions): ToolbarItem[];

/** The editor items this section can render, in canonical order. */
type EditorItemKey = 'cut' | 'copy' | 'paste' | 'erase';
interface UseEditorSectionOptions {
    /** Id of the `ClickSelectBehaviour` selection is read from. Default `'click-select'`. */
    clickSelectId?: string;
    /** Layer that erase / clipboard target. Default `'graph'`. */
    layerId?: string;
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas$1 | null;
    /**
     * Which items to include, in canonical (cut · copy · paste · erase) order.
     * Default: all four. Pass e.g. `['erase']` for an erase-only bar (no
     * clipboard) — cut/copy/paste are simply omitted.
     */
    items?: EditorItemKey[];
}
/**
 * **Editor** toolbar section — cut / copy / paste / erase {@link ToolbarItem}s
 * built off {@link useClipboard} + {@link useClearGraph}. Cut/copy disable
 * without a selection, paste until something is copied. Erase is selection-aware
 * — it deletes the selection (with a "Selection" label) when something is
 * selected, otherwise clears the whole layer. Requires a
 * `<GraphClipboardProvider>` + `ClickSelectBehaviour`; edits are undoable
 * through `canvas.history`. Restrict the set via {@link UseEditorSectionOptions.items}
 * — e.g. `items: ['erase']` for an erase-only bar with no clipboard controls.
 *
 * @deprecated A second way to draw toolbar controls beside the control specs
 * `useControlItems` (in `@invana/canvas-ui`) renders. Use the `clipboard.*` / `graph.erase` / `graph.clear` control specs (`EDIT_CONTROL_ITEMS`), or
 *   {@link useClipboard} / {@link useClearGraph} for bespoke UI.
 * Kept for compatibility; removal waits for the next breaking release
 * (`rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` X1).
 */
declare function useEditorSection(options?: UseEditorSectionOptions): ToolbarItem[];

interface UseViewSectionOptions {
    /** Include the zoom-in / zoom-out buttons. Default `true`. */
    showZoom?: boolean;
    /** Include the lock-view toggle. Default `true`. */
    showLock?: boolean;
    /** Layer the fit-to-content button targets. Default `'graph'`. */
    layerId?: string;
    /** Behaviour ids disabled while locked. Default `['pan', 'drag-node']`. */
    lockBehaviourIds?: string[];
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas$1 | null;
}
/**
 * **View** toolbar section — zoom in / zoom out / fit-to-content / lock-view
 * {@link ToolbarItem}s built off {@link useZoom} + {@link useFitContent} +
 * {@link useLock}. Set `showZoom: false` to omit the two zoom buttons (fit stays);
 * the lock is a toggle whose icon flips unlocked↔locked (set `showLock: false` to
 * omit it); locking disables pan + node drag by default while leaving zoom
 * available. Icons are baked in.
 *
 * @deprecated A second way to draw toolbar controls beside the control specs
 * `useControlItems` (in `@invana/canvas-ui`) renders. Use the `camera.zoomIn` / `camera.zoomOut` / `camera.fit` / `view.lock` control specs
 *   (`VIEW_CONTROL_ITEMS`), or {@link useZoom} / {@link useFitContent} / {@link useLock} for bespoke UI.
 * Kept for compatibility; removal waits for the next breaking release
 * (`rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` X1).
 */
declare function useViewSection(options?: UseViewSectionOptions): ToolbarItem[];

interface UseLayoutsSectionOptions {
    /** Map of layout key → factory producing a fresh layout instance. Memoize it. */
    layouts: Record<string, LayoutFactory>;
    /** Trigger label. Default `'Layout'`. */
    label?: string;
    /** Target `GraphLayer` id. Default `'graph'`. */
    layerId?: string;
    /** Padding for the post-layout fit. Default `80`. */
    fitPadding?: number;
    /** Initially-selected key. Default: first key. */
    initial?: string;
    /** Optional key → human label map. Default: identity. */
    labels?: Record<string, string>;
    /** Menu alignment. */
    align?: 'start' | 'center' | 'end';
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas$1 | null;
}
/**
 * **Layouts** toolbar section — a layout-picker `select` {@link ToolbarItem}
 * built off {@link useLayout} (applies the chosen layout + fits the view).
 * Layouts live in separate packages, so the consumer supplies the factory map
 * (memoize it).
 *
 * @deprecated A second way to draw toolbar controls beside the control specs
 * `useControlItems` (in `@invana/canvas-ui`) renders. Use the `layout.activate` control spec (`LAYOUT_CONTROL_ITEMS`, over layouts registered on the canvas), or
 *   {@link useLayout} for a factory-driven picker.
 * Kept for compatibility; removal waits for the next breaking release
 * (`rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` X1).
 */
declare function useLayoutsSection(options: UseLayoutsSectionOptions): ToolbarItem[];

interface UseStyleEditorSectionOptions {
    /** Target `GraphLayer` id. Default `'graph'`. */
    layerId?: string;
    /** Trigger label. Default `'Edge'`. */
    label?: string;
    /** Initially-selected path type. Default: the layer's current edge default. */
    initial?: EdgePathType;
    /** Path types to expose, in order. Default: straight / orth / bezier / rounded / smooth. */
    types?: readonly EdgePathType[];
    /** Optional key → human label map. Default: the built-in path-type labels. */
    labels?: Record<string, string>;
    /** Menu alignment. */
    align?: 'start' | 'center' | 'end';
    /** Explicit canvas instance; defaults to the context canvas. */
    canvas?: Canvas$1 | null;
}
/**
 * **Style Editor** toolbar section — an edge-routing `select` {@link ToolbarItem}
 * built off {@link useEdgeType}. Selecting a type re-routes every edge in the
 * layer (straight / orthogonal / curved / …) and becomes the default for future
 * edges.
 *
 * @deprecated A second way to draw toolbar controls beside the control specs
 * `useControlItems` (in `@invana/canvas-ui`) renders. Use the `graph.edgeType` control spec (`EDGE_TYPE_CONTROL_ITEMS`), or {@link useEdgeType} for bespoke UI.
 * Kept for compatibility; removal waits for the next breaking release
 * (`rfc:feat-2026-09-28-hooks-and-commands-duplicate-the-same-logic` X1).
 */
declare function useStyleEditorSection(options?: UseStyleEditorSectionOptions): ToolbarItem[];

/**
 * Every control panel in `definition.controlPanels`, keyed by id — re-renders
 * only when that slice changes.
 */
declare function useControlPanels(canvas?: Canvas$1 | null): Record<string, ControlPanelSpec>;
/** The runtime node registered for slot `name` (see `ControlPanel` children), or `undefined`. */
declare function useControlPanelSlot(name: string, canvas?: Canvas$1 | null): ReactNode;

/** A command by name plus the args a spec passes it. */
interface CommandRef {
    command: string;
    args?: unknown;
}
/** The live state of one {@link CommandRef}. */
interface CommandState {
    /** The command is registered. */
    available: boolean;
    /** Registered and its `isEnabled` allows running now. */
    enabled: boolean;
    /** Its `isActive` (toggle state). */
    active: boolean;
    /** Its `value` (pick-one commands), or `null`. */
    value: string | null;
    /** Its `options` (pick-one commands), or `[]`. */
    options: CommandOption[];
}
/**
 * Live {@link CommandState} for each ref, plus a `run` dispatcher — what a
 * control-panel renderer needs to draw command buttons and toggles.
 *
 * Re-evaluates on view-store changes and on `commands.subscribe` — command
 * (un)registration and `invalidate()`, which the engine fires for everything
 * else a command reads (registries, layer visibility, the undo stacks, edge
 * defaults on a `GraphCanvas`). **Re-renders only when a
 * state actually changes**: the snapshot is the states serialised to a string,
 * so pointer-rate view writes (hover, camera) that change nothing here cost one
 * comparison.
 */
declare function useCommandStates(refs: readonly CommandRef[], canvas?: Canvas$1 | null): {
    states: CommandState[];
    run: (command: string, args?: unknown) => boolean;
};

export { type ApplicableLayout, BackgroundLayer, type BackgroundLayerProps, BrushSelectBehaviour, type BrushSelectBehaviourProps, Canvas, CanvasContext, type CanvasProps, type CanvasRootProps, CanvasThemeSync, type CanvasThemeSyncProps, ClickInspectBehaviour, type ClickInspectBehaviourProps, ClickSelectBehaviour, type ClickSelectBehaviourProps, ClickViewBehaviour, type ClickViewBehaviourProps, ClipboardContext, CollapseExpandBehaviour, type CollapseExpandBehaviourProps, ColorByBehaviour, type ColorByBehaviourProps, type CommandRef, type CommandState, ContextMenuBehaviour, type ContextMenuBehaviourProps, type ContextMenuState, ControlPanel, type ControlPanelProps, type ControlPanelSlots, CreateNodeBehaviour, type CreateNodeBehaviourProps, D3ForceLayout, type D3ForceLayoutProps, D3SankeyLayout, type D3SankeyLayoutProps, DensityContourFillLayer, type DensityContourFillLayerProps, DensityContourStrokeLayer, type DensityContourStrokeLayerProps, DevInfoLayer, type DevInfoLayerProps, type DownloadImageExportOptions, DragNodeBehaviour, type DragNodeBehaviourProps, DragPanBehaviour, type DragPanBehaviourProps, DrawEdgeBehaviour, type DrawEdgeBehaviourProps, EdgeLODBehaviour, type EdgeLODBehaviourProps, EdgeLabelLODBehaviour, type EdgeLabelLODBehaviourProps, EdgeScaleLODBehaviour, type EdgeScaleLODBehaviourProps, type EditorItemKey, ElkLayout, type ElkLayoutProps, type EntityEditorTarget, EntranceBehaviour, type EntranceBehaviourProps, EraseBehaviour, type EraseBehaviourProps, FisheyeBehaviour, type FisheyeBehaviourProps, FocusBehaviour, type FocusBehaviourProps, GraphCanvas, GraphCanvasContext, type GraphCanvasProps, GraphClipboardProvider, type GraphClipboardProviderProps, type GraphEventMap, GraphLayer, type GraphLayerProps, type GraphTool, GraphToolProvider, type GraphToolProviderProps, HoverActivateBehaviour, type HoverActivateBehaviourProps, HoverElementPreviewBehaviour, type HoverElementPreviewBehaviourProps, IconLODBehaviour, type IconLODBehaviourProps, ImageLODBehaviour, type ImageLODBehaviourProps, KeyboardCameraInputBehaviour, type KeyboardCameraInputBehaviourProps, KeyboardShortcutsBehaviour, type KeyboardShortcutsBehaviourProps, LabelCollisionBehaviour, type LabelCollisionBehaviourProps, LassoSelectBehaviour, type LassoSelectBehaviourProps, type LayoutFactory, MapLayer, type MapLayerProps, MiniMapLayer, type MiniMapLayerProps, NodeCentralityBehaviour, type NodeCentralityBehaviourProps, NodeLabelLODBehaviour, type NodeLabelLODBehaviourProps, NodeResizeBehaviour, type NodeResizeBehaviourProps, NodeScaleLODBehaviour, type NodeScaleLODBehaviourProps, ParallelEdgeBehaviour, type ParallelEdgeBehaviourProps, PinchZoomBehaviour, type PinchZoomBehaviourProps, TextResolutionLODBehaviour, type TextResolutionLODBehaviourProps, ThemeBehaviour, type ThemeBehaviourProps, ToolContext, type ToolContextValue, type UseCameraResult, type UseCanvasImageExportResult, type UseCanvasMessageResult, type UseClearGraphResult, type UseClipboardOptions, type UseClipboardResult, type UseContextMenuResult, type UseEdgeTypeOptions, type UseEdgeTypeResult, type UseEditorSectionOptions, type UseEntityEditorOptions, type UseFitContentResult, type UseGraphEventOptions, type UseGridOptions, type UseGridResult, type UseHistoryOptions, type UseHistoryResult, type UseHistorySectionOptions, type UseHoverElementPreviewOptions, type UseInspectTargetOptions, type UseLayoutOptions, type UseLayoutResult, type UseLayoutsSectionOptions, type UseLockOptions, type UseLockResult, type UsePlaybookResult, type UseSelectModeOptions, type UseSelectModeResult, type UseSelectionOptions, type UseSelectionResult, type UseStyleEditorSectionOptions, type UseViewDataOptions, type UseViewSectionOptions, type UseViewTargetOptions, type UseZoomResult, type ViewContext, type ViewData, WheelZoomBehaviour, type WheelZoomBehaviourProps, controlPanelSlots, useBehaviourInstance, useBehaviourRegistration, useCamera, useCanvas, useCanvasEvent, useCanvasGraphClipboard, useCanvasImageExport, useCanvasMessage, useCanvasStateJson, useClearGraph, useClipboard, useCommandStates, useContextMenu, useControlPanelSlot, useControlPanels, useEdgeType, useEditorSection, useEntityEditor, useFitContent, useGraphCanvas, useGraphCanvasOptions, useGraphCanvasUpdate, useGraphClipboard, useGraphEvent, useGraphStore, useGrid, useHistory, useHistoryEntries, useHistorySection, useHoverElementPreview, useInspectTarget, useLayout, useLayoutsSection, useLock, usePlaybook, useResolvedCanvas, useSelectMode, useSelection, useStore, useStyleEditorSection, useTool, useViewContext, useViewData, useViewSection, useViewTarget, useZoom };
