/**
 * Types for the GraphLegendLayer editor.
 *
 * Engine-agnostic: `@invana/graph` (home of `GraphLegendLayer` and its options) is
 * **not** imported for its runtime — the editable option shape is mirrored here
 * as {@link GraphLegendLayerOptions}, a serialisable patch the consumer applies via
 * `setOptions`. Keep it in sync with the engine `GraphLegendLayerOptions` by hand.
 *
 * Two engine encodings are deliberately narrowed:
 *
 * - Each chrome colour is `GraphLegendColor = string (CSS) | { light, dark }`. This
 *   editor edits the **scalar CSS string** only; a `{ light, dark }` pair is out
 *   of scope and round-trips untouched (see `mapping.ts`). Colours stay strings
 *   end-to-end — the overlay is DOM, so there is no `0xRRGGBB` conversion.
 * - `margin: number | { x?, y? }` is surfaced as the `marginX` / `marginY` pair,
 *   re-fused on the way out.
 *
 * Out of scope entirely (wiring, not tunable state): `graphLayerId`, the
 * `nodeTypeOf` / `edgeTypeOf` accessors (functions), the `nodeTypes` /
 * `edgeTypes` allow-lists, and the `colors` per-type override map.
 */

/** Anchor corner inside the canvas viewport. */
export type GraphLegendPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/** How `{ light, dark }` colour variants resolve. */
export type GraphLegendMode = 'auto' | 'light' | 'dark';

/** How the per-type count is rendered. */
export type GraphLegendCountMode = 'both' | 'visible' | 'total';

/** Row ordering within each section. */
export type GraphLegendSort = 'count-desc' | 'name-asc' | 'insertion';

/**
 * The subset of `GraphLegendLayerOptions` this editor produces — a serialisable patch.
 */
export interface GraphLegendLayerOptions {
  /** Panel heading. `false` (or an empty string) hides it. Default `'Legend'`. */
  title?: string | false;
  /** Include the node-type section. Default `true`. */
  showNodes?: boolean;
  /** Include the edge-type section. Default `true`. */
  showEdges?: boolean;
  /** Node-section heading. `false` / empty hides it. Default `'Nodes'`. */
  nodesTitle?: string | false;
  /** Edge-section heading. `false` / empty hides it. Default `'Edges'`. */
  edgesTitle?: string | false;
  /** Show the per-type counts. Default `true`. */
  showCounts?: boolean;
  /** How the count is rendered. Default `'both'` (`visible / total`). */
  countMode?: GraphLegendCountMode;
  /** Row ordering within each section. Default `'count-desc'`. */
  sort?: GraphLegendSort;
  /** Cap on rows per section; the remainder collapses to `+N more`. `0` = no cap. Default `12`. */
  maxRows?: number;
  /** Drop rows whose visible count is `0`. Default `false`. */
  hideEmpty?: boolean;
  /** Swatch colour for a type with no resolvable colour, as `0xRRGGBB`. Default `0x9ca3af`. */
  fallbackColor?: number;
  /**
   * Make rows clickable, toggling that type's visibility in the graph (a
   * toggled-off row renders struck through and muted). Default `false`.
   */
  toggleOnClick?: boolean;
  /** Row opacity when its type is toggled off. Default `0.45`. */
  hiddenTypeOpacity?: number;
  /** Anchor corner. Default `'top-left'`. */
  position?: GraphLegendPosition;
  /** Inset from the chosen corner in screen px — uniform or per-axis. Default `10`. */
  margin?: number | { x?: number; y?: number };
  /** Text size in px. Default `11`. */
  fontSize?: number;
  /** Panel opacity 0–1. Default `0.95`. */
  opacity?: number;
  /** Node swatch diameter in px (the edge swatch derives its length from it). Default `10`. */
  swatchSize?: number;
  /** Panel background as a CSS colour (may be `rgba(...)`). */
  backgroundColor?: string;
  /** Row text colour as a CSS colour. */
  textColor?: string;
  /** Section-heading + count colour as a CSS colour. */
  mutedColor?: string;
  /** Panel border colour as a CSS colour (may be `rgba(...)`). */
  borderColor?: string;
  /** Panel corner radius in px. Default `6`. */
  borderRadius?: number;
  /** How `{ light, dark }` colours resolve. Default `'auto'`. */
  mode?: GraphLegendMode;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. Identical to
 * {@link GraphLegendLayerOptions} except: the engine's `margin: number | { x?, y? }`
 * union is split into two scalar fields (a single field can't be both),
 * `fallbackColor` becomes a `#rrggbb` string (what the colour swatch emits), and
 * the three headings are plain strings — a text input expresses "no heading" as
 * `''`, never `false`.
 */
export interface GraphLegendLayerFields
  extends Omit<
    GraphLegendLayerOptions,
    'margin' | 'fallbackColor' | 'title' | 'nodesTitle' | 'edgesTitle'
  > {
  /** Panel heading; `''` for none. */
  title?: string;
  /** Node-section heading; `''` for none. */
  nodesTitle?: string;
  /** Edge-section heading; `''` for none. */
  edgesTitle?: string;
  /** Horizontal inset in px. Maps into `margin`. */
  marginX?: number;
  /** Vertical inset in px. Maps into `margin`. */
  marginY?: number;
  /** Fallback swatch colour as `#rrggbb`. */
  fallbackColor?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface GraphLegendLayerFormState {
  options: GraphLegendLayerFields;
}
