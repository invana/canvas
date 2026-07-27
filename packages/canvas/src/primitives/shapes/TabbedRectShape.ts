import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import { pointInPolygon, roundedPolygonOutline, type RoundedCorner } from './_polyUtils';
import type {
  Point,
  Rect,
  ShapeHostInfo,
  ShapeLabelPlacement,
  ShapePaintStyle,
  TabbedRectSpec,
} from '../types';

/**
 * Rectangle with a raised tab on its top edge — the manila-folder silhouette —
 * traced as one continuous outline so fill and stroke wrap body and tab
 * together.
 *
 * Anchored at the top-left of the **full AABB** (the tab's top-left corner
 * when the tab is flush left), matching `RectShape`'s top-left convention.
 * `spec.height` is the body alone, so `bounds().height` is
 * `tabHeight + height` — callers positioning this shape place its topmost
 * point, not the body's.
 *
 * Two details give it the folder read rather than "a rect with a box stuck on
 * top": the tab's inward-facing side is **angled** (`tabSkew`), and its base
 * is closed by a **fold line** (`tabDivider`) drawn across the body's top
 * edge. The fold line is interior geometry, so it is drawn only on the shape's
 * own paint pass — a glow or halo tracing this silhouette gets the outline
 * alone and doesn't sprout a stray line across the middle.
 *
 * Two behaviours make it usable as a container frame:
 *
 * - **`boundaryIntersect` snaps to the body, never the tab.** A connector
 *   drawn to this shape lands on the rectangle a reader perceives as the
 *   object; a line terminating on the little tab reads as a mistake.
 * - **`labelAnchorBox` routes inside labels into the tab.** So
 *   `placement: 'inside-center'` puts the title on the tab, independent of
 *   how large the body grows — which is what makes an auto-sized frame's
 *   title stay put.
 */
export class TabbedRectShape extends ShapeBase<TabbedRectSpec> {
  static readonly kind = 'tabbed-rect';

  constructor(spec: TabbedRectSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: TabbedRectSpec, style?: ShapePaintStyle): void {
    const baseInset = style?.inset ?? 0;
    const verts = outlineOf(spec, baseInset);
    if (verts.length < 3) return;

    const dashArray = style?.dashArray ?? spec.stroke?.dashArray;
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      const dash = {
        color: style?.color ?? spec.stroke?.color ?? 0x000000,
        alpha: style?.alpha ?? spec.stroke?.alpha ?? 1,
        width: style?.strokeWidth ?? spec.stroke?.width ?? 1,
        dashArray,
        dashOffset: style?.dashOffset ?? spec.stroke?.dashOffset,
      };
      emitDashedStroke(g, verts, { ...dash, closed: true });
      const fold = style === undefined ? foldLineOf(spec, baseInset) : undefined;
      if (fold) emitDashedStroke(g, fold, { ...dash, closed: false });
      return;
    }

    const trace = (extra = 0) => {
      const v = extra > 0 ? outlineOf(spec, baseInset + extra) : verts;
      if (v.length >= 3) tracePolygon(g, v);
    };
    trace();
    applyFill(g, spec, style, this.host, this.bounds(), trace);
    applyStroke(g, spec, style, trace);

    // The fold line closing the tab's base. Interior geometry, so it's skipped
    // whenever a decoration is borrowing this silhouette (`style` present) —
    // and skipped when the spec carries no stroke, since it *is* a border and
    // has no colour of its own to fall back on.
    if (style === undefined && spec.stroke && (spec.stroke.width ?? 1) > 0) {
      const fold = foldLineOf(spec, baseInset);
      if (fold) {
        g.moveTo(fold[0]!.x, fold[0]!.y);
        g.lineTo(fold[1]!.x, fold[1]!.y);
        g.stroke({
          color: spec.stroke.color,
          alpha: spec.stroke.alpha ?? 1,
          width: spec.stroke.width ?? 1,
          cap: spec.stroke.cap,
        });
      }
    }
  }

  bounds(): Rect {
    return TabbedRectShape.boundsOf(this.spec);
  }

  static boundsOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): Rect {
    return { x: 0, y: 0, width: spec.width, height: spec.tabHeight + spec.height };
  }

  static scaleSpec(
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    factor: number,
  ): Partial<TabbedRectSpec> {
    return {
      width: spec.width * factor,
      height: spec.height * factor,
      tabWidth: spec.tabWidth * factor,
      tabHeight: spec.tabHeight * factor,
      ...(spec.cornerRadius !== undefined ? { cornerRadius: spec.cornerRadius * factor } : {}),
      ...(spec.tabCornerRadius !== undefined
        ? { tabCornerRadius: spec.tabCornerRadius * factor }
        : {}),
      ...(spec.tabOffset !== undefined ? { tabOffset: spec.tabOffset * factor } : {}),
      ...(spec.tabSkew !== undefined ? { tabSkew: spec.tabSkew * factor } : {}),
    };
  }

  /**
   * The body's midpoint, not the AABB's — the tab band shifts the AABB
   * centre upward by `tabHeight / 2`, which would float a centred glyph or
   * label off the rectangle the eye reads as the object.
   */
  override visualCenter(): Point {
    return {
      x: this.spec.width / 2,
      y: this.spec.tabHeight + this.spec.height / 2,
    };
  }

  contains(localX: number, localY: number): boolean {
    return pointInPolygon(localX, localY, outlineOf(this.spec, 0));
  }

  /**
   * Ray exit against the **body** rectangle only. Input and output are
   * relative to the AABB centre per the `IShape` contract, so the body is
   * expressed as an off-centre box: the tab band sits entirely above the
   * AABB centre line, shifting the body's top edge down by `tabHeight / 2`.
   *
   * Excluding the tab is deliberate — a connector should terminate on the
   * container's body, not on the little title flag above it.
   */
  override boundaryIntersect(localFromCenter: Point): Point | null {
    const { width, height, tabHeight } = this.spec;
    const halfW = width / 2;
    // AABB centre is at y = (tabHeight + height) / 2 in local space; the
    // body spans local y ∈ [tabHeight, tabHeight + height].
    const bodyTop = (tabHeight - height) / 2;
    const bodyBottom = (tabHeight + height) / 2;

    const dx = localFromCenter.x;
    const dy = localFromCenter.y;
    if (dx === 0 && dy === 0) return null;

    let tMin = Infinity;
    if (dx !== 0) {
      const t = (dx > 0 ? halfW : -halfW) / dx;
      if (t > 0 && t < tMin) tMin = t;
    }
    if (dy !== 0) {
      const t = (dy > 0 ? bodyBottom : bodyTop) / dy;
      if (t > 0 && t < tMin) tMin = t;
    }
    if (!isFinite(tMin)) return null;
    return { x: dx * tMin, y: dy * tMin };
  }

  /**
   * Route every `inside-*` placement into the **tab**.
   *
   * The rule is one-line on purpose: this silhouette exists to be a frame
   * around *other* content, so its body interior belongs to whatever it
   * contains — the only place the shape's own label belongs is the tab.
   * `inside-center` therefore centres the title on the tab, `inside-left`
   * left-aligns it there, and so on: the placement still means what it says,
   * just against the tab's box rather than the body's.
   *
   * The box returned is the tab's **upright** portion — the slant is excluded
   * on whichever side is angled, so a centred title reads centred against the
   * part of the tab that's actually full height rather than drifting into the
   * taper. Because that box is small and fixed, the inside-placement inset
   * (proportional to the box) stays visually identical no matter how large the
   * body grows underneath.
   *
   * Two deliberate escapes: bare `'center'` resolves through
   * {@link visualCenter} to the **body** centre, and the outside placements
   * fall through to the full AABB so they clear the whole silhouette.
   */
  labelAnchorBox(placement: ShapeLabelPlacement): Rect | undefined {
    if (!placement.startsWith('inside-')) return undefined;
    const geo = geometryOf(this.spec, 0);
    if (!geo) return undefined;
    return {
      x: geo.tabTopLeft,
      y: geo.tabTop,
      width: Math.max(0, geo.tabTopRight - geo.tabTopLeft),
      height: geo.shoulder - geo.tabTop,
    };
  }

  static paintInto(
    g: Graphics,
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const verts = outlineOf(spec, style?.inset ?? 0);
    if (verts.length < 3) return;
    // Outline coordinates are AABB-origin-relative; markers anchor on the
    // centre, so re-base to the AABB midpoint before rotating into place.
    const cx = spec.width / 2;
    const cy = (spec.tabHeight + spec.height) / 2;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const placed = verts.map((v) => {
      const x = v.x - cx;
      const y = v.y - cy;
      return { x: anchor.x + x * cos - y * sin, y: anchor.y + x * sin + y * cos };
    });
    tracePolygon(g, placed);
    applyMarkerFill(g, spec.fill, style);
  }
}

/**
 * Every edge coordinate the silhouette, fold line and label box are built
 * from, resolved once against `inset`. Returns `null` when the inset has
 * collapsed the geometry to nothing.
 *
 * The inset is applied analytically per edge rather than via a polygon
 * offset: the re-entrant shoulder corners make a bisector offset unstable,
 * and all but the slanted edges are axis-aligned, so the exact answer is one
 * addition.
 */
interface TabbedRectGeometry {
  left: number;
  right: number;
  bottom: number;
  /** Top of the tab — the silhouette's topmost edge. */
  tabTop: number;
  /** Where the tab meets the body; the fold line's y. */
  shoulder: number;
  /** Tab extent at its **base**, where it meets the body. */
  tabLeft: number;
  tabRight: number;
  /** Tab extent at its **top**, narrowed by the slant on whichever side leans. */
  tabTopLeft: number;
  tabTopRight: number;
  flushLeft: boolean;
  flushRight: boolean;
}

function geometryOf(
  spec: Omit<TabbedRectSpec, 'x' | 'y'>,
  inset: number,
): TabbedRectGeometry | null {
  const totalH = spec.tabHeight + spec.height;
  const left = inset;
  const right = spec.width - inset;
  const bottom = totalH - inset;
  const tabTop = inset;
  const shoulder = spec.tabHeight + inset;
  if (right <= left || bottom <= shoulder) return null;

  const x0 = tabXOf(spec);
  const tabLeft = Math.max(left, x0 + inset);
  const tabRight = Math.min(right, x0 + Math.min(spec.tabWidth, spec.width) - inset);
  if (tabRight <= tabLeft) return null;

  // The tab leans away from the side it hugs, so the angled edge is always
  // the one facing the rest of the frame. A centred tab leans both ways.
  const align = spec.tabAlign ?? 'left';
  const flushLeft = tabLeft - left < 1e-6;
  const flushRight = right - tabRight < 1e-6;
  // A side flush with the body's edge merges into it and can't lean.
  const slantLeft = (align === 'right' || align === 'center') && !flushLeft;
  const slantRight = (align === 'left' || align === 'center') && !flushRight;

  const sides = (slantLeft ? 1 : 0) + (slantRight ? 1 : 0);
  // Clamp so the slants can never eat more than half the tab — an over-large
  // skew degrades to a triangle-ish tab instead of inverting the top edge.
  const skew =
    sides === 0
      ? 0
      : Math.max(0, Math.min(spec.tabSkew ?? 0, (tabRight - tabLeft) / (2 * sides)));

  return {
    left,
    right,
    bottom,
    tabTop,
    shoulder,
    tabLeft,
    tabRight,
    tabTopLeft: tabLeft + (slantLeft ? skew : 0),
    tabTopRight: tabRight - (slantRight ? skew : 0),
    flushLeft,
    flushRight,
  };
}

/** Left edge of the tab's base in shape-local space, resolved from `tabAlign`. */
function tabXOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): number {
  const tabW = Math.min(spec.tabWidth, spec.width);
  const offset = spec.tabOffset ?? 0;
  switch (spec.tabAlign ?? 'left') {
    case 'center':
      return (spec.width - tabW) / 2;
    case 'right':
      return Math.max(0, spec.width - tabW - offset);
    default:
      return Math.min(offset, Math.max(0, spec.width - tabW));
  }
}

/**
 * Trace the folder silhouette into a polyline, inset by `inset` on every
 * side. Winds clockwise from the tab's top-left corner. Coordinates are
 * shape-local — the AABB's top-left is the origin.
 *
 * The two re-entrant shoulders stay sharp; the convex corners take a fillet.
 * Rounding a shoulder reads as a dent rather than a fold.
 *
 * Exported so vector export can emit the same silhouette the renderer draws
 * instead of re-deriving it.
 */
export function tabbedRectOutline(
  spec: Omit<TabbedRectSpec, 'x' | 'y'>,
  inset = 0,
): Point[] {
  return outlineOf(spec, inset);
}

/**
 * The tab's bottom border — the fold where the tab meets the body — as a
 * two-point segment, or `undefined` when `tabDivider` is off or the geometry
 * has collapsed. Spans the tab's **base**, so with a flush tab it starts on
 * the body's own edge and the two borders meet cleanly.
 */
export function tabbedRectFoldLine(
  spec: Omit<TabbedRectSpec, 'x' | 'y'>,
  inset = 0,
): [Point, Point] | undefined {
  return foldLineOf(spec, inset);
}

function foldLineOf(
  spec: Omit<TabbedRectSpec, 'x' | 'y'>,
  inset: number,
): [Point, Point] | undefined {
  if (spec.tabDivider === false) return undefined;
  const geo = geometryOf(spec, inset);
  if (!geo) return undefined;
  return [
    { x: geo.tabLeft, y: geo.shoulder },
    { x: geo.tabRight, y: geo.shoulder },
  ];
}

function outlineOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>, inset: number): Point[] {
  const geo = geometryOf(spec, inset);
  if (!geo) return [];
  const { left, right, bottom, tabTop, shoulder, tabLeft, tabRight } = geo;

  const r = Math.max(0, (spec.cornerRadius ?? 0) - inset);
  const tr = Math.max(0, (spec.tabCornerRadius ?? spec.cornerRadius ?? 0) - inset);

  const corners: RoundedCorner[] = [];
  corners.push({ x: geo.tabTopLeft, y: tabTop, r: tr });
  corners.push({ x: geo.tabTopRight, y: tabTop, r: tr });
  if (geo.flushRight) {
    // Tab reaches the body's right edge — the tab's leaning (or vertical)
    // side runs straight into the body's side, one convex bend.
    corners.push({ x: right, y: shoulder, r });
  } else {
    corners.push({ x: tabRight, y: shoulder, r: 0 });
    corners.push({ x: right, y: shoulder, r });
  }
  corners.push({ x: right, y: bottom, r });
  corners.push({ x: left, y: bottom, r });
  if (!geo.flushLeft) {
    corners.push({ x: left, y: shoulder, r });
    corners.push({ x: tabLeft, y: shoulder, r: 0 });
  }
  return roundedPolygonOutline(corners);
}

function tracePolygon(g: Graphics, vertices: ReadonlyArray<Point>): void {
  const first = vertices[0]!;
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]!;
    g.lineTo(v.x, v.y);
  }
  g.closePath();
}
