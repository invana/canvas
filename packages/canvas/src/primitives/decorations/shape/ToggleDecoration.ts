import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';
import type { Rect } from '../../types';

/**
 * Placement of a `ToggleDecoration` relative to the host shape's AABB.
 *
 * - Cardinal sides (`top` / `right` / `bottom` / `left`) sit centred on the
 *   midpoint of that side.
 * - Corners (`top-left` / ... / `bottom-right`) sit on the corner itself.
 * - `inside-*` variants mirror the cardinal sides but pull inward by
 *   `radius + 4 px` so the toggle nests inside the silhouette (useful for
 *   circle groups where an outside toggle would float well past the rim).
 *
 * The toggle's gfx is positioned by its centre, so it half-overlaps the
 * silhouette edge in the outside variants — a touch-friendly hit target
 * that visually reads as "attached to the host".
 */
export type TogglePlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'inside-top'
  | 'inside-right'
  | 'inside-bottom'
  | 'inside-left';

/**
 * Visual style of a `ToggleDecoration` — the small `+` / `−` button used to
 * collapse / expand compound groups, and by extension any "open this" /
 * "close this" affordance a domain layer wants to put on a shape.
 *
 * The decoration is pure-visual: it paints itself, exposes a shape-local
 * hit-geometry (`getLocalHitGeometry`), and emits no events. Domain
 * behaviours (e.g. `CollapseExpandBehaviour` in `@invana/graph`) read the
 * geometry and do the click-distance math against the host's
 * `shape:pointerdown` payload — keeps the decoration domain-free and
 * sidesteps Pixi event-bubbling through the shape gfx.
 */
export interface ToggleDecorationStyle {
  /**
   * Which glyph the button shows. Domain layers flip this through
   * `setDecoration` whenever the underlying collapsed-state changes.
   * Default `'plus'`.
   */
  readonly state?: 'plus' | 'minus';
  /** Where on the host AABB the toggle sits. Default `'bottom'`. */
  readonly placement?: TogglePlacement;
  /** Button outer radius, px. Default `10`. */
  readonly radius?: number;
  /** Button fill colour. Default `0xffffff` (white). */
  readonly bgFill?: number;
  /** Button fill alpha. Default `1`. */
  readonly bgAlpha?: number;
  /** Button outline colour. Default `0x6b7fff` (theme blue). */
  readonly strokeColor?: number;
  /** Button outline width, px. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Glyph stroke colour. Default = `strokeColor`. */
  readonly glyphColor?: number;
  /** Glyph stroke width, px. Default `1.5`. */
  readonly glyphWidth?: number;
  /**
   * Extra offset applied after placement resolution, in shape-local px.
   * Use to nudge the toggle off a default placement without writing a
   * custom placement (e.g. push a `bottom-right` toggle further out
   * past a thick stroke).
   */
  readonly offsetX?: number;
  readonly offsetY?: number;
  /**
   * Override the keyword-based `placement` resolution with raw shape-local
   * coordinates. When set, `placement`, `offsetX`, and `offsetY` are all
   * ignored — the toggle's centre is placed at exactly `(x, y)` in the
   * host shape's local frame (centre-relative for centred shapes like
   * `CircleShape`, top-left-relative for `RectShape`).
   *
   * Use when none of the 12 named placements lands where you want it
   * (e.g. floating the toggle along a diagonal, or matching a specific
   * UI mock that doesn't snap to AABB anchors).
   */
  readonly position?: { readonly x: number; readonly y: number };
}

/**
 * Shape-local hit geometry exposed by a `ToggleDecoration` instance. The
 * `cx` / `cy` coordinates are in the host shape's local frame (i.e. add
 * the host's spec `x` / `y` to convert to world). `radius` is the touch
 * radius — typically a touch larger than the visual radius so the button
 * stays easy to hit on coarse pointers.
 *
 * Domain behaviours read this and check `Math.hypot(worldX − host.x − cx,
 * worldY − host.y − cy) ≤ radius` in their `shape:pointerdown` handler.
 */
export interface ToggleHitGeometry {
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

/**
 * Default touch padding added to the visual radius when reporting the hit
 * geometry. Keeps a 10 px visual button hittable at ~14 px — comfortable on
 * a desktop pointer and just acceptable on touch (which the layout-style
 * apps that use this generally aren't optimised for anyway).
 */
const HIT_PADDING_PX = 4;

/**
 * Small circular `+` / `−` button drawn at a configurable anchor on the
 * host shape. Pure visual; emits no events.
 *
 * Geometry: one filled + stroked circle, plus one or two glyph strokes
 * (`+` draws a horizontal and vertical stroke; `−` draws only the
 * horizontal). Repainted on every `update()` so a `setDecoration` that
 * flips `state` from `'plus'` to `'minus'` redraws in place without
 * remounting.
 */
export class ToggleDecoration extends ShapeDecorationBase<ToggleDecorationStyle> {
  private readonly button = new Graphics();
  private readonly glyph = new Graphics();
  /**
   * Cached hit geometry, refreshed on every `repaint()`. Stale read between
   * a host bounds change and the next `update()` is acceptable — the
   * renderer always calls `update` after bounds change, and the resulting
   * "missed by a pixel" hit just means the user clicked an extra time.
   */
  private hit: ToggleHitGeometry = { cx: 0, cy: 0, radius: 0 };

  constructor(style: ToggleDecorationStyle) {
    super(style);
    this.gfx.addChild(this.button);
    this.gfx.addChild(this.glyph);
  }

  /**
   * Most-recently-computed shape-local hit geometry. Returns `{0, 0, 0}`
   * before the first `mount` / `update` — callers should still defend
   * against a zero radius as a "not laid out yet" signal.
   */
  getLocalHitGeometry(): ToggleHitGeometry {
    return this.hit;
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const radius = this.style.radius ?? 10;
    const placement = this.style.placement ?? 'bottom';
    // Offsets are ignored when `position` overrides the placement — the
    // caller has supplied exact coordinates and shouldn't be surprised by
    // an extra shift.
    const offsetX = this.style.position ? 0 : (this.style.offsetX ?? 0);
    const offsetY = this.style.position ? 0 : (this.style.offsetY ?? 0);
    const bgFill = this.style.bgFill ?? 0xffffff;
    const bgAlpha = this.style.bgAlpha ?? 1;
    const strokeColor = this.style.strokeColor ?? 0x6b7fff;
    const strokeWidth = this.style.strokeWidth ?? 1.5;
    const glyphColor = this.style.glyphColor ?? strokeColor;
    const glyphWidth = this.style.glyphWidth ?? 1.5;
    const state = this.style.state ?? 'plus';

    // `position` overrides the keyword-based placement entirely — pure
    // raw shape-local coordinates. Falls back to the AABB anchor resolver
    // when not set.
    const { cx, cy } = this.style.position
      ? { cx: this.style.position.x, cy: this.style.position.y }
      : anchorOnBounds(host.bounds, placement, radius);

    this.button.clear();
    this.button.circle(0, 0, radius);
    this.button.fill({ color: bgFill, alpha: bgAlpha });
    if (strokeWidth > 0) {
      this.button.stroke({ color: strokeColor, width: strokeWidth });
    }

    this.glyph.clear();
    const armLength = radius * 0.55;
    this.glyph
      .moveTo(-armLength, 0)
      .lineTo(armLength, 0)
      .stroke({ color: glyphColor, width: glyphWidth, cap: 'round' });
    if (state === 'plus') {
      this.glyph
        .moveTo(0, -armLength)
        .lineTo(0, armLength)
        .stroke({ color: glyphColor, width: glyphWidth, cap: 'round' });
    }

    this.gfx.position.set(cx + offsetX, cy + offsetY);
    this.hit = { cx: cx + offsetX, cy: cy + offsetY, radius: radius + HIT_PADDING_PX };
  }

  /**
   * Outer-extent contribution — outside-placed toggles bulge slightly
   * past the silhouette, but the bulge is small (one radius) and only on
   * one side. Reporting it would push `LabelDecoration` outward on all
   * four sides, which looks worse than letting an outside-bottom label
   * overlap the toggle. Returning `0` keeps the label flow stable; the
   * developer can offset the label manually if both fight for the same
   * slot.
   */
  getOuterExtent(): number {
    return 0;
  }
}

/**
 * Resolve the shape-local centre of the toggle from the host's AABB and
 * the configured placement. The `radius` budget pulls inward for
 * `inside-*` placements so the entire button nests inside the silhouette.
 *
 * Conventions:
 * - Outside cardinal placements (`top` / `bottom` / `left` / `right`)
 *   sit centred on the midpoint of that AABB side.
 * - Corner placements sit on the corner itself (half the button outside,
 *   half inside).
 * - Inside cardinals pull the centre inward by `radius + 4 px` so a 10 px
 *   button hugs the rim without poking out.
 */
function anchorOnBounds(
  bounds: Rect,
  placement: TogglePlacement,
  radius: number,
): { cx: number; cy: number } {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;
  const insidePad = radius + 4;

  switch (placement) {
    case 'top':         return { cx: midX,  cy: top };
    case 'bottom':      return { cx: midX,  cy: bottom };
    case 'left':        return { cx: left,  cy: midY };
    case 'right':       return { cx: right, cy: midY };
    case 'top-left':    return { cx: left,  cy: top };
    case 'top-right':   return { cx: right, cy: top };
    case 'bottom-left': return { cx: left,  cy: bottom };
    case 'bottom-right':return { cx: right, cy: bottom };
    case 'inside-top':    return { cx: midX,  cy: top + insidePad };
    case 'inside-bottom': return { cx: midX,  cy: bottom - insidePad };
    case 'inside-left':   return { cx: left + insidePad, cy: midY };
    case 'inside-right':  return { cx: right - insidePad, cy: midY };
  }
}
