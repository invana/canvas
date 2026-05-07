/**
 * Public type surface for the `draw/` module — pure-function paint primitives.
 *
 * Primitives have ONE responsibility each:
 *   - shape primitive    : emit a shape's geometry into a Graphics
 *   - connector primitive: emit a polyline into a Graphics (no markers, no labels)
 *   - text primitive     : mount a Text/HTMLText display object into a Container
 *   - router             : pure (endpoints) → polyline
 *   - decoration         : emit decoration geometry given host bounds
 *
 * Composition (an edge that has an arrow, a node that has a label, a rack that
 * has blinking lights) is a Layer concern, not a primitive concern. The draw
 * module never composes two primitives into one — that's the layer's job.
 */

import type { Container, Graphics, Texture } from 'pixi.js';

// ─── Fill input ───────────────────────────────────────────────────────────

/**
 * Accepted value for `fill` in shape specs.
 *
 * - `number` — solid color (e.g. `0x4f9cf9`). `fillAlpha` controls opacity.
 * - `Texture` — image projected onto the shape geometry. The shape boundary
 *   acts as the clip mask; sizing is controlled by `fillFit`.
 *   Use `TextureRegistry` to load and share textures by URL.
 */
export type FillInput = number | Texture;

/**
 * Controls how a texture fill is sized within a shape's bounding box.
 * Only meaningful when `fill` is a `Texture`; ignored for solid-color fills.
 *
 * - `'fill'`       — stretch to fit exactly (default). Ignores aspect ratio.
 * - `'cover'`      — scale uniformly so the image covers the box; crops the overflow. Centered.
 * - `'none'`       — natural pixel size, centered. Larger images are cropped; smaller images
 *                    show the clamped edge pixel in the gap (PixiJS UV clamp limitation).
 * - `'scale-down'` — like `'none'` but downscales when the image is larger than the box.
 *                    Never upscales — equivalent to `min(none, contain)`.
 *
 * Note: `'contain'` is intentionally omitted. PixiJS clamps out-of-range UVs to the
 * edge pixel, so letterbox gaps fill with the image border rather than being transparent.
 */
export type FillFit = 'fill' | 'cover' | 'none' | 'scale-down';

// ─── Geometry primitives ───────────────────────────────────────────────────

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface Vec2 {
  readonly x: number;
  readonly y: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Endpoint anchor a router consumes — point + optional outgoing tangent. */
export interface Endpoint {
  readonly x: number;
  readonly y: number;
  readonly tangent?: Vec2;
}

// ─── Spec base shapes ──────────────────────────────────────────────────────

export interface BaseShapeSpec {
  readonly kind: string;
  readonly x: number;
  readonly y: number;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}

/**
 * Minimal connector spec. Note: NO marker / label fields. A connector
 * primitive draws a polyline — nothing else. Layers compose markers/labels
 * as separate shape entries.
 */
export interface BaseConnectorSpec {
  readonly kind: string;
  readonly source: ConnectorEndpointSpec;
  readonly target: ConnectorEndpointSpec;
  /** Registered router kind. Default `'straight'`. */
  readonly router?: string;
  readonly zIndex?: number;
  readonly alpha?: number;
  readonly visible?: boolean;
}

export type ConnectorEndpointSpec =
  | { readonly kind: 'point'; readonly x: number; readonly y: number; readonly tangent?: Vec2 }
  | { readonly kind: 'shape'; readonly shapeId: string };

// ─── Descriptor types ──────────────────────────────────────────────────────

/**
 * Shape primitive descriptor.
 *
 * `draw` emits the shape's geometry into the supplied Graphics, baking the
 * affine transform `(ox, oy, rot)` into emitted vertex coordinates. No
 * Container ownership, no Graphics ownership, no `this`.
 *
 * Symmetric shapes (circle) ignore `rot`. Asymmetric shapes (arrow, polygon)
 * use it. Default origin is (0, 0) — the renderer positions the parent
 * Container at `(spec.x, spec.y)`, so embedded callers (compounds in a
 * higher-level layer) pass a non-zero origin to draw at an offset.
 */
export interface ShapeKind<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  draw(g: Graphics, spec: TSpec, ox?: number, oy?: number, rot?: number): void;
  bounds(spec: TSpec): Rect;
  contains?(spec: TSpec, lx: number, ly: number): boolean;
}

/**
 * Connector primitive descriptor.
 *
 * `draw` emits a polyline into the supplied Graphics. Nothing else —
 * no markers, no labels. The polyline arrives pre-routed (the renderer
 * runs the registered router and caches the result).
 *
 * `bounds` returns the polyline AABB inflated by stroke half-width.
 */
export interface ConnectorKind<TSpec extends BaseConnectorSpec = BaseConnectorSpec> {
  draw(g: Graphics, polyline: ReadonlyArray<Point>, spec: TSpec): void;
  bounds(polyline: ReadonlyArray<Point>, spec: TSpec): Rect;
}

/**
 * Text primitive descriptor.
 *
 * Text is fundamentally different from geometric primitives: Pixi `Text` /
 * `HTMLText` are their own display objects (rasterised glyphs on a texture),
 * not Graphics calls. They cannot share a parent's Graphics like circles can.
 *
 * Instead of `draw(g, ...)`, text primitives `mount` a display object into a
 * supplied parent Container and return a `TextHandle` for subsequent updates.
 * The renderer holds the handle and calls `update` on spec changes,
 * `setLabelResolution` on zoom changes.
 */
export interface TextKind<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  mount(parent: Container, spec: TSpec, ox?: number, oy?: number, rot?: number): TextHandle<TSpec>;
  bounds(handle: TextHandle<TSpec>): Rect;
}

export interface TextHandle<TSpec extends BaseShapeSpec = BaseShapeSpec> {
  update(spec: TSpec, ox?: number, oy?: number, rot?: number): void;
  setLabelResolution?(resolution: number): void;
  setLODLevel?(level: number): void;
  destroy(): void;
}

/**
 * A router is a pure function — endpoints in, polyline out. Routers never
 * touch pixi; trivially testable and re-runnable per frame.
 */
export type Router = (
  source: Endpoint,
  target: Endpoint,
  opts?: Record<string, unknown>,
) => ReadonlyArray<Point>;

/**
 * Static decoration descriptor.
 *
 * `draw` emits decoration geometry into the supplied Graphics given host
 * bounds + style options. `hostKind` is supplied so a decoration can vary
 * its outline by host shape (circle hosts get a circular halo, rect hosts
 * get a rounded-rect halo).
 *
 * `setup` (optional) is called once when the decoration is first installed
 * on its host's slot Container, before any `draw`. Used for one-time
 * Container-level setup that can't be expressed as Graphics calls — e.g.
 * applying a `BlurFilter` for glow. Decorations that don't need it omit
 * the hook.
 */
export interface StaticDecorationKind<TOpts> {
  setup?(slot: Container, opts: TOpts): void;
  draw(g: Graphics, bounds: Rect, opts: TOpts, hostKind?: string): void;
}

/**
 * Animated decoration constructor. The decoration owns animation state
 * (phase, elapsed) and a `tick` method. The renderer hands it both the slot
 * Container (so the decoration can animate transforms cheaply — e.g.
 * rotating a pre-stamped dashed ring) and a Graphics for emit calls.
 * Decorations never create their own Container or Graphics.
 */
export type AnimatedDecorationCtor<TOpts> = new (
  slot: Container,
  g: Graphics,
  opts: TOpts,
) => AnimatedDecoration;

export interface AnimatedDecoration {
  /** Re-render with new host bounds (called on host spec change). */
  update(bounds: Rect, hostKind?: string): void;
  /** Advance animation by `deltaMs`. Return `false` to retire (renderer drops it). */
  tick(deltaMs: number): boolean;
  /** Final cleanup. Renderer is responsible for clearing the Graphics afterwards. */
  destroy(): void;
}
