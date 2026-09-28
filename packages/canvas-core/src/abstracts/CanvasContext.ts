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

import type { IOverlayDevice, OverlaySpace } from '../contracts/IOverlayDevice';
import type { ISurface, SurfaceOptions, SurfaceSpace } from '../contracts/ISurface';
import type { CanvasStore } from '../state/CanvasStore';
import type { ReactiveStore } from '../state/port/types';
import type { OperationLog } from '../state/log/types';
import type { CanvasEventBus } from '../state/events/CanvasEventBus';
import type { Camera } from './Camera';
import type { GestureArbiter } from './GestureArbiter';
import type { LayerRegistry } from './registries/LayerRegistry';
import type { BehaviourRegistry } from './registries/BehaviourRegistry';
import type { CommandRegistry } from './registries/CommandRegistry';
import type { ThemeState } from '../state/theme/types';
import type { LayoutRunOptions } from './Layout';

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
   * The underlying HTMLCanvasElement when running in DOM mode (`Canvas.init`).
   * Undefined for `Canvas.initWithStage` (headless / test path). Layers that
   * overlay DOM content above the canvas — `DevInfoLayer`, tooltips, popovers —
   * read this to find a parent element and to attach native DOM listeners.
   */
  readonly canvasElement?: HTMLCanvasElement;

  /**
   * The canvas's named commands (`canvas.commands`) — for an extension that
   * dispatches by name, such as a keyboard-shortcut behaviour. Optional so a
   * hand-built context (a test double) needn't supply one.
   */
  readonly commands?: CommandRegistry<unknown>;

  /**
   * The canvas's operation log — the record behind `canvas.history`. A data
   * layer attaches its store here on mount (`GraphStore.attachLog`) so the
   * store's recorded writes and the view's edits land in one undo order.
   * Optional so a hand-built context (a test double) needn't supply one.
   */
  readonly log?: OperationLog;

  /**
   * Build a patch-emitting {@link ReactiveStore} — the factory behind
   * `Layer.state`. Injected by the engine (which implements it with the
   * kernel's `createReactiveStore`) because this package is dependency-free
   * and cannot construct a store itself; the seam is also what makes the
   * backend swappable (a collaborative canvas injects a Yjs-backed factory).
   */
  createStateStore<T extends object>(initial: T): ReactiveStore<T>;

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
   * A layer's slice of the renderer — its drawing device, overlays, visibility
   * and paint order. Replaces the layer bases constructing a pixi `Container`
   * themselves, and is the seam a second backend implements
   * (`docs/renderer-split-design.md` §4).
   */
  createSurface(space: SurfaceSpace, id: string, opts?: SurfaceOptions): ISurface;

  /**
   * Show a transient message on the shared canvas message channel — the same
   * call as `Canvas.showMessage`. Lets layers / behaviours / layouts surface a
   * status line (e.g. a layout announcing "Running…" on start) without reaching
   * for the bus directly. `timeout` (ms) auto-clears it.
   */
  showMessage(text: string, timeout?: number): void;

  /** Clear the current canvas message. */
  clearMessage(): void;

  /**
   * Re-run the canvas's **active** layout (`definition.activeLayout`) — the
   * same call as `Canvas.runLayout(activeLayout, run)`. Lets a behaviour ask
   * for a re-flow without knowing which layout is showing (e.g.
   * `CollapseExpandBehaviour` after a group frame opens or closes). Resolves
   * once the run settles; resolves immediately when no layout is active.
   *
   * Optional so hand-built contexts (tests, the headless double) need not
   * provide it — callers use `ctx.runActiveLayout?.(…)`.
   */
  runActiveLayout?(run?: LayoutRunOptions): Promise<void>;

  /**
   * Resolve on the first frame on which the canvas is **settled**: no layout
   * run in flight (its position transition included) and no camera glide.
   * Waits at least one frame, so writes made just before the call have
   * flushed. Resolves anyway after `timeoutMs` (default 15 000) so a
   * never-ending simulation can't hold a caller forever.
   *
   * What a playbook step and `FocusBehaviour`'s framing wait on. Not on the
   * public `Canvas` surface. Optional so hand-built contexts need not provide
   * it — callers use `ctx.whenSettled?.()`.
   */
  whenSettled?(opts?: { timeoutMs?: number }): Promise<void>;
}
