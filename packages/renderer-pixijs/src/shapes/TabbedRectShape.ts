import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyFill, applyMarkerFill, applyStroke } from '../paint/applyFillStroke';
import { emitDashedStroke } from '../paint/dashedStroke';
import {
  collapsedTabbedRect,
  containsTabbedRect,
  fitTabbedRectToContent,
  scaleTabbedRect,
  tabbedRectBounds,
  tabbedRectFoldLine,
  tabbedRectOutline,
  tabbedRectTabBox,
  tabbedRectTabWidth,
} from '@invana/canvas';
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
    const verts = tabbedRectOutline(spec, baseInset);
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
      const fold = style === undefined ? tabbedRectFoldLine(spec, baseInset) : undefined;
      if (fold) emitDashedStroke(g, fold, { ...dash, closed: false });
      return;
    }

    const trace = (extra = 0) => {
      const v = extra > 0 ? tabbedRectOutline(spec, baseInset + extra) : verts;
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
      const fold = tabbedRectFoldLine(spec, baseInset);
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
    return tabbedRectBounds(spec);
  }

  /** The folder, closed: body gone, tab kept. */
  static collapsedOf(spec: Omit<TabbedRectSpec, 'x' | 'y'>): Partial<TabbedRectSpec> {
    return collapsedTabbedRect(spec);
  }

  /** Size the tab to the title it carries. */
  static fitToContent(
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    content: { readonly width: number; readonly height: number },
  ): Partial<TabbedRectSpec> {
    return fitTabbedRectToContent(spec, content);
  }

  static scaleSpec(
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    factor: number,
  ): Partial<TabbedRectSpec> {
    return scaleTabbedRect(spec, factor);
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
    if (height <= 0) return { x: tabbedRectTabWidth(this.spec) / 2, y: tabHeight / 2 };
    return { x: width / 2, y: tabHeight + height / 2 };
  }

  contains(localX: number, localY: number): boolean {
    return containsTabbedRect(this.spec, localX, localY);
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
    const halfW = (height <= 0 ? tabbedRectTabWidth(this.spec) : width) / 2;
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
    return tabbedRectTabBox(this.spec, 0);
  }

  static paintInto(
    g: Graphics,
    spec: Omit<TabbedRectSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const verts = tabbedRectOutline(spec, style?.inset ?? 0);
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

function tracePolygon(g: Graphics, vertices: ReadonlyArray<Point>): void {
  const first = vertices[0]!;
  g.moveTo(first.x, first.y);
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i]!;
    g.lineTo(v.x, v.y);
  }
  g.closePath();
}
