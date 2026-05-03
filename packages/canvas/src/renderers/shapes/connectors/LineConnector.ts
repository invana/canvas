/**
 * `LineConnector` — built-in connector registered as kind `'line'`.
 *
 * Renders the router-supplied polyline with straight segments and miter joins.
 * Pair with the `'orthogonal'` router for boxy diagrams; pair with `'straight'`
 * (default) for direct edges; pair with `'bezier'` for smooth curves (the
 * router supplies a dense polyline so the rasterisation stays smooth).
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseConnectorSpec, IConnector, Point, ConnectorHostInfo } from '../types';

export interface LineConnectorSpec extends BaseConnectorSpec {
  readonly kind: 'line';
  readonly stroke: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
  /** Pixi line cap. Default `'butt'`. */
  readonly cap?: 'butt' | 'round' | 'square';
  /** Pixi line join. Default `'miter'`. */
  readonly join?: 'miter' | 'round' | 'bevel';
}

export class LineConnector implements IConnector<LineConnectorSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;

  constructor(_spec: LineConnectorSpec, host: ConnectorHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'connector:line';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: LineConnectorSpec, points: ReadonlyArray<Point>): void {
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    g.clear();
    if (points.length < 2 || (spec.strokeWidth ?? 1) <= 0) return;

    g.moveTo(points[0]!.x, points[0]!.y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i]!.x, points[i]!.y);
    }
    g.stroke({
      color: spec.stroke,
      width: spec.strokeWidth ?? 1,
      alpha: spec.strokeAlpha ?? 1,
      cap: spec.cap,
      join: spec.join,
    });
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }
}
