import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';
import type { Rect } from '../../types';

/**
 * Where on the host AABB a `ResizeHandleDecoration` sits. The eight cardinal
 * + corner positions cover every rectangular drag axis (horizontal / vertical
 * sides, diagonal corners). For radially-symmetric hosts (circle groups) use
 * any side — domain behaviours typically map all four sides to the same
 * radius-scaling drag.
 */
export type ResizeHandlePlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface ResizeHandleDecorationStyle {
  /** Which AABB position the handle sits on. Default `'bottom-right'`. */
  readonly placement?: ResizeHandlePlacement;
  /** Side length of the square handle, px. Default `8`. */
  readonly size?: number;
  /** Handle fill colour. Default `0xffffff`. */
  readonly bgFill?: number;
  readonly bgAlpha?: number;
  /** Handle outline colour. Default `0x6b7fff`. */
  readonly strokeColor?: number;
  /** Handle outline width. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Optional CSS-style cursor hint for the host renderer's hit pipeline. */
  readonly cursor?: string;
  /** Visible only when truthy. Domain behaviours flip this on hover/select. Default `true`. */
  readonly visible?: boolean;
  /**
   * Override the keyword-based `placement` resolution with raw shape-local
   * coordinates. When set, `placement` is ignored — the handle's centre is
   * placed at exactly `(x, y)` in the host shape's local frame. The
   * reported hit geometry's `placement` field still reflects the
   * configured `placement` (or `'bottom-right'` if omitted) so consumers
   * that switch on it for resize-direction math still work.
   */
  readonly position?: { readonly x: number; readonly y: number };
}

/**
 * Shape-local hit geometry for a `ResizeHandleDecoration`. Same coordinate
 * convention as the toggle's: add the host shape's spec `x` / `y` to convert
 * to world. The geometry is a square — a behaviour testing a pointer hit
 * compares against the AABB `[cx-half, cx+half] × [cy-half, cy+half]`.
 */
export interface ResizeHandleHitGeometry {
  readonly cx: number;
  readonly cy: number;
  /** Half side-length in shape-local px. */
  readonly half: number;
  readonly placement: ResizeHandlePlacement;
}

const HIT_PADDING_PX = 3;

/**
 * Small square handle drawn at a configurable anchor on the host shape's
 * AABB. Pure visual; emits no events. `GroupResizeBehaviour` (in
 * `@invana/graph`) reads `getLocalHitGeometry()` and resolves drags itself.
 *
 * Multiple handles per host are expected — register one decoration per
 * corner / side with distinct slot ids (`'resize-tl'`, `'resize-br'`, …)
 * and the renderer will mount each into its own slot.
 */
export class ResizeHandleDecoration extends ShapeDecorationBase<ResizeHandleDecorationStyle> {
  private readonly handle = new Graphics();
  private hit: ResizeHandleHitGeometry = { cx: 0, cy: 0, half: 0, placement: 'bottom-right' };

  constructor(style: ResizeHandleDecorationStyle) {
    super(style);
    this.handle.label = 'resize:handle';
    this.gfx.addChild(this.handle);
  }

  /** See {@link ToggleDecoration.getLocalHitGeometry}. */
  getLocalHitGeometry(): ResizeHandleHitGeometry {
    return this.hit;
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const placement = this.style.placement ?? 'bottom-right';
    const size = this.style.size ?? 8;
    const bgFill = this.style.bgFill ?? 0xffffff;
    const bgAlpha = this.style.bgAlpha ?? 1;
    const strokeColor = this.style.strokeColor ?? 0x6b7fff;
    const strokeWidth = this.style.strokeWidth ?? 1.5;
    const visible = this.style.visible ?? true;

    const { cx, cy } = this.style.position
      ? { cx: this.style.position.x, cy: this.style.position.y }
      : handleCentre(host.bounds, placement);
    const half = size / 2;

    this.handle.clear();
    this.handle.rect(-half, -half, size, size);
    this.handle.fill({ color: bgFill, alpha: bgAlpha });
    if (strokeWidth > 0) {
      this.handle.stroke({ color: strokeColor, width: strokeWidth });
    }
    this.handle.cursor = this.style.cursor ?? cursorFor(placement);

    this.gfx.position.set(cx, cy);
    this.gfx.visible = visible;
    this.hit = { cx, cy, half: half + HIT_PADDING_PX, placement };
  }

  getOuterExtent(): number {
    return 0;
  }
}

function handleCentre(bounds: Rect, placement: ResizeHandlePlacement): { cx: number; cy: number } {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;

  switch (placement) {
    case 'top':          return { cx: midX,  cy: top };
    case 'bottom':       return { cx: midX,  cy: bottom };
    case 'left':         return { cx: left,  cy: midY };
    case 'right':        return { cx: right, cy: midY };
    case 'top-left':     return { cx: left,  cy: top };
    case 'top-right':    return { cx: right, cy: top };
    case 'bottom-left':  return { cx: left,  cy: bottom };
    case 'bottom-right': return { cx: right, cy: bottom };
  }
}

/**
 * Default cursor hint per side. Domain layers can override via
 * `style.cursor` — useful when the handle should map to a non-resize gesture
 * (e.g. rotate from a corner). Returned as a CSS cursor string.
 */
function cursorFor(placement: ResizeHandlePlacement): string {
  switch (placement) {
    case 'top':
    case 'bottom':       return 'ns-resize';
    case 'left':
    case 'right':        return 'ew-resize';
    case 'top-left':
    case 'bottom-right': return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':  return 'nesw-resize';
  }
}
