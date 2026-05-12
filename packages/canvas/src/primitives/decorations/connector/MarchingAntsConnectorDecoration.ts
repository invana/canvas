import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

/**
 * Connector variant of marching-ants. Strokes the connector's routed path
 * with a dashed line whose `dashOffset` advances each frame, producing
 * a flowing/marching pattern along the line — useful for highlighting an
 * active edge, a route under consideration, a data flow, etc.
 *
 * Geometry is delegated to `host.connector.paintInto` with `dashArray` /
 * `dashOffset` overrides; the connector primitive samples the routed
 * path and emits dashes via the shared `dashedStroke` helper. Works on
 * every router / pathStyle (straight, orth, bezier, smooth — all produce
 * a `Path`).
 */
export interface MarchingAntsConnectorDecorationStyle {
  readonly color: number;
  /** Stroke width in px. Default `1.5`. */
  readonly strokeWidth?: number;
  /** Dash length in px. Default `6`. */
  readonly dashLength?: number;
  /** Gap length in px. Default `4`. */
  readonly gapLength?: number;
  /**
   * March speed in px/sec along the path. Default `24`.
   * Negative values reverse the march direction.
   */
  readonly speedPxPerSec?: number;
  /** Overall decoration alpha. Default `1`. */
  readonly alpha?: number;
  readonly cap?: 'butt' | 'round' | 'square';
  readonly join?: 'miter' | 'round' | 'bevel';
}

export class MarchingAntsConnectorDecoration extends ConnectorDecorationBase<MarchingAntsConnectorDecorationStyle> {
  private antsGfx = new Graphics();
  private elapsedMs = 0;

  protected repaint(): void {
    if (this.antsGfx.parent !== this.gfx) {
      this.gfx.addChild(this.antsGfx);
    }
  }

  tick(deltaMs: number): boolean {
    const host = this.host;
    if (!host) {
      this.antsGfx.clear();
      return true;
    }

    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 24;
    const dashLen = Math.max(0.5, this.style.dashLength ?? 6);
    const gapLen = Math.max(0.5, this.style.gapLength ?? 4);
    const dashOffset = -(this.elapsedMs / 1000) * speed;

    this.antsGfx.clear();
    host.connector.paintInto(this.antsGfx, host.connectorSpec, host.path, {
      color: this.style.color,
      alpha: this.style.alpha ?? 1,
      strokeWidth: this.style.strokeWidth ?? 1.5,
      dashArray: [dashLen, gapLen],
      dashOffset,
      cap: this.style.cap,
      join: this.style.join,
    });
    return true;
  }
}
