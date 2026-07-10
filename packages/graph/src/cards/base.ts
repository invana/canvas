import type { CompositePart } from '@invana/canvas';

import type { CompositeShapeOption } from '../layer/types';

/** The card's box + fill / stroke / clip, returned by {@link CompositeCard.build}. */
export interface CardFrame {
  width: number;
  height: number;
  fill: number;
  stroke?: { color: number; width?: number; alpha?: number };
  cornerRadius?: number;
  /** Clip parts to the rounded silhouette (edge accents follow the corners). */
  clip?: boolean;
}

/**
 * Base class for the built-in composite **card** node types — the composite
 * counterpart to `ShapeBase<TSpec>` (`RectShape` / `CircleShape` / …). Like a
 * shape, a card is fully driven by a typed **spec**: every knob (width, colours,
 * radii, spacing) lives in `this.spec`, so *editing the spec* changes the card —
 * no subclassing needed for values. Subclass and override the `protected`
 * section methods only when you need to change *structure*.
 *
 * ```ts
 * // configure via the spec (like RectShape)
 * const card = new UserCard({ width: 300, bg: 0x1e293b, nameColor: 0xffffff });
 * node.style.shape = (n) => card.build(n.data as UserCardData);
 *
 * // …or subclass to change structure
 * class MyUser extends UserCard { protected topAccent() {} } // no accent bar
 * ```
 *
 * `spec` fields are mutable — `card.spec.width = 320` re-styles on the next
 * render. Instances are otherwise stateless, so one renders every node of a type.
 */
export abstract class CompositeCard<TSpec, TData, TOpts = void> {
  /** The card's full, resolved configuration. Mutable — edit to re-style. */
  readonly spec: TSpec;

  constructor(spec: TSpec) {
    this.spec = spec;
  }

  /** Assemble the ordered {@link CompositePart}s for this card. */
  protected abstract parts(data: TData, opts: TOpts): CompositePart[];
  /** The card box + fill / stroke / clip, given the assembled parts. */
  protected abstract frame(data: TData, parts: readonly CompositePart[], opts: TOpts): CardFrame;

  /** Build the composite spec for one node's data (+ optional per-call opts). */
  build(data: TData, opts?: TOpts): CompositeShapeOption {
    const o = opts ?? ({} as TOpts);
    const parts = this.parts(data, o);
    const f = this.frame(data, parts, o);
    return {
      kind: 'composite',
      width: f.width,
      height: f.height,
      ...(f.cornerRadius !== undefined ? { cornerRadius: f.cornerRadius } : {}),
      fill: f.fill,
      ...(f.stroke ? { stroke: f.stroke } : {}),
      ...(f.clip ? { clip: true } : {}),
      parts,
    };
  }
}
