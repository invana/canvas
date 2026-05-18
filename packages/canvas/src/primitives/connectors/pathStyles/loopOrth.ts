import type { IPathStyle, PathCommand } from '../../types';

type LoopOrthSide =
  | 'top'    | 'right'  | 'bottom' | 'left'
  | 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';

interface LoopOrthOpts {
  /**
   * Which way the rectangular loop sticks out from the pivot. Named sides
   * resolve to world-space angles in screen coordinates (y points down):
   *
   *   top         = -π/2     top-right    = -π/4
   *   right       =  0       bottom-right =  π/4
   *   bottom      =  π/2     bottom-left  =  3π/4
   *   left        =  π       top-left     = -3π/4
   *
   * For arbitrary directions pass a number — radians, same convention.
   * Default `'top'`.
   */
  readonly side?: LoopOrthSide | number;
  /**
   * Distance from the pivot to the loop's two **feet** (where the U-bracket
   * starts and ends), measured along `side`. Pick this larger than the
   * host node's half-extent in the loop direction so the feet — and the
   * arrow marker that lands on the trailing foot — sit outside the
   * silhouette. Default `28`.
   */
  readonly baseOffset?: number;
  /**
   * How much further the loop extends past the feet, in world units. The
   * two outer corners of the U sit `stubLength` along `side` from the
   * feet, so total visible extent from the pivot is `baseOffset +
   * stubLength`. Default `30`.
   */
  readonly stubLength?: number;
  /**
   * Tangential separation between the two stubs — the loop's width
   * perpendicular to `side`. Both feet sit on the line perpendicular to
   * `side` at distance `baseOffset` from the pivot; one at `-gap/2`, the
   * other at `+gap/2`. Default `30`.
   */
  readonly gap?: number;
}

const DEFAULT_SIDE: LoopOrthSide = 'top';
const DEFAULT_BASE_OFFSET = 28;
const DEFAULT_STUB_LENGTH = 30;
const DEFAULT_GAP = 30;

function sideToAngle(side: LoopOrthSide | number): number {
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
 * Self-loop pathStyle — rectangular "stub-out, across, stub-back" bracket
 * anchored at the first polyline point. Designed for edges where source
 * and target reference the same shape; the router output is `[p, p]` and
 * this style ignores everything after `polyline[0]`.
 *
 * Geometry: the loop's two feet sit on a chord perpendicular to `side` at
 * distance `baseOffset` from the pivot, separated by `gap`. From each foot
 * the path runs `stubLength` further along `side` to the two outer
 * corners, which are joined by one cross segment. With `baseOffset` chosen
 * to clear the host silhouette, the entire path — including the trailing
 * foot where the arrow marker lands — sits outside the shape.
 *
 * `side` accepts the eight compass cardinals (`top`, `top-right`, …,
 * `top-left`) or an arbitrary radian angle.
 *
 * Pair with `router: 'straight'`; the polyline content beyond the first
 * point is ignored.
 *
 * Edge cases:
 *  - Polyline shorter than one point: returns `[]`.
 *  - `gap = 0`: both stubs collapse onto the same line — the loop reads
 *    as a single out-and-back spike. Pixi handles it without erroring.
 */
export const loopOrthPathStyle: IPathStyle = (polyline, opts) => {
  if (polyline.length < 1) return [];
  const o = opts as LoopOrthOpts | undefined;
  const angle = sideToAngle(o?.side ?? DEFAULT_SIDE);
  const baseOffset = o?.baseOffset ?? DEFAULT_BASE_OFFSET;
  const stubLength = o?.stubLength ?? DEFAULT_STUB_LENGTH;
  const gap = o?.gap ?? DEFAULT_GAP;

  const p = polyline[0]!;
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

  const out: PathCommand[] = [
    { kind: 'M', x: sx,  y: sy  },
    { kind: 'L', x: c1x, y: c1y },
    { kind: 'L', x: c2x, y: c2y },
    { kind: 'L', x: ex,  y: ey  },
  ];
  return out;
};
