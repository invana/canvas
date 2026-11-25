import type { CanvasConfig } from '@invana/canvas';
import type { RenderPreference } from '@invana/canvas-react';

import type { TypeStylingPatch } from '../view-panels/styling/types';

/** The `canvasId` a panel binds to when its options name none. */
export const DEFAULT_CANVAS_ID = 'canvas';

/**
 * Options of a `kind: "canvas"` panel — a {@link GraphBoard} on the board.
 *
 * JSON by design, like every board panel: the graph arrives as a **reference**
 * (`dataRef`) that the host resolves through `CanvasBoardProvider`'s
 * `resolveData`, so a board spec can be stored, diffed and sent over the wire.
 * No height: the panel takes its row's, so give it a `fill` row.
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
  /**
   * Where the board's styling starts: per node type a colour and the value that
   * labels it (`labelKey`), per edge type a colour, a width, `dashed`.
   */
  styling?: TypeStylingPatch;
  /** The rail panel open at first. Default none: a panel is small, the graph comes first. */
  defaultPanel?: string | null;
  /** Deep-merged over the board's config. */
  config?: CanvasConfig;
  /** Pin the render backend (`'webgl'` / `'webgpu'`). Default: auto. */
  preference?: RenderPreference;
}

/** Which two values of a node type's `data` place it: its latitude and longitude, in degrees. */
export interface MapGeo {
  lat: string;
  lon: string;
}

/**
 * Options of a `kind: "map"` panel — a graph placed on a map.
 *
 * JSON like every board panel: the graph by `dataRef`, and per node type the two
 * `data` values that place it (`geo`). A node without both is left off; an edge is
 * drawn when both of its ends are placed. The basemap follows the board's theme:
 * `themed` draws the built-in light or dark style tinted with the theme's palette;
 * `none` draws a plain background and makes no outside request.
 */
export interface MapPanelOptions {
  /** Names this canvas on the board, as a `canvas` panel's does. Default `"canvas"`. */
  canvasId?: string;
  /** The graph, by reference — resolved with the provider's `resolveData`. */
  dataRef: string;
  /** Per node type, the `data` values that place it. A type not named is left off. */
  geo: Record<string, MapGeo>;
  /** `themed` (default): the built-in style for the theme, tinted with its palette; `none`: a plain background. */
  basemap?: 'themed' | 'none';
  /** A MapLibre style to load instead of the built-in one; still tinted while `basemap` is `themed`. */
  styleUrl?: string | null;
  /** Per node type a colour and the value that labels it; per edge type a colour. */
  styling?: TypeStylingPatch;
  /** A line under the map — how many nodes were left off, from the host. */
  note?: string;
}

/** Options of a `kind: "canvas-inspector"` panel — the clicked node / edge of a canvas. */
export interface CanvasInspectorPanelOptions {
  /** The canvas to follow. Default `"canvas"`. */
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
  map: MapPanelOptions;
  'canvas-inspector': CanvasInspectorPanelOptions;
  'canvas-layers': CanvasLayersPanelOptions;
  'canvas-table': CanvasTablePanelOptions;
};
