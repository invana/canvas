/**
 * `DragPanBehaviour` — pointer-drag panning via the pixi-viewport `drag` plugin.
 *
 * An optional `modifier` key restricts the gesture so you can reserve plain
 * drag for other behaviours (e.g. lasso, rubber-band select):
 *
 *   - `'none'`  (default) — any left-button drag pans.
 *   - `'space'`            — Space + drag (Figma / Sketch style).
 *   - `'shift'`            — Shift + drag.
 *   - `'alt'`              — Alt/Option + drag.
 *
 * A decelerate plugin is added alongside by default, giving momentum after
 * the pointer lifts. Disable with `decelerate: false`.
 *
 * **Yielding.** Panning is the lowest-priority pointer gesture: while another
 * behaviour owns the gesture (`ctx.gestures.owner` — a node drag, a lasso, a
 * brush, a resize, an edge draw), this behaviour suspends its own pan and
 * restores it on release. Before P5 the inverse held — each of those behaviours
 * reached into `camera.viewport.plugins` to pause `'drag'` — which scattered a
 * `pixi-viewport` internal across six domain behaviours and left the camera
 * resumed by whichever gesture finished first.
 *
 * The pan itself is installed through `camera.configureInput({ drag })` rather
 * than the viewport plugin registry, so the `pixi-viewport` vocabulary stays
 * inside `Camera` and this behaviour survives the P6 renderer extraction
 * unchanged (`docs/renderer-split-design.md` §9, P5).
 *
 * The canvas cursor swaps to `dragCursor` (`'grabbing'` by default) the moment
 * a qualifying pointer is pressed — so it reads as "holding the canvas, ready
 * to drag" before any movement happens — and restores on release. The press is
 * matched against the configured `mouseButtons` and `modifier`; the `space`
 * modifier can't be read off a pointer event, so for that mode the swap falls
 * back to pixi-viewport's `drag-start` (fires once the gesture actually moves).
 * The idle cursor is left untouched, so this never fights the renderer's hover
 * cursor.
 */

import { Behaviour, type BehaviourOptions } from './Behaviour';
import type { CanvasContext } from '../context/CanvasContext';
import type { CameraInputModifier } from '../camera/Camera';

export type DragModifier = 'none' | 'space' | 'shift' | 'alt';

export interface DragPanBehaviourOptions extends BehaviourOptions {
  /** Which modifier key must be held during drag. Default `'none'`. */
  modifier?: DragModifier;
  /** Allowed mouse buttons. Default `'left'`. Forwarded to the camera. */
  mouseButtons?: 'all' | 'left' | 'right' | 'middle';
  /** Add momentum deceleration after pointer lift. Default `true`. */
  decelerate?: boolean;
  /**
   * Cursor applied to the canvas while the pan pointer is held. Set on
   * pointer-press (matching `mouseButtons` / `modifier`), restored to the
   * previous value on release. Default `'grabbing'`.
   */
  dragCursor?: string;
}

/**
 * This behaviour's `'none'` sentinel → the camera's `modifier | null`
 * vocabulary. `'space'` / `'shift'` / `'alt'` pass straight through; the camera
 * owns the mapping to physical key codes.
 */
function toCameraModifier(modifier: DragModifier): CameraInputModifier | null {
  return modifier === 'none' ? null : modifier;
}

export class DragPanBehaviour extends Behaviour<DragPanBehaviourOptions> {
  override readonly kind = 'drag-pan';

  // Live-read from `_options` so `setOptions` takes effect: event-time reads
  // (cursor / button / modifier) pick up immediately, and the viewport plugins
  // are re-armed with the new config in onOptionsChanged.
  private get modifier(): DragModifier { return this._options.modifier ?? 'none'; }
  private get mouseButtons(): NonNullable<DragPanBehaviourOptions['mouseButtons']> {
    return this._options.mouseButtons ?? 'left';
  }
  private get withDecelerate(): boolean { return this._options.decelerate ?? true; }
  private get dragCursor(): string { return this._options.dragCursor ?? 'grabbing'; }

  /** Canvas the cursor swap targets; `null` on headless / custom stages. */
  private canvasEl: HTMLCanvasElement | null = null;
  /** Cursor saved when the pan pointer is pressed, restored on release. */
  private prevCursor: string | null = null;

  /** Unsubscribe from the gesture arbiter; set while enabled. */
  private offGestures?: () => void;
  /** Unsubscribe from the camera's `drag-start`; set while enabled. */
  private offDragStart?: () => void;
  /** Whether the pan plugin is currently suspended for another gesture owner. */
  private yielding = false;

  constructor(opts: DragPanBehaviourOptions) {
    const modifier = opts.modifier ?? 'none';
    const gesture = modifier === 'none' ? 'drag' : `${modifier}+drag`;
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
  }

  protected onRegister(ctx: CanvasContext): void {
    this.canvasEl = ctx.canvasElement ?? null;
  }

  /** Re-arm the camera's drag input with the merged options. */
  protected override onOptionsChanged(): void {
    this.reArm();
  }

  protected onEnable(): void {
    const camera = this.ctx!.camera;
    camera.configureInput({
      drag: {
        mouseButtons: this.mouseButtons,
        modifier: toCameraModifier(this.modifier),
        decelerate: this.withDecelerate,
      },
    });
    // Eager grab on press for the immediate "holding the canvas" feel.
    this.canvasEl?.addEventListener('pointerdown', this.onPointerDown);
    // Fallback for the `space` modifier, which can't be read off a pointer
    // event: the camera reports `drag-start` only once the gesture moves.
    this.offDragStart = camera.onDragStart(this.armCursor);

    // Track gesture ownership. Seeded from the current owner so enabling
    // mid-gesture (a tool switch, a live `setOptions`) doesn't re-arm panning
    // underneath someone else's drag.
    const gestures = this.ctx!.gestures;
    this.yielding = false;
    this.offGestures = gestures.onOwnerChange(this.applyYield);
    this.applyYield(gestures.owner);
  }

  protected onDisable(): void {
    this.offGestures?.();
    this.offGestures = undefined;
    this.yielding = false;
    this.canvasEl?.removeEventListener('pointerdown', this.onPointerDown);
    this.offDragStart?.();
    this.offDragStart = undefined;
    this.restoreCursor(); // restore + drop window listeners if disabled mid-gesture
    // `drag: null` tears down pan *and* momentum, so a re-arm after toggling
    // `decelerate` off doesn't leave the old plugin running.
    this.ctx!.camera.configureInput({ drag: null });
  }

  /**
   * Suspend / restore panning to match gesture ownership. Momentum is left
   * running so an in-flight glide finishes as it always has — see
   * `Camera.setDragSuspended`.
   */
  private readonly applyYield = (owner: string | null): void => {
    const shouldYield = owner !== null && owner !== this.id;
    if (shouldYield === this.yielding) return;
    this.yielding = shouldYield;
    this.ctx?.camera.setDragSuspended(shouldYield);
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (!this._enabled) return;
    if (!this.buttonAllowed(e.button)) return;
    if (!this.modifierHeld(e)) return;
    this.armCursor();
    // Release can land outside the canvas, so listen at the window.
    window.addEventListener('pointerup', this.restoreCursor);
    window.addEventListener('pointercancel', this.restoreCursor);
  };

  /** Swap to the drag cursor, saving the prior value. No-op if already armed. */
  private readonly armCursor = (): void => {
    if (!this.canvasEl || this.prevCursor !== null) return;
    this.prevCursor = this.canvasEl.style.cursor;
    this.canvasEl.style.cursor = this.dragCursor;
  };

  /** Restore the saved cursor and detach the release listeners. */
  private readonly restoreCursor = (): void => {
    window.removeEventListener('pointerup', this.restoreCursor);
    window.removeEventListener('pointercancel', this.restoreCursor);
    if (this.prevCursor === null || !this.canvasEl) return;
    this.canvasEl.style.cursor = this.prevCursor;
    this.prevCursor = null;
  };

  /** Does this pointer button match the configured `mouseButtons`? */
  private buttonAllowed(button: number): boolean {
    switch (this.mouseButtons) {
      case 'all':    return true;
      case 'middle': return button === 1;
      case 'right':  return button === 2;
      default:       return button === 0; // 'left'
    }
  }

  /**
   * Is the configured modifier satisfied for this press? `shift` / `alt` read
   * off the event; `none` is always true; `space` returns `false` here (not
   * detectable on a pointer event) and is handled by the `drag-start` fallback.
   */
  private modifierHeld(e: PointerEvent): boolean {
    switch (this.modifier) {
      case 'shift': return e.shiftKey;
      case 'alt':   return e.altKey;
      case 'space': return false;
      default:      return true; // 'none'
    }
  }
}
