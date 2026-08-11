/**
 * Hit-test result shape.
 *
 * Part of the pixi-free spec vocabulary — see `docs/renderer-split-design.md`.
 */

export interface HitResult {
  readonly kind: 'shape' | 'connector';
  readonly id: string;
  /** Optional sub-region (e.g. a connector handle, a shape sub-part). */
  readonly subId?: string;
}

// ─── Events emitted by the renderer ────────────────────────────────────────

/**
 * Raw, DOM-level events the `PrimitivesRenderer` surfaces. No semantic
 * interpretation — they describe pointer hits on shapes / connectors and
 * nothing more. Layers translate them into domain events.
 */
