// ── AnimationRegistry (element-plugin) ────────────────────────────────────────
// Defines the AnimationHandler contract and the registry that maps type names
// to their handler objects.  Adapted from shape-plugin's AnimationRegistry —
// handlers now receive a BaseSolid instead of a ShapeObject.

import type { BaseNode as BaseSolid, AnimSlot } from './BaseSolid.js';
import type { ElementHaloPool } from './ElementHaloPool.js';

export type { AnimSlot };

/**
 * Contract for a self-contained, frame-driven animation handler for
 * {@link ElementPlugin} solid elements.
 *
 * @typeParam TSpec  - User-facing options (no `type` field needed).
 * @typeParam TState - Mutable internal state owned by this handler per element.
 *
 * @remarks
 * Register custom animation types on {@link defaultRegistry}:
 * ```ts
 * import { defaultRegistry } from '@invana/canvas';
 * defaultRegistry.register({
 *   type: 'shimmer',
 *   init: () => ({ phase: 0 }),
 *   tick: (state, _spec, dt) => { state.phase += dt / 600; return { dirty: true, stop: false }; },
 *   apply: (state, _spec, obj) => { obj._animOverrides.colorOverride = `hsl(${state.phase * 60},80%,70%)`; },
 *   cleanup: (_state, obj) => { obj._animOverrides.colorOverride = undefined; },
 * });
 * ```
 */
export interface AnimationHandler<TSpec = Record<string, unknown>, TState = unknown> {
  /** Unique type identifier — matches the key used in {@link ElementAnimations}. */
  readonly type: string;

  /**
   * Create initial mutable state when this animation is started on an element.
   *
   * @param spec   - User-supplied options.
   * @param obj    - The target {@link BaseSolid}.
   * @param halos  - The {@link ElementHaloPool} (required by `pulse` to rent a halo graphics).
   */
  init(spec: TSpec, obj: BaseSolid, halos: ElementHaloPool): TState;

  /**
   * Advance animation state by one frame.
   *
   * @param state    - Mutable state created by {@link init}.
   * @param spec     - User-supplied options (treat as immutable).
   * @param deltaMS  - Milliseconds elapsed since the last frame.
   * @returns `dirty` — redraw needed; `stop` — animation has finished.
   */
  tick(state: TState, spec: TSpec, deltaMS: number): { dirty: boolean; stop: boolean };

  /**
   * Apply the current state to the element.
   * Should write only to {@link BaseSolid._animOverrides}.
   * Container-level transforms (scale, alpha) are applied centrally by
   * {@link ElementPlugin._applyContainerOverrides} after all handlers run.
   *
   * @param state  - Current animation state.
   * @param spec   - User-supplied options.
   * @param obj    - The target {@link BaseSolid}.
   * @param halos  - The {@link ElementHaloPool} (required by `pulse`).
   */
  apply(state: TState, spec: TSpec, obj: BaseSolid, halos: ElementHaloPool): void;

  /**
   * Reset any display state touched by this animation back to defaults.
   * Called when the animation is stopped (explicitly or auto-stop).
   */
  cleanup?(state: TState, obj: BaseSolid, halos: ElementHaloPool): void;
}

/**
 * Registry mapping animation type names to their {@link AnimationHandler} implementations.
 *
 * @remarks
 * The singleton {@link defaultRegistry} is pre-loaded with all built-in handlers.
 * External code can call `defaultRegistry.register(myHandler)` to add new types.
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

  /** Look up a handler by its type name. */
  get(type: string): AnimationHandler<any, any> | undefined {
    return this._map.get(type);
  }

  /** Returns `true` if a handler for the given type has been registered. */
  has(type: string): boolean {
    return this._map.has(type);
  }
}
