/**
 * `DragNodeBehaviour` — pointer-drag a `GraphLayer` node by writing the new
 * position to its `GraphStore` (not directly to the renderer).
 *
 * Differs from `@invana/canvas` `DragShapeBehaviour` in one important way:
 * the position update flows through the store, so:
 *   - `node:update` events fire — anyone listening (server replication,
 *     analytics, animations) sees the move.
 *   - The layer's connector-reroute pass runs naturally on the store flush.
 *   - Pinned-node semantics work: a dragged node automatically becomes
 *     `pinned: true` (configurable) so a subsequent layout pass leaves the
 *     dropped node where the user put it.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new DragNodeBehaviour({ id: 'drag', layerId: 'graph', enabled: true }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** Constructor options for `DragNodeBehaviour`. */
export interface DragNodeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id whose nodes this behaviour drags. */
  layerId: string;

  /**
   * Predicate to restrict which node ids are draggable. Returning `false`
   * ignores the pointerdown. Default = every node is draggable.
   */
  filter?: (id: string) => boolean;

  /**
   * Pin the node (`store.setPinned(id, true)`) when the drag starts so any
   * subsequent layout pass leaves the dropped node where the user put it.
   * Default `true`.
   */
  pinWhileDragging?: boolean;

  /**
   * What to do with the node's `pinned` state on drag end:
   * - `'keep'` (default) — leave it pinned. Subsequent layouts won't move it.
   * - `'release'` — clear the pin. The next layout pass may shuffle the node.
   * - `'restore'` — restore the pre-drag pinned value.
   */
  pinOnRelease?: 'keep' | 'release' | 'restore';

  /** Cursor applied to the canvas while dragging. Default `'grabbing'`. */
  dragCursor?: string;

  /**
   * When `true` (the default), dragging a node that is itself a compound
   * group (resolved `style.group` set) translates every descendant by the
   * same delta in one `setPositionsBulk` call so the whole subtree moves
   * together. Set to `false` to drag the group frame on its own — useful
   * only when descendants are layout-driven and should stay put.
   *
   * For auto-fit groups the frame's position is layer-derived from the
   * children bbox; moving descendants moves the frame naturally on the
   * next flush. For non-auto-fit groups, the group's stored `position`
   * is also updated so the declared frame follows the cursor.
   */
  groupAware?: boolean;
}

interface DragState {
  readonly id: string;
  /**
   * Pointer's world position at the gesture's anchoring moment. Captured at
   * pointerdown initially and re-captured on the first real pointermove (the
   * same instant we lazy-apply the pin) so the gesture's delta is measured
   * from a *fresh* cursor position — see the `nodePosStart` note.
   */
  pointerWorldStart: { x: number; y: number };
  /**
   * Node's position at the gesture's anchoring moment. Initially set at
   * pointerdown, then refreshed on the first real pointermove. The refresh
   * matters when an active layout (e.g. `D3ForceLayout`) is still moving the
   * node between pointerdown and the first pointermove: without it, deltas
   * would be measured against a stale anchor and the dragged node would
   * teleport away from the cursor.
   */
  nodePosStart: { x: number; y: number };
  /** Whether the node was already pinned when the drag began. */
  readonly wasPinned: boolean;
  /**
   * Whether the pin has actually been applied yet. We defer pinning to the
   * first real pointermove so a plain click on a node — which goes through
   * pointerdown + pointerup with no movement — doesn't churn the renderer
   * (a `node:update` flush mid-pointer-flow would clobber the in-flight
   * `shape:click` for the same shape, swallowing the click).
   */
  pinApplied: boolean;
}

export class DragNodeBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;

  private readonly filter?: (id: string) => boolean;
  private readonly pinWhileDragging: boolean;
  private readonly pinOnRelease: 'keep' | 'release' | 'restore';
  private readonly dragCursor: string;
  private readonly groupAware: boolean;

  private state: DragState | null = null;
  private offShapeDown: (() => void) | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private prevCursor: string | null = null;

  constructor(opts: DragNodeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['node+drag'] });
    this.filter = opts.filter;
    this.pinWhileDragging = opts.pinWhileDragging ?? true;
    this.pinOnRelease = opts.pinOnRelease ?? 'keep';
    this.dragCursor = opts.dragCursor ?? 'grabbing';
    this.groupAware = opts.groupAware ?? true;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `DragNodeBehaviour "${this.id}": layer "${this.layerId}" not found.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `DragNodeBehaviour "${this.id}": target layer is not mounted.`,
      );
    }

    const onShapeDown = (e: { id: string; worldX: number; worldY: number }): void => {
      if (!this._enabled) return;
      if (this.filter && !this.filter(e.id)) return;
      const node = layer.store.getNode(e.id);
      if (!node) return;
      this.startDrag(e.id, e.worldX, e.worldY, node.position ?? { x: 0, y: 0 });
    };
    renderer.events.on('shape:pointerdown', onShapeDown);
    this.offShapeDown = () => renderer.events.off('shape:pointerdown', onShapeDown);
  }

  protected override onDestroy(): void {
    this.endDrag();
    this.offShapeDown?.();
    this.offShapeDown = null;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }

  protected override onDisable(): void {
    if (this.state) this.endDrag();
  }

  // ─── Drag flow ──────────────────────────────────────────────────────────

  private startDrag(
    id: string,
    worldX: number,
    worldY: number,
    nodePos: { x: number; y: number },
  ): void {
    if (!this.layer) return;
    const wasPinned = this.layer.store.getNode(id)?.pinned === true;
    this.state = {
      id,
      pointerWorldStart: { x: worldX, y: worldY },
      nodePosStart: { x: nodePos.x, y: nodePos.y },
      wasPinned,
      pinApplied: false,
    };

    // Note: we deliberately *don't* call `setPinned(...)` here. A
    // pointerdown that doesn't move (a click) shouldn't pin the node — see
    // the field comment on `pinApplied`. Pin is applied lazily inside
    // `onWindowPointerMove` on the first real movement.

    // Pause the camera-drag plugin so the world doesn't pan while moving the node.
    this.ctxRef?.camera.viewport.plugins.pause('drag');

    // Window-level move/up listeners — same rationale as DragShapeBehaviour.
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);

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

    // Only run the pinOnRelease logic if we actually pinned during this
    // gesture — a click that never moved should leave the pin state alone.
    if (this.layer && this.state.pinApplied) {
      switch (this.pinOnRelease) {
        case 'release':
          this.layer.store.setPinned(this.state.id, false);
          break;
        case 'restore':
          this.layer.store.setPinned(this.state.id, this.state.wasPinned);
          break;
        case 'keep':
        default:
          // Leave whatever pinWhileDragging set in place.
          break;
      }
    }

    this.ctxRef?.camera.viewport.plugins.resume('drag');
    this.state = null;
  }

  private readonly onWindowPointerMove = (e: PointerEvent): void => {
    if (!this.state || !this.ctxRef || !this.layer) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctxRef.camera.toWorld(screenX, screenY);

    // First real pointermove: refresh the gesture anchors against the node's
    // current store position, so a layout that's been moving the node between
    // pointerdown and now doesn't leave us measuring deltas from a stale
    // anchor. After this branch, `nextX/nextY` equals the fresh node position
    // (delta = 0 on the anchoring move).
    if (!this.state.pinApplied) {
      const fresh = this.layer.store.getNode(this.state.id)?.position;
      if (fresh) this.state.nodePosStart = { x: fresh.x, y: fresh.y };
      this.state.pointerWorldStart = { x: world.x, y: world.y };
    }

    const dx = world.x - this.state.pointerWorldStart.x;
    const dy = world.y - this.state.pointerWorldStart.y;
    const nextX = this.state.nodePosStart.x + dx;
    const nextY = this.state.nodePosStart.y + dy;

    // Lazy-pin on the first real movement (see the `pinApplied` field comment).
    if (this.pinWhileDragging && !this.state.pinApplied && !this.state.wasPinned) {
      this.layer.store.setPinned(this.state.id, true);
    }
    this.state.pinApplied = true;

    // Group-aware drag: when the moved node is itself a compound group,
    // translate every descendant by the same delta so the subtree moves
    // together. We compute the delta against the *just-applied* position
    // (`nextX - this.state.nodePosStart.x`) instead of against `world`,
    // which gives the descendants the exact same translation the group
    // node received — no anchor drift between root and descendants.
    if (this.groupAware && this.layer.getGroupRole(this.state.id) === 'expanded') {
      const groupDx = nextX - this.state.nodePosStart.x;
      const groupDy = nextY - this.state.nodePosStart.y;
      // First update the group's own position, then walk descendants. The
      // store's `batch` collapses both into one flush so the layer sees a
      // single coherent state.
      const layer = this.layer;
      layer.store.batch(() => {
        layer.store.setPosition(this.state!.id, { x: nextX, y: nextY });
        const descIds: string[] = [];
        const xy: number[] = [];
        for (const descId of layer.store.descendantsOf(this.state!.id)) {
          const desc = layer.store.getNode(descId);
          if (!desc?.position) continue;
          descIds.push(descId);
          xy.push(desc.position.x + groupDx, desc.position.y + groupDy);
        }
        if (descIds.length > 0) {
          layer.store.setPositionsBulk(descIds, new Float32Array(xy));
        }
      });
      return;
    }

    // Non-silent so the layer's node:update subscriber repaints the shape
    // *and* queues an incident-edge reroute on the next store flush.
    this.layer.store.setPosition(this.state.id, { x: nextX, y: nextY });
  };

  private readonly onWindowPointerUp = (): void => {
    this.endDrag();
  };

  private clientToScreen(
    clientX: number,
    clientY: number,
  ): { screenX: number; screenY: number } {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect.left, screenY: clientY - rect.top };
  }
}
