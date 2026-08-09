import { Tween, linear } from '@invana/canvas';
import { EffectBase } from '../../base/EffectBase';
import type { EffectTarget, TransformDelta } from '../../types';

/**
 * Style options for `ShakeEffect`.
 *
 * - `amplitude` — peak jitter magnitude in world pixels, applied as a random
 *   offset to both axes every frame. Default `4`.
 * - `axis` — `'both' | 'x' | 'y'`. Default `'both'`.
 * - `decayMs` — when set, amplitude tweens from full to zero over this many
 *   milliseconds and the effect retires when complete. Use this for "shake
 *   on click" gestures. Omit for a continuous shake.
 * - `seed` — optional starting offset into the PRNG. Effects are independent
 *   by default (each constructs its own RNG state).
 */
export interface ShakeEffectStyle {
  readonly amplitude?: number;
  readonly axis?: 'both' | 'x' | 'y';
  readonly decayMs?: number;
  readonly seed?: number;
}

/**
 * Per-frame random jitter applied to the host's position. Pure transform
 * modulation — the host's spec is untouched; removing the effect (or letting
 * `decayMs` retire it) reverts the host to its baseline position on the next
 * frame.
 *
 * Uses `Tween` for the optional decay envelope so easing stays consistent
 * with other animated primitives.
 */
export class ShakeEffect extends EffectBase<ShakeEffectStyle> {
  readonly target: EffectTarget = 'transform';

  private readonly amplitude: number;
  private readonly axis: 'both' | 'x' | 'y';
  private readonly decay: Tween | null;
  private seed: number;
  private currentDx = 0;
  private currentDy = 0;

  constructor(style: ShakeEffectStyle) {
    super(style);
    this.amplitude = style.amplitude ?? 4;
    this.axis = style.axis ?? 'both';
    this.seed = style.seed ?? Math.floor(Math.random() * 0xffffffff);
    this.decay = style.decayMs
      ? new Tween({ from: 1, to: 0, duration: style.decayMs, easing: linear })
      : null;
  }

  tick(deltaMs: number): boolean {
    let envelope = 1;
    if (this.decay) {
      const alive = this.decay.tick(deltaMs);
      envelope = this.decay.value;
      if (!alive) {
        this.currentDx = 0;
        this.currentDy = 0;
        return false;
      }
    }
    const amp = this.amplitude * envelope;
    if (this.axis === 'both' || this.axis === 'x') {
      this.currentDx = (this.rand() * 2 - 1) * amp;
    }
    if (this.axis === 'both' || this.axis === 'y') {
      this.currentDy = (this.rand() * 2 - 1) * amp;
    }
    return true;
  }

  readTransform(): TransformDelta {
    return { dx: this.currentDx, dy: this.currentDy };
  }

  /** xorshift32 — deterministic per-effect PRNG, no global state. */
  private rand(): number {
    let x = this.seed | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x;
    // Convert to [0, 1).
    return ((x >>> 0) % 0xffffff) / 0xffffff;
  }
}
