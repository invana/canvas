import type { Graphics } from 'pixi.js';
import { ShapeBase } from '../base/ShapeBase';
import type {
  BaseShapeSpec,
  Point,
  Rect,
  ShapeHostInfo,
  ShapePaintStyle,
} from '../types';

/**
 * Arrowhead marker. Drawn as a triangle whose tip lies at the anchor; the
 * base extends `length` pixels back along the negative tangent direction
 * with a perpendicular spread of `width`.
 *
 * Two paint surfaces:
 *   - **instance**: used as a regular shape via `addShape` — the arrow tip
 *     anchors at `(spec.x, spec.y)` and points along +X (angle = 0). Useful
 *     for stand-alone arrowheads or directional badges.
 *   - **static**: used as a connector marker via `connectorSpec.sourceMarker
 *     = arrowMarkerSpec(...)` — the connector calls `ArrowMarker.paintInto`
 *     with the polyline endpoint + tangent angle.
 */

export interface ArrowMarkerSpec extends BaseShapeSpec {
  readonly kind: 'arrow';
  /** Tip-to-base distance, px. Default `10`. */
  readonly length?: number;
  /** Perpendicular wing spread (full width across the base), px. Default `8`. */
  readonly width?: number;
}

/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = arrowMarkerSpec({ fill: 0x000000 })`.
 */
export function arrowMarkerSpec(
  spec: Omit<ArrowMarkerSpec, 'kind' | 'x' | 'y'> = {},
): Omit<ArrowMarkerSpec, 'x' | 'y'> {
  return { kind: 'arrow', ...spec };
}

export class ArrowMarker extends ShapeBase<ArrowMarkerSpec> {
  static readonly kind = 'arrow';

  constructor(spec: ArrowMarkerSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: ArrowMarkerSpec, style?: ShapePaintStyle): void {
    ArrowMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style);
  }

  bounds(): Rect {
    const len = this.spec.length ?? 10;
    const wid = this.spec.width ?? 8;
    return { x: -len, y: -wid / 2, width: len, height: wid };
  }

  /**
   * Distance from the arrow tip back to the base along the negative tangent.
   * The connector trims its body by this amount so the line stops at the
   * marker's base — the marker triangle then visually starts where the line
   * ends and its tip reaches the original anchor (target endpoint).
   */
  static markerInset(spec: Omit<ArrowMarkerSpec, 'x' | 'y'>): number {
    return spec.length ?? 10;
  }

  static paintInto(
    g: Graphics,
    spec: Omit<ArrowMarkerSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const len = spec.length ?? 10;
    const wid = spec.width ?? 8;
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

    if (style?.fill !== false && style?.color !== undefined) {
      g.fill({ color: style.color, alpha: style.alpha ?? 1 });
      return;
    }
    if (typeof spec.fill === 'number') {
      g.fill({ color: spec.fill });
      return;
    }
    if (typeof spec.fill === 'object' && spec.fill?.kind === 'solid') {
      g.fill({ color: spec.fill.color, alpha: spec.fill.alpha ?? 1 });
      return;
    }
    // Default: black-filled arrow.
    g.fill({ color: 0x000000 });
  }
}
