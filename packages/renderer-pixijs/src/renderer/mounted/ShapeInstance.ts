/**
 * Lives in `mounted/`, **not** `instancing/`. These are per-element bookkeeping
 * records — one object per mounted shape, holding its spec, display objects,
 * decorations and effects. "Instancing" in a renderer means the opposite (one
 * geometry drawn many times), and that is the direction batching would take
 * this package; the old folder name pointed at exactly the wrong idea.
 */

/**
 * `ShapeInstance` — internal record the renderer keeps per added shape.
 *
 * Holds the spec, the pixi-backed `IShape`, and the active decoration map
 * keyed by slot. Not exported from the package — purely an internal binding
 * between caller spec and rendered output.
 */

import type { ShapeDisplayOverride } from '@invana/canvas-core';

import type {
  BaseShapeSpec,
  IShape,
  IShapeDecoration,
  IShapeEffect,
} from '../../types';

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

  /**
   * Display-only override (`PrimitivesRenderer.setShapeDisplayOverride`), or
   * `null`. Layered on top of `spec.x/y` and {@link gfxScale}; neither of those
   * writers touches it.
   */
  displayOverride: ShapeDisplayOverride | null = null;

  /**
   * Offset of the **drawn** gfx origin from `(spec.x, spec.y)` — the override's
   * `dx/dy` plus the shift that keeps an override scale centred on the shape.
   * `0` without an override. Cached by `PrimitivesRenderer.applyDisplayTransform`
   * so geometry answers (anchors, picking) don't recompute it per query.
   */
  drawnDx = 0;
  /** See {@link drawnDx}. */
  drawnDy = 0;

  /**
   * The text-LOD channel: what `setShapeTextVisible` last asked for. Governs the
   * `'label'` decoration **and** the shape's internal text.
   */
  textWanted = true;
  /**
   * The label-collision channel: what `setDecorationVisible(id, 'label', …)`
   * last asked for. Governs the `'label'` decoration only.
   *
   * The two channels are separate so neither writer overwrites the other: the
   * label is drawn only when both allow it ({@link textWanted} ∧ this), and a
   * display override's `showText` forces it on. Both survive a label remount.
   */
  labelWanted = true;

  /**
   * `true` for a badge plate (`PrimitivesRenderer.setBadge`). A badge's text is
   * part of the badge, so a label-size policy never rescales it.
   */
  isBadge = false;

  /** Visual scale actually drawn: {@link gfxScale} × the override's `scale`. */
  get drawnScale(): number {
    return this.gfxScale * (this.displayOverride?.scale ?? 1);
  }

  constructor(
    readonly id: string,
    /** Mutable; the renderer merges partial updates onto this in place. */
    public spec: TSpec,
    readonly shape: IShape<TSpec>,
  ) {}
}
