import { Graphics } from 'pixi.js';
import { Tween, easeInOutCubic, easeInOutSine, easeOutCubic, linear, samplePath } from '@invana/canvas';
import type { Easing, RevealConnectorDecorationStyle, RevealDirection, RevealEasingName, RevealRepeat } from '@invana/canvas';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';
import type { Path, Point } from '../../types';

// Style types moved to the pixi-free spec vocabulary (`specs/decorationStyle.ts`)
// so domain packages can describe decorations without importing a backend.
// Re-exported here so existing importers keep working.
export type { RevealConnectorDecorationStyle , RevealDirection, RevealEasingName, RevealHostStroke, RevealRepeat} from '@invana/canvas';







export class RevealConnectorDecoration extends ConnectorDecorationBase<RevealConnectorDecorationStyle> {
  private revealGfx = new Graphics();
  private tween: Tween | null = null;
  private remainingDelayMs: number;
  private finished = false;
  private hostHiddenByUs = false;

  /** Densified polyline of the host path, oriented per `direction`. */
  private samples: Point[] = [];
  /** Cumulative arc length at each sample. */
  private cumLen: number[] = [];
  /** Total arc length. */
  private totalLen = 0;

  constructor(style: RevealConnectorDecorationStyle) {
    super(style);
    this.revealGfx.label = 'reveal:mask';
    this.remainingDelayMs = Math.max(0, style.delayMs ?? 0);
  }

  protected repaint(): void {
    if (this.revealGfx.parent !== this.gfx) {
      this.gfx.addChild(this.revealGfx);
    }

    const host = this.host;
    if (!host) {
      this.revealGfx.clear();
      this.samples = [];
      this.cumLen = [];
      this.totalLen = 0;
      return;
    }

    this.rebuildArcTable(host.path, this.style.direction ?? 'source-to-target');

    // Lazily create the tween on the first repaint (mount). Subsequent
    // `update(host)` calls (e.g. routing change while node drags) keep the
    // tween — we only rebuild the geometry tables so progress maps onto
    // the new path proportionally.
    if (!this.tween) {
      this.tween = new Tween({
        from: 0,
        to: 1,
        duration: Math.max(1, this.style.durationMs ?? 2000),
        easing: resolveEasing(this.style.easing),
        repeat: resolveRepeat(this.style.repeat),
      });
    }

    // Re-apply on every repaint: the renderer calls `connector.draw(...)` in
    // `recomputeConnectorPath` (triggered by mount + by routing changes) which
    // re-strokes the body and re-paints the markers. Hide only the body line
    // and the *ending* marker (the one the reveal is sweeping toward). The
    // *starting* marker stays visible because the line begins from it.
    if ((this.style.hostStroke ?? 'hide') === 'hide' && !this.finished) {
      host.connector.setBodyVisible(false);
      this.applyEndingMarkerVisibility(this.tween.value);
      this.hostHiddenByUs = true;
    }

    // Paint the current frame's slice immediately so we don't show an empty
    // surface for one frame between mount and first tick.
    this.paintAt(this.tween.value);
  }

  /**
   * Show / hide the "ending" marker (the endpoint the reveal sweeps toward)
   * based on whether the line has reached it. The "starting" marker stays
   * visible at all times because the reveal originates from its endpoint.
   */
  private applyEndingMarkerVisibility(progress: number): void {
    if (!this.host) return;
    if ((this.style.hostStroke ?? 'hide') !== 'hide') return;
    // Pop the ending marker in slightly before the line fully reaches the
    // endpoint so it feels in-sync rather than late. `0.985` ≈ last 1.5%
    // of the path — visually indistinguishable from "at the end" but
    // hides the one-frame gap between line completion and tween retire.
    const reached = progress >= 0.985;
    const direction = this.style.direction ?? 'source-to-target';
    if (direction === 'source-to-target') {
      this.host.connector.setTargetMarkerVisible(reached);
    } else {
      this.host.connector.setSourceMarkerVisible(reached);
    }
  }

  tick(deltaMs: number): boolean {
    if (this.finished) return false;
    if (this.remainingDelayMs > 0) {
      this.remainingDelayMs -= deltaMs;
      // Hold at 0% while delayed; nothing visible yet.
      this.paintAt(0);
      return true;
    }
    const tween = this.tween;
    const host = this.host;
    if (!tween || !host) return true;

    const stillAnimating = tween.tick(deltaMs);
    this.paintAt(tween.value);
    this.applyEndingMarkerVisibility(tween.value);

    if (stillAnimating) return true;

    // Cycle complete and tween retired (one-shot / N-cycles exhausted).
    const repeat = resolveRepeat(this.style.repeat);
    const isOneShotLike = repeat !== 'forever';
    if (isOneShotLike) {
      const holdAtFull = this.style.holdAtFull ?? true;
      if (holdAtFull) {
        // Hand off to the host stroke + markers if we were hiding it.
        this.restoreHostVisibility();
        this.revealGfx.clear();
      } else {
        this.revealGfx.clear();
        // Leave host as-is: for `hostStroke: 'hide'` the connector stays
        // invisible because the developer asked for `!holdAtFull`. They
        // can clear by removing the decoration explicitly.
      }
      this.finished = true;
      return false;
    }
    return true;
  }

  destroy(): void {
    this.restoreHostVisibility();
    super.destroy();
  }

  private restoreHostVisibility(): void {
    if (this.hostHiddenByUs && this.host) {
      this.host.connector.setBodyVisible(true);
      this.host.connector.setSourceMarkerVisible(true);
      this.host.connector.setTargetMarkerVisible(true);
    }
    this.hostHiddenByUs = false;
  }

  private rebuildArcTable(path: Path, direction: RevealDirection): void {
    let samples = samplePath(path);
    if (direction === 'target-to-source') {
      samples = samples.slice().reverse();
    }
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

  /**
   * Paint the polyline from `samples[0]` up to arc-length `progress × totalLen`.
   * Interpolates within the last partial segment so the head doesn't snap
   * between sample indices.
   */
  private paintAt(progress: number): void {
    const g = this.revealGfx;
    g.clear();
    const host = this.host;
    if (!host) return;
    const n = this.samples.length;
    if (n < 2 || this.totalLen <= 0) return;

    const cutoff = clamp01(progress) * this.totalLen;
    if (cutoff <= 0) return;

    const first = this.samples[0]!;
    g.moveTo(first.x, first.y);

    if (cutoff >= this.totalLen) {
      // Full path — straight walk through every sample.
      for (let i = 1; i < n; i++) {
        const p = this.samples[i]!;
        g.lineTo(p.x, p.y);
      }
    } else {
      // Walk until the cumulative length crosses the cutoff, then emit
      // a final interpolated point so the head lands exactly on cutoff.
      for (let i = 1; i < n; i++) {
        const len = this.cumLen[i]!;
        if (len < cutoff) {
          const p = this.samples[i]!;
          g.lineTo(p.x, p.y);
          continue;
        }
        const prevLen = this.cumLen[i - 1]!;
        const segLen = len - prevLen;
        const u = segLen > 0 ? (cutoff - prevLen) / segLen : 0;
        const a = this.samples[i - 1]!;
        const b = this.samples[i]!;
        g.lineTo(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u);
        break;
      }
    }

    // Inherit stroke style from the host connector's spec verbatim — the
    // reveal is a progressive draw of the *same* line the host would paint,
    // not a separate decorative overlay.
    const s = host.connectorSpec.stroke;
    g.stroke({
      color: s?.color ?? 0x000000,
      alpha: s?.alpha ?? 1,
      width: s?.width ?? 1,
      cap: s?.cap,
      join: s?.join,
    });
  }
}

function resolveEasing(name: RevealEasingName | undefined): Easing {
  switch (name) {
    case 'easeOutCubic':
      return easeOutCubic;
    case 'easeInOutCubic':
      return easeInOutCubic;
    case 'easeInOutSine':
      return easeInOutSine;
    case 'linear':
    default:
      return linear;
  }
}

function resolveRepeat(repeat: RevealRepeat | undefined): number | 'forever' {
  if (repeat === true) return 'forever';
  if (typeof repeat === 'number' && repeat >= 1) {
    // `Tween.repeat` is the count of *additional* cycles after the first,
    // so subtract one for parity with "N cycles total".
    return Math.max(0, Math.floor(repeat) - 1);
  }
  return 0;
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
