import { ConnectorEffectBase } from '../../base/ConnectorEffectBase';
import type { EffectTarget, StyleOverride } from '../../types';

/**
 * Sinusoidal alpha modulation on the host connector. Cycles forever — never
 * retires on its own; remove explicitly via `setEffect(id, slot, null)`.
 *
 * Style channel only — connector effects don't have a coherent meaning
 * for transform deltas (translating / scaling a path-resolved primitive
 * would just shift its position offscreen relative to the endpoints),
 * so this effect modulates the host's gfx alpha instead. Pairs naturally
 * with a thin static `glow-connector` for "active edge" cues, or stands
 * alone for "blinking" / "pulsing" / "in-flight" visualisations.
 */
export interface BreathingConnectorEffectStyle {
  /**
   * How far below full brightness the dim phase reaches, `[0, 1]`.
   * `0.5` swings alpha between `0.5` and `1`. Default `0.5`.
   */
  readonly amplitude?: number;
  /** Duration of one full breath cycle in ms. Default `1800`. */
  readonly periodMs?: number;
  /** Start-time offset so multiple breathing hosts can desync. Default `0`. */
  readonly phaseOffsetMs?: number;
}

export class BreathingConnectorEffect extends ConnectorEffectBase<BreathingConnectorEffectStyle> {
  readonly target: EffectTarget = 'style';

  private readonly amplitude: number;
  private readonly periodMs: number;
  private elapsed: number;
  private currentAlpha = 1;

  constructor(style: BreathingConnectorEffectStyle) {
    super(style);
    this.amplitude = clamp01(style.amplitude ?? 0.5);
    this.periodMs = style.periodMs ?? 1800;
    this.elapsed = style.phaseOffsetMs ?? 0;
  }

  tick(deltaMs: number): boolean {
    this.elapsed += deltaMs;
    const phase = (this.elapsed / this.periodMs) * Math.PI * 2;
    // Map sin from [-1, 1] to [1 - amplitude, 1].
    this.currentAlpha = 1 - this.amplitude * (0.5 - 0.5 * Math.sin(phase));
    return true;
  }

  readStyle(): StyleOverride {
    return { alpha: this.currentAlpha };
  }
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}
