import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { finishMarkerPaint } from '../paint/applyFillStroke';
import type {
  BaseShapeSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../../types';

/**
 * Diamond (rhombus) marker. Drawn with its forward vertex at the anchor,
 * extending `lengthScale × strokeWidth` back along the negative tangent, and
 * widest at its midpoint with a perpendicular span of
 * `widthScale × strokeWidth`.
 *
 * Sizing is proportional to the host connector's stroke width, exactly as
 * {@link ArrowMarker} — `@invana/graph` converts a pixel `arrow*Size` into
 * these scales so both markers answer the same units.
 *
 * The classic use is UML-flavoured composition / aggregation, and the "exactly
 * one" end of an ER relationship where a solid terminal is wanted instead of a
 * directional arrowhead.
 *
 * Two paint surfaces, mirroring {@link ArrowMarker}:
 *   - **instance**: via `addShape`, forward vertex at `(spec.x, spec.y)`
 *     pointing along +X, sized as if `strokeWidth = 1`.
 *   - **static**: via `connectorSpec.targetMarker`, where the connector calls
 *     `DiamondMarker.paintInto` with the endpoint, tangent and stroke width.
 */

export interface DiamondMarkerSpec extends BaseShapeSpec {
  readonly kind: 'diamond';
  /**
   * Multiplier on the connector's stroke width giving the tip-to-tail
   * distance. Default `4`.
   */
  readonly lengthScale?: number;
  /**
   * Multiplier on the connector's stroke width giving the perpendicular span
   * at the midpoint. Clamped to `≥ strokeWidth`. Default `2.6`.
   */
  readonly widthScale?: number;
}

const DEFAULT_LENGTH_SCALE = 4;
const DEFAULT_WIDTH_SCALE = 2.6;

/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = diamondMarkerSpec({ fill: 0x000000 })`.
 */
export function diamondMarkerSpec(
  spec: Omit<DiamondMarkerSpec, 'kind' | 'x' | 'y'> = {},
): Omit<DiamondMarkerSpec, 'x' | 'y'> {
  return { kind: 'diamond', ...spec };
}

function resolveLength(spec: Omit<DiamondMarkerSpec, 'x' | 'y'>, strokeWidth: number): number {
  return (spec.lengthScale ?? DEFAULT_LENGTH_SCALE) * strokeWidth;
}

function resolveWidth(spec: Omit<DiamondMarkerSpec, 'x' | 'y'>, strokeWidth: number): number {
  const raw = (spec.widthScale ?? DEFAULT_WIDTH_SCALE) * strokeWidth;
  return raw < strokeWidth ? strokeWidth : raw;
}

export class DiamondMarker extends ShapeBase<DiamondMarkerSpec> {
  static readonly kind = 'diamond';

  constructor(spec: DiamondMarkerSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: DiamondMarkerSpec, style?: ShapePaintStyle): void {
    DiamondMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style, 1);
  }

  bounds(): Rect {
    const len = resolveLength(this.spec, 1);
    const wid = resolveWidth(this.spec, 1);
    return { x: -len, y: -wid / 2, width: len, height: wid };
  }

  /**
   * Distance from the forward vertex back to the tail along the negative
   * tangent. The connector trims its body by this much so the line meets the
   * diamond's tail rather than running under it.
   */
  static markerInset(
    spec: Omit<DiamondMarkerSpec, 'x' | 'y'>,
    strokeWidth: number = 1,
  ): number {
    return resolveLength(spec, strokeWidth);
  }

  static paintInto(
    g: Graphics,
    spec: Omit<DiamondMarkerSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
    strokeWidth: number = 1,
  ): void {
    const len = resolveLength(spec, strokeWidth);
    const wid = resolveWidth(spec, strokeWidth);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Midpoint (the widest cross-section) and tail, stepping back along the
    // negative tangent from the anchor.
    const midX = anchor.x - cos * (len / 2);
    const midY = anchor.y - sin * (len / 2);
    const tailX = anchor.x - cos * len;
    const tailY = anchor.y - sin * len;
    // Perpendicular unit vector (90° CCW from the tangent).
    const perpX = -sin;
    const perpY = cos;
    const halfW = wid / 2;

    g.poly([
      anchor.x, anchor.y,                          // forward vertex
      midX + perpX * halfW, midY + perpY * halfW,  // side 1
      tailX, tailY,                                // tail vertex
      midX - perpX * halfW, midY - perpY * halfW,  // side 2
    ]);

    finishMarkerPaint(g, spec.fill, style);
  }
}
