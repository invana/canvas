/**
 * Decoration and effect *descriptions* — what to attach and how it should look.
 * The classes that implement them are renderer-side.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

export type EffectTarget = 'transform' | 'style';

/**
 * Per-frame transform contribution from a `target: 'transform'` effect. Each
 * field is optional and contributes additively (translations + rotation) or
 * multiplicatively (scale) when the renderer aggregates across all transform
 * effects attached to the same host. Omitted fields contribute the identity
 * (0 for additive, 1 for multiplicative).
 *
 * Coordinates are in the host shape's parent space (the renderer's world
 * container) so deltas read like "wiggle the shape 3px right" regardless of
 * the host's internal local origin.
 */

export interface TransformDelta {
  readonly dx?: number;
  readonly dy?: number;
  /** Rotation delta in radians. */
  readonly dRot?: number;
  /** Horizontal scale multiplier. Identity = 1. */
  readonly sx?: number;
  /** Vertical scale multiplier. Identity = 1. */
  readonly sy?: number;
}

/**
 * Per-frame style override from a `target: 'style'` effect. Channels are
 * merged across effects with last-writer-wins per channel (insertion order in
 * the host's effect map). Pixi's tint multiplies the underlying fill, so a
 * `tint` of `0xffffff` is the identity.
 */

export interface StyleOverride {
  /** Pixi tint (multiplicative). Identity = `0xffffff`. */
  readonly tint?: number;
  /** Multiplier on the host's current alpha. Identity = 1. */
  readonly alpha?: number;
}

/**
 * Information a shape effect receives in `mount` / `update`. No `surface`
 * field — effects don't draw, they modulate. The renderer applies the
 * effect's `readTransform` / `readStyle` output onto the host gfx each frame.
 */

export type EffectTargetKind = 'shape' | 'connector' | 'both';

export interface RegisterEffectOptions {
  readonly target: EffectTargetKind;
}

/** Caller-side payload for `setEffect(id, slot, ...)`. */

export interface EffectSpec<TStyle = unknown> {
  readonly kind: string;
  readonly style: TStyle;
}

// ─── Constructor types ─────────────────────────────────────────────────────

/**
 * Constructor type for shapes registered via `registerShape`. Optionally
 * exposes a `static paintInto` so the shape can also serve as a connector
 * marker. Shapes without `paintInto` cannot be used as markers.
 */

export type DecorationTarget = 'shape' | 'connector' | 'both';

export interface RegisterDecorationOptions {
  readonly target: DecorationTarget;
}

/** Caller-side payload for `setDecoration(id, slot, ...)`. */

export interface DecorationSpec<TStyle = unknown> {
  readonly kind: string;
  readonly style: TStyle;
}

// ─── Hit-test ──────────────────────────────────────────────────────────────
