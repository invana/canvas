/**
 * The `tabbed-rect` (manila folder) silhouette, as pure maths.
 *
 * Every edge coordinate the outline, fold line, label box, bounds and hit test
 * are built from is resolved here, from the spec alone. It lives in `specs/`
 * rather than beside the renderer because the folder's footprint is a genuine
 * property of the *description* — a layout asking how big a container frame is,
 * an SVG export tracing it, and a headless hit-test all need the same answer
 * without a GPU (`docs/renderer-split-design.md` §4.5).
 *
 * Coordinates are **AABB-origin-relative**: `(0, 0)` is the top-left of the
 * full silhouette, which is the tab band's top-left when the tab is flush left.
 */

import type { Point, Rect } from '../geometry';
import type { TabbedRectSpec } from '../shape';
import { roundedPolygonOutline, type RoundedCorner } from './polygonMath';

/** A tabbed-rect spec with its world position removed — geometry only. */
export type TabbedRectGeometrySpec = Omit<TabbedRectSpec, 'x' | 'y'>;

/**
 * Every edge coordinate the silhouette, fold line and label box are built
 * from, resolved once against `inset`. `null` when the inset has collapsed the
 * geometry to nothing.
 *
 * The inset is applied analytically per edge rather than via a polygon offset:
 * the re-entrant shoulder corners make a bisector offset unstable, and all but
 * the slanted edges are axis-aligned, so the exact answer is one addition.
 */
export interface TabbedRectGeometry {
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

/**
 * Resolved tab width: the declared {@link TabbedRectSpec.tabWidth}, falling
 * back to the body's width when it's left unset (a full-width tab).
 *
 * Clamped to the body while there is one — a tab can't outgrow the rectangle
 * it sits on. A bodyless folder's tab *is* the silhouette, so it sizes freely.
 */
export function tabbedRectTabWidth(spec: TabbedRectGeometrySpec): number {
  const declared = spec.tabWidth ?? spec.width;
  return spec.height <= 0 ? declared : Math.min(declared, spec.width);
}

/**
 * AABB of the folder.
 *
 * Bodyless (`height <= 0`): the tab *is* the silhouette, so it's also the
 * footprint — the declared body width describes a rectangle that isn't being
 * drawn. Everything positioned against the AABB (the label box, decorations,
 * edge anchors) therefore lands on the tab.
 */
export function tabbedRectBounds(spec: TabbedRectGeometrySpec): Rect {
  if (spec.height <= 0) {
    return { x: 0, y: 0, width: tabbedRectTabWidth(spec), height: spec.tabHeight };
  }
  return { x: 0, y: 0, width: spec.width, height: spec.tabHeight + spec.height };
}

/**
 * The folder, closed: body gone, tab kept. `width` is deliberately left alone —
 * {@link tabbedRectBounds} already reports the tab as the footprint once the
 * body is gone, so rewriting it would double-apply.
 */
export function collapsedTabbedRect(
  _spec: TabbedRectGeometrySpec,
): Partial<TabbedRectSpec> {
  return { height: 0 };
}

/**
 * Size the tab to the content it carries — the title.
 *
 * The taper eats into the tab's top edge, so the slant's run is added on top of
 * the text budget; otherwise leaning the tab would push the title into the
 * taper. A centred tab leans on both sides.
 *
 * The clamp to `width` applies **only while there's a body**: a tab can't
 * outgrow the rectangle it sits on, but a closed folder is nothing *but* its
 * tab, so it sizes to the whole title rather than ellipsising it. Returns
 * nothing when {@link TabbedRectSpec.tabWidth} is pinned.
 */
export function fitTabbedRectToContent(
  spec: TabbedRectGeometrySpec,
  content: { readonly width: number; readonly height: number },
): Partial<TabbedRectSpec> {
  if (spec.tabWidth !== undefined) return {};
  const pad = spec.tabPadding ?? 10;
  const slantSides = (spec.tabAlign ?? 'left') === 'center' ? 2 : 1;
  const fitted = content.width + 2 * pad + (spec.tabSkew ?? 0) * slantSides;
  return { tabWidth: spec.height <= 0 ? fitted : Math.min(spec.width, fitted) };
}

/** Uniform scale of every length the folder carries. */
export function scaleTabbedRect(
  spec: TabbedRectGeometrySpec,
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
 * Trace the folder silhouette into a polyline, inset by `inset` on every side.
 * Winds clockwise from the tab's top-left corner.
 *
 * The two re-entrant shoulders stay sharp; the convex corners take a fillet.
 * Rounding a shoulder reads as a dent rather than a fold.
 */
export function tabbedRectOutline(
  spec: TabbedRectGeometrySpec,
  inset = 0,
): Point[] {
  const geo = tabbedRectGeometry(spec, inset);
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

/**
 * The tab's bottom border — the fold where the tab meets the body — as a
 * two-point segment, or `undefined` when `tabDivider` is off or the geometry
 * has collapsed. Spans the tab's **base**, so with a flush tab it starts on the
 * body's own edge and the two borders meet cleanly.
 */
export function tabbedRectFoldLine(
  spec: TabbedRectGeometrySpec,
  inset = 0,
): [Point, Point] | undefined {
  if (spec.tabDivider === false) return undefined;
  const geo = tabbedRectGeometry(spec, inset);
  if (!geo || geo.bodyless) return undefined;
  return [
    { x: geo.tabLeft, y: geo.shoulder },
    { x: geo.tabRight, y: geo.shoulder },
  ];
}

/**
 * The tab's **upright** box — its full-height portion, with the slant excluded
 * on whichever side is angled. This is where the folder's own label belongs:
 * the body interior belongs to whatever the frame contains, so a title centred
 * against this box stays put no matter how large the body grows.
 */
export function tabbedRectTabBox(
  spec: TabbedRectGeometrySpec,
  inset = 0,
): Rect | undefined {
  const geo = tabbedRectGeometry(spec, inset);
  if (!geo) return undefined;
  return {
    x: geo.tabTopLeft,
    y: geo.tabTop,
    width: Math.max(0, geo.tabTopRight - geo.tabTopLeft),
    height: geo.shoulder - geo.tabTop,
  };
}

/** Resolve every edge coordinate of the folder against `inset`. */
export function tabbedRectGeometry(
  spec: TabbedRectGeometrySpec,
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
  const tabRight = Math.min(right, x0 + tabbedRectTabWidth(spec) - inset);
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
 * Two things flip relative to {@link tabbedRectGeometry}'s main path, both
 * because the tab's base stops being an interior fold and becomes the outline's
 * bottom edge:
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
  spec: TabbedRectGeometrySpec,
  inset: number,
): TabbedRectGeometry | null {
  const tabTop = inset;
  const base = spec.tabHeight - inset;
  const tabLeft = inset;
  const tabRight = tabbedRectTabWidth(spec) - inset;
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
    // keeps the label box (tabTop → shoulder) spanning the whole tab.
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

/** Left edge of the tab's base in shape-local space, resolved from `tabAlign`. */
function tabXOf(spec: TabbedRectGeometrySpec): number {
  // Bodyless: the tab is the whole footprint, so it starts at the origin —
  // there's no body left for it to be aligned against or offset from.
  if (spec.height <= 0) return 0;
  const tabW = tabbedRectTabWidth(spec);
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
