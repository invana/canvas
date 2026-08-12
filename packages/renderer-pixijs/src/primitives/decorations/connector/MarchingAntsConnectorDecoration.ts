import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { MarchingAntsConnectorDecorationStyle } from '@invana/canvas';
export type { MarchingAntsConnectorDecorationStyle } from '@invana/canvas';



export class MarchingAntsConnectorDecoration extends ConnectorDecorationBase<MarchingAntsConnectorDecorationStyle> {
  private antsGfx = new Graphics();
  private elapsedMs = 0;

  constructor(style: MarchingAntsConnectorDecorationStyle) {
    super(style);
    this.antsGfx.label = 'ants:path';
  }

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
