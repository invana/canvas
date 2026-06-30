/**
 * Shared **geometry vocabulary** for the kernel — `Point` / `Vec2` / `Size` /
 * `Rect` / `CameraTransform`. Relocated from the engine so the renderer-free
 * kernel (node positions, the abstract camera, bounds, derived group geometry)
 * and every adapter speak the same coordinate types **without importing a drawing
 * library**. The pixi renderer (`@invana/canvas`) maps these onto its own
 * `Container`/`Viewport` transforms.
 */

/** A 2-D point in world space. */
export interface Point {
  x: number;
  y: number;
}

/** A 2-D vector (direction / delta). Structurally identical to {@link Point}. */
export interface Vec2 {
  x: number;
  y: number;
}

/** Width × height extent. */
export interface Size {
  width: number;
  height: number;
}

/** Axis-aligned bounding box. */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * The **abstract camera transform** (C2) — renderer-agnostic: where world `(0,0)`
 * sits in the view (`x`/`y`) plus a uniform `zoom`. Never a `pixi-viewport`
 * handle; the renderer projects this onto its own viewport.
 */
export interface CameraTransform {
  x: number;
  y: number;
  zoom: number;
}
