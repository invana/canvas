// ── AnimationRegistry ─────────────────────────────────────────────────────────
// Defines the AnimationHandler contract and the registry that maps type names
// to their handler objects. New animation types are added solely by registering
// a handler — no changes to AnimationTicker or ShapeObject are required.

import type { ShapeObject } from './ShapeObject.js';
import type { HaloPool } from './HaloPool.js';

/**
 * Contract for a self-contained, frame-driven animation handler.
 *
 * @typeParam TSpec  - User-facing options for this animation (no `type` field needed).
 * @typeParam TState - Mutable internal state owned by this handler per active shape.
 *
 * @remarks
 * Handlers are registered on an {@link AnimationRegistry} and dispatched per-frame
 * by {@link AnimationTicker}. Each handler owns its own state — there is no shared
 * flat `_animState` on {@link ShapeObject}.
 *
 * Adding a new animation type only requires:
 * 1. Creating a handler that satisfies this interface.
 * 2. Calling `defaultRegistry.register(myHandler)`.
 *
 * @example
 * ```ts
 * const wobbleHandler: AnimationHandler<{ speed?: number }, { phase: number }> = {
 *   type: 'wobble',
 *   init: () => ({ phase: 0 }),
 *   tick: (state, spec, dt) => {
 *     state.phase += dt / (spec.speed ?? 500);
 *     return { dirty: true, stop: false };
 *   },
 *   apply: (state, _spec, obj) => { obj._animOverrides.scale = 1 + Math.sin(state.phase) * 0.05; },
 *   cleanup: (_state, obj) => { obj._animOverrides.scale = 1; },
 * };
 * defaultRegistry.register(wobbleHandler);
 * ```
 */
export interface AnimationHandler<TSpec = Record<string, unknown>, TState = unknown> {
  /** Unique type identifier — matches the key used in {@link ShapeAnimations}. */
  readonly type: string;

  /**
   * Create initial mutable state when this animation is started on a shape.
   *
   * @param spec   - User-supplied options for this animation.
   * @param obj    - The target {@link ShapeObject}.
   * @param halos  - The {@link HaloPool} (required by `pulse` to rent a halo graphics instance).
   */
  init(spec: TSpec, obj: ShapeObject, halos: HaloPool): TState;

  /**
   * Advance animation state by one frame.
   * Called every tick by {@link AnimationTicker} for each active slot.
   *
   * @param state    - Mutable state object created by {@link init}.
   * @param spec     - User-supplied options (treat as immutable).
   * @param deltaMS  - Milliseconds elapsed since the last frame.
   * @returns
   *   `dirty` — `true` if the shape's main `Graphics` needs a redraw this frame.
   *   `stop`  — `true` if the animation has finished and should be removed.
   */
  tick(state: TState, spec: TSpec, deltaMS: number): { dirty: boolean; stop: boolean };

  /**
   * Apply the current state to the shape's display objects.
   * Always called after {@link tick}, regardless of the `dirty` flag.
   * Should write only to {@link ShapeObject._animOverrides} or PixiJS `Container`
   * properties (scale, alpha). Must not allocate per-frame.
   *
   * @param state  - Current animation state.
   * @param spec   - User-supplied options.
   * @param obj    - The target {@link ShapeObject}.
   * @param halos  - The {@link HaloPool} (required by `pulse` to redraw rings).
   */
  apply(state: TState, spec: TSpec, obj: ShapeObject, halos: HaloPool): void;

  /**
   * Reset any display state touched by this animation back to defaults.
   * Called when the animation is stopped — either explicitly by the user
   * or when `stop: true` is returned from {@link tick}.
   *
   * @param state  - Final animation state at the time of stopping.
   * @param obj    - The target {@link ShapeObject}.
   * @param halos  - The {@link HaloPool} (required by `pulse` to return rented graphics).
   */
  cleanup?(state: TState, obj: ShapeObject, halos: HaloPool): void;
}

/**
 * A per-shape active animation slot stored in {@link ShapeObject._animSlots}.
 *
 * @internal
 */
export interface AnimSlot {
  /** User-supplied options for this animation (immutable after start). */
  spec: Record<string, unknown>;
  /** Handler-owned mutable state — opaque at this level. */
  state: unknown;
}

/**
 * Registry mapping animation type names to their {@link AnimationHandler} implementations.
 *
 * @remarks
 * The singleton {@link defaultRegistry} is pre-loaded with all built-in handlers.
 * External code can call `defaultRegistry.register(myHandler)` to add new
 * animation types without modifying any core file.
 *
 * @example
 * ```ts
 * import { defaultRegistry } from '@invana/canvas-core-new';
 *
 * defaultRegistry.register({
 *   type: 'shimmer',
 *   init: () => ({ phase: 0 }),
 *   tick: (state, _spec, dt) => { state.phase += dt / 600; return { dirty: true, stop: false }; },
 *   apply: (state, _spec, obj) => { obj._animOverrides.colorOverride = `hsl(${state.phase * 60},80%,70%)`; },
 *   cleanup: (_state, obj) => { obj._animOverrides.colorOverride = undefined; },
 * });
 * ```
 */
export class AnimationRegistry {
  private _map = new Map<string, AnimationHandler<any, any>>();

  /**
   * Register an animation handler.
   * If a handler with the same `type` is already registered it is replaced.
   *
   * @param handler - The handler to register.
   * @returns `this` for chaining.
   */
  register(handler: AnimationHandler<any, any>): this {
    this._map.set(handler.type, handler);
    return this;
  }

  /**
   * Look up a handler by its type name.
   *
   * @param type - Animation type string (e.g. `'breathe'`).
   * @returns The registered handler, or `undefined` if none found.
   */
  get(type: string): AnimationHandler<any, any> | undefined {
    return this._map.get(type);
  }

  /**
   * Returns `true` if a handler for the given type has been registered.
   *
   * @param type - Animation type string.
   */
  has(type: string): boolean {
    return this._map.has(type);
  }
}
