/**
 * Types for the DevInfoLayer editor.
 *
 * Engine-agnostic by design: `@invana/canvas` (where `DevInfoLayer` and its
 * options live) is **not** imported — canvas-ui may only use `@invana/graph`
 * types (see package CLAUDE.md). So the editable option shape is mirrored here
 * as {@link DevInfoLayerOptions}, a plain serialisable patch the consumer
 * applies via `setOptions`. The mirror is structural, not derived, so it can't
 * `Pick` from the engine — keep it in sync with `DevInfoLayerOptions` by hand.
 */

/** Which corner the overlay anchors to. Mirrors the engine's `DevInfoCorner`. */
export type DevInfoCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

/**
 * The subset of `DevInfoLayerOptions` this editor produces — a serialisable
 * patch. The base `id` / `enabled` (and `zIndex`, init-only) fields are out of
 * scope; only the display knobs round-trip. `margin` keeps the engine's
 * `number | { x?, y? }` encoding (per-axis inset), re-fused in `mapping.ts`.
 */
export interface DevInfoLayerOptions {
  /** Which corner to anchor the overlay. */
  corner?: DevInfoCorner;
  /** Inset from the chosen corner in screen pixels — uniform or per-axis. */
  margin?: number | { x?: number; y?: number };
  /** Font size in px. */
  fontSize?: number;
  /** Panel opacity 0–1. */
  opacity?: number;
  /** Overlay background CSS colour (may be `rgba(...)`, hence a free string). */
  backgroundColor?: string;
  /** Text colour (`#rrggbb`). */
  textColor?: string;
  /** Accent / header colour (`#rrggbb`). */
  accentColor?: string;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The engine's
 * `margin: number | { x?, y? }` union is flattened into two scalar fields —
 * `marginX` / `marginY` (see `mapping.ts`), since a single field can't be both.
 */
export interface DevInfoLayerFields {
  corner?: DevInfoCorner;
  /** Horizontal inset in px. Maps into `margin`. */
  marginX?: number;
  /** Vertical inset in px. Maps into `margin`. */
  marginY?: number;
  fontSize?: number;
  opacity?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface DevInfoLayerFormState {
  options: DevInfoLayerFields;
}
