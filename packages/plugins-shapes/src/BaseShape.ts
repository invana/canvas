// ── BaseShape ─────────────────────────────────────────────────────────────────
// Abstract base class for all closed/filled shape elements.
// Subclasses must implement draw(), getBBox(), getCenter(), and getConnectionPoint().

import type { Container } from 'pixi.js';
import type { DrawContext } from './DrawContext.js';
import { LOD } from './LODController.js';
import type { BaseShapeSpec, BBox, DrawStyle, Point } from './spec/index.js';
import { DEFAULT_NODE_STATES } from './defaultStates.js';

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
   * Draw this shape using the provided {@link DrawContext}.
   *
   * @param ctx    - Drawing context.  No PixiJS imports needed.
   * @param detail - Current LOD level.  Typically only draw labels at `DETAIL`.
   */
  abstract draw(ctx: DrawContext, detail: LOD): void;

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
   * Perimeter point in the direction of the given world-space target.
   * Called by connectors to compute clean attachment positions.
   */
  abstract getConnectionPoint(toX: number, toY: number): Point;

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
  }

  /**
   * Signal that this shape's appearance has changed and a redraw is needed.
   */
  markDirty(): void {
    this._onDirty?.();
  }

  /**
   * Merge the base style with active-state overrides.
   *
   * @returns The resolved {@link DrawStyle} to pass to DrawContext methods.
   */
  resolveStyle(): DrawStyle {
    let style: DrawStyle = { ...(this.spec.style ?? {}) };
    for (const state of this.activeStates) {
      // Built-in G6-style default first, then user spec.states override (higher priority).
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
