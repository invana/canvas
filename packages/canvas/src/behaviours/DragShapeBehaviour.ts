/**
 * `DragShapeBehaviour` — pointer-drag move for individual shapes managed by
 * a `PrimitivesRenderer`. Layer-scoped: constructed with a specific renderer
 * reference; the same canvas can host multiple layers, each with its own
 * drag behaviour.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * What happens on drag:
 *   1. `shape:pointerdown` from the renderer → drag start. Records the
 *      pointer's world position and the shape's current `(spec.x, spec.y)`.
 *   2. The pointer gesture is claimed (`ctx.gestures`) so the camera stops
 *      panning and no other gesture starts on top of the move. A refused claim
 *      means another behaviour already owns the pointer — the drag doesn't
 *      start.
 *   3. Window-level `pointermove` updates the shape via
 *      `renderer.updateShape(id, { x, y })` so the click point stays under
 *      the cursor. Window events are used (rather than pixi container events)
 *      so the drag continues smoothly even when the pointer slides off the
 *      original shape or off the canvas momentarily.
 *   4. When `reRouteConnectors` is `true` (default), every connector is
 *      re-routed after each move — useful when the moved shape is an
 *      obstacle for an obstacle-aware router. Set `false` if you're moving
 *      a node whose edges should re-route via a smarter graph-level signal
 *      (or if you have thousands of edges and the cost matters).
 *   5. `pointerup` / `pointercancel` → drag end. The gesture claim is released
 *      and camera panning resumes.
 *
 * The behaviour observes the renderer's public surface only: subscribes to
 * `shape:pointerdown`, calls `getShapePosition` / `updateShape` /
 * `reRouteAllConnectors`. No private access.
 */

import { Behaviour, type BehaviourOptions } from './Behaviour';
import type { CanvasContext } from '../context/CanvasContext';
import type { PrimitivesRenderer } from '../primitives/PrimitivesRenderer';

export interface DragShapeBehaviourOptions extends BehaviourOptions {
  /** The renderer whose shapes this behaviour can drag. */
  readonly renderer: PrimitivesRenderer;
  /**
   * Optional predicate to restrict which shape ids are draggable. Returning
   * `false` ignores the pointerdown. Default = every shape is draggable.
   */
  readonly filter?: (id: string) => boolean;
  /**
   * Re-route every connector after each move. Default `true` — needed for
   * obstacle-aware routers (`manhattan` etc.) so they recompute when
   * obstacles move. Set `false` to avoid the per-move re-route cost.
   */
  readonly reRouteConnectors?: boolean;
  /**
   * Optional cursor while dragging. Applied on drag start and cleared on
   * drag end. Default `'grabbing'`.
   */
  readonly dragCursor?: string;
}

interface DragState {
  readonly id: string;
  readonly pointerWorldStart: { x: number; y: number };
  readonly shapePosStart: { x: number; y: number };
}

export class DragShapeBehaviour extends Behaviour<DragShapeBehaviourOptions> {
  override readonly kind = 'drag-shape';

  // The renderer is fixed at construction; the tuning knobs live-read from
  // `_options` (all consumed at event-time) so `setOptions` takes effect.
  private get renderer(): PrimitivesRenderer { return this._options.renderer; }
  private get filter(): ((id: string) => boolean) | undefined { return this._options.filter; }
  private get reRouteConnectors(): boolean { return this._options.reRouteConnectors ?? true; }
  private get dragCursor(): string { return this._options.dragCursor ?? 'grabbing'; }

  private state: DragState | null = null;
  private offShapeDown?: () => void;
  private canvasEl: HTMLCanvasElement | null = null;
  private prevCursor: string | null = null;

  constructor(opts: DragShapeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['shape+drag'] });
  }

  protected override onRegister(ctx: CanvasContext): void {
    // The canvas element backs `getBoundingClientRect()` when converting window
    // pointer coords to screen coords during a drag, and the cursor swap.
    // `null` on the headless `initWithStage` path — the drag still works, just
    // without the cursor swap and assuming a window-origin canvas.
    this.canvasEl = ctx.canvasElement ?? null;

    const onShapeDown = (e: { id: string; worldX: number; worldY: number }): void => {
      if (!this._enabled) return;
      if (this.filter && !this.filter(e.id)) return;
      const pos = this.renderer.getShapePosition(e.id);
      if (!pos) return;
      this.startDrag(e.id, e.worldX, e.worldY, pos);
    };
    this.renderer.events.on('shape:pointerdown', onShapeDown);
    this.offShapeDown = () => this.renderer.events.off('shape:pointerdown', onShapeDown);
  }

  protected override onDestroy(_ctx: CanvasContext): void {
    this.endDrag();
    this.offShapeDown?.();
    this.offShapeDown = undefined;
  }

  protected override onDisable(): void {
    if (this.state) this.endDrag();
  }

  private startDrag(id: string, worldX: number, worldY: number, shapePos: { x: number; y: number }): void {
    // Take the pointer before touching any state: a refusal means another
    // behaviour is already mid-gesture, so this drag must not begin.
    if (!this.claimGesture()) return;

    this.state = {
      id,
      pointerWorldStart: { x: worldX, y: worldY },
      shapePosStart: shapePos,
    };

    // Window-level move/up listeners. DOM events are the most reliable
    // source for drag flows — they fire regardless of which pixi target is
    // currently hit and continue working when the pointer briefly leaves
    // the canvas.
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);

    // Swap the canvas cursor for visual feedback.
    if (this.canvasEl) {
      this.prevCursor = this.canvasEl.style.cursor;
      this.canvasEl.style.cursor = this.dragCursor;
    }
  }

  private endDrag(): void {
    if (!this.state) return;

    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerUp);

    if (this.prevCursor !== null && this.canvasEl) {
      this.canvasEl.style.cursor = this.prevCursor;
      this.prevCursor = null;
    }

    // Hand the pointer back — camera panning resumes here.
    this.releaseGesture();
    this.state = null;
  }

  private readonly onWindowPointerMove = (e: PointerEvent): void => {
    if (!this.state || !this.ctx) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctx.camera.toWorld(screenX, screenY);
    const dx = world.x - this.state.pointerWorldStart.x;
    const dy = world.y - this.state.pointerWorldStart.y;
    const nextX = this.state.shapePosStart.x + dx;
    const nextY = this.state.shapePosStart.y + dy;
    this.renderer.updateShape(this.state.id, { x: nextX, y: nextY });
    if (this.reRouteConnectors) this.renderer.reRouteAllConnectors();
  };

  private readonly onWindowPointerUp = (): void => {
    this.endDrag();
  };

  /** Convert a window-level `(clientX, clientY)` to canvas-relative screen coords. */
  private clientToScreen(clientX: number, clientY: number): { screenX: number; screenY: number } {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect.left, screenY: clientY - rect.top };
  }
}
