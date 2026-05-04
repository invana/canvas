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
 * still anchor cleanly.
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseConnectorSpec, IConnector, Point, ConnectorHostInfo } from '../types';

export interface CurveConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'curve';
  readonly stroke: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
  readonly cap?: 'butt' | 'round' | 'square';
}

export class CurveConnector implements IConnector<CurveConnectorSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(_spec: CurveConnectorSpec, host: ConnectorHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'connector:curve';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: CurveConnectorSpec, points: ReadonlyArray<Point>): void {
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    g.clear();
    if (points.length < 2 || (spec.strokeWidth ?? 1) <= 0) return;

    if (points.length === 2) {
      g.moveTo(points[0]!.x, points[0]!.y);
      g.lineTo(points[1]!.x, points[1]!.y);
    } else {
      g.moveTo(points[0]!.x, points[0]!.y);
      // Smooth through interior points; segment ends are edge midpoints.
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

    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
      cap: spec.cap,
    });
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }
}
