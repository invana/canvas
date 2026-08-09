import { EffectBase } from '../../base/EffectBase';
import type { EffectTarget, TransformDelta } from '../../types';

/**
 * Style options for `BreathingEffect`.
 *
 * - `amplitude` — fractional scale swing. `0.05` means the host scales
 *   between `0.95` and `1.05`. Default `0.05`.
 * - `periodMs` — duration of one full breath cycle. Default `1800`.
 * - `axis` — `'both' | 'x' | 'y'`. Default `'both'`.
 * - `phaseOffsetMs` — start time offset; lets multiple breathing hosts
 *   desync visually. Default `0`.
 */
export interface BreathingEffectStyle {
  readonly amplitude?: number;
  readonly periodMs?: number;
  readonly axis?: 'both' | 'x' | 'y';
  readonly phaseOffsetMs?: number;
}

/**
 * Sinusoidal scale modulation around 1.0. Cycles forever — never retires on
 * its own; remove explicitly via `setEffect(id, slot, null)`. Uses a raw
 * sine accumulator rather than `Tween` because the motion is naturally
 * cyclical (no start / end / easing curve to compose).
 */
export class BreathingEffect extends EffectBase<BreathingEffectStyle> {
  readonly target: EffectTarget = 'transform';

  private readonly amplitude: number;
  private readonly periodMs: number;
  private readonly axis: 'both' | 'x' | 'y';
  private elapsed: number;
  private currentSx = 1;
  private currentSy = 1;

  constructor(style: BreathingEffectStyle) {
    super(style);
    this.amplitude = style.amplitude ?? 0.05;
    this.periodMs = style.periodMs ?? 1800;
    this.axis = style.axis ?? 'both';
    this.elapsed = style.phaseOffsetMs ?? 0;
  }

  tick(deltaMs: number): boolean {
    this.elapsed += deltaMs;
    const phase = (this.elapsed / this.periodMs) * Math.PI * 2;
    const factor = 1 + this.amplitude * Math.sin(phase);
    this.currentSx = this.axis === 'y' ? 1 : factor;
    this.currentSy = this.axis === 'x' ? 1 : factor;
    return true;
  }

  readTransform(): TransformDelta {
    return { sx: this.currentSx, sy: this.currentSy };
  }
}
