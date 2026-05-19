import type { IPathStyle } from '../../types';

type LoopPolylineCardinalSide = 'top' | 'right' | 'bottom' | 'left';
type LoopPolylineCornerSide =
  | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
type LoopPolylineSide = LoopPolylineCardinalSide | LoopPolylineCornerSide;

interface LoopPolylineOpts {
  /**
   * Where the loop sits relative to the pivot. Two families:
   *
   * **Cardinals** (`top` / `right` / `bottom` / `left`) — the loop is a
   * three-segment U-bracket sticking straight out from one side of the
   * host. Both feet sit on a chord perpendicular to `side` at distance
   * `baseOffset`.
   *
   * **Corners** (`top-right` / `bottom-right` / `bottom-left` /
   * `top-left`) — the loop is a three-segment orthogonal wrap around the
   * named corner of the host. One foot lands on a line parallel to the
   * horizontal edge, the other on a line parallel to the vertical edge;
   * the middle segment runs past the outer corner of the wrap. Use
   * `baseOffsetX` / `baseOffsetY` (or the symmetric fallback
   * `baseOffset`) to position the wrap corner relative to the host
   * silhouette.
   *
   * For arbitrary directions pass a number — radians, screen
   * coordinates (y points down). Numeric `side` always renders the
   * cardinal U-bracket geometry, even when the angle is diagonal.
   * Default `'top'`.
   */
  readonly side?: LoopPolylineSide | number;
  /**
   * Symmetric clearance from the pivot to the host silhouette. For
   * cardinals: distance along `side` from pivot to the foot midpoint.
   * For corners: distance along *both* axes from pivot to the named
   * corner of the silhouette — use `baseOffsetX` / `baseOffsetY` for
   * non-square hosts. Default `28`.
   */
  readonly baseOffset?: number;
  /**
   * Horizontal-axis distance from pivot to silhouette. Only consulted
   * for corner sides; defaults to `baseOffset` when omitted.
   */
  readonly baseOffsetX?: number;
  /**
   * Vertical-axis distance from pivot to silhouette. Only consulted
   * for corner sides; defaults to `baseOffset` when omitted.
   */
  readonly baseOffsetY?: number;
  /**
   * How far each stub extends past the silhouette. For cardinals: both
   * stubs run `stubLength` further along `side` from the feet. For
   * corners: each stub runs `stubLength` further outward (away from the
   * named corner) along its perpendicular axis. Default `30`.
   */
  readonly stubLength?: number;
  /**
   * Foot separation along the silhouette. For cardinals: tangential
   * distance perpendicular to `side` — both feet sit on a chord, one
   * at `-gap/2`, the other at `+gap/2`. For corners: along-edge
   * distance from the named corner of the silhouette to each foot —
   * one foot sits `gap` from the corner along the horizontal edge, the
   * other `gap` along the vertical edge. Default `30`.
   */
  readonly gap?: number;
}

const DEFAULT_SIDE: LoopPolylineSide = 'top';
const DEFAULT_BASE_OFFSET = 28;
const DEFAULT_STUB_LENGTH = 30;
const DEFAULT_GAP = 30;

const CORNER_SIDES = new Set<LoopPolylineSide>([
  'top-right', 'bottom-right', 'bottom-left', 'top-left',
]);

function sideToAngle(side: LoopPolylineSide | number): number {
  if (typeof side === 'number') return side;
  switch (side) {
    case 'top':          return -Math.PI / 2;
    case 'top-right':    return -Math.PI / 4;
    case 'right':        return 0;
    case 'bottom-right': return  Math.PI / 4;
    case 'bottom':       return  Math.PI / 2;
    case 'bottom-left':  return  3 * Math.PI / 4;
    case 'left':         return  Math.PI;
    case 'top-left':     return -3 * Math.PI / 4;
  }
}

/**
 * Signed unit vector components for each corner. Sign convention:
 *   sx = +1 for *-right, -1 for *-left
 *   sy = -1 for top-*,   +1 for bottom-*
 */
function cornerSigns(side: LoopPolylineCornerSide): { sx: number; sy: number } {
  switch (side) {
    case 'top-right':    return { sx:  1, sy: -1 };
    case 'bottom-right': return { sx:  1, sy:  1 };
    case 'bottom-left':  return { sx: -1, sy:  1 };
    case 'top-left':     return { sx: -1, sy: -1 };
  }
}

/**
 * Self-loop pathStyle — orthogonal polyline anchored at the first
 * polyline point. Designed for edges where source and target reference
 * the same shape; the router output is `[p, p]` and this style ignores
 * everything after `polyline[0]`.
 *
 * Two geometries dispatch on `side`:
 *
 * **Cardinal U-bracket** (`top` / `right` / `bottom` / `left` or any
 * numeric angle) — three segments. Feet sit on a chord perpendicular
 * to `side` at distance `baseOffset` from the pivot, separated by
 * `gap`. From each foot the path runs `stubLength` further along
 * `side` to the two outer corners, joined by one cross segment.
 *
 * **Corner wrap** (`top-right` / `bottom-right` / `bottom-left` /
 * `top-left`) — four segments. Both feet sit on the host silhouette:
 * one on the horizontal edge `gap` from the named corner, the other
 * on the vertical edge `gap` from the same corner. From each foot the
 * path runs `stubLength` perpendicular to its edge (outward), the two
 * outward stubs are joined by a cross segment past the corner, and the
 * arrow lands flush with the perpendicular edge. The wrap's inner
 * corner sits at `(±baseOffsetX, ±baseOffsetY)` from the pivot.
 *
 * Pair with `router: 'straight'`; the polyline content beyond the first
 * point is ignored.
 *
 * Edge cases:
 *  - Polyline shorter than one point: returns `[]`.
 *  - Cardinal `gap = 0`: both stubs collapse onto the same line — the
 *    loop reads as a single out-and-back spike.
 *  - Corner `gap = 0`: both feet land at the corner itself; the wrap
 *    degenerates to a closed rectangle whose inner corner touches the
 *    silhouette.
 */
export const loopPolylinePathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 1) return [];
  const o = opts as LoopPolylineOpts | undefined;
  const side = o?.side ?? DEFAULT_SIDE;
  const baseOffset = o?.baseOffset ?? DEFAULT_BASE_OFFSET;
  const stubLength = o?.stubLength ?? DEFAULT_STUB_LENGTH;
  const gap = o?.gap ?? DEFAULT_GAP;
  const p = polyline[0]!;

  // Corner wrap — named corner sides only. Numeric angles always fall
  // through to the cardinal U-bracket geometry, even when the angle is
  // diagonal — callers asking for a literal corner wrap must use the
  // named corner sides.
  if (typeof side === 'string' && CORNER_SIDES.has(side)) {
    const { sx, sy } = cornerSigns(side as LoopPolylineCornerSide);
    const offX = o?.baseOffsetX ?? baseOffset;
    const offY = o?.baseOffsetY ?? baseOffset;
    // Silhouette corner in world coords (the named corner of the host).
    const cornerX = p.x + sx * offX;
    const cornerY = p.y + sy * offY;
    // Foot A — on the horizontal edge, `gap` along it from the corner.
    const ax = cornerX - sx * gap;
    const ay = cornerY;
    // Foot B — on the vertical edge, `gap` along it from the corner.
    const bx = cornerX;
    const by = cornerY - sy * gap;
    // Outer corner of the wrap bracket — `stubLength` past the silhouette
    // in both axes.
    const ox = cornerX + sx * stubLength;
    const oy = cornerY + sy * stubLength;
    // Path: out from horizontal edge, across past the corner, down past
    // the vertical-edge level, in to the vertical edge. Both endpoints
    // sit on the host silhouette so the arrow marker lands flush.
    return [
      { kind: 'M', x: ax, y: ay },
      { kind: 'L', x: ax, y: oy },
      { kind: 'L', x: ox, y: oy },
      { kind: 'L', x: ox, y: by },
      { kind: 'L', x: bx, y: by },
    ];
  }

  // Cardinal U-bracket — applies to the four cardinal sides and any
  // numeric angle.
  const angle = sideToAngle(side);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  // Perpendicular to `angle`, rotated 90° anti-clockwise.
  const px = -uy;
  const py = ux;
  // Foot midpoint sits `baseOffset` along the loop direction from pivot.
  const mx = p.x + ux * baseOffset;
  const my = p.y + uy * baseOffset;
  const halfG = gap / 2;
  const sx = mx - px * halfG;
  const sy = my - py * halfG;
  const ex = mx + px * halfG;
  const ey = my + py * halfG;
  const c1x = sx + ux * stubLength;
  const c1y = sy + uy * stubLength;
  const c2x = ex + ux * stubLength;
  const c2y = ey + uy * stubLength;
  return [
    { kind: 'M', x: sx,  y: sy  },
    { kind: 'L', x: c1x, y: c1y },
    { kind: 'L', x: c2x, y: c2y },
    { kind: 'L', x: ex,  y: ey  },
  ];
};
