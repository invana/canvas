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

    // Compute the host-bounds-relative anchor for this placement.
    const placement = this.style.placement ?? 'bottom';
    const offsetX = this.style.offset?.x ?? 0;
    const offsetY = this.style.offset?.y ?? 0;
    const { ax, ay, alignDx, alignDy } = anchorAndAlign(host.bounds, placement, outerW, outerH);

    this.gfx.position.set(ax + alignDx + offsetX, ay + alignDy + offsetY);
    this.gfx.rotation = this.style.rotation ?? 0;
    this.gfx.alpha = this.style.alpha ?? 1;
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
): { ax: number; ay: number; alignDx: number; alignDy: number } {
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
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
