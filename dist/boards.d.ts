import * as react from 'react';
import { ReactNode } from 'react';
import { PanelRegistry, BoardProps, PanelRendererProps } from '@invana/boards';
import { GraphData, GraphCanvas } from '@invana/graph';
import { CanvasConfig } from '@invana/canvas';
import { RenderPreference } from '@invana/canvas-react';

/**
 * Turns a `canvas` panel's `dataRef` into a graph. Return `undefined` for an
 * unknown reference — the panel then says so instead of drawing an empty canvas.
 */
type ResolveCanvasData = (dataRef: string) => GraphData | undefined;
/** Props of {@link CanvasBoardProvider}. */
interface CanvasBoardProviderProps {
    /** Resolves each `canvas` panel's `dataRef`. Keep the reference stable. */
    resolveData: ResolveCanvasData;
    /** One `Board`, a `BoardPages`, or anything that renders this package's panels. */
    children?: ReactNode;
}
/**
 * The shared state a board's canvas panels need: how to resolve a `dataRef`,
 * and which live engine answers to which `canvasId`. A `canvas` panel registers
 * its engine here once ready; `canvas-inspector` / `canvas-layers` /
 * `canvas-table` look it up.
 *
 * Board panels only receive their own JSON options, and the canvas is a
 * *sibling* of the panels that read it, so the engine has to travel through
 * something both share. This is that, scoped to the subtree — no module state,
 * so any number of boards can sit on one page. `canvasId`s must be unique within
 * one provider (wrap `BoardPages` in one, and give each page's canvas its own id).
 */
declare function CanvasBoardProvider({ resolveData, children }: CanvasBoardProviderProps): react.JSX.Element;
/**
 * The live engine of the board canvas named `canvasId` (default `"canvas"`), or
 * `null` until that canvas has mounted and registered.
 */
declare function useBoardCanvas(canvasId?: string): GraphCanvas | null;

/** The `canvasId` a panel binds to when its options name none. */
declare const DEFAULT_CANVAS_ID = "canvas";
/**
 * Options of a `kind: "canvas"` panel — a live graph canvas on the board.
 *
 * JSON by design, like every board panel: the graph arrives as a **reference**
 * (`dataRef`) that the host resolves through `CanvasBoardProvider`'s
 * `resolveData`, so a board spec can be stored, diffed and sent over the wire.
 */
interface CanvasPanelOptions {
    /**
     * Names this canvas on the board, so `canvas-inspector` / `canvas-layers` /
     * `canvas-table` panels can bind to it. Default `"canvas"`. Unique per
     * `CanvasBoardProvider`.
     */
    canvasId?: string;
    /** The graph, by reference — resolved with the provider's `resolveData`. */
    dataRef: string;
    /** Canvas config, deep-merged over the app bundle defaults (`graphCanvasAppBaseConfig`). */
    config?: CanvasConfig;
    /** Mount the default graph bundle. Default `true`. */
    bundle?: boolean;
    /** Pin the render backend (`'webgl'` / `'webgpu'`). Default: auto. */
    preference?: RenderPreference;
    /**
     * Register a `ClickInspectBehaviour` (id `click-inspect`) so a click on a node
     * or edge is what a `canvas-inspector` panel shows. Off by default: a
     * behaviour is only ever registered when asked for.
     */
    inspect?: boolean;
    /** The `GraphLayer` id the canvas draws into. Default `"graph"`. */
    layerId?: string;
    /**
     * Height of the canvas in px. Default `520`. A canvas has no content height,
     * and the kit's panel body does not grow into a `fill` row's height (its
     * `PanelBox` body has no `flex-1`), so the panel sets its own.
     */
    height?: number;
}
/** Options of a `kind: "canvas-inspector"` panel — the clicked node / edge of a canvas. */
interface CanvasInspectorPanelOptions {
    /** The canvas to follow. Default `"canvas"`. Needs that canvas's `inspect: true`. */
    canvasId?: string;
    /** `GraphLayer` id the inspected element is resolved against. Default `"graph"`. */
    layerId?: string;
    /** Minimum zoom the inspector's **Focus** action zooms a node in to. */
    focusZoom?: number;
}
/** Options of a `kind: "canvas-layers"` panel — a canvas's layers, types and elements. */
interface CanvasLayersPanelOptions {
    /** The canvas to read. Default `"canvas"`. */
    canvasId?: string;
}
/** A column of a `canvas-table` panel. */
interface CanvasTableColumn {
    /**
     * What the column reads from each node: `id`, `type`, `label`, `degree`
     * (edges touching the node), or `data.<field>` for a field of the node's data.
     */
    key: string;
    /** Header label. */
    label: string;
    /** Right-align (numbers). */
    align?: 'left' | 'right';
    /** Set in the mono face (ids, keys). */
    mono?: boolean;
}
/** Options of a `kind: "canvas-table"` panel — a live table of a canvas's nodes. */
interface CanvasTablePanelOptions {
    /** The canvas to read. Default `"canvas"`. */
    canvasId?: string;
    /** `GraphLayer` id whose nodes are listed. Default `"graph"`. */
    layerId?: string;
    /** Columns. Default: id · type · degree. */
    columns?: CanvasTableColumn[];
    /** Rows drawn before `Open all`. Default `25`. */
    limit?: number;
    /** What a row is called in the count line — `nodes`, `characters`. Default `"nodes"`. */
    noun?: string;
    /**
     * Order: a column `key`, highest first. Default `"degree"`. Rows with equal
     * values keep the store's order.
     */
    sortBy?: string;
}
/**
 * Kind → options for every panel this package registers. Pass it as the board
 * spec's type argument so a mistyped option is a compile error:
 *
 * ```ts
 * const spec: BoardSpec<CanvasPanelKinds> = {
 *   rows: [{ fill: true, panels: [{ id: 'g', kind: 'canvas', options: { dataRef: 'team' } }] }],
 * };
 * ```
 */
type CanvasPanelKinds = {
    canvas: CanvasPanelOptions;
    'canvas-inspector': CanvasInspectorPanelOptions;
    'canvas-layers': CanvasLayersPanelOptions;
    'canvas-table': CanvasTablePanelOptions;
};

/**
 * Every panel kind this package adds, for a board's `registry`. Each renderer
 * needs a {@link CanvasBoardProvider} above it — {@link CanvasBoard} brings one;
 * with the kit's `BoardPages`, wrap it in a provider yourself.
 */
declare const CANVAS_PANELS: PanelRegistry;
/** Props of {@link CanvasBoard}: the kit `Board`'s, plus how to resolve graphs. */
interface CanvasBoardProps extends BoardProps<CanvasPanelKinds> {
    /** Resolves each `canvas` panel's `dataRef`. Keep the reference stable. */
    resolveData: ResolveCanvasData;
}
/**
 * A design-kit `Board` that can hold canvases: the kit's board, with
 * {@link CANVAS_PANELS} registered under any `registry` you pass, inside its own
 * {@link CanvasBoardProvider}. A board of only kit panels is a dashboard; add a
 * `canvas` panel and its inspector / layers / table panels bind to it.
 *
 * ```tsx
 * <CanvasBoard
 *   resolveData={(ref) => graphs[ref]}
 *   spec={{
 *     rows: [
 *       { panels: [{ id: 'g', kind: 'canvas', options: { dataRef: 'team', inspect: true } }] },
 *       { panels: [{ id: 't', kind: 'canvas-table', title: 'Nodes', options: {} }] },
 *     ],
 *     inspector: { spec: { rows: [{ panels: [{ id: 'i', kind: 'canvas-inspector', options: {} }] }] } },
 *   }}
 * />
 * ```
 */
declare function CanvasBoard({ resolveData, registry, ...board }: CanvasBoardProps): react.JSX.Element;

/**
 * `kind: "canvas"` — a live graph canvas on a board.
 *
 * The engine half of `GraphCanvasApp` (`GraphCanvasAppRoot` + `GraphCanvasAppSurface`):
 * the same bundle, config defaults, theme sync and keyboard scope, and none of the
 * app's chrome, because the board draws its own. Resolves its graph from
 * `dataRef` and registers its engine under `canvasId` so the board's other
 * canvas panels can bind to it.
 */
declare function CanvasPanel({ options }: PanelRendererProps<CanvasPanelOptions>): react.JSX.Element;

/**
 * `kind: "canvas-inspector"` — the node or edge last clicked on a board canvas,
 * read-only. canvas-ui's `ElementInspectorViewPanel`, bound to the canvas named
 * by `canvasId`; that canvas needs `inspect: true` so a click is recorded.
 */
declare function CanvasInspectorPanel({ options }: PanelRendererProps<CanvasInspectorPanelOptions>): react.JSX.Element;

/**
 * `kind: "canvas-layers"` — a board canvas's layers, element types and elements,
 * with visibility toggles. canvas-ui's `LayersViewPanel`, bound to `canvasId`.
 */
declare function CanvasLayersPanel({ options }: PanelRendererProps<CanvasLayersPanelOptions>): react.JSX.Element;

/**
 * `kind: "canvas-table"` — a live table of a board canvas's nodes, drawn by the
 * kit's own `table` block so it reads like every other table on the board.
 *
 * Re-reads as the graph changes. Clicking a row selects that node on the canvas
 * (the `click-select` behaviour), points the canvas's inspector at it when the
 * canvas has `inspect: true`, and reports the board action `select` with the
 * node id as `itemId`.
 */
declare function CanvasTablePanel({ panel, options, onAction, icons, gap }: PanelRendererProps<CanvasTablePanelOptions>): react.JSX.Element;

export { CANVAS_PANELS, CanvasBoard, type CanvasBoardProps, CanvasBoardProvider, type CanvasBoardProviderProps, CanvasInspectorPanel, type CanvasInspectorPanelOptions, CanvasLayersPanel, type CanvasLayersPanelOptions, CanvasPanel, type CanvasPanelKinds, type CanvasPanelOptions, type CanvasTableColumn, CanvasTablePanel, type CanvasTablePanelOptions, DEFAULT_CANVAS_ID, type ResolveCanvasData, useBoardCanvas };
