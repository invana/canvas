import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import { applyMarkerFill } from '../paint/applyFillStroke';
import type {
  BaseShapeSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Arrowhead marker. Drawn as a triangle whose tip lies at the anchor; the
 * base extends `lengthScale × strokeWidth` pixels back along the negative
 * tangent direction with a perpendicular spread of `widthScale × strokeWidth`
 * (clamped so the base is never narrower than the line).
 *
 * Sizing is **always proportional to the host connector's stroke width** —
 * a 1px line gets a 4×3 arrow (with the default scales), a 7px line gets a
 * 28×21 arrow. The base width is additionally clamped to ≥ strokeWidth so a
 * thick line never feeds into a narrower arrow base.
 *
 * Two paint surfaces:
 *   - **instance**: used as a regular shape via `addShape` — the arrow tip
 *     anchors at `(spec.x, spec.y)` and points along +X (angle = 0). Useful
 *     for stand-alone arrowheads or directional badges. With no host
 *     connector, sizing assumes `strokeWidth = 1`.
 *   - **static**: used as a connector marker via `connectorSpec.sourceMarker
 *     = arrowMarkerSpec(...)` — the connector calls `ArrowMarker.paintInto`
 *     with the polyline endpoint, tangent angle, and resolved strokeWidth.
 */

export interface ArrowMarkerSpec extends BaseShapeSpec {
  readonly kind: 'arrow';
  /**
   * Multiplier on the connector's stroke width that yields the tip-to-base
   * distance. Default `4` (so a 2px stroke produces an 8px-long arrow).
   */
  readonly lengthScale?: number;
  /**
   * Multiplier on the connector's stroke width that yields the perpendicular
   * base width. Final width is clamped to `≥ strokeWidth` so the arrow base
   * is never narrower than the line. Default `3`.
   */
  readonly widthScale?: number;
}

const DEFAULT_LENGTH_SCALE = 4;
const DEFAULT_WIDTH_SCALE = 3;

/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.
 */
export function arrowMarkerSpec(
  spec: Omit<ArrowMarkerSpec, 'kind' | 'x' | 'y'> = {},
): Omit<ArrowMarkerSpec, 'x' | 'y'> {
  return { kind: 'arrow', ...spec };
}

function resolveLength(spec: Omit<ArrowMarkerSpec, 'x' | 'y'>, strokeWidth: number): number {
  return (spec.lengthScale ?? DEFAULT_LENGTH_SCALE) * strokeWidth;
}

function resolveWidth(spec: Omit<ArrowMarkerSpec, 'x' | 'y'>, strokeWidth: number): number {
  const raw = (spec.widthScale ?? DEFAULT_WIDTH_SCALE) * strokeWidth;
  return raw < strokeWidth ? strokeWidth : raw;
}

export class ArrowMarker extends ShapeBase<ArrowMarkerSpec> {
  static readonly kind = 'arrow';

  constructor(spec: ArrowMarkerSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: ArrowMarkerSpec, style?: ShapePaintStyle): void {
    // Instance shapes have no host connector — assume stroke width 1 so the
    // default scales (4, 3) yield a 4×3 arrow, matching the visual the spec
    // multipliers promise relative to a unit line.
    ArrowMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style, 1);
  }

  bounds(): Rect {
    // Mirrors `drawGeometry` — instance bounds use strokeWidth = 1.
    const len = resolveLength(this.spec, 1);
    const wid = resolveWidth(this.spec, 1);
    return { x: -len, y: -wid / 2, width: len, height: wid };
  }

  /**
   * Distance from the arrow tip back to the base along the negative tangent.
   * The connector trims its body by this amount so the line stops at the
   * marker's base — the marker triangle then visually starts where the line
   * ends and its tip reaches the original anchor (target endpoint).
   */
  static markerInset(
    spec: Omit<ArrowMarkerSpec, 'x' | 'y'>,
    strokeWidth: number = 1,
  ): number {
    return resolveLength(spec, strokeWidth);
  }

  static paintInto(
    g: Graphics,
    spec: Omit<ArrowMarkerSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
    strokeWidth: number = 1,
  ): void {
    const len = resolveLength(spec, strokeWidth);
    const wid = resolveWidth(spec, strokeWidth);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);

    // Base center: anchor stepped backward (opposite tangent) by `len`.
    const baseX = anchor.x - cos * len;
    const baseY = anchor.y - sin * len;
    // Perpendicular unit vector (90° CCW from tangent).
    const perpX = -sin;
    const perpY = cos;
    const halfW = wid / 2;

    g.poly([
      anchor.x, anchor.y,                            // tip
      baseX + perpX * halfW, baseY + perpY * halfW,   // wing 1
      baseX - perpX * halfW, baseY - perpY * halfW,   // wing 2
    ]);

    if (style?.fill === false) {
      // Halo / outline mode: stroke the marker silhouette at the requested
      // width. Geometry size still comes from `strokeWidth × *Scale` (above),
      // so the halo widens without scaling the marker.
      if (style.color !== undefined && (style.strokeWidth ?? 0) > 0) {
        g.stroke({
          width: style.strokeWidth!,
          color: style.color,
          alpha: style.alpha ?? 1,
        });
      }
      return;
    }
    if (style?.color !== undefined) {
      g.fill({ color: style.color, alpha: style.alpha ?? 1 });
      return;
    }
    if (spec.fill !== undefined) {
      applyMarkerFill(g, spec.fill, style);
      return;
    }
    // Default: black-filled arrow.
    g.fill({ color: 0x000000 });
  }
}
