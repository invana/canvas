import { ConnectorEffectBase } from '../../base/ConnectorEffectBase';
import { Tween } from '../../animation/Tween';
import {
  easeInOutCubic,
  easeInOutSine,
  easeOutCubic,
  linear,
  type Easing,
} from '../../animation/easings';
import type { EffectTarget, StyleOverride } from '../../types';

/** Named easings accepted by the fade-in style payload. */
export type FadeInEasingName = 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine';

/**
 * One-shot opacity fade-in on the host connector. Drives the connector's
 * alpha from `fromAlpha` (default `0`) to `toAlpha` (default `1`) over
 * `durationMs` with the configured easing, then retires from the per-frame
 * tick set while continuing to contribute `toAlpha` to the effect aggregation
 * so the connector stays visible after the fade.
 *
 * Pairs naturally with the appearance of a "new edge" in a graph. For a
 * continuous pulse use `BreathingConnectorEffect` instead — this one is
 * deliberately one-shot.
 */
export interface FadeInConnectorEffectStyle {
  /** Duration of the fade in milliseconds. Default `600`. */
  readonly durationMs?: number;
  /** Start alpha. Default `0`. */
  readonly fromAlpha?: number;
  /** End alpha. Default `1`. */
  readonly toAlpha?: number;
  /** Easing curve. Default `'easeOutCubic'`. */
  readonly easing?: FadeInEasingName;
  /** Hold the effect at `fromAlpha` for this many ms before the fade starts. Default `0`. */
  readonly delayMs?: number;
}

export class FadeInConnectorEffect extends ConnectorEffectBase<FadeInConnectorEffectStyle> {
  readonly target: EffectTarget = 'style';

  private readonly tween: Tween;
  private readonly fromAlpha: number;
  private readonly toAlpha: number;
  private remainingDelayMs: number;
  private currentAlpha: number;

  constructor(style: FadeInConnectorEffectStyle) {
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
      // While delayed, keep the host at `fromAlpha` and stay animated.
      return true;
    }
    const stillAnimating = this.tween.tick(deltaMs);
    this.currentAlpha = this.tween.value;
    // After the tween retires, settle at `toAlpha` and stop ticking.
    // The renderer keeps calling `readStyle()` every frame so the alpha
    // override persists for the lifetime of the effect.
    if (!stillAnimating) this.currentAlpha = this.toAlpha;
    return stillAnimating;
  }

  readStyle(): StyleOverride {
    return { alpha: this.currentAlpha };
  }
}

function resolveEasing(name: FadeInEasingName | undefined): Easing {
  switch (name) {
    case 'linear':
      return linear;
    case 'easeInOutCubic':
      return easeInOutCubic;
    case 'easeInOutSine':
      return easeInOutSine;
    case 'easeOutCubic':
    default:
      return easeOutCubic;
  }
}
