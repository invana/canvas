/**
 * Shape specs — the description of a thing to draw, per shape kind.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

import type { Point } from './geometry';
import type { PlaneName } from './plane';
import type { ShapeFill, ShapeStroke } from './style';

export interface BaseShapeSpec {
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly fill?: ShapeFill;
  readonly stroke?: ShapeStroke;
  /**
   * Which paint stripe this shape renders into. Default `'content'` — with
   * every shape above every connector, the renderer's long-standing
   * "nodes above edges" convention.
   *
   * `'backdrop'` moves the shape **below the connectors**, for scenery rather
   * than content: a group frame, a swimlane band, a region wash. Purely visual —
   * hit resolution still reads {@link zIndex} recorded at insert, so a backdrop
   * shape is picked exactly as it was before.
   */
  readonly plane?: PlaneName;
  /** Default `0`. Higher = on top. Used for hit-test resolution. */
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
  /**
   * Container-level rotation in radians, applied around the shape's
   * top-left local origin. Composes with effect-driven transform deltas
   * — the effect aggregator writes `(spec.rotation ?? 0) + dRot` per frame
   * so connector-hosted badges with `autoRotate: true` keep rotating
   * smoothly even while a `shake` / `breathing` effect runs on top.
   *
   * For per-shape geometric rotation (the visible rotation of a regular
   * polygon's vertices, a star's points, etc.), use the kind-specific
   * `rotation` field on those shape specs — that one rotates the *geometry*
   * before it's drawn; this one rotates the *container* after.
   */
  readonly rotation?: number;
}

export interface CircleSpec extends BaseShapeSpec {
  readonly kind: 'circle';
  readonly radius: number;
}

/**
 * Filled / stroked ellipse, centred at `(x, y)` with independent horizontal /
 * vertical radii. A circle is the `radiusX === radiusY` special case; prefer
 * {@link CircleSpec} there (cheaper, uniform).
 */

export interface EllipseSpec extends BaseShapeSpec {
  readonly kind: 'ellipse';
  readonly radiusX: number;
  readonly radiusY: number;
}

export interface RectSpec extends BaseShapeSpec {
  readonly kind: 'rect';
  readonly width: number;
  readonly height: number;
  readonly cornerRadius?: number;
}

/**
 * Where a {@link TabbedRectSpec}'s tab sits along the body's top edge.
 * `'left'` / `'right'` measure {@link TabbedRectSpec.tabOffset} in from that
 * side; `'center'` ignores the offset and splits the remainder evenly.
 */

export type TabAlign = 'left' | 'center' | 'right';

/**
 * Rectangle carrying a smaller raised **tab** on its top edge, traced as one
 * continuous silhouette — the "folder" outline. Fill and stroke run around
 * body and tab together, so it reads as a single object rather than a rect
 * with a badge stuck on it.
 *
 * Anchored at the **top-left of the full AABB**, i.e. the top-left of the
 * tab band — so `(spec.x, spec.y)` is the topmost point of the silhouette,
 * `height` describes the *body* only, and `bounds().height` is
 * `tabHeight + height`. The body spans `y ∈ [tabHeight, tabHeight + height]`
 * across the full `width`; the tab spans `tabHeight` above it, inset
 * horizontally per {@link tabAlign} / {@link tabOffset}.
 *
 * A tab as wide as the body degenerates to a plain rect of the combined
 * height; that's a valid (if pointless) spec, not an error. `height: 0` is
 * the other degenerate end and a useful one — see {@link TabbedRectSpec.height}.
 */

export interface TabbedRectSpec extends BaseShapeSpec {
  readonly kind: 'tabbed-rect';
  /** Width of the body — also the AABB width; the tab never exceeds it. */
  readonly width: number;
  /**
   * Height of the **body alone**, excluding {@link tabHeight}.
   *
   * `0` (or less) draws the **tab by itself** — a closed folder. The tab's
   * base becomes an exterior edge (so it takes a fillet and loses the fold
   * line), the tab is free to lean even when flush with the body's former
   * edges, and `bounds().height` is just `tabHeight`. Anything anchored to
   * the silhouette (labels, edges, decorations) follows the tab.
   */
  readonly height: number;
  /**
   * Width of the raised tab, measured at its base. Clamped to {@link width}
   * while a body is present; on a bodyless folder (`height <= 0`) the tab is
   * the whole silhouette, so it sizes freely and *becomes* the AABB width.
   *
   * Omit to leave it unresolved — it then falls back to `width` (a full-width
   * tab), and `ShapeCtor.fitToContent` sizes it to the title the caller
   * measures. Set it to pin the tab and opt out of that fitting.
   */
  readonly tabWidth?: number;
  /**
   * Horizontal breathing room between the tab's content and each of its ends,
   * used when `ShapeCtor.fitToContent` sizes the tab. Default `10`. Ignored
   * when {@link tabWidth} is pinned.
   */
  readonly tabPadding?: number;
  /** Height of the raised tab, added above the body. */
  readonly tabHeight: number;
  /** Fillet applied to the body's outer corners. Default `0` (sharp). */
  readonly cornerRadius?: number;
  /**
   * Fillet applied to the tab's two top corners. Defaults to
   * {@link cornerRadius} so a uniformly-rounded folder needs one field.
   * The two re-entrant "shoulder" corners where the tab meets the body
   * always stay sharp — rounding them reads as a dent, not a fold.
   */
  readonly tabCornerRadius?: number;
  /** Which side the tab hugs. Default `'left'`. */
  readonly tabAlign?: TabAlign;
  /**
   * Distance from the {@link tabAlign} edge to the tab. Default `0` — the
   * tab is flush with that side, which merges its outer edge into the
   * body's and produces the classic folder profile. Ignored when
   * `tabAlign: 'center'`.
   */
  readonly tabOffset?: number;
  /**
   * Horizontal run of the tab's **angled** side, in px. Default `0` (a
   * square tab). A non-zero value tapers the tab inward toward its top,
   * which is what separates a folder tab from a box parked on a rectangle.
   *
   * The lean is always on the side facing the rest of the frame — the right
   * edge for `tabAlign: 'left'`, the left edge for `'right'`, and both for
   * `'center'`. A side flush with the body's own edge can't lean, since the
   * two edges have merged.
   *
   * {@link tabWidth} measures the tab at its **base**, so the skew eats into
   * the top edge rather than widening the footprint. Clamped so the slants
   * can never consume more than half the tab.
   */
  readonly tabSkew?: number;
  /**
   * Draw the tab's bottom border — the fold line across the tab's base where
   * it meets the body. Default `true`; set `false` for an open profile where
   * the tab flows into the body with no seam.
   *
   * It's interior geometry, painted only on the shape's own pass: a
   * decoration borrowing this silhouette (glow, halo, marching ants) traces
   * the outline alone. It's also skipped when the spec carries no stroke —
   * it's a border, with no colour of its own to fall back on.
   */
  readonly tabDivider?: boolean;
}

/**
 * Free-form polygon. `vertices` are centre-relative — the silhouette is
 * traced around the origin, then translated to `(x, y)`. Closed implicitly:
 * the last vertex connects back to the first. Use this for arbitrary
 * outlines (arrows, blobs, callouts). For regular n-gons or stars prefer
 * `RegularPolygonSpec` / `StarSpec` — they're cheaper to author.
 */

export interface PolygonSpec extends BaseShapeSpec {
  readonly kind: 'polygon';
  readonly vertices: ReadonlyArray<Point>;
}

/**
 * Regular n-gon centred at `(x, y)` with circum-radius `radius`. Covers
 * triangle (`sides: 3`), pentagon, hexagon (pointy-top by default — pass
 * `rotation: Math.PI / 6` for flat-top), octagon, etc. `rotation` is in
 * radians; positive rotates counter-clockwise in screen space.
 */

export interface RegularPolygonSpec extends BaseShapeSpec {
  readonly kind: 'regular-polygon';
  readonly sides: number;
  readonly radius: number;
  readonly rotation?: number;
}

/**
 * Annular sector centred at `(x, y)` between radii `innerR`/`outerR` and
 * angles `startAngle`/`endAngle` (radians). Angle convention: `0` is along
 * `+x` (3 o'clock); increasing values sweep clockwise on screen.
 *
 * Special cases:
 * - `innerR === 0` → pie slice.
 * - `endAngle - startAngle >= 2π` and `innerR > 0` → full annulus (ring).
 * - `endAngle - startAngle >= 2π` and `innerR === 0` → full disc (prefer
 *   `CircleSpec` for that case).
 *
 * The natural fit for sunburst / partition layouts where each node is an
 * arc-shaped region rather than a positioned dot. Pair with
 * `D3HierarchyLayout({ mode: 'sunburst' })`, which writes the four arc
 * parameters per node.
 */

export interface ArcSpec extends BaseShapeSpec {
  readonly kind: 'arc';
  readonly innerR: number;
  readonly outerR: number;
  readonly startAngle: number;
  readonly endAngle: number;
}

/**
 * Star centred at `(x, y)`, with `points` outer points alternating between
 * `outerRadius` and `innerRadius`. Classic 5-point star uses
 * `points: 5, outerRadius: r, innerRadius: r * 0.4`. `rotation` is in
 * radians; positive rotates counter-clockwise.
 */

export interface StarSpec extends BaseShapeSpec {
  readonly kind: 'star';
  readonly points: number;
  readonly innerRadius: number;
  readonly outerRadius: number;
  readonly rotation?: number;
}

/**
 * A marker spec is any registered shape spec **without** `x` / `y` — the
 * connector positions and orients the marker at the polyline endpoint.
 * Reuses the shape registry: there is no separate marker registry. The
 * shape's class must expose a static `paintInto` (see `ShapeCtor`).
 */

export type MarkerShapeSpec = Omit<BaseShapeSpec, 'x' | 'y'> & { readonly kind: string };

/**
 * Anchor selection for a `kind: 'shape'` connector endpoint. Resolves the
 * shape id to a concrete world-space `(x, y)` point on the shape — center of
 * the bounding box (`'center'`, default), perimeter intersection toward the
 * other endpoint (`'boundary'`), or any registered custom anchor.
 *
 * String shorthand picks an anchor by name with default opts; the object
 * form passes opts to the anchor function.
 */

/**
 * Free-form polyline or filled outline. Points are centre-relative, like
 * {@link PolygonSpec}, but the run is **open by default** — set `closed` to
 * join the last point back to the first.
 *
 * This is the vocabulary for shapes whose geometry is *computed* rather than
 * parameterised: density-contour bands, bubble-set hulls, region outlines. It
 * exists so those features can be described as data instead of drawn with a
 * backend drawing API — see `docs/renderer-split-design.md` §3.
 */
export interface PathSpec extends BaseShapeSpec {
  readonly kind: 'path';
  /** Centre-relative points, in order. Fewer than 2 renders nothing. */
  readonly points: readonly Point[];
  /** Join the last point back to the first. Default `false`. */
  readonly closed?: boolean;
}
