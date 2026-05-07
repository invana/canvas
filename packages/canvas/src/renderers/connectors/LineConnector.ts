/**
 * `LineConnector` — built-in connector registered as kind `'line'`.
 *
 * Renders the router-supplied polyline with straight segments. Pair with the
 * `'orthogonal'` router for boxy diagrams; pair with `'straight'` (default)
 * for direct edges; pair with `'bezier'` for smooth curves (the router
 * supplies a dense polyline so the rasterisation stays smooth).
 *
 * Path + source/target markers are painted into a single internal `Graphics`
 * so the connector's gfx is structurally one drawing — decorations (halo,
 * glow, marching-ants) cover the entire silhouette as one piece. Markers
 * resolve through the renderer's shape registry: `spec.sourceMarker` /
 * `spec.targetMarker` carry any registered shape spec, and the connector
 * invokes the shape's static `paintInto` to render its geometry.
 */

import { Container, Graphics } from 'pixi.js';
import type {
  BaseConnectorSpec,
  ConnectorHostInfo,
  ConnectorPaintStyle,
  IConnector,
  MarkerShapeSpec,
  Point,
  ShapeCtor,
} from '../types';
import { drawDashedPolyline } from '../decorations/polyline';
import { sourceAnchorAngle, targetAnchorAngle } from './markerPlacement';

export interface LineConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'line';
  readonly stroke: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
  /** Pixi line cap. Default `'butt'`. */
  readonly cap?: 'butt' | 'round' | 'square';
  /** Pixi line join. Default `'miter'`. */
  readonly join?: 'miter' | 'round' | 'bevel';
  /**
   * Dashed-line style. When set, the path stroke is rendered as a regular
   * dash/gap pattern. Markers are painted solid regardless. For animated
   * dashes use a `MarchingAntsConnectorDecoration` instead.
   */
  readonly dash?: { readonly dashLength: number; readonly gapLength: number };
}

export class LineConnector implements IConnector<LineConnectorSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly shapeRegistry: ReadonlyMap<string, ShapeCtor>;

  constructor(_spec: LineConnectorSpec, host: ConnectorHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'connector:line';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
    this.shapeRegistry = host.shapeRegistry;
  }

  draw(spec: LineConnectorSpec, points: ReadonlyArray<Point>): void {
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    g.clear();
    if (points.length < 2 || (spec.strokeWidth ?? 1) <= 0) return;

    this.paintInto(g, spec, points, {
      stroke: {
        color: spec.stroke,
        width: spec.strokeWidth ?? 1,
        alpha: spec.strokeAlpha ?? 1,
        cap: spec.cap,
        join: spec.join,
      },
      dash: spec.dash,
    });
  }

  paintInto(
    g: Graphics,
    spec: LineConnectorSpec,
    points: ReadonlyArray<Point>,
    style: ConnectorPaintStyle,
  ): void {
    if (points.length < 2) return;
    const stroke = style.stroke;
    if (!stroke || stroke.width <= 0) return;

    const dash = style.dash;
    if (dash && dash.dashLength > 0 && dash.gapLength > 0) {
      drawDashedPolyline(g, points, dash.dashLength, dash.gapLength, dash.dashOffset ?? 0);
    } else {
      g.moveTo(points[0]!.x, points[0]!.y);
      for (let i = 1; i < points.length; i++) {
        g.lineTo(points[i]!.x, points[i]!.y);
      }
    }
    g.stroke({
      color: stroke.color,
      width: stroke.width,
      alpha: stroke.alpha ?? 1,
      cap: stroke.cap,
      join: stroke.join,
    });

    paintMarkers(g, spec, points, style, this.shapeRegistry);
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }
}

/**
 * Resolve and paint both source/target markers via their shape ctor's static
 * `paintInto`. Shared by `LineConnector` and `CurveConnector`. Throws a
 * clear error if a marker references an unregistered kind, or a registered
 * shape ctor without `paintInto` (image/text shapes today).
 */
export function paintMarkers(
  g: Graphics,
  spec: BaseConnectorSpec,
  points: ReadonlyArray<Point>,
  style: ConnectorPaintStyle,
  shapeRegistry: ReadonlyMap<string, ShapeCtor>,
): void {
  if (spec.sourceMarker) {
    const placement = sourceAnchorAngle(points);
    if (placement) paintOneMarker(g, spec.sourceMarker, placement.anchor, placement.angleRad, style, shapeRegistry);
  }
  if (spec.targetMarker) {
    const placement = targetAnchorAngle(points);
    if (placement) paintOneMarker(g, spec.targetMarker, placement.anchor, placement.angleRad, style, shapeRegistry);
  }
}

function paintOneMarker(
  g: Graphics,
  markerSpec: MarkerShapeSpec,
  anchor: Point,
  angleRad: number,
  style: ConnectorPaintStyle,
  shapeRegistry: ReadonlyMap<string, ShapeCtor>,
): void {
  const Ctor = shapeRegistry.get(markerSpec.kind);
  if (!Ctor) {
    throw new Error(
      `Connector marker references unregistered shape kind "${markerSpec.kind}"`,
    );
  }
  if (typeof Ctor.paintInto !== 'function') {
    throw new Error(
      `Connector marker shape "${markerSpec.kind}" has no static paintInto — cannot be used as a marker`,
    );
  }
  const overrideStyle = style.tintMarkers && style.stroke
    ? { color: style.stroke.color, alpha: style.stroke.alpha }
    : undefined;
  Ctor.paintInto(g, markerSpec, anchor, angleRad, overrideStyle);
}
