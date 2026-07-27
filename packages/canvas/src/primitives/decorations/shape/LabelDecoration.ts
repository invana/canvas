/**
 * Shape-anchored `LabelDecoration` — positions a text (or HTML text) block
 * relative to the host shape's bounding box, with optional background pill
 * and per-zoom LOD.
 *
 * Placement covers the 13 standard slots: `center` (inside the silhouette),
 * 8 outside sides (`top` / `top-right` / `right` / ... / `top-left`), and 4
 * inside corners (`inside-top-left` / ...). For `center` this decoration
 * subsumes the legacy `kind: 'text'` fill layer.
 *
 * Performance: text and background are mutated in place on update; no
 * allocation per frame. LOD removes the decoration's gfx from the scene
 * (not just `visible = false`) when outside the zoom band so Pixi skips the
 * transform pass entirely.
 */

import { Container, Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';
import {
  applyLabelResolution,
  fitInsideBox,
  mountLabelContent,
  updateLabelContent,
  type LabelContentView,
} from '../../paint/labelContent';
import { drawLabelBackground } from '../../paint/labelBackground';
import type { Rect, ShapeLabelPlacement, ShapeLabelStyle } from '../../types';

/** Default inset for inside-corner placements as a fraction of min(w, h). */
const INSIDE_CORNER_INSET_RATIO = 0.15;

export class LabelDecoration extends ShapeDecorationBase<ShapeLabelStyle> {
  private contentView: LabelContentView | null = null;
  private contentLayer: Container | null = null;
  private bgGfx: Graphics | null = null;
  /** Whether `gfx` is currently parented to host surface (false when LOD-hidden). */
  private attached = true;
  /** Cached host surface for re-attach on LOD show. */
  private hostSurface: Container | null = null;
  /**
   * Cached rasterisation resolution applied to the inner text. Survives
   * `repaint()` so a renderer-level zoom-LOD push isn't lost when style
   * changes trigger a fresh `updateLabelContent`.
   */
  private resolution: number | null = null;

  /**
   * Pixi rasterises `Text` to a glyph texture once and re-uses it across
   * frames. The default resolution is the renderer's DPR, so when the
   * camera zooms in the texture is sampled up and labels get fuzzy.
   * Bumping `resolution` re-rasterises at higher fidelity. Idempotent
   * with the same value (Pixi short-circuits internally).
   */
  setResolution(resolution: number): void {
    this.resolution = resolution;
    if (this.contentView) applyLabelResolution(this.contentView, resolution);
  }

  /**
   * Last-applied rasterisation resolution, or `null` if `setResolution`
   * has never been called. The renderer's viewport sweep uses this to
   * skip labels already at the target so a converged scene costs nothing
   * past one bounds check per label per frame.
   */
  getResolution(): number | null {
    return this.resolution;
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;
    this.hostSurface = host.surface;

    // Build inner layout: optional background pill + text content.
    if (!this.contentLayer) {
      this.contentLayer = new Container();
      this.contentLayer.label = 'label:content';
      this.gfx.addChild(this.contentLayer);
    }
    if (this.style.background && !this.bgGfx) {
      this.bgGfx = new Graphics();
      this.bgGfx.label = 'label:bg';
      // Background sits behind text inside the content layer.
      this.contentLayer.addChildAt(this.bgGfx, 0);
    } else if (!this.style.background && this.bgGfx) {
      this.bgGfx.destroy();
      this.bgGfx = null;
    }

    if (!this.contentView) {
      this.contentView = mountLabelContent(this.style.content, this.style.wrap);
      this.contentLayer.addChild(this.contentView.display);
    } else {
      const next = updateLabelContent(this.contentView, this.style.content, this.style.wrap);
      if (next !== this.contentView) {
        this.contentLayer.addChild(next.display);
        this.contentView = next;
      }
    }
    // Re-apply the renderer-pushed rasterisation resolution. `mountLabelContent`
    // / kind-switch in `updateLabelContent` creates a fresh Pixi `Text` whose
    // resolution defaults back to renderer DPR; without this re-apply the
    // label would silently revert to base sharpness on the next style change.
    if (this.resolution !== null) applyLabelResolution(this.contentView, this.resolution);

    // For `inside-*` placements, the label carries a containment contract —
    // it must fit inside the host shape's inner box. Run the shrink → truncate
    // → hide cascade against the placement-specific inner-box budget before
    // measuring. Outside placements and `'center'` skip this and size freely.
    const placement = this.style.placement ?? 'bottom';
    // A shape with internal structure may redirect this placement at one of
    // its sub-regions (a tab, a header band) instead of its outer AABB. That
    // box governs both the fit budget below and the anchor math further down,
    // so the label is measured against the region it will actually occupy.
    const anchorOverride = host.shape.labelAnchorBox?.(placement);
    const placementBox = anchorOverride ?? host.bounds;
    let hidden = false;
    if (isInsidePlacement(placement)) {
      const box = innerBoxFor(placement, placementBox);
      const minFontSize = this.style.minFontSize ?? 9;
      const result = fitInsideBox(this.contentView, this.style.content, this.style.wrap, box, minFontSize);
      hidden = result.hidden;
    }

    // Measure text after style update; Pixi computes width/height on access.
    const textW = this.contentView.display.width;
    const textH = this.contentView.display.height;

    // Lay out content + background. Origin (0, 0) of contentLayer is the
    // label's geometric center; text is offset so its centroid sits there.
    let outerW = textW;
    let outerH = textH;
    if (this.style.background && this.bgGfx) {
      const result = drawLabelBackground(this.bgGfx, this.style.background, {
        width: textW,
        height: textH,
      });
      outerW = result.width;
      outerH = result.height;
      // Background was traced from (-padL, -padT); shift it so its centroid
      // lines up with the label's centroid.
      this.bgGfx.position.set(-textW / 2, -textH / 2);
    }
    // Center text inside the content layer (and background).
    this.contentView.display.position.set(-textW / 2, -textH / 2);

    // Compute the host-bounds-relative anchor for this placement. For the
    // `'center'` and `'inside-center'` placements, prefer the shape's
    // `visualCenter()` over the AABB midpoint when the shape provides it —
    // non-rectangular silhouettes (arc / polygon / star / ...) have AABB
    // centres that can sit outside their actual interior, which would
    // visibly mis-place a centred label.
    const offsetX = this.style.offset?.x ?? 0;
    const offsetY = this.style.offset?.y ?? 0;
    // An explicit `labelAnchorBox` for this placement is the more specific
    // statement — it names the region this label belongs in — so it wins over
    // the shape's general-purpose visual centre. Without this, a shape that
    // routes `inside-center` at a sub-region would still be overruled here and
    // the label would land on the silhouette's centre of mass instead.
    const visualCenter =
      anchorOverride === undefined &&
      (placement === 'center' || placement === 'inside-center') &&
      host.shape.visualCenter
        ? host.shape.visualCenter()
        : undefined;
    // For outside placements (top / bottom / left / right / corners), inflate
    // the anchor rect by the host's `outerDecorationExtent` so the label
    // sits past the outermost ring / halo on the host instead of overlapping
    // it. Inside placements and the centred placements operate against the
    // raw silhouette bounds — pushing them outward would walk the label off
    // the shape it's meant to sit inside.
    const anchorBounds =
      host.outerDecorationExtent > 0 && isOutsidePlacement(placement)
        ? inflateRect(placementBox, host.outerDecorationExtent)
        : placementBox;
    const { ax, ay, alignDx, alignDy } = anchorAndAlign(
      anchorBounds,
      placement,
      outerW,
      outerH,
      visualCenter,
    );

    this.gfx.position.set(ax + alignDx + offsetX, ay + alignDy + offsetY);
    this.gfx.rotation = this.style.rotation ?? 0;
    // Fit cascade may have produced a "hide" result for inside-* placements
    // that couldn't fit even after shrink + truncate; clamp alpha to 0 in
    // that case. Otherwise honour the style's configured alpha.
    this.gfx.alpha = hidden ? 0 : (this.style.alpha ?? 1);
    this.gfx.cursor = this.style.cursor ?? 'default';
    this.gfx.eventMode = this.style.interactive ? 'static' : 'none';
  }

  /**
   * Per-frame check for LOD — when the camera-zoom (effective world scale)
   * leaves the `visibility` range, detach `gfx` from the surface so Pixi
   * skips it entirely. Re-attach when zoom re-enters the range.
   *
   * Without `visibility` set this hook is a no-op and the renderer never
   * registers it as animated (we return `false`).
   */
  tick(_deltaMs: number): boolean {
    const v = this.style.visibility;
    if (!v || (v.minZoom === undefined && v.maxZoom === undefined)) return false;
    const z = effectiveScale(this.gfx);
    const shouldShow =
      (v.minZoom === undefined || z >= v.minZoom) &&
      (v.maxZoom === undefined || z <= v.maxZoom);
    if (shouldShow && !this.attached && this.hostSurface) {
      this.hostSurface.addChild(this.gfx);
      this.attached = true;
    } else if (!shouldShow && this.attached) {
      this.gfx.parent?.removeChild(this.gfx);
      this.attached = false;
    }
    return true;
  }
}

// ─── Placement math ────────────────────────────────────────────────────────

/**
 * Resolve the anchor point on / inside the host bounds for `placement`, and
 * the alignment delta that shifts the label's centroid relative to that
 * anchor so the label "hugs" the host correctly.
 *
 * Convention: the label's gfx origin is at the label's centroid. For outside
 * placements (`bottom`, `top-right`, ...) we shift the centroid past the
 * anchor by half the label's outer extent so the label sits next to the
 * shape, not on top of it. For inside placements (`center`,
 * `inside-top-left`, ...) we don't shift (the centroid stays on the anchor).
 */
function anchorAndAlign(
  bounds: Rect,
  placement: ShapeLabelPlacement,
  outerW: number,
  outerH: number,
  visualCenter: { x: number; y: number } | undefined,
): { ax: number; ay: number; alignDx: number; alignDy: number } {
  const cx = visualCenter ? visualCenter.x : bounds.x + bounds.width / 2;
  const cy = visualCenter ? visualCenter.y : bounds.y + bounds.height / 2;
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const inside = Math.min(bounds.width, bounds.height) * INSIDE_CORNER_INSET_RATIO;

  switch (placement) {
    case 'center':
      return { ax: cx, ay: cy, alignDx: 0, alignDy: 0 };

    case 'top':
      return { ax: cx, ay: top, alignDx: 0, alignDy: -outerH / 2 };
    case 'bottom':
      return { ax: cx, ay: bottom, alignDx: 0, alignDy: outerH / 2 };
    case 'left':
      return { ax: left, ay: cy, alignDx: -outerW / 2, alignDy: 0 };
    case 'right':
      return { ax: right, ay: cy, alignDx: outerW / 2, alignDy: 0 };

    case 'top-left':
      return { ax: left, ay: top, alignDx: -outerW / 2, alignDy: -outerH / 2 };
    case 'top-right':
      return { ax: right, ay: top, alignDx: outerW / 2, alignDy: -outerH / 2 };
    case 'bottom-left':
      return { ax: left, ay: bottom, alignDx: -outerW / 2, alignDy: outerH / 2 };
    case 'bottom-right':
      return { ax: right, ay: bottom, alignDx: outerW / 2, alignDy: outerH / 2 };

    case 'inside-top-left':
      return { ax: left + inside, ay: top + inside, alignDx: outerW / 2, alignDy: outerH / 2 };
    case 'inside-top-right':
      return { ax: right - inside, ay: top + inside, alignDx: -outerW / 2, alignDy: outerH / 2 };
    case 'inside-bottom-left':
      return { ax: left + inside, ay: bottom - inside, alignDx: outerW / 2, alignDy: -outerH / 2 };
    case 'inside-bottom-right':
      return { ax: right - inside, ay: bottom - inside, alignDx: -outerW / 2, alignDy: -outerH / 2 };

    case 'inside-top':
      return { ax: cx, ay: top + inside, alignDx: 0, alignDy: outerH / 2 };
    case 'inside-bottom':
      return { ax: cx, ay: bottom - inside, alignDx: 0, alignDy: -outerH / 2 };
    case 'inside-left':
      return { ax: left + inside, ay: cy, alignDx: outerW / 2, alignDy: 0 };
    case 'inside-right':
      return { ax: right - inside, ay: cy, alignDx: -outerW / 2, alignDy: 0 };
    case 'inside-center':
      return { ax: cx, ay: cy, alignDx: 0, alignDy: 0 };
  }
}

/**
 * Whether `placement` carries the "label must stay inside the shape"
 * containment contract — true for any `inside-*` value, false for the 8
 * outside sides/corners and bare `'center'`. The fit cascade (shrink →
 * truncate → hide) only runs for inside placements.
 */
export function isInsidePlacement(placement: ShapeLabelPlacement): boolean {
  return placement.startsWith('inside-');
}

/**
 * Whether `placement` anchors the label *outside* the host silhouette —
 * one of the 8 cardinal / diagonal slots (`top`, `top-right`, `right`,
 * `bottom-right`, `bottom`, `bottom-left`, `left`, `top-left`).
 *
 * `'center'` is intentionally excluded: the label sits *on* the host's
 * geometric centre, so the host's outer decorations don't push it.
 */
function isOutsidePlacement(placement: ShapeLabelPlacement): boolean {
  return (
    placement === 'top' ||
    placement === 'bottom' ||
    placement === 'left' ||
    placement === 'right' ||
    placement === 'top-left' ||
    placement === 'top-right' ||
    placement === 'bottom-left' ||
    placement === 'bottom-right'
  );
}

/** Expand `r` by `pad` on every side. */
function inflateRect(r: Rect, pad: number): Rect {
  return {
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}

/**
 * Inner-box budget the label is allowed to occupy for an `inside-*` placement,
 * expressed relative to the host shape's AABB. All inside placements share the
 * same uniform inset `INSIDE_CORNER_INSET_RATIO * min(w, h)` so the visual
 * rhythm matches the existing inside-corners. Width/height halves correspond
 * to which axis the placement subdivides:
 *
 * - `inside-center`        — full box minus 2× inset on both axes
 * - `inside-top`/`-bottom` — full width, half height
 * - `inside-left`/`-right` — half width, full height
 * - `inside-*-corner`      — half width, half height
 */
export function innerBoxFor(
  placement: ShapeLabelPlacement,
  bounds: Rect,
): { width: number; height: number } {
  const inset = Math.min(bounds.width, bounds.height) * INSIDE_CORNER_INSET_RATIO;
  const fullW = Math.max(0, bounds.width - 2 * inset);
  const fullH = Math.max(0, bounds.height - 2 * inset);
  const halfW = Math.max(0, bounds.width / 2 - inset);
  const halfH = Math.max(0, bounds.height / 2 - inset);
  switch (placement) {
    case 'inside-center':
      return { width: fullW, height: fullH };
    case 'inside-top':
    case 'inside-bottom':
      return { width: fullW, height: halfH };
    case 'inside-left':
    case 'inside-right':
      return { width: halfW, height: fullH };
    case 'inside-top-left':
    case 'inside-top-right':
    case 'inside-bottom-left':
    case 'inside-bottom-right':
      return { width: halfW, height: halfH };
    default:
      // Not an inside placement — caller should not invoke; return zero box
      // so any incidental use is harmless.
      return { width: 0, height: 0 };
  }
}

/**
 * Effective world-space scale of `gfx` — product of `scale.x` walking up
 * parent chain. The camera applies its zoom as a scale on the world layer,
 * so the product reflects current effective zoom for LOD decisions.
 */
function effectiveScale(gfx: Container): number {
  let s = 1;
  let p: Container | null = gfx;
  while (p) {
    s *= p.scale.x;
    p = p.parent;
  }
  return s;
}
