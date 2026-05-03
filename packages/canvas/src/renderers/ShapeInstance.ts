/**
 * `ShapeInstance` — internal record the renderer keeps per added shape.
 *
 * Holds the spec, the pixi-backed `IShape` implementation, and the active
 * decoration map keyed by slot. Not exported from the package — purely an
 * internal binding between caller spec and rendered output.
 */

import type { BaseShapeSpec, IShape, IShapeDecoration } from './types';

export class ShapeInstance<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  /** Active decorations keyed by slot name. */
  readonly decorations = new Map<string, IShapeDecoration>();

  constructor(
    readonly id: string,
    /** Mutable; the renderer merges partial updates onto this in place. */
    public spec: TSpec,
    readonly shape: IShape<TSpec>,
  ) {}
}
