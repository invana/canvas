import { Graphics } from 'pixi.js';
import { samplePath } from '@invana/canvas';
import type { FlowParticlesConnectorDecorationStyle } from '@invana/canvas';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';
import type { Path, Point } from '../../types';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
export type { FlowParticlesConnectorDecorationStyle } from '@invana/canvas';



export class FlowParticlesConnectorDecoration extends ConnectorDecorationBase<FlowParticlesConnectorDecorationStyle> {
  private particles: Graphics[] = [];
  private elapsedMs = 0;

  private samples: Point[] = [];
  private cumLen: number[] = [];
  private totalLen = 0;

  protected repaint(): void {
    this.gfx.alpha = this.style.alpha ?? 1;

    const host = this.host;
    if (!host) {
      for (const p of this.particles) p.clear();
      this.samples = [];
      this.cumLen = [];
      this.totalLen = 0;
      return;
    }

    this.rebuildArcTable(host.path);
    this.syncParticleCount();
    this.drawSilhouetteIntoEach();
  }

  tick(deltaMs: number): boolean {
    if (!this.host || this.totalLen <= 0 || this.particles.length === 0) return true;

    this.elapsedMs += deltaMs;
    const speed = this.style.speedPxPerSec ?? 60;
    const basePhase = clamp01(this.style.phase ?? 0);
    const loop = this.style.loop ?? true;
    const total = this.totalLen;
    const count = this.particles.length;

    const orientToPath =
      this.style.orientToPath ?? (this.style.markerKind ?? 'circle') === 'arrow';

    const travel = (this.elapsedMs / 1000) * speed;

    for (let i = 0; i < count; i++) {
      const particlePhase = basePhase + i / count;
      let dist = particlePhase * total + travel;
      if (loop) {
        dist = ((dist % total) + total) % total;
      } else if (dist < 0) {
        dist = 0;
      } else if (dist > total) {
        dist = total;
      }
      const { x, y, tx, ty } = this.sampleAt(dist);
      const g = this.particles[i]!;
      g.position.set(x, y);
      g.rotation = orientToPath ? Math.atan2(ty, tx) : 0;
    }

    return true;
  }

  private syncParticleCount(): void {
    const target = Math.max(1, Math.floor(this.style.count ?? 5));
    while (this.particles.length < target) {
      const g = new Graphics();
      g.label = `flow:particle-${this.particles.length}`;
      this.gfx.addChild(g);
      this.particles.push(g);
    }
    while (this.particles.length > target) {
      const g = this.particles.pop()!;
      g.destroy();
    }
  }

  private drawSilhouetteIntoEach(): void {
    const color = this.style.color;
    const size = Math.max(1, this.style.size ?? 6);
    const kind = this.style.markerKind ?? 'circle';
    for (const g of this.particles) {
      g.clear();
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
          const tip = size / 2;
          const base = -size / 2;
          const half = size / 2;
          g.poly([tip, 0, base, -half, base, half]).fill({ color });
          break;
        }
      }
    }
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
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
