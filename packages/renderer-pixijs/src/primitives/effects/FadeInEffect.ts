import { Tween, resolveEasing, type EasingName } from '@invana/canvas-core';
import { EffectBase } from '../base/EffectBase';
import type { EffectTarget, StyleOverride } from '../../types';

/**
 * Style options for `FadeInEffect` — the shape twin of
 * `FadeInConnectorEffect`, field for field.
 *
 * - `durationMs` — length of the fade. Default `600`.
 * - `fromAlpha` / `toAlpha` — the endpoints. Default `0` → `1`.
 * - `easing` — named curve, so the payload stays serialisable. Default
 *   `'easeOutCubic'`.
 * - `delayMs` — hold at `fromAlpha` this long before fading. This is the field
 *   that turns a set of fades into an *entrance*: give each host a different
 *   delay and the scene arrives in an order you chose rather than all at once.
 */
export interface FadeInEffectStyle {
  readonly durationMs?: number;
  readonly fromAlpha?: number;
  readonly toAlpha?: number;
  readonly easing?: EasingName;
  readonly delayMs?: number;
}

/**
 * One-shot opacity fade-in on the host shape. Drives alpha from `fromAlpha`
 * (default `0`) to `toAlpha` (default `1`) over `durationMs`, then retires from
 * the per-frame tick set while continuing to contribute `toAlpha` — so the host
 * stays visible without costing a tick for the rest of its life.
 *
 * The connector side of this has existed since the effects vocabulary landed
 * (`FadeInConnectorEffect`); shapes had `shake` and `breathing` and no way to
 * arrive. Pairs with the appearance of a new node, and with
 * `EntranceBehaviour`, which is just this effect applied across a graph with a
 * staggered `delayMs`.
 *
 * For a continuous pulse use `BreathingEffect` instead — this one is
 * deliberately one-shot.
 */
export class FadeInEffect extends EffectBase<FadeInEffectStyle> {
  readonly target: EffectTarget = 'style';

  private readonly tween: Tween;
  private readonly fromAlpha: number;
  private readonly toAlpha: number;
  private remainingDelayMs: number;
  private currentAlpha: number;

  constructor(style: FadeInEffectStyle) {
    super(style);
    this.fromAlpha = style.fromAlpha ?? 0;
    this.toAlpha = style.toAlpha ?? 1;
    this.remainingDelayMs = Math.max(0, style.delayMs ?? 0);
    this.currentAlpha = this.fromAlpha;
    this.tween = new Tween({
      from: this.fromAlpha,
      to: this.toAlpha,
      duration: Math.max(1, style.durationMs ?? 600),
      easing: resolveEasing(style.easing),
    });
  }

  tick(deltaMs: number): boolean {
    if (this.remainingDelayMs > 0) {
      this.remainingDelayMs -= deltaMs;
      // While delayed, hold the host at `fromAlpha` and stay in the tick set.
      return true;
    }
    const stillAnimating = this.tween.tick(deltaMs);
    this.currentAlpha = this.tween.value;
    // After the tween retires, settle exactly on `toAlpha` and stop ticking;
    // `readStyle()` keeps being read every frame, so the alpha override holds.
    if (!stillAnimating) this.currentAlpha = this.toAlpha;
    return stillAnimating;
  }

  readStyle(): StyleOverride {
    return { alpha: this.currentAlpha };
  }
}
