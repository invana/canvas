import type { IPathStyle, PathCommand } from '../../types';

type LoopCurveSide =
  | 'top'    | 'right'  | 'bottom' | 'left'
  | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

interface LoopCurveOpts {
  /**
   * Which way the petal blooms from the host. Named sides resolve to
   * world-space angles in screen coordinates (y points down):
   *
   *   top         = -π/2     top-right    = -π/4
   *   right       =  0       bottom-right =  π/4
   *   bottom      =  π/2     bottom-left  =  3π/4
   *   left        =  π       top-left     = -3π/4
   *
   * Wins over `angle` when both are provided.
   */
  readonly side?: LoopCurveSide;
  /**
   * Direction the petal blooms from the host, in radians. `0` points
   * right, `π/2` points down (screen coords — y grows downward),
   * `-π/2` points up. Default `-π/2` — petal blooms above the host.
   * Ignored when `side` is set.
   */
  readonly angle?: number;
  /**
   * How far the balloon tip sits past the chord between the two feet,
   * measured along `angle` from the chord midpoint. The geometric apex
   * of the curve lands at roughly `0.75 * radius` past the chord
   * (cubic-bezier control-arm pull falls short of the geometric
   * maximum). Default `40`.
   */
  readonly radius?: number;
  /**
   * Belly half-spread of the balloon — distance from the tip along the
   * chord direction to each control point. When `bulge > clen/2` (half
   * the chord length) the control points lie past the feet in chord
   * direction, splaying the curve outward → balloon. When
   * `bulge = clen/2` the controls sit directly above the feet → U
   * (parallel-sided hairpin). When `bulge < clen/2` controls converge
   * toward the tip → teardrop. Default `radius` (round balloon).
   */
  readonly bulge?: number;
  /**
   * Used only in **single-pivot mode**, i.e. when the polyline's first
   * and last points coincide (source and target endpoints resolved to
   * the same world point — typical when both use the `center` anchor).
   * Distance from the pivot to the foot midpoint, measured along
   * `angle`. Ignored when the polyline has two distinct endpoints
   * (two-foot mode), since the feet are then taken directly from the
   * polyline. Default `28`.
   */
  readonly baseOffset?: number;
  /**
   * Used only in **single-pivot mode**. Tangential separation between
   * the two feet, perpendicular to `angle`. Ignored in two-foot mode.
   * Default `12`.
   */
  readonly width?: number;
  /**
   * Used only in **single-pivot mode**. World-space shift of the foot
   * midpoint, applied before `baseOffset` is added along `angle`. Lets
   * callers land the petal on a specific edge/corner when working
   * from a single `center` anchor. Ignored in two-foot mode (anchors
   * already position the feet). Default `{ dx: 0, dy: 0 }`.
   */
  readonly pivotOffset?: { readonly dx: number; readonly dy: number };
}

const DEFAULT_ANGLE = -Math.PI / 2; // petal points up
const DEFAULT_BASE_OFFSET = 28;
const DEFAULT_RADIUS = 40;
const DEFAULT_WIDTH = 12;
// Below this chord length we treat the two polyline endpoints as
// coincident and fall back to single-pivot mode. 0.5 world units is
// well below visible — anything smaller is sub-pixel jitter.
const COINCIDENT_EPS = 0.5;

/**
 * Named loop-curve shape presets. Each preset carries the four
 * profile-shaping opts (`baseOffset`, `radius`, `width`, `bulge`); the
 * caller fills in placement (`side` / `angle`, `pivotOffset`) per
 * instance. Spread into `pathStyleOpts`:
 *
 *   pathStyleOpts: { ...LOOP_CURVE_PRESETS.balloon, side: 'top' }
 *
 * Definitions:
 *   - `balloon`  — fat puffed belly. `bulge >> width/2` → controls
 *     splay wide; `bulge > radius` → belly bulges past the tip.
 *   - `teardrop` — slender pointed petal. `radius >> bulge`, narrow
 *     `width` → long axis with controls converging toward the tip.
 *   - `ring`     — near-circular loop. `radius ≈ bulge`, modest neck.
 *   - `hairpin`  — parallel-sided U (legacy). `bulge ≈ width/2` →
 *     controls sit directly above the feet, no flare.
 */
export const LOOP_CURVE_PRESETS = {
  balloon:  { baseOffset: 2, radius: 22, width:  6, bulge: 26 },
  teardrop: { baseOffset: 2, radius: 34, width:  4, bulge:  8 },
  ring:     { baseOffset: 2, radius: 20, width: 10, bulge: 20 },
  hairpin:  { baseOffset: 2, radius: 28, width:  8, bulge:  4 },
} as const satisfies Record<string, Required<Pick<LoopCurveOpts, 'baseOffset' | 'radius' | 'width' | 'bulge'>>>;

export type LoopCurvePresetName = keyof typeof LOOP_CURVE_PRESETS;

function sideToAngle(side: LoopCurveSide): number {
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
 * Self-loop pathStyle — single cubic Bézier "balloon / petal / teardrop"
 * drawn between two foot points. Mirrors AntV G6's `loop-curve` placement
 * model: cardinal placements (`top`, `right`, `bottom`, `left`) put both
 * feet on the same edge of the host; diagonal placements (`top-right`,
 * `bottom-right`, `bottom-left`, `top-left`) put the two feet on the two
 * adjacent edges that meet at the named corner.
 *
 * The path style runs in one of two modes depending on the polyline it
 * receives:
 *
 *  - **Two-foot mode** (preferred): when `polyline[0]` and `polyline[N-1]`
 *    are distinct (chord length > {@link COINCIDENT_EPS}), they are used
 *    as the two feet. The caller positions them via anchors — typically
 *    an `edge-port` anchor on the source endpoint and another on the
 *    target endpoint. The path style only shapes the curve between them.
 *
 *  - **Single-pivot mode** (legacy): when the two endpoints coincide
 *    (typical when both source and target use the `center` anchor on the
 *    same shape), the feet are synthesised from `pivotOffset`,
 *    `baseOffset` and `width`. `baseOffset` shifts the foot midpoint
 *    along `angle`; `width` separates the feet perpendicular to it.
 *    Useful when no edge-port anchor is configured.
 *
 * Geometry (both modes): given two feet `start` and `end`, the tip sits
 * at `chordMid + bloom * radius`, and the two cubic control points are
 * placed at `tip ± chordDir * bulge`. `bulge > chordLen/2` → balloon
 * (controls splayed outward past the feet); `bulge = chordLen/2` →
 * parallel-sided U; `bulge < chordLen/2` → teardrop (controls converge).
 *
 * Pair with `router: 'straight'`. The polyline content between
 * `polyline[0]` and `polyline[N-1]` is ignored.
 *
 * Edge cases:
 *  - Polyline shorter than one point: returns `[]`.
 *  - `width = 0` in single-pivot mode: feet coincide → closed teardrop
 *    cusp; the arrow marker lands on the start point.
 */
export const loopCurvePathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 1) return [];
  const o = opts as LoopCurveOpts | undefined;
  const angle = o?.side !== undefined ? sideToAngle(o.side) : (o?.angle ?? DEFAULT_ANGLE);
  const radius = o?.radius ?? DEFAULT_RADIUS;
  const bulge = o?.bulge ?? radius;

  const ux = Math.cos(angle);
  const uy = Math.sin(angle);

  // Resolve the two feet. Two-foot mode honours the polyline's start /
  // end directly (positioned by anchors); single-pivot mode synthesises
  // them from baseOffset + width.
  const start = polyline[0]!;
  const end = polyline[polyline.length - 1] ?? start;
  const chordDx = end.x - start.x;
  const chordDy = end.y - start.y;
  const chordLen = Math.hypot(chordDx, chordDy);

  let sx: number;
  let sy: number;
  let ex: number;
  let ey: number;

  if (chordLen > COINCIDENT_EPS) {
    sx = start.x; sy = start.y;
    ex = end.x;   ey = end.y;
  } else {
    // Single-pivot mode — derive feet from baseOffset/width/pivotOffset.
    const baseOffset = o?.baseOffset ?? DEFAULT_BASE_OFFSET;
    const width = o?.width ?? DEFAULT_WIDTH;
    const pivotDx = o?.pivotOffset?.dx ?? 0;
    const pivotDy = o?.pivotOffset?.dy ?? 0;
    // Foot midpoint = pivot + pivotOffset + baseOffset along angle.
    const mx = start.x + pivotDx + ux * baseOffset;
    const my = start.y + pivotDy + uy * baseOffset;
    // Feet split perpendicular to angle by ±width/2.
    const px = -uy;
    const py = ux;
    const halfW = width / 2;
    sx = mx - px * halfW; sy = my - py * halfW;
    ex = mx + px * halfW; ey = my + py * halfW;
  }

  // Place controls. Tip sits `radius` along bloom direction from chord
  // midpoint. Controls flank the tip ±`bulge` along the chord direction
  // (start→end). When `bulge` exceeds the chord half-length, controls
  // splay past the feet → balloon.
  const midx = (sx + ex) / 2;
  const midy = (sy + ey) / 2;
  const tipx = midx + ux * radius;
  const tipy = midy + uy * radius;

  // Chord direction; falls back to perpendicular-to-bloom when chord is
  // degenerate (single-pivot mode with width = 0 — both feet identical).
  let cdx: number;
  let cdy: number;
  const realChordLen = Math.hypot(ex - sx, ey - sy);
  if (realChordLen > COINCIDENT_EPS) {
    cdx = (ex - sx) / realChordLen;
    cdy = (ey - sy) / realChordLen;
  } else {
    cdx = -uy;
    cdy = ux;
  }

  const c1x = tipx - cdx * bulge;
  const c1y = tipy - cdy * bulge;
  const c2x = tipx + cdx * bulge;
  const c2y = tipy + cdy * bulge;

  const out: PathCommand[] = [
    { kind: 'M', x: sx, y: sy },
    { kind: 'C', c1x, c1y, c2x, c2y, x: ex, y: ey },
  ];
  return out;
};
