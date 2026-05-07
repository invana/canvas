/**
 * `CurveConnector` — built-in connector registered as kind `'curve'`.
 *
 * Smooths the router-supplied polyline by drawing quadratic curves through
 * each interior vertex (the vertex is the control point; the segment ends
 * are at the midpoints of the adjacent edges). This is a Catmull-Rom-style
 * smoothing that's cheap and produces visually pleasing edges for any
 * polyline — including dense bezier-router samples (where the smoothing is
 * essentially a no-op visually) and sparse orthogonal-router elbows
 * (where it rounds the corners).
 *
 * Endpoints (first / last polyline points) are honoured exactly so markers
 * still anchor cleanly. Markers are painted into the same internal
 * `Graphics` as the path so decorations cover the entire silhouette as one
 * piece. When `dash` is set, the curve is sampled to a dense polyline before
 * dash segmentation (Pixi v8 has no native dash on `quadraticCurveTo`).
 */

import { Container, Graphics } from 'pixi.js';
import type {
  BaseConnectorSpec,
  ConnectorHostInfo,
  ConnectorPaintStyle,
  IConnector,
  Point,
  ShapeCtor,
} from '../types';
import { drawDashedPolyline } from '../decorations/polyline';
import { paintMarkers } from './LineConnector';

export interface CurveConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'curve';
  readonly stroke: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  /**
   * Dashed-curve style. When set, the curve is sampled to a dense polyline
   * (12 samples per quadratic segment) and dashes are emitted on the
   * straight chords. Visually faithful at typical zoom; for animated dashes
   * use `MarchingAntsConnectorDecoration`.
   */
  readonly dash?: { readonly dashLength: number; readonly gapLength: number };
}

const QUAD_SAMPLES = 12;

export class CurveConnector implements IConnector<CurveConnectorSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private readonly shapeRegistry: ReadonlyMap<string, ShapeCtor>;

  constructor(_spec: CurveConnectorSpec, host: ConnectorHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'connector:curve';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
    this.shapeRegistry = host.shapeRegistry;
  }

  draw(spec: CurveConnectorSpec, points: ReadonlyArray<Point>): void {
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
      },
      dash: spec.dash,
    });
  }

  paintInto(
    g: Graphics,
    spec: CurveConnectorSpec,
    points: ReadonlyArray<Point>,
    style: ConnectorPaintStyle,
  ): void {
    if (points.length < 2) return;
    const stroke = style.stroke;
    if (!stroke || stroke.width <= 0) return;

    const dash = style.dash;
    if (dash && dash.dashLength > 0 && dash.gapLength > 0) {
      const sampled = sampleCurvePolyline(points);
      drawDashedPolyline(g, sampled, dash.dashLength, dash.gapLength, dash.dashOffset ?? 0);
    } else {
      emitCurvePath(g, points);
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

/** Emit the same curve geometry as the previous straight `draw()` did. */
function emitCurvePath(g: Graphics, points: ReadonlyArray<Point>): void {
  if (points.length === 2) {
    g.moveTo(points[0]!.x, points[0]!.y);
    g.lineTo(points[1]!.x, points[1]!.y);
    return;
  }
  g.moveTo(points[0]!.x, points[0]!.y);
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const next = points[i + 1]!;
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    g.quadraticCurveTo(p.x, p.y, mx, my);
  }
  const last = points[points.length - 1]!;
  g.lineTo(last.x, last.y);
}

/**
 * Sample the smoothed curve into a dense polyline so the dash segmenter
 * (which operates on straight segments) can walk arc-length. Mirrors the
 * `quadraticCurveTo` topology in `emitCurvePath`: midpoint→vertex→midpoint
 * quadratics in the interior, straight first and last halves.
 */
function sampleCurvePolyline(points: ReadonlyArray<Point>): Point[] {
  if (points.length === 2) return [points[0]!, points[1]!];
  const out: Point[] = [];
  out.push(points[0]!);
  // First half-segment is straight (start → first midpoint) — emitted as the
  // implicit start of the first quadratic; we represent it as the start point
  // and let the loop's first quadratic carry from start to next midpoint.
  let prevX = points[0]!.x;
  let prevY = points[0]!.y;
  let startX = points[0]!.x;
  let startY = points[0]!.y;
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]!;
    const next = points[i + 1]!;
    const mx = (p.x + next.x) / 2;
    const my = (p.y + next.y) / 2;
    sampleQuad(out, startX, startY, p.x, p.y, mx, my, QUAD_SAMPLES);
    prevX = mx;
    prevY = my;
    startX = mx;
    startY = my;
  }
  const last = points[points.length - 1]!;
  if (prevX !== last.x || prevY !== last.y) out.push(last);
  return out;
}

function sampleQuad(
  out: Point[],
  x0: number,
  y0: number,
  cpx: number,
  cpy: number,
  x1: number,
  y1: number,
  steps: number,
): void {
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    out.push({
      x: mt * mt * x0 + 2 * mt * t * cpx + t * t * x1,
      y: mt * mt * y0 + 2 * mt * t * cpy + t * t * y1,
    });
  }
}
