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
 *
 * `height: 0` draws the **tab by itself** — the closed folder. The tab's base
 * becomes the outline's bottom edge (filleted, no fold line), the taper still
 * applies, and bounds / label box / edge anchors all collapse onto the tab.
 * That's the silhouette a collapsed container frame renders as.
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
    // Bodyless (`height <= 0`): the tab *is* the silhouette, so it's also the
    // footprint — the declared body width describes a rectangle that isn't
    // being drawn. Everything positioned against the AABB (the label box,
    // decorations, edge anchors) therefore lands on the tab.
    if (spec.height <= 0) {
      return { x: 0, y: 0, width: tabWidthOf(spec), height: spec.tabHeight };
    }
    return { x: 0, y: 0, width: spec.width, height: spec.tabHeight + spec.height };
  }

  /**
   * The folder, closed: body gone, tab kept. `width` is deliberately left
   * alone — {@link boundsOf} already reports the tab as the footprint once
   * the body is gone, so rewriting it would double-apply.
   */
  static collapsedOf(_spec: Omit<TabbedRectSpec, 'x' | 'y'>): Partial<TabbedRectSpec> {
    return { height: 0 };
  }

  /**
   * Size the tab to the content it carries — the title.
   *
   * The taper eats into the tab's top edge, so the slant's run is added on top
   * of the text budget; otherwise leaning the tab would push the title into
   * the taper. A centred tab leans on both sides.
   *
   * The clamp to `width` applies **only while there's a body**: a tab can't
   * outgrow the rectangle it sits on, but a closed folder is nothing *but* its
   * tab, so it sizes to the whole title rather than ellipsising it. Returns
   * nothing when {@link TabbedRectSpec.tabWidth} is pinned.
   */
  static fitToContent(
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    content: { readonly width: number; readonly height: number },
  ): Partial<TabbedRectSpec> {
    if (spec.tabWidth !== undefined) return {};
    const pad = spec.tabPadding ?? 10;
    const slantSides = (spec.tabAlign ?? 'left') === 'center' ? 2 : 1;
    const fitted = content.width + 2 * pad + (spec.tabSkew ?? 0) * slantSides;
    return { tabWidth: spec.height <= 0 ? fitted : Math.min(spec.width, fitted) };
  }

  static scaleSpec(
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    factor: number,
  ): Partial<TabbedRectSpec> {
    return {
      width: spec.width * factor,
      height: spec.height * factor,
      tabHeight: spec.tabHeight * factor,
      ...(spec.tabWidth !== undefined ? { tabWidth: spec.tabWidth * factor } : {}),
      ...(spec.tabPadding !== undefined ? { tabPadding: spec.tabPadding * factor } : {}),
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
   *
   * With no body (`height <= 0`) the tab *is* the object, so its own midpoint
   * is the answer.
   */
  override visualCenter(): Point {
    const { width, height, tabHeight } = this.spec;
    if (height <= 0) return { x: tabWidthOf(this.spec) / 2, y: tabHeight / 2 };
    return { x: width / 2, y: tabHeight + height / 2 };
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
   * container's body, not on the little title flag above it. The one exception
   * is a bodyless spec (`height <= 0`, the closed folder): with no body to aim
   * at, the tab band becomes the target.
   */
  override boundaryIntersect(localFromCenter: Point): Point | null {
    const { width, height, tabHeight } = this.spec;
    const halfW = (height <= 0 ? tabWidthOf(this.spec) : width) / 2;
    // AABB centre is at y = (tabHeight + height) / 2 in local space; the
    // body spans local y ∈ [tabHeight, tabHeight + height]. Bodyless: the AABB
    // is the tab band, already centred on it.
    const bodyTop = height <= 0 ? -tabHeight / 2 : (tabHeight - height) / 2;
    const bodyBottom = height <= 0 ? tabHeight / 2 : (tabHeight + height) / 2;

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
    const box = TabbedRectShape.boundsOf(spec);
    const cx = box.width / 2;
    const cy = box.height / 2;
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
  /**
   * `true` when `spec.height <= 0` and the silhouette is the tab alone — the
   * closed folder. `left` / `right` / `bottom` describe the tab, and there is
   * no fold line. See {@link bodylessGeometryOf}.
   */
  bodyless: boolean;
}

function geometryOf(
  spec: Omit<TabbedRectSpec, 'x' | 'y'>,
  inset: number,
): TabbedRectGeometry | null {
  if (spec.height <= 0) return bodylessGeometryOf(spec, inset);
  const totalH = spec.tabHeight + spec.height;
  const left = inset;
  const right = spec.width - inset;
  const bottom = totalH - inset;
  const tabTop = inset;
  const shoulder = spec.tabHeight + inset;
  if (right <= left || bottom <= shoulder) return null;

  const x0 = tabXOf(spec);
  const tabLeft = Math.max(left, x0 + inset);
  const tabRight = Math.min(right, x0 + tabWidthOf(spec) - inset);
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
    bodyless: false,
  };
}

/**
 * Geometry for a **bodyless** spec (`height <= 0`) — the closed folder: the
 * silhouette is the tab and nothing else.
 *
 * Two things flip relative to {@link geometryOf}'s main path, both because the
 * tab's base stops being an interior fold and becomes the outline's bottom edge:
 *
 * - The inset pulls that edge **up** (`tabHeight − inset`) instead of pushing
 *   the body's top edge down, so a decoration borrowing this silhouette insets
 *   uniformly rather than growing downward.
 * - The tab may **lean on either side regardless of flushness**. In the main
 *   path a side flush with the body's edge can't slant (it merges into it);
 *   with no body there's nothing to merge with, so a tab spanning the full
 *   declared width still gets its taper — which is what keeps a collapsed
 *   frame reading as a folder rather than a plain rounded rect.
 */
function bodylessGeometryOf(
  spec: Omit<TabbedRectSpec, 'x' | 'y'>,
  inset: number,
): TabbedRectGeometry | null {
  const tabTop = inset;
  const base = spec.tabHeight - inset;
  const tabLeft = inset;
  const tabRight = tabWidthOf(spec) - inset;
  if (base <= tabTop || tabRight <= tabLeft) return null;

  const align = spec.tabAlign ?? 'left';
  const slantLeft = align === 'right' || align === 'center';
  const slantRight = align === 'left' || align === 'center';
  const sides = (slantLeft ? 1 : 0) + (slantRight ? 1 : 0);
  const skew =
    sides === 0
      ? 0
      : Math.max(0, Math.min(spec.tabSkew ?? 0, (tabRight - tabLeft) / (2 * sides)));

  return {
    left: tabLeft,
    right: tabRight,
    bottom: base,
    tabTop,
    // No fold to sit on: the shoulder *is* the outline's bottom edge, which
    // keeps `labelAnchorBox` (tabTop → shoulder) spanning the whole tab.
    shoulder: base,
    tabLeft,
    tabRight,
    tabTopLeft: tabLeft + (slantLeft ? skew : 0),
    tabTopRight: tabRight - (slantRight ? skew : 0),
    flushLeft: true,
    flushRight: true,
    bodyless: true,
  };
}

/**
 * Resolved tab width: the declared {@link TabbedRectSpec.tabWidth}, falling
 * back to the body's width when it's left unset (a full-width tab).
 *
 * Clamped to the body while there is one — a tab can't outgrow the rectangle
 * it sits on. A bodyless folder's tab *is* the silhouette, so it sizes freely.
 */
function tabWidthOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): number {
  const declared = spec.tabWidth ?? spec.width;
  return spec.height <= 0 ? declared : Math.min(declared, spec.width);
}

/** Left edge of the tab's base in shape-local space, resolved from `tabAlign`. */
function tabXOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): number {
  // Bodyless: the tab is the whole footprint, so it starts at the origin —
  // there's no body left for it to be aligned against or offset from.
  if (spec.height <= 0) return 0;
  const tabW = tabWidthOf(spec);
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
  if (!geo || geo.bodyless) return undefined;
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
  // Closed folder — the tab's base closes the outline, so there are no
  // shoulders to turn and the body's fillet applies to its two bottom corners.
  if (geo.bodyless) {
    corners.push({ x: tabRight, y: bottom, r });
    corners.push({ x: tabLeft, y: bottom, r });
    return roundedPolygonOutline(corners);
  }
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
