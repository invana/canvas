/**
 * `CanvasContext` — the shared service surface every Layer / Behaviour /
 * Layout receives at mount/register time.
 *
 * Architecture: see `architecture-proposal.md` §2.4.
 *
 * **One context, three audiences.** Per the proposal, there is no separate
 * `LayerContext` / `BehaviourContext` / `LayoutContext` — the same shape is
 * handed to every participant so cross-cutting access (read peer layers,
 * fire camera moves, tap telemetry) doesn't need three parallel context types.
 *
 * The `Canvas` builds a concrete object that satisfies this interface and
 * passes it down. Tests can construct a stub by satisfying these fields.
 */

import type { Container } from 'pixi.js';
import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { Camera } from '../camera/Camera';
import type { LayerRegistry } from '../registries/LayerRegistry';
import type { BehaviourRegistry } from '../registries/BehaviourRegistry';

export interface CanvasContext {
  /** Layer registry — `add / remove / get<T>(id) / list / byZOrder`. */
  readonly layers: LayerRegistry;

  /**
   * Behaviour registry — `register / setEnabled / get<T>(id) / list`.
   * Behaviours never auto-enable; the developer registers + enables explicitly
   * (`architecture-proposal.md` §2.2).
   */
  readonly behaviours: BehaviourRegistry;

  /** Camera — pan/zoom/projection. Wraps a `pixi-viewport` `Viewport`. */
  readonly camera: Camera;

  /** Canvas-wide event bus + telemetry tap channel. */
  readonly events: CanvasEventBus;

  /**
   * The world container — a `pixi-viewport` `Viewport` instance. Camera-
   * transformed; `WorldLayer.mount` attaches its root sub-layer container
   * here. Typed as `Container` so domain code doesn't depend on
   * `pixi-viewport`; reach for the `Viewport`-specific API via
   * `camera.viewport`.
   */
  readonly world: Container;

  /**
   * The pixi `app.stage` (or test stage) — the renderer root. `ScreenLayer.mount`
   * attaches its root container here, as a sibling of `world`. Pixi's child
   * order = draw order: `world` is added first (bottom), each `ScreenLayer`'s
   * root is added after (above). No screen-wrapper container exists.
   */
  readonly stage: Container;
}
