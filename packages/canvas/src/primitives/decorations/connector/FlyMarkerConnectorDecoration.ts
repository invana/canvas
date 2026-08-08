import { Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';
import { samplePath } from '../../../connectors/pathSampling';
import type { Path, Point } from '../../types';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
import type { FlyMarkerConnectorDecorationStyle } from '../../../specs/decorationStyle';
export type { FlyMarkerConnectorDecorationStyle } from '../../../specs/decorationStyle';



export class FlyMarkerConnectorDecoration extends ConnectorDecorationBase<FlyMarkerConnectorDecorationStyle> {
  private markerGfx = new Graphics();
  private elapsedMs = 0;

  constructor(style: FlyMarkerConnectorDecorationStyle) {
    super(style);
    this.markerGfx.label = 'fly:marker';
  }

  /** Densified polyline of the current host path. */
  private samples: Point[] = [];
  /** Cumulative arc-length at each sample. `cumLen[i]` = distance from samples[0] to samples[i]. */
  private cumLen: number[] = [];
  /** Total arc length of the sampled polyline. */
  private totalLen = 0;

  protected repaint(): void {
    if (this.markerGfx.parent !== this.gfx) {
      this.gfx.addChild(this.markerGfx);
    }
    this.gfx.alpha = this.style.alpha ?? 1;

    const host = this.host;
    if (!host) {
      this.markerGfx.clear();
      this.samples = [];
      this.cumLen = [];
      this.totalLen = 0;
      return;
    }

    this.rebuildArcTable(host.path);
    this.drawMarkerSilhouette();
  }

  tick(deltaMs: number): boolean {
    if (!this.host || this.totalLen <= 0) return true;

    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 80;
    const phase = clamp01(this.style.phase ?? 0);
    const loop = this.style.loop ?? true;

    let dist = phase * this.totalLen + (this.elapsedMs / 1000) * speed;
    if (loop) {
      dist = ((dist % this.totalLen) + this.totalLen) % this.totalLen;
    } else if (dist < 0) {
      dist = 0;
    } else if (dist > this.totalLen) {
      dist = this.totalLen;
    }

    const { x, y, tx, ty } = this.sampleAt(dist);
    this.markerGfx.position.set(x, y);

    const orientToPath =
      this.style.orientToPath ?? (this.style.markerKind ?? 'circle') === 'arrow';
    this.markerGfx.rotation = orientToPath ? Math.atan2(ty, tx) : 0;

    return true;
  }

  private rebuildArcTable(path: Path): void {
    const samples = samplePath(path);
    this.samples = samples;
    const cum: number[] = new Array(samples.length);
    let total = 0;
    if (samples.length > 0) {
      cum[0] = 0;
      for (let i = 1; i < samples.length; i++) {
        const a = samples[i - 1]!;
        const b = samples[i]!;
        total += Math.hypot(b.x - a.x, b.y - a.y);
        cum[i] = total;
      }
    }
    this.cumLen = cum;
    this.totalLen = total;
  }

  /** Position + unit tangent at arc-length `dist` along the sampled polyline. */
  private sampleAt(dist: number): { x: number; y: number; tx: number; ty: number } {
    const n = this.samples.length;
    if (n === 0) return { x: 0, y: 0, tx: 1, ty: 0 };
    if (n === 1) return { x: this.samples[0]!.x, y: this.samples[0]!.y, tx: 1, ty: 0 };

    const last = this.samples[n - 1]!;
    if (dist >= this.totalLen) {
      const prev = this.samples[n - 2]!;
      const dx = last.x - prev.x;
      const dy = last.y - prev.y;
      const len = Math.hypot(dx, dy) || 1;
      return { x: last.x, y: last.y, tx: dx / len, ty: dy / len };
    }

    // Binary-search for the segment containing `dist`.
    let lo = 0;
    let hi = n - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >>> 1;
      if (this.cumLen[mid]! <= dist) lo = mid;
      else hi = mid;
    }
    const a = this.samples[lo]!;
    const b = this.samples[lo + 1]!;
    const segStart = this.cumLen[lo]!;
    const segEnd = this.cumLen[lo + 1]!;
    const segLen = segEnd - segStart;
    const u = segLen > 0 ? (dist - segStart) / segLen : 0;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const tLen = Math.hypot(dx, dy) || 1;
    return {
      x: a.x + dx * u,
      y: a.y + dy * u,
      tx: dx / tLen,
      ty: dy / tLen,
    };
  }

  private drawMarkerSilhouette(): void {
    const g = this.markerGfx;
    g.clear();
    const color = this.style.color;
    const size = Math.max(1, this.style.size ?? 8);
    const kind = this.style.markerKind ?? 'circle';

    switch (kind) {
      case 'circle': {
        g.circle(0, 0, size / 2).fill({ color });
        break;
      }
      case 'square': {
        const h = size / 2;
        g.rect(-h, -h, size, size).fill({ color });
        break;
      }
      case 'arrow': {
        // Isoceles triangle pointing along +x. Tip at (size/2, 0), base width = size.
        const tip = size / 2;
        const base = -size / 2;
        const half = size / 2;
        g.poly([tip, 0, base, -half, base, half]).fill({ color });
        break;
      }
    }
  }
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
