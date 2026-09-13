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
 * Circular (dot) marker. Drawn tangent to the endpoint: the circle's forward
 * edge touches the anchor and its body extends `lengthScale × strokeWidth`
 * back along the negative tangent, so the diameter *is* the marker's
 * tangent-extent and the line meets the circle rather than running through it.
 *
 * Sizing is proportional to the host connector's stroke width, exactly as
 * {@link ArrowMarker} — `@invana/graph` converts a pixel `arrow*Size` into
 * these scales so every marker answers the same units.
 *
 * The classic use is the "zero or one" end of an ER relationship, and any
 * non-directional terminal where an arrowhead would wrongly imply flow.
 *
 * Two paint surfaces, mirroring {@link ArrowMarker}:
 *   - **instance**: via `addShape`, forward edge at `(spec.x, spec.y)` with the
 *     body extending along −X, sized as if `strokeWidth = 1`.
 *   - **static**: via `connectorSpec.targetMarker`, where the connector calls
 *     `DotMarker.paintInto` with the endpoint, tangent and stroke width.
 */

export interface DotMarkerSpec extends BaseShapeSpec {
  readonly kind: 'dot';
  /**
   * Multiplier on the connector's stroke width giving the circle's
   * **diameter** — which is also its tangent-extent. Default `3.2`.
   */
  readonly lengthScale?: number;
}

const DEFAULT_LENGTH_SCALE = 3.2;

/**
 * Convenience builder for connector marker specs (no `x` / `y`).
 * Usage: `connectorSpec.targetMarker = dotMarkerSpec({ fill: 0x000000 })`.
 */
export function dotMarkerSpec(
  spec: Omit<DotMarkerSpec, 'kind' | 'x' | 'y'> = {},
): Omit<DotMarkerSpec, 'x' | 'y'> {
  return { kind: 'dot', ...spec };
}

function resolveDiameter(spec: Omit<DotMarkerSpec, 'x' | 'y'>, strokeWidth: number): number {
  const raw = (spec.lengthScale ?? DEFAULT_LENGTH_SCALE) * strokeWidth;
  return raw < strokeWidth ? strokeWidth : raw;
}

export class DotMarker extends ShapeBase<DotMarkerSpec> {
  static readonly kind = 'dot';

  constructor(spec: DotMarkerSpec, host: ShapeHostInfo) {
    super(host);
    this.draw(spec);
  }

  protected drawGeometry(g: Graphics, spec: DotMarkerSpec, style?: ShapePaintStyle): void {
    DotMarker.paintInto(g, spec, { x: 0, y: 0 }, 0, style, 1);
  }

  bounds(): Rect {
    const d = resolveDiameter(this.spec, 1);
    return { x: -d, y: -d / 2, width: d, height: d };
  }

  /**
   * The circle's diameter — the connector trims its body by this much so the
   * line stops at the dot's trailing edge instead of crossing it.
   */
  static markerInset(
    spec: Omit<DotMarkerSpec, 'x' | 'y'>,
    strokeWidth: number = 1,
  ): number {
    return resolveDiameter(spec, strokeWidth);
  }

  static paintInto(
    g: Graphics,
    spec: Omit<DotMarkerSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
    strokeWidth: number = 1,
  ): void {
    const d = resolveDiameter(spec, strokeWidth);
    const r = d / 2;
    // Centre sits one radius back along the negative tangent, so the circle's
    // forward edge — not its centre — lands on the endpoint.
    const cx = anchor.x - Math.cos(angleRad) * r;
    const cy = anchor.y - Math.sin(angleRad) * r;

    g.circle(cx, cy, r);

    finishMarkerPaint(g, spec.fill, style);
  }
}
