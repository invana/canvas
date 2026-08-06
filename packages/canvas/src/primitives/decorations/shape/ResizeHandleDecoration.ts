import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';
import type { Rect } from '../../types';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { ResizeHandleDecorationStyle, ResizeHandlePlacement } from '../../../specs/decorationStyle';
export type { ResizeHandleDecorationStyle, ResizeHandlePlacement } from '../../../specs/decorationStyle';




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
