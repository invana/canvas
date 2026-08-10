/**
 * Fill, stroke and paint-override vocabulary. Values are plain numbers and enums —
 * a colour is `0xRRGGBB`, never a backend colour object.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

export type InsetAnchor =
  | 'center'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * One layer of a shape's fill. Layers split by role:
 *
 * - **Silhouette fillers** (`solid`, `image`) — paint into the silhouette
 *   via Pixi's `g.fill()`. Multiple silhouette layers stack via alpha;
 *   each is re-traced before painting. Image fills always render the
 *   texture cover-fitted to the silhouette (uniform scale, may crop) —
 *   the engine intentionally does not expose CSS-style `background-size`
 *   / `background-repeat` knobs on raster fills.
 * - **Inset content** (`glyph`, `svg`, `svg-url`) — mounted as Container
 *   children of the shape's `gfx`. Sized by `sizeRatio` (fraction of the
 *   smaller bounds dimension) and positioned by `anchor` (default
 *   `'center'`).
 *
 * The engine has no dedicated "icon" kind — icon-library specifics (Font
 * Awesome glyphs, Lucide SVGs, Fluent icons, …) are produced by developer
 * code and dropped into a `glyph` or `svg` layer directly.
 */

export type ShapeFillLayer =
  | { readonly kind: 'solid'; readonly color: number; readonly alpha?: number }
  | {
      /**
       * Raster image painted into the host silhouette.
       *
       * Two orthogonal knobs control sizing:
       *
       * - `fit` (default `'cover'`) — how the texture's aspect maps to
       *   the silhouette's AABB. `'cover'` scales by `max(...)`, fully
       *   covers, may crop on the cross-axis. `'contain'` scales by
       *   `min(...)`, fully fits, leaves the cross-axis margin
       *   transparent (the underlying fill layer reads through; the
       *   engine pins the texture sampler to `clamp-to-edge` so the
       *   margin doesn't tile).
       *
       * - `padding` (default `0`) — pixel inset on the silhouette
       *   *before* fit math runs. The silhouette itself is re-traced at
       *   that inset for this layer only, so the gap between the
       *   full-size silhouette and the inset silhouette is painted by
       *   layers underneath (typically a `solid` `bgFill`). Use this
       *   when the host silhouette is more restrictive than its AABB
       *   (circle, polygon, star, arc) and the texture corners would
       *   otherwise clip against the curve.
       *
       * Tile patterns, repeat modes, and inset-Sprite badge placement
       * aren't on the engine surface — stack a `glyph` / `svg` /
       * `svg-url` layer for icon-shaped content.
       */
      readonly kind: 'image';
      readonly url: string;
      readonly alpha?: number;
      readonly fit?: 'cover' | 'contain';
      readonly padding?: number;
    }
  | {
      /** Font-rendered character (icon-font codepoint, Unicode symbol, emoji). */
      readonly kind: 'glyph';
      readonly char: string;
      /** Required for icon-font glyphs; optional for system-font Unicode. */
      readonly fontFamily?: string;
      /**
       * Font weight (CSS value, e.g. `400`, `900`, `'bold'`). Required for
       * icon fonts that pack different glyph sets per weight.
       */
      readonly fontWeight?: number | string;
      readonly fontStyle?: 'normal' | 'italic';
      /** Glyph color. Default `0xffffff`. */
      readonly color?: number;
      readonly alpha?: number;
      /** Size as fraction of the shape's smaller bounds dimension. Default `0.6`. */
      readonly sizeRatio?: number;
      /** Anchor relative to the shape's bounds. Default `'center'`. */
      readonly anchor?: InsetAnchor;
    }
  | {
      /** SVG path-d. Multiple subpaths (`M...M...`) are supported. */
      readonly kind: 'svg';
      readonly pathD: string;
      /** Viewport the path was authored in. Default `{ width: 24, height: 24 }`. */
      readonly viewBox?: { readonly width: number; readonly height: number };
      /** Stroke width when rendering. Default `2`. */
      readonly strokeWidth?: number;
      readonly color?: number;
      readonly alpha?: number;
      readonly sizeRatio?: number;
      readonly anchor?: InsetAnchor;
    }
  | {
      /**
       * Vector SVG icon fetched from a URL. The engine fetches the SVG,
       * extracts every drawing primitive (`path` / `ellipse` / `circle` /
       * `rect` / `line` / `polyline` / `polygon`) into a single concatenated
       * `pathD`, and renders it as a Pixi Graphics path. Fetched lazily on
       * first use; the resulting `pathD` is cached globally per URL.
       *
       * Use this when a consumer wants to point at their own remote SVG
       * (logo, custom diagram, sample artwork). For curated icon-library
       * usage, prefer an icon-font glyph via `kind: 'glyph'` — the
       * library is icon-vendor-agnostic and intentionally has no
       * vendor-specific fetch glue.
       */
      readonly kind: 'svg-url';
      readonly url: string;
      readonly viewBox?: { readonly width: number; readonly height: number };
      readonly strokeWidth?: number;
      readonly color?: number;
      readonly alpha?: number;
      readonly sizeRatio?: number;
      readonly anchor?: InsetAnchor;
    };

/**
 * A shape's fill. Either a single layer, an array of layers (painted
 * bottom-up — first array entry sits underneath), or the `number` shorthand
 * for a solid color.
 */

export type ShapeFill =
  | number
  | ShapeFillLayer
  | ReadonlyArray<ShapeFillLayer>;

/**
 * The **inset-content** half of {@link ShapeFillLayer} — the layer kinds a
 * backend mounts *inside* the silhouette as a child rather than painting
 * *into* it. Named here (not only where it is mounted) because it is part of
 * the vocabulary: a `CompositePart` of kind `'icon'` carries one, so the spec
 * types must be able to reference it without reaching into a renderer.
 */
export type InsetFillLayer = Extract<
  ShapeFillLayer,
  { kind: 'glyph' | 'svg' | 'svg-url' }
>;

/**
 * Does this fill paint the **silhouette** — i.e. would a backend emit a fill
 * for it? True for the `number` shorthand and for any `solid` / `image` layer;
 * false for `undefined` and for a fill made only of inset content
 * ({@link InsetFillLayer}), which mounts a child instead of filling.
 *
 * Load-bearing for hit-testing: a shape with no silhouette fill is **hollow**
 * — only its stroke band answers a containment test, exactly as pixi's
 * `Graphics.containsPoint` behaves (it consults a `fill` instruction that was
 * never emitted). See `containsSpec` in `specs/shapeGeometry/`.
 */
export function hasSilhouetteFill(fill: ShapeFill | undefined): boolean {
  if (fill === undefined) return false;
  if (typeof fill === 'number') return true;
  const layers = Array.isArray(fill) ? fill : [fill as ShapeFillLayer];
  return layers.some((l) => l.kind === 'solid' || l.kind === 'image');
}

// ─── Stroke (border) ───────────────────────────────────────────────────────

export interface ShapeStroke {
  readonly color: number;
  readonly alpha?: number;
  readonly width?: number;
  /** Default `'center'`. */
  readonly alignment?: 'inside' | 'center' | 'outside';
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
}

// ─── Paint styles (decoration → primitive override) ────────────────────────

/**
 * Decoration entry-point override on `IShape.paintInto`. When supplied, the
 * shape ignores `spec.fill` / `spec.stroke` and paints with these values
 * instead. Decorations like glow widen `strokeWidth` and reduce `alpha` to
 * paint a halo; decorations like marching-ants supply `dashArray` /
 * `dashOffset` to render a dashed silhouette; decorations like ring/halo
 * with non-zero `inset` ask the shape to trace a parallel-offset version of
 * its own silhouette.
 */

export interface ShapePaintStyle {
  readonly color?: number;
  readonly alpha?: number;
  readonly strokeWidth?: number;
  /**
   * Stroke alignment relative to the silhouette. Default `'outside'` —
   * decorations almost always want their geometry painted outside the
   * host body (halo, glow, ring), so the inner band doesn't eat into the
   * fill. Override per-call when a decoration genuinely wants to bleed
   * inward (e.g. an "inset border" effect).
   */
  readonly alignment?: 'inside' | 'center' | 'outside';
  /** Default `false` — decorations almost always stroke without filling. */
  readonly fill?: boolean;
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  /** Positive = inside the silhouette, negative = outside. Default `0`. */
  readonly inset?: number;
}

/** Mirror of `ShapePaintStyle` for connectors. No `inset` (connectors are 1D). */

export interface ConnectorPaintStyle {
  readonly color?: number;
  readonly alpha?: number;
  readonly strokeWidth?: number;
  readonly dashArray?: readonly [number, number];
  readonly dashOffset?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
  /**
   * When `true`, markers paint with `color` / `alpha` instead of their own
   * spec colors. Glow / halo decorations use this so the decoration covers
   * path + markers as a unified silhouette; marching-ants leaves it
   * undefined so markers stay normal-colored over the dashed line.
   */
  readonly tintMarkers?: boolean;
  /**
   * When `true`, `paintInto` paints only the body (no source / target
   * markers). Useful for decorations that handle markers separately or
   * want to leave them untouched. `markerHalo` is preferred for glow /
   * halo coverage; reach for `skipMarkers` only when even outlined
   * markers would be wrong.
   */
  readonly skipMarkers?: boolean;
  /**
   * When `true`, markers paint as **outlines** at `style.strokeWidth`
   * (using `style.color` / `style.alpha`) instead of as filled silhouettes.
   * Marker geometry continues to size off the host connector's spec
   * stroke width — the halo width affects only the outline stroke, never
   * the marker's tip-to-base / wing-spread dimensions. Combined with the
   * widening-stroke / decreasing-alpha pattern of a glow decoration,
   * this produces a halo around the marker that matches the body halo.
   */
  readonly markerHalo?: boolean;
}

// ─── Spec types ────────────────────────────────────────────────────────────

/**
 * Ordered paint stripe. Earlier entries paint **below** later ones, and a stripe
 * always wins over `zIndex`: `plane` picks the stripe, `zIndex` orders *within*
 * it. Independent of the scene graph — a shape keeps its logical parent (and so
 * its transform); only its render order moves.
 *
 * `'backdrop'` is the only stripe below the connectors, which is what makes a
 * group frame able to sit under the edges between its own members — see
 * `docs/rfcs/fix/2026-08-05-group-frame-occludes-edges.md`.
 *
 * @remarks
 * The design of record (`docs/render-planes-and-emphasis-plan.md` §4.1) defines
 * five stripes — `backdrop` · `background` · `content` · `foreground` ·
 * `overlay`. Two are implemented: `'backdrop'` and the default `'content'`. The
 * remaining three are served today by the renderer's built-in connector / shape
 * / overlay ordering; widening this union later is additive.
 */
