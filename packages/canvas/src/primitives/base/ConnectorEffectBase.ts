import type {
  ConnectorEffectHostInfo,
  EffectTarget,
  IConnectorEffect,
  StyleOverride,
  TransformDelta,
} from '../types';

/**
 * Base for effects that target connector primitives. Mirror of `EffectBase`
 * for shape effects — the effect modulates the host connector's style
 * (tint / alpha) rather than adding geometry alongside it.
 *
 * Subclasses:
 *  - Declare `readonly target` as `'style'` (typical) or `'transform'`.
 *    Note: the renderer ignores `'transform'` for connector hosts because
 *    translating / rotating / scaling a path-resolved primitive has no
 *    coherent meaning — effects that need to perturb endpoints should
 *    mutate the input polyline upstream of routing, not modulate gfx.
 *  - Implement `readStyle()`. The renderer aggregates contributions
 *    across every effect attached to the same connector (`tint` is
 *    last-writer-wins per channel; `alpha` multipliers compose).
 *  - Optionally implement `tick(deltaMs)` for animated effects. Returning
 *    `false` retires the effect from the renderer's per-frame set.
 *
 * Effects do not own a Pixi container — they have no gfx. The structural
 * difference from `ConnectorDecorationBase` is the same as for shapes:
 * decorations draw, effects modulate.
 */
export abstract class ConnectorEffectBase<TStyle> implements IConnectorEffect<TStyle> {
  abstract readonly target: EffectTarget;

  readonly style: TStyle;
  protected host: ConnectorEffectHostInfo | null = null;

  constructor(style: TStyle) {
    this.style = style;
  }

  mount(host: ConnectorEffectHostInfo): void {
    this.host = host;
  }

  update(host: ConnectorEffectHostInfo): void {
    this.host = host;
  }

  destroy(): void {
    this.host = null;
  }

  tick?(deltaMs: number): boolean;

  readTransform?(): TransformDelta;

  readStyle?(): StyleOverride;
}
