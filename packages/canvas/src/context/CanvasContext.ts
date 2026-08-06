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
import type { IOverlayDevice, OverlaySpace } from '../renderer/IOverlayDevice';
import type { CanvasStore } from '@invana/canvas-store';
import type { CanvasEventBus } from '@invana/canvas-store';
import type { Camera } from '../camera/Camera';
import type { GestureArbiter } from '../input/GestureArbiter';
import type { LayerRegistry } from '../registries/LayerRegistry';
import type { BehaviourRegistry } from '../registries/BehaviourRegistry';
import type { ThemeState } from '../theme/types';

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

  /**
   * Pointer-gesture arbitration — at most one owner at a time. A behaviour that
   * needs the pointer to itself (drag, lasso, brush, resize, edge draw) claims
   * it here rather than suspending the camera's pan plugin behind its back;
   * `DragPanBehaviour` yields whenever `gestures.owner` names somebody else.
   *
   * Behaviours should reach for `Behaviour.claimGesture` /
   * `Behaviour.releaseGesture` instead of calling this directly — the base class
   * releases on `disable()` / `destroy()`, and a stranded claim would freeze
   * both the camera and every other gesture.
   */
  readonly gestures: GestureArbiter;

  /** Canvas-wide event bus + telemetry tap channel. */
  readonly events: CanvasEventBus;

  /**
   * The renderer-free kernel (`@invana/canvas-store`) — `view` (reactive config +
   * interaction state), `data` (bulk per-source stores), `events`, `theme`,
   * history. The cross-cutting handle for the state migration: layers
   * read/subscribe `store.data[id]` + `store.view`; behaviours write interaction
   * via `store.view.update(...)`. During M0 the engine mirrors its config into
   * `store.view.definition` (see `Canvas.update`).
   */
  readonly store: CanvasStore;

  /**
   * The active theme channel. A single publisher (the domain `ThemeBehaviour`)
   * calls `theme.set(...)`; theme-aware layers read `theme.current()` and/or
   * subscribe to the `'theme:change'` event to recolour. `current()` is `null`
   * until a theme is first published.
   */
  readonly theme: ThemeState;

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

  /**
   * The underlying HTMLCanvasElement when running in DOM mode (`Canvas.init`).
   * Undefined for `Canvas.initWithStage` (headless / test path). Layers that
   * overlay DOM content above the canvas — `DevInfoLayer`, tooltips, popovers —
   * read this to find a parent element and to attach native DOM listeners.
   */
  readonly canvasElement?: HTMLCanvasElement;

  /**
   * A drawing device for a **transient** visual — a lasso, a brush rectangle, a
   * drag ghost. Not for layer content: anything durable is a spec in the store
   * (`docs/renderer-split-design.md` §3).
   *
   * Available to behaviours as well as layers, because a gesture overlay belongs
   * to the gesture, not to any one layer.
   */
  createOverlay(label: string, space?: OverlaySpace): IOverlayDevice;

  /**
   * Show a transient message on the shared canvas message channel — the same
   * call as `Canvas.showMessage`. Lets layers / behaviours / layouts surface a
   * status line (e.g. a layout announcing "Running…" on start) without reaching
   * for the bus directly. `timeout` (ms) auto-clears it.
   */
  showMessage(text: string, timeout?: number): void;

  /** Clear the current canvas message. */
  clearMessage(): void;
}
