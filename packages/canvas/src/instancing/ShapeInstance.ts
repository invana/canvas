/**
 * `ShapeInstance` — internal record the renderer keeps per added shape.
 *
 * Holds the spec, the pixi-backed `IShape`, and the active decoration map
 * keyed by slot. Not exported from the package — purely an internal binding
 * between caller spec and rendered output.
 */

import type {
  BaseShapeSpec,
  IShape,
  IShapeDecoration,
  IShapeEffect,
} from '../primitives/types';

export class ShapeInstance<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  readonly decorations = new Map<string, IShapeDecoration>();
  /**
   * Active effects keyed by slot. Effects modulate the host's transform
   * and/or style each frame; the renderer aggregates contributions from
   * every entry and writes the result onto `shape.gfx`.
   */
  readonly effects = new Map<string, IShapeEffect>();

  /**
   * Uniform gfx-transform scale most recently written by
   * `PrimitivesRenderer.scaleShape`. Defaults to `1` (no extra scale).
   *
   * The spec's geometry (`radius` / `width` / `height`) describes the
   * shape in unscaled local units; `gfxScale` is the *visual* multiplier
   * the renderer applies on top, used by behaviours like
   * `NodeScaleLODBehaviour` to keep shapes pixel-constant across camera
   * zoom without rebuilding geometry every frame.
   *
   * Anchor / obstacle / endpoint-centre computations multiply the local
   * bounds by this factor so connectors stay glued to the *visible*
   * silhouette — without it, edges anchor to the pre-scaled bounds and
   * visibly fall short of the smaller shape.
   */
  gfxScale: number = 1;

  constructor(
    readonly id: string,
    /** Mutable; the renderer merges partial updates onto this in place. */
    public spec: TSpec,
    readonly shape: IShape<TSpec>,
  ) {}
}
