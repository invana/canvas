import { Graphics } from 'pixi.js';
import { ShapeDecorationBase } from '../../base/ShapeDecorationBase';
import { emitDashedStroke } from '../../paint/dashedStroke';
import type { Point, Rect } from '../../types';

/**
 * One of the eight standard transform-frame anchors: corner (`top-left`,
 * `top-right`, `bottom-left`, `bottom-right`) or edge-midpoint (`top`,
 * `right`, `bottom`, `left`).
 *
 * Re-using `ResizeHandlePlacement`'s vocabulary so any behaviour that
 * already does direction-aware drag math (corner → diagonal resize,
 * `top` / `bottom` → vertical, `left` / `right` → horizontal) keeps
 * working without translation.
 */
export type SelectionFramePlacement =
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Visual style of a `SelectionFrameDecoration` — the dashed AABB outline
 * plus a configurable subset of round drag handles. One decoration
 * replaces the 4–8 separate `ResizeHandleDecoration` mounts the resize
 * behaviour used to issue, so callers only manage one slot per host.
 *
 * The decoration is pure-visual: it paints itself and exposes per-handle
 * hit geometry via {@link SelectionFrameDecoration.getLocalHandleHits}.
 * Hit-test math lives in the behaviour, matching the `ToggleDecoration`
 * / `ResizeHandleDecoration` contract.
 */
/**
 * Border line style. `'solid'` paints a continuous outline; `'dashed'` and
 * `'dotted'` paint a regular gap pattern via Pixi's dashed stroke. Both
 * dash variants pick sensible default dash/gap lengths — supply
 * {@link SelectionFrameDecorationStyle.dashArray} to override them
 * verbatim.
 */
export type SelectionFrameBorderStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Visual kind of a drag handle. Circles read as "round nub"; squares are
 * the classic CAD/Figma look. Both kinds use the same hit geometry (a
 * disk of radius `handleRadius + HIT_PADDING_PX`) so the resize behaviour
 * doesn't need to branch on shape.
 */
export type SelectionFrameHandleShape = 'circle' | 'square';

export interface SelectionFrameDecorationStyle {
  /** Border line colour. Default `0x6b7fff` (theme blue). */
  readonly borderColor?: number;
  /** Border line width, px. Default `1.5`. */
  readonly borderWidth?: number;
  /**
   * `'solid'` | `'dashed'` | `'dotted'`. Default `'dotted'` — reads as a
   * helper / annotation rather than the host's actual outline. When
   * {@link dashArray} is supplied it wins over this preset.
   */
  readonly borderStyle?: SelectionFrameBorderStyle;
  /**
   * Custom dash pattern `[dashLength, gapLength]` in px. Overrides
   * {@link borderStyle} entirely when set — use when the presets don't
   * land where you want them.
   */
  readonly dashArray?: readonly [number, number];
  /** Border alpha. Default `0.6` — ghosts the frame so the host silhouette reads as the real thing. */
  readonly borderAlpha?: number;
  /**
   * Outward inset between the host AABB and the dashed frame. Lets the
   * frame visually "wrap" the host without touching the silhouette.
   * Default `4`.
   */
  readonly padding?: number;

  // ─── Handles ──────────────────────────────────────────────────────────
  /** `'circle'` (default) paints round nubs; `'square'` paints squares. */
  readonly handleShape?: SelectionFrameHandleShape;
  /**
   * Half-extent of the handle in px. For circle handles this is the
   * outer radius; for square handles it's half the side length, so the
   * visible size matches a circle of the same value. Default `5`.
   */
  readonly handleRadius?: number;
  /**
   * Corner radius for square handles only. Default `1.5` for a subtly
   * rounded look; pass `0` for hard corners. Ignored when
   * `handleShape: 'circle'`.
   */
  readonly handleCornerRadius?: number;
  /** Handle fill colour. Default `0xffffff`. */
  readonly handleFill?: number;
  /** Handle fill alpha. Default `1`. */
  readonly handleFillAlpha?: number;
  /** Handle outline colour. Default = `borderColor`. */
  readonly handleStrokeColor?: number;
  /** Handle outline width in px. Default `1.5`. Pass `0` for no outline. */
  readonly handleStrokeWidth?: number;
  /** Handle outline alpha. Default `1`. */
  readonly handleStrokeAlpha?: number;
  /**
   * Which handles to render. Default = all eight. Pass a smaller array to
   * suppress edge midpoints (`['top-left', 'top-right', 'bottom-left',
   * 'bottom-right']`) or limit to a single axis (`['right']` for the
   * radial circle case).
   */
  readonly handles?: ReadonlyArray<SelectionFramePlacement>;
  /** Visible only when truthy. Default `true`. */
  readonly visible?: boolean;
}

/** Default touch padding around each handle's visual radius. */
const HIT_PADDING_PX = 4;

const ALL_PLACEMENTS: ReadonlyArray<SelectionFramePlacement> = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
];

/**
 * Per-handle hit geometry returned by {@link SelectionFrameDecoration.getLocalHandleHits}.
 * `cx` / `cy` are in the host shape's local frame (add the host's spec
 * `x` / `y` to convert to world). `radius` is the touch radius (visual
 * radius + a small floor for coarse pointers).
 */
export interface SelectionFrameHandleHit {
  readonly placement: SelectionFramePlacement;
  readonly cx: number;
  readonly cy: number;
  readonly radius: number;
}

/**
 * Selection / transform frame — dashed AABB outline plus round drag
 * handles at the four corners and four edge midpoints. Pure visual; the
 * resize behaviour reads `getLocalHandleHits()` and runs its own
 * pointer hit math against the returned per-handle disks.
 *
 * Repaints in place on style change so a behaviour can flip the
 * `visible` field, change the dash colour, or hide / show specific
 * handles via `handles` without remounting.
 */
export class SelectionFrameDecoration extends ShapeDecorationBase<SelectionFrameDecorationStyle> {
  private readonly border = new Graphics();
  private readonly handlesGfx = new Graphics();
  private hits: ReadonlyArray<SelectionFrameHandleHit> = [];

  constructor(style: SelectionFrameDecorationStyle) {
    super(style);
    this.border.label = 'frame:border';
    this.handlesGfx.label = 'frame:handles';
    this.gfx.addChild(this.border);
    this.gfx.addChild(this.handlesGfx);
  }

  /**
   * Most-recently-computed per-handle hit geometry, in shape-local
   * coordinates. Behaviours iterate this array on pointerdown and test
   * each disk against the world-space click.
   */
  getLocalHandleHits(): ReadonlyArray<SelectionFrameHandleHit> {
    return this.hits;
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;

    const borderColor = this.style.borderColor ?? 0x6b7fff;
    const borderWidth = this.style.borderWidth ?? 1.5;
    // Defaults chosen so the frame reads as a *helper* rather than the
    // host's actual outline: dotted (more obviously transient than dashed)
    // and partially transparent so the underlying silhouette stays
    // visible through and around the frame.
    const borderStyle = this.style.borderStyle ?? 'dotted';
    const borderAlpha = this.style.borderAlpha ?? 0.6;
    const padding = this.style.padding ?? 4;
    const handleShape = this.style.handleShape ?? 'circle';
    const handleRadius = this.style.handleRadius ?? 5;
    const handleCornerRadius = this.style.handleCornerRadius ?? 1.5;
    const handleFill = this.style.handleFill ?? 0xffffff;
    const handleFillAlpha = this.style.handleFillAlpha ?? 1;
    const handleStrokeColor = this.style.handleStrokeColor ?? borderColor;
    const handleStrokeWidth = this.style.handleStrokeWidth ?? 1.5;
    const handleStrokeAlpha = this.style.handleStrokeAlpha ?? 1;
    const handles = this.style.handles ?? ALL_PLACEMENTS;
    const visible = this.style.visible ?? true;

    // Resolve dash pattern. Explicit `dashArray` wins; otherwise pick a
    // preset based on `borderStyle`. `'solid'` returns `null` so we skip
    // the dash field on the stroke entirely.
    const dashArray =
      this.style.dashArray ?? dashArrayFor(borderStyle, borderWidth);

    const inflated = inflateRect(host.bounds, padding);

    this.border.clear();
    if (dashArray && dashArray[0] > 0 && dashArray[1] > 0) {
      // PixiJS v8's `stroke()` has no native dash support — emit the dash
      // segments ourselves via the project-wide `emitDashedStroke` helper
      // (same path every other shape uses for dashed silhouettes), then
      // run a single `stroke()` to paint them uniformly.
      emitDashedStroke(this.border, rectOutlinePoints(inflated), {
        color: borderColor,
        alpha: borderAlpha,
        width: borderWidth,
        dashArray: dashArray as readonly [number, number],
        closed: true,
      });
      this.border.stroke({
        color: borderColor,
        width: borderWidth,
        alpha: borderAlpha,
      });
    } else {
      this.border.rect(inflated.x, inflated.y, inflated.width, inflated.height);
      this.border.stroke({
        color: borderColor,
        width: borderWidth,
        alpha: borderAlpha,
      });
    }

    this.handlesGfx.clear();
    const nextHits: SelectionFrameHandleHit[] = [];
    for (const p of handles) {
      const { cx, cy } = handleCentre(inflated, p);
      if (handleShape === 'square') {
        // `handleRadius` is treated as half-extent so a square reads the
        // same visual size as a circle of the same radius.
        const side = handleRadius * 2;
        if (handleCornerRadius > 0) {
          this.handlesGfx.roundRect(
            cx - handleRadius,
            cy - handleRadius,
            side,
            side,
            handleCornerRadius,
          );
        } else {
          this.handlesGfx.rect(cx - handleRadius, cy - handleRadius, side, side);
        }
      } else {
        this.handlesGfx.circle(cx, cy, handleRadius);
      }
      this.handlesGfx.fill({ color: handleFill, alpha: handleFillAlpha });
      if (handleStrokeWidth > 0) {
        this.handlesGfx.stroke({
          color: handleStrokeColor,
          width: handleStrokeWidth,
          alpha: handleStrokeAlpha,
        });
      }
      nextHits.push({
        placement: p,
        cx,
        cy,
        radius: handleRadius + HIT_PADDING_PX,
      });
    }

    this.hits = nextHits;
    this.gfx.visible = visible;
  }

  getOuterExtent(): number {
    // The frame sits at `padding + borderWidth/2` outside the silhouette,
    // and the handles bulge one more `handleRadius` past that on the
    // outside corners. Report the resting peak so `LabelDecoration` can
    // push labels past the frame.
    const padding = this.style.padding ?? 4;
    const borderWidth = this.style.borderWidth ?? 1.5;
    const handleRadius = this.style.handleRadius ?? 5;
    return padding + borderWidth / 2 + handleRadius;
  }
}

/**
 * Compute the centre of a handle on the inflated AABB. Corner handles
 * sit exactly on the corner; edge-midpoint handles sit on the midpoint
 * of the named side.
 */
function handleCentre(bounds: Rect, placement: SelectionFramePlacement): { cx: number; cy: number } {
  const left = bounds.x;
  const right = bounds.x + bounds.width;
  const top = bounds.y;
  const bottom = bounds.y + bounds.height;
  const midX = bounds.x + bounds.width / 2;
  const midY = bounds.y + bounds.height / 2;
  switch (placement) {
    case 'top':          return { cx: midX, cy: top };
    case 'bottom':       return { cx: midX, cy: bottom };
    case 'left':         return { cx: left, cy: midY };
    case 'right':        return { cx: right, cy: midY };
    case 'top-left':     return { cx: left, cy: top };
    case 'top-right':    return { cx: right, cy: top };
    case 'bottom-left':  return { cx: left, cy: bottom };
    case 'bottom-right': return { cx: right, cy: bottom };
  }
}

/**
 * Map a `borderStyle` preset to a concrete `[dashLength, gapLength]` (or
 * `null` for solid). Picked to read well at the default `borderWidth` of
 * `1.5` px:
 *
 * - `'solid'` → `null` — no dash field at all.
 * - `'dashed'` → `[5, 4]` — visible chunks with a comfortable gap.
 * - `'dotted'` → `[borderWidth, borderWidth * 2]` — short dashes that
 *   visually read as dots without depending on `lineCap: 'round'`.
 */
function dashArrayFor(
  style: SelectionFrameBorderStyle,
  borderWidth: number,
): readonly [number, number] | null {
  switch (style) {
    case 'solid':
      return null;
    case 'dotted': {
      const w = Math.max(1, borderWidth);
      return [w, w * 2] as const;
    }
    case 'dashed':
    default:
      return [5, 4] as const;
  }
}

/**
 * Sharp-corner rect outline — four clockwise points (`emitDashedStroke`
 * closes the loop via the `closed: true` option). The selection frame
 * never has rounded corners, so the curved-corner sampler used by
 * `RectShape` would be overkill.
 */
function rectOutlinePoints(r: Rect): ReadonlyArray<Point> {
  return [
    { x: r.x,           y: r.y },
    { x: r.x + r.width, y: r.y },
    { x: r.x + r.width, y: r.y + r.height },
    { x: r.x,           y: r.y + r.height },
  ];
}

function inflateRect(r: Rect, pad: number): Rect {
  return {
    x: r.x - pad,
    y: r.y - pad,
    width: r.width + pad * 2,
    height: r.height + pad * 2,
  };
}
