// ── BaseShape ─────────────────────────────────────────────────────────────────
// Abstract base class for all closed/filled shape elements.
// Subclasses must implement draw(), getBBox(), getCenter(), and rayBoundaryHit().
//
// `getConnectionPoint()` is provided as a non-abstract default that calls
// `rayBoundaryHit()` (or, when the connector targets a named port, looks up
// the port's anchor on `getPorts()`). Most shapes only need to implement the
// boundary primitive.

import type { Container } from 'pixi.js';
import type { DrawContext } from './DrawContext.js';
import { LOD } from './LODController.js';
import type {
  BadgePosition,
  BadgeSpec,
  BaseShapeSpec,
  BBox,
  DrawStyle,
  HaloSpec,
  NodePort,
  Point,
} from './spec/index.js';
import { DEFAULT_NODE_STATES } from './defaultStates.js';

/** Default halo style applied when `spec.halo` is partially or fully omitted. */
const DEFAULT_HALO: Required<HaloSpec> = {
  color: '#7c3aed',
  width: 6,
  offset: 2,
  alpha: 0.35,
  visibleStates: ['selected'],
};

/**
 * A per-element active animation slot.
 * Stored in {@link BaseShape._animSlots}, keyed by animation type name.
 * @internal
 */
export interface AnimSlot {
  /** User-supplied options for this animation (immutable after start). */
  spec: Record<string, unknown>;
  /** Handler-owned mutable state — opaque at this level. */
  state: unknown;
}

/**
 * Abstract base class for all solid (closed/filled) shape elements managed by
 * {@link ShapesPlugin}.
 *
 * @remarks
 * Four methods are abstract and must be implemented by each subclass:
 * - `draw()` — full appearance at the current LOD level
 * - `getBBox()` — bounding box for viewport culling + RBush indexing
 * - `getCenter()` — world-space anchor (used for the LOD dot and layout)
 * - `getConnectionPoint()` — perimeter point for connector attachment
 *
 * @example
 * ```ts
 * class DatabaseShape extends RectShape {
 *   draw(ctx: DrawContext, detail: LOD) {
 *     super.draw(ctx, detail);          // rect + label
 *     if (detail >= LOD.FULL) {
 *       ctx.fillEllipse(this.spec.x + this.spec.width / 2, this.spec.y + 8, 20, 8, { fill: '#1f6feb' });
 *     }
 *   }
 * }
 * shapesPlugin.registerShape('database', DatabaseShape);
 * ```
 *
 * @typeParam S - The concrete spec type (must extend {@link BaseShapeSpec}).
 */
export abstract class BaseShape<S extends BaseShapeSpec = BaseShapeSpec> {
  /**
   * The current spec for this shape.
   * Modified by {@link ShapesPlugin.updateShape} — do not mutate directly in `draw()`.
   */
  spec: S;

  /**
   * Currently active state names.
   * States are toggled via {@link setState}; each active state's style override
   * is merged into the resolved style inside {@link resolveStyle}.
   */
  readonly activeStates: Set<string> = new Set();

  /**
   * Called by {@link ShapeObject} when the shape needs a redraw.
   * Set automatically — do not override.
   * @internal
   */
  _onDirty?: () => void;

  /**
   * Called by {@link ShapeObject} when the halo underlay needs a redraw.
   * Set automatically — do not override.
   * @internal
   */
  _onHaloDirty?: () => void;

  /**
   * Reference to the owning `ShapeObject`'s PixiJS `Container`.
   * Set by {@link ShapeObject} constructor — do not set manually.
   * @internal
   */
  _container: Container | null = null;

  /**
   * Active animation slots keyed by type name (e.g. `'breathe'`, `'fadeIn'`).
   * Populated by {@link ShapesPlugin.animate}; cleared by {@link ShapesPlugin.clearAnimation}.
   * @internal
   */
  _animSlots = new Map<string, AnimSlot>();

  /**
   * Per-frame rendering overrides written by animation handlers each tick.
   * @internal
   */
  _animOverrides: {
    /** Container scale factor (1 = no scale). Applied by `ShapesPlugin._tick()`. */
    scale: number;
    /** Container alpha (1 = fully opaque). Applied by `ShapesPlugin._tick()`. */
    alpha: number;
    /** Fill color override written by `colorCycleHandler`. */
    colorOverride?: string;
    /** Accumulated dash offset for animated borders (marchingAnts / dashedFlow). */
    dashOffset: number;
    /** Border stroke color override written by `marchingAntsHandler` / `borderGlowHandler`. */
    borderColor?: string;
    /** Border stroke width override written by `borderGlowHandler`. */
    borderWidth?: number;
  } = { scale: 1, alpha: 1, dashOffset: 0 };

  constructor(spec: S) {
    this.spec = spec;
  }

  // ── Abstract members ─────────────────────────────────────────────────────────

  /**
   * Draw this shape's body (geometry + label) using the provided
   * {@link DrawContext}. Subclasses implement only the silhouette + label;
   * decorations (icons, badges) and halos are layered automatically by the
   * non-abstract {@link draw} / {@link drawHalo} methods.
   *
   * @param ctx    - Drawing context. No PixiJS imports needed.
   * @param detail - Current LOD level. Typically only draw labels at `DETAIL`.
   */
  abstract drawBody(ctx: DrawContext, detail: LOD): void;

  /**
   * Stroke an outer halo silhouette into the halo underlay context.
   *
   * The default implementation draws a bounding-box-derived rounded rectangle
   * — fine for arbitrary custom shapes. Built-in shapes override this with
   * true outline-offset geometry so the halo hugs the silhouette (e.g. a
   * Diamond's halo is a bigger Diamond, not a rounded square).
   *
   * Implementations should return early if {@link isHaloActive} is false.
   *
   * @param ctx    - Halo drawing context (separate `Graphics` from the body).
   * @param detail - Current LOD level.
   */
  drawHalo(ctx: DrawContext, detail: LOD): void {
    if (detail === LOD.DOT || !this.isHaloActive()) return;
    const b = this.getBBox();
    const halo = this.resolveHalo();
    const pad = halo.offset + halo.width / 2;
    ctx.fillRect(
      b.minX - pad,
      b.minY - pad,
      (b.maxX - b.minX) + pad * 2,
      (b.maxY - b.minY) + pad * 2,
      { ...this.resolveHaloStyle(), cornerRadius: pad },
    );
  }

  /**
   * Axis-aligned bounding box for this shape.
   * Used by {@link ShapePool} for RBush spatial indexing and viewport culling.
   */
  abstract getBBox(): BBox;

  /**
   * World-space centre of this shape.
   * Used for the 2 px LOD dot rendered in `DOT` mode and for layout helpers.
   */
  abstract getCenter(): Point;

  /**
   * Boundary intersection along a ray cast from `origin` in unit direction
   * `dir`. Returns the world-space hit point on the shape's perimeter, or
   * `null` if the ray misses (rare — only when `origin` is outside the shape
   * and points away from it).
   *
   * Implementations should be O(1) where possible (analytic for circle /
   * ellipse / rect) and O(N) where N is the perimeter segment count
   * (polygon / polyline / flattened path).
   *
   * This is the single primitive used by `getConnectionPoint()` to compute
   * clean attachment positions. Subclasses typically only need to implement
   * this; `getConnectionPoint()` is provided as a default.
   */
  abstract rayBoundaryHit(origin: Point, dir: Point): Point | null;

  /**
   * Optional declared connection ports. Default: `undefined`.
   *
   * Shapes that override should return a stable list — the same `id` always
   * resolves to the same logical anchor; positions can move with the shape's
   * own movement / resize.
   *
   * Connectors targeting a named port via `sourcePortId` / `targetPortId` use
   * this; connectors without a port id fall through to {@link rayBoundaryHit}.
   */
  getPorts?(): NodePort[];

  /**
   * Perimeter point in the direction of the given world-space target.
   * Called by connectors to compute clean attachment positions.
   *
   * Resolution order:
   * 1. If `opts.portId` is set and `getPorts()` is implemented, return the
   *    port's anchor.
   * 2. Otherwise, ray-cast from the shape's centre in `opts.dir` (or, if
   *    omitted, in the chord direction towards `(toX, toY)`).
   *
   * Override only when the default ray-cast logic isn't appropriate.
   */
  getConnectionPoint(
    toX: number,
    toY: number,
    opts?: { dir?: Point; portId?: string },
  ): Point {
    if (opts?.portId && this.getPorts) {
      const port = this.getPorts().find((p) => p.id === opts.portId);
      if (port) return port.position;
    }
    const c = this.getCenter();
    let dx: number, dy: number;
    if (opts?.dir) {
      dx = opts.dir.x;
      dy = opts.dir.y;
    } else {
      dx = toX - c.x;
      dy = toY - c.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1e-9) return c;
      dx /= len;
      dy /= len;
    }
    return this.rayBoundaryHit(c, { x: dx, y: dy }) ?? c;
  }

  // ── Computed geometry ────────────────────────────────────────────────────────

  /**
   * Computed width of this shape derived from its bounding box.
   */
  get width(): number {
    const b = this.getBBox();
    return b.maxX - b.minX;
  }

  /**
   * Computed height of this shape derived from its bounding box.
   */
  get height(): number {
    const b = this.getBBox();
    return b.maxY - b.minY;
  }

  // ── Built-in methods ─────────────────────────────────────────────────────────

  /**
   * Template method. Renders the shape body via {@link drawBody}, then layers
   * the icon at the centre and badges around the bounding box. Subclasses
   * should override `drawBody` rather than this method.
   */
  draw(ctx: DrawContext, detail: LOD): void {
    this.drawBody(ctx, detail);
    if (detail >= LOD.FILL_BORDER && this.spec.icon) {
      const c = this.getCenter();
      const fallback = Math.min(this.width, this.height) * 0.4;
      ctx.drawIcon(c.x, c.y, this.spec.icon, fallback);
    }
    if (detail >= LOD.DETAIL && this.spec.badges?.length) {
      this._drawBadges(ctx);
    }
  }

  /**
   * Precise hit-test for a world-space pointer position.
   * Default implementation uses the bbox; override for non-rectangular shapes.
   */
  hitTest(wx: number, wy: number): boolean {
    const b = this.getBBox();
    return wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
  }

  /**
   * Activate or deactivate a named state.
   *
   * @param state  - State name.
   * @param active - `true` to activate, `false` to deactivate.
   */
  setState(state: string, active: boolean): void {
    if (active) {
      this.activeStates.add(state);
    } else {
      this.activeStates.delete(state);
    }
    this.onStateChange?.(state, active);
    this.markDirty();
    if (this._isHaloVisibleState(state)) this._onHaloDirty?.();
  }

  /**
   * Signal that this shape's appearance has changed and a redraw is needed.
   */
  markDirty(): void {
    this._onDirty?.();
  }

  // ── Halo helpers ─────────────────────────────────────────────────────────────

  /**
   * Resolved halo settings (defaults merged with `spec.halo`).
   * Concrete `drawHalo` implementations call this to get final colour, width,
   * offset and alpha.
   */
  resolveHalo(): Required<HaloSpec> {
    return { ...DEFAULT_HALO, ...(this.spec.halo ?? {}) };
  }

  /**
   * `true` when at least one of the halo's `visibleStates` is currently active.
   * Concrete `drawHalo` implementations use this to short-circuit early.
   */
  isHaloActive(): boolean {
    const halo = this.resolveHalo();
    if (halo.visibleStates.length === 0) return false;
    for (const state of halo.visibleStates) {
      if (this.activeStates.has(state)) return true;
    }
    return false;
  }

  /**
   * The {@link DrawStyle} to pass to a stroke-only fill primitive when
   * drawing the halo (transparent fill, halo color stroke at halo width).
   */
  resolveHaloStyle(): DrawStyle {
    const halo = this.resolveHalo();
    return {
      fill: '#000000',
      fillAlpha: 0,
      stroke: halo.color,
      strokeWidth: halo.width,
      strokeAlpha: halo.alpha,
    };
  }

  private _isHaloVisibleState(state: string): boolean {
    const halo = this.resolveHalo();
    return halo.visibleStates.includes(state);
  }

  // ── Decoration rendering ─────────────────────────────────────────────────────

  /**
   * Map a {@link BadgePosition} anchor to a world-space point on the shape's
   * bounding box, offset outward by `offsetPx`.
   */
  protected _badgeAnchor(position: BadgePosition, offsetPx: number): Point {
    const b = this.getBBox();
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    switch (position) {
      case 'T':  return { x: cx,         y: b.minY - offsetPx };
      case 'B':  return { x: cx,         y: b.maxY + offsetPx };
      case 'L':  return { x: b.minX - offsetPx, y: cy };
      case 'R':  return { x: b.maxX + offsetPx, y: cy };
      case 'TL': return { x: b.minX - offsetPx, y: b.minY - offsetPx };
      case 'TR': return { x: b.maxX + offsetPx, y: b.minY - offsetPx };
      case 'BL': return { x: b.minX - offsetPx, y: b.maxY + offsetPx };
      case 'BR': return { x: b.maxX + offsetPx, y: b.maxY + offsetPx };
    }
  }

  private _drawBadges(ctx: DrawContext): void {
    const badges = this.spec.badges;
    if (!badges) return;
    for (const badge of badges) {
      this._drawBadge(ctx, badge);
    }
  }

  private _drawBadge(ctx: DrawContext, badge: BadgeSpec): void {
    const offset = badge.offset ?? 4;
    const { x, y } = this._badgeAnchor(badge.position, offset);
    ctx.drawBadge(x, y, badge);
  }

  /**
   * Merge the base style with active-state overrides.
   *
   * @returns The resolved {@link DrawStyle} to pass to DrawContext methods.
   */
  resolveStyle(): DrawStyle {
    let style: DrawStyle = { ...(this.spec.style ?? {}) };
    for (const state of this.activeStates) {
      // Built-in default first, then user spec.states override (higher priority).
      const fallback = DEFAULT_NODE_STATES[state];
      if (fallback) style = { ...style, ...fallback };
      const override = this.spec.states?.[state];
      if (override) style = { ...style, ...override };
    }
    if (this._animOverrides.colorOverride !== undefined) style = { ...style, fill: this._animOverrides.colorOverride };
    if (this._animOverrides.borderColor !== undefined) style = { ...style, stroke: this._animOverrides.borderColor };
    if (this._animOverrides.borderWidth !== undefined) style = { ...style, strokeWidth: this._animOverrides.borderWidth };
    return style;
  }

  // ── Optional lifecycle hooks ─────────────────────────────────────────────────

  /** Called once when the shape enters the viewport for the first time. */
  onMount?(): void;

  /**
   * Called when the shape's spec is updated via `ShapesPlugin.updateShape()`.
   */
  onUpdate?(prev: S, next: S): void;

  /** Called when the shape is removed from the scene. */
  onDestroy?(): void;

  /** Called whenever a state activates or deactivates. */
  onStateChange?(state: string, active: boolean): void;

  /**
   * Called each animation frame if the shape has active animation callbacks.
   */
  onAnimationTick?(dt: number): void;
}

// Re-export LOD so shape authors can import it from one place.
export { LOD };

// ── Backward-compatibility alias ─────────────────────────────────────────────
/** @deprecated Use {@link BaseShape} instead. */
export { BaseShape as BaseNode };
