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

export type DragModifier = 'none' | 'space' | 'shift' | 'alt';

export interface DragPanBehaviourOptions extends BehaviourOptions {
  /** Which modifier key must be held during drag. Default `'none'`. */
  modifier?: DragModifier;
  /** Allowed mouse buttons. Default `'left'`. Forwarded to pixi-viewport. */
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

function modifierToKeys(modifier: DragModifier): string[] | null {
  switch (modifier) {
    case 'space': return ['Space'];
    case 'shift': return ['ShiftLeft', 'ShiftRight'];
    case 'alt':   return ['AltLeft', 'AltRight'];
    default:      return null;
  }
}

export class DragPanBehaviour extends Behaviour {
  private readonly modifier: DragModifier;
  private readonly mouseButtons: string;
  private readonly withDecelerate: boolean;
  private readonly dragCursor: string;

  /** Canvas the cursor swap targets; `null` on headless / custom stages. */
  private canvasEl: HTMLCanvasElement | null = null;
  /** Cursor saved when the pan pointer is pressed, restored on release. */
  private prevCursor: string | null = null;

  constructor(opts: DragPanBehaviourOptions) {
    const modifier = opts.modifier ?? 'none';
    const gesture = modifier === 'none' ? 'drag' : `${modifier}+drag`;
    super({ ...opts, shortcuts: opts.shortcuts ?? [gesture] });
    this.modifier = modifier;
    this.mouseButtons = opts.mouseButtons ?? 'left';
    this.withDecelerate = opts.decelerate ?? true;
    this.dragCursor = opts.dragCursor ?? 'grabbing';
  }

  protected onRegister(ctx: CanvasContext): void {
    this.canvasEl = ctx.canvasElement ?? null;
  }

  protected onEnable(): void {
    const vp = this.ctx!.camera.viewport;
    vp.drag({ mouseButtons: this.mouseButtons, keyToPress: modifierToKeys(this.modifier) ?? undefined });
    if (this.withDecelerate) vp.decelerate();
    // Eager grab on press for the immediate "holding the canvas" feel.
    this.canvasEl?.addEventListener('pointerdown', this.onPointerDown);
    // Fallback for the `space` modifier, which can't be read off a pointer
    // event: pixi-viewport fires `drag-start` only once the gesture moves.
    vp.on('drag-start', this.armCursor);
  }

  protected onDisable(): void {
    const vp = this.ctx!.camera.viewport;
    this.canvasEl?.removeEventListener('pointerdown', this.onPointerDown);
    vp.off('drag-start', this.armCursor);
    this.restoreCursor(); // restore + drop window listeners if disabled mid-gesture
    vp.plugins.remove('drag');
    if (this.withDecelerate) vp.plugins.remove('decelerate');
  }

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
