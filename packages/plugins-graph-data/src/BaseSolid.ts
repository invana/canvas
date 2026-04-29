// ── BaseNode ─────────────────────────────────────────────────────────────────
// Abstract base class for all closed/filled elements.
// Subclasses must implement draw(), getBBox(), getCenter(), and getConnectionPoint().

import type { Container } from 'pixi.js';
import type { DrawContext } from './DrawContext.js';
import { LOD } from './LODController.js';
import type { BaseNodeSpec, BBox, DrawStyle, Point } from './spec/index.js';

/**
 * A per-element active animation slot.
 * Stored in {@link BaseSolid._animSlots}, keyed by animation type name.
 * @internal
 */
export interface AnimSlot {
  /** User-supplied options for this animation (immutable after start). */
  spec: Record<string, unknown>;
  /** Handler-owned mutable state — opaque at this level. */
  state: unknown;
}

/**
 * Abstract base class for all solid (closed/filled) elements managed by
 * {@link ElementPlugin}.
 *
 * @remarks
 * Four methods are abstract and must be implemented by each subclass:
 * - `draw()` — full appearance at the current LOD level
 * - `getBBox()` — bounding box for viewport culling + RBush indexing
 * - `getCenter()` — world-space anchor (used for the LOD dot and layout)
 * - `getConnectionPoint()` — perimeter point for connector attachment
 *
 * Everything else — state management, style resolution, dirty-flag propagation,
 * and lifecycle hooks — is provided by this base class.
 *
 * @example
 * ```ts
 * class DatabaseNode extends RectElement {
 *   draw(ctx: DrawContext, detail: LOD) {
 *     super.draw(ctx, detail);          // rect + label
 *     if (detail >= LOD.FULL) {
 *       ctx.fillEllipse(this.spec.x + this.spec.width / 2, this.spec.y + 8, 20, 8, { fill: '#1f6feb' });
 *     }
 *   }
 * }
 * elementPlugin.registerNode('database', DatabaseNode);
 * ```
 *
 * @typeParam S - The concrete spec type (must extend {@link BaseNodeSpec}).
 */
export abstract class BaseNode<S extends BaseNodeSpec = BaseNodeSpec> {
  /**
   * The current spec for this element.
   * Modified by {@link ElementPlugin.updateNode} — do not mutate directly in `draw()`.
   */
  spec: S;

  /**
   * Currently active state names.
   * States are toggled via {@link setState}; each active state's style override
   * is merged into the resolved style inside {@link resolveStyle}.
   *
   * @example Active states after hover + selection: `Set { 'hovered', 'selected' }`
   */
  readonly activeStates: Set<string> = new Set();

  /**
   * Called by {@link ElementObject} when the element needs a redraw.
   * Set automatically — do not override.
   * @internal
   */
  _onDirty?: () => void;

  /**
   * Reference to the owning `ElementObject`'s PixiJS `Container`.
   * Set by {@link ElementObject} constructor — do not set manually.
   * @internal
   */
  _container: Container | null = null;

  /**
   * Active animation slots keyed by type name (e.g. `'breathe'`, `'fadeIn'`).
   * Populated by {@link ElementPlugin.animate}; cleared by {@link ElementPlugin.clearAnimation}.
   * @internal
   */
  _animSlots = new Map<string, AnimSlot>();

  /**
   * Per-frame rendering overrides written by animation handlers each tick.
   * Read by {@link resolveStyle} for fill/stroke overrides and by
   * {@link ElementPlugin._applyContainerOverrides} for transform overrides.
   * @internal
   */
  _animOverrides: {
    /** Container scale factor (1 = no scale). Applied by `ElementPlugin._tick()`. */
    scale: number;
    /** Container alpha (1 = fully opaque). Applied by `ElementPlugin._tick()`. */
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
   * Draw this element using the provided {@link DrawContext}.
   *
   * @remarks
   * Called on every redraw (viewport entry, spec update, LOD change, state change).
   * Use `detail` to skip expensive draw calls at low zoom levels.
   *
   * @param ctx    - Drawing context.  No PixiJS imports needed.
   * @param detail - Current LOD level.  Typically only draw labels at `DETAIL`.
   */
  abstract draw(ctx: DrawContext, detail: LOD): void;

  /**
   * Axis-aligned bounding box for this element.
   * Used by {@link ElementPool} for RBush spatial indexing and viewport culling.
   * Must return a fresh object (not cached) — called after every spec update.
   */
  abstract getBBox(): BBox;

  /**
   * World-space centre of this element.
   * Used for the 2 px LOD dot rendered in `DOT` mode and for layout helpers.
   */
  abstract getCenter(): Point;

  /**
   * Perimeter point in the direction of the given world-space target.
   * Called by connectors to compute clean attachment positions.
   *
   * @param toX - X coordinate of the target (typically another element's centre).
   * @param toY - Y coordinate of the target.
   */
  abstract getConnectionPoint(toX: number, toY: number): Point;

  // ── Built-in methods ─────────────────────────────────────────────────────────

  /**
   * Precise hit-test for a world-space pointer position.
   * Default implementation uses the bbox; override for non-rectangular shapes.
   *
   * @param wx - Pointer world-space X.
   * @param wy - Pointer world-space Y.
   */
  hitTest(wx: number, wy: number): boolean {
    const b = this.getBBox();
    return wx >= b.minX && wx <= b.maxX && wy >= b.minY && wy <= b.maxY;
  }

  /**
   * Activate or deactivate a named state.
   *
   * @remarks
   * Triggers {@link onStateChange} and queues a redraw via {@link markDirty}.
   * Built-in state names used by `ElementPlugin`: `'hovered'`, `'selected'`.
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
   * Signal that this element's appearance has changed and a redraw is needed.
   * Safe to call from within lifecycle hooks or custom animation callbacks.
   */
  markDirty(): void {
    this._onDirty?.();
  }

  /**
   * Merge the base style with active-state overrides.
   * Priority order: `spec.style` → state styles (in activation order, last wins).
   *
   * @returns The resolved {@link DrawStyle} to pass to DrawContext methods.
   */
  resolveStyle(): DrawStyle {
    let style: DrawStyle = { ...(this.spec.style ?? {}) };
    for (const state of this.activeStates) {
      const override = this.spec.states?.[state];
      if (override) style = { ...style, ...override };
    }
    // Apply animation overrides (written by animation handlers each tick)
    if (this._animOverrides.colorOverride !== undefined) style = { ...style, fill: this._animOverrides.colorOverride };
    if (this._animOverrides.borderColor !== undefined) style = { ...style, stroke: this._animOverrides.borderColor };
    if (this._animOverrides.borderWidth !== undefined) style = { ...style, strokeWidth: this._animOverrides.borderWidth };
    return style;
  }

  // ── Optional lifecycle hooks (override in subclasses) ────────────────────────

  /**
   * Called once when the element is added to the scene (enters the viewport
   * for the first time after being registered).
   */
  onMount?(): void;

  /**
   * Called when the element's spec is updated via `ElementPlugin.updateNode()`.
   * Receives the previous and next spec values for diffing.
   *
   * @param prev - The spec before the update.
   * @param next - The spec after the update (same object as `this.spec`).
   */
  onUpdate?(prev: S, next: S): void;

  /** Called when the element is removed from the scene. Release custom resources here. */
  onDestroy?(): void;

  /**
   * Called whenever a state activates or deactivates (after `activeStates` is updated).
   *
   * @param state  - The state that changed.
   * @param active - New activation status.
   */
  onStateChange?(state: string, active: boolean): void;

  /**
   * Called each animation frame if the element has active animation callbacks.
   * Write style/transform overrides here, then call `markDirty()` to trigger a redraw.
   *
   * @param dt - Delta time in milliseconds since the last frame.
   */
  onAnimationTick?(dt: number): void;
}

// Re-export LOD so element authors can import it from one place.
export { LOD };
