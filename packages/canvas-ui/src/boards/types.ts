import type { CanvasConfig } from '@invana/canvas';
import type { RenderPreference } from '@invana/canvas-react';

/** The `canvasId` a panel binds to when its options name none. */
export const DEFAULT_CANVAS_ID = 'canvas';

/**
 * Options of a `kind: "canvas"` panel — a live graph canvas on the board.
 *
 * JSON by design, like every board panel: the graph arrives as a **reference**
 * (`dataRef`) that the host resolves through `CanvasBoardProvider`'s
 * `resolveData`, so a board spec can be stored, diffed and sent over the wire.
 */
export interface CanvasPanelOptions {
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
export interface CanvasInspectorPanelOptions {
  /** The canvas to follow. Default `"canvas"`. Needs that canvas's `inspect: true`. */
  canvasId?: string;
  /** `GraphLayer` id the inspected element is resolved against. Default `"graph"`. */
  layerId?: string;
  /** Minimum zoom the inspector's **Focus** action zooms a node in to. */
  focusZoom?: number;
}

/** Options of a `kind: "canvas-layers"` panel — a canvas's layers, types and elements. */
export interface CanvasLayersPanelOptions {
  /** The canvas to read. Default `"canvas"`. */
  canvasId?: string;
}

/** A column of a `canvas-table` panel. */
export interface CanvasTableColumn {
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
export interface CanvasTablePanelOptions {
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
// A `type`, not an `interface`: an object type alias satisfies the kit's
// `ExtraPanels` (`Record<string, unknown>`) without an index signature, and an
// index signature would add a `kind: string` member that accepts any options.
export type CanvasPanelKinds = {
  canvas: CanvasPanelOptions;
  'canvas-inspector': CanvasInspectorPanelOptions;
  'canvas-layers': CanvasLayersPanelOptions;
  'canvas-table': CanvasTablePanelOptions;
};
