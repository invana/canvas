import type {
  EffectTarget,
  IShapeEffect,
  ShapeEffectHostInfo,
  StyleOverride,
  TransformDelta,
} from '../types';

/**
 * Base for effects that target shape primitives. An effect *modulates* the
 * host — wiggle its transform, override its tint/alpha — rather than adding
 * geometry alongside it (that's a decoration). The renderer reads each
 * effect's contribution every frame via `readTransform()` (transform effects)
 * or `readStyle()` (style effects), aggregates across all effects attached to
 * the same host, and applies the aggregate to the host's gfx.
 *
 * Subclasses:
 *  - Declare `readonly target` as `'transform'` or `'style'`.
 *  - Implement `readTransform()` (target='transform') OR `readStyle()`
 *    (target='style'). The renderer calls only the one matching `target`.
 *  - Optionally implement `tick(deltaMs)` for animated effects. Returning
 *    `false` retires the effect from the renderer's per-frame set.
 *
 * Effects do not own a Pixi container — they have no gfx. That's the
 * structural difference from `PrimitiveBase` children: shapes / connectors /
 * decorations draw, effects modulate.
 */
export abstract class EffectBase<TStyle> implements IShapeEffect<TStyle> {
  abstract readonly target: EffectTarget;

  readonly style: TStyle;
  protected host: ShapeEffectHostInfo | null = null;

  constructor(style: TStyle) {
    this.style = style;
  }

  mount(host: ShapeEffectHostInfo): void {
    this.host = host;
  }

  update(host: ShapeEffectHostInfo): void {
    this.host = host;
  }

  destroy(): void {
    this.host = null;
  }

  /**
   * Optional per-frame advance. Subclasses override; the base no-ops. Return
   * `false` to retire the effect from the renderer's animation set.
   */
  tick?(deltaMs: number): boolean;

  /**
   * Required by transform-effects; the renderer ignores it for style-effects.
   * Subclasses with `target='transform'` must override.
   */
  readTransform?(): TransformDelta;

  /**
   * Required by style-effects; the renderer ignores it for transform-effects.
   * Subclasses with `target='style'` must override.
   */
  readStyle?(): StyleOverride;
}
