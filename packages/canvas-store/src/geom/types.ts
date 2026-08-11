/**
 * Shared **geometry vocabulary** for the kernel — `Point` / `Vec2` / `Size` /
 * `Rect` / `CameraTransform`. Relocated from the engine so the renderer-free
 * kernel (node positions, the abstract camera, bounds, derived group geometry)
 * and every adapter speak the same coordinate types **without importing a drawing
 * library**. The pixi renderer (`@invana/canvas`) maps these onto its own
 * `Container`/`Viewport` transforms.
 */

/**
 * These four are the **single** definition in the repo. The spec vocabulary
 * (`../specs/geometry`) re-exports them rather than declaring its own — before
 * `specs/` moved into the kernel there were two `Rect`s with different mutability,
 * which is exactly the confusion this consolidation removes. Fields are `readonly`:
 * coordinates are computed and replaced wholesale, never patched in place.
 */

/** A 2-D point in world space. */
export interface Point {
  readonly x: number;
  readonly y: number;
}

/** A 2-D vector (direction / delta). Structurally identical to {@link Point}. */
export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

/** Width × height extent. */
export interface Size {
  readonly width: number;
  readonly height: number;
}

/** Axis-aligned bounding box. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
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
