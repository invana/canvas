/**
 * `DragNodeBehaviour` — pointer-drag a `GraphLayer` node by writing the new
 * position to its `GraphStore` (not directly to the renderer).
 *
 * Differs from `@invana/canvas` `DragShapeBehaviour` in one important way:
 * the position update flows through the store, so:
 *   - `node:update` events fire — anyone listening (server replication,
 *     analytics, animations) sees the move.
 *   - The layer's connector-reroute pass runs naturally on the store flush.
 *
 * **Doesn't pin during the drag.** The transient hold against an active
 * physics layout is done via the layer's `node:drag-start` / `node:drag-end`
 * events — layouts (e.g. `D3ForceLayout` clamping `fx/fy`) subscribe and
 * manage the lock internally. The store's `GraphNode.pinned` flag is *not*
 * touched mid-gesture, since that flag is user-data semantics (permanent
 * pin) and a drag shouldn't silently mutate it.
 *
 * **Pin on release is opt-in.** Set `pinOnRelease: true` to call
 * `store.setPinned(id, true)` on drag-end — useful when you want the user's
 * placement to survive future layout passes. Off by default; when off, a
 * released node is free again and the next layout tick may move it.
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

  /** Cursor applied to the canvas while dragging. Default `'grabbing'`. */
  dragCursor?: string;

  /**
   * When `true`, set `GraphNode.pinned = true` on the dragged node when
   * the gesture ends (real drag only — a click that didn't move is a
   * no-op). The store's pinned flag is read by layouts (e.g.
   * `D3ForceLayout` writes pinned nodes to d3-force's `fx/fy`) so the
   * node stays where the user dropped it across future layout passes.
   * Default `false`. To un-pin a pinned node, call
   * `graph.store.setPinned(id, false)` explicitly.
   */
  pinOnRelease?: boolean;

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
   * same instant we emit `node:drag-start`) so the gesture's delta is
   * measured from a *fresh* cursor position — see the `nodePosStart` note.
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
  /**
   * Whether the first real movement has been seen yet. We defer emitting
   * `node:drag-start` until the first real movement so a plain click on a
   * node — which goes through pointerdown + pointerup with no movement —
   * doesn't disturb the layout (a layout might reheat on the start signal).
   */
  moved: boolean;
}

export class DragNodeBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;

  private readonly filter?: (id: string) => boolean;
  private readonly dragCursor: string;
  private readonly groupAware: boolean;
  private readonly pinOnRelease: boolean;

  private state: DragState | null = null;
  private offShapeDown: (() => void) | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private prevCursor: string | null = null;
  /**
   * Pointer id captured on `pointerdown` so we can hold the capture on the
   * canvas element for the duration of the drag — otherwise the cursor
   * crossing the canvas bounds (e.g. over a lil-gui panel) fires
   * `pointercancel` on the document and the drag ends prematurely.
   */
  private capturedPointerId: number | null = null;

  constructor(opts: DragNodeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['node+drag'] });
    this.filter = opts.filter;
    this.dragCursor = opts.dragCursor ?? 'grabbing';
    this.groupAware = opts.groupAware ?? true;
    this.pinOnRelease = opts.pinOnRelease ?? false;
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

    const onShapeDown = (e: {
      id: string;
      worldX: number;
      worldY: number;
      pointerId: number;
    }): void => {
      if (!this._enabled) return;
      if (this.filter && !this.filter(e.id)) return;
      const node = layer.store.getNode(e.id);
      if (!node) return;
      this.capturedPointerId = e.pointerId;
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
    this.state = {
      id,
      pointerWorldStart: { x: worldX, y: worldY },
      nodePosStart: { x: nodePos.x, y: nodePos.y },
      moved: false,
    };

    // Pause the camera-drag plugin so the world doesn't pan while moving the node.
    this.ctxRef?.camera.viewport.plugins.pause('drag');

    // Window-level move/up listeners — same rationale as DragShapeBehaviour.
    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);

    if (this.canvasEl) {
      this.prevCursor = this.canvasEl.style.cursor;
      this.canvasEl.style.cursor = this.dragCursor;
      // Hold the pointer capture on the canvas DOM element for the duration
      // of the drag. Without this, the cursor crossing the canvas bounds —
      // over a lil-gui panel, the storybook chrome, or off the page — fires
      // `pointercancel` on the document, prematurely ending the drag and
      // (because we paused the camera viewport's drag plugin on startDrag
      // and resume it in endDrag) handing the still-held button off to the
      // camera-pan plugin mid-gesture. Capturing keeps every subsequent
      // pointermove routed to the canvas.
      if (this.capturedPointerId !== null) {
        try {
          this.canvasEl.setPointerCapture(this.capturedPointerId);
        } catch {
          // Capture can throw if the pointer has already been released (rare
          // race when the browser cancels between pointerdown and our
          // startDrag). Swallow — endDrag handles the missing capture.
        }
      }
    }
  }

  private endDrag(): void {
    if (!this.state) return;
    const { id, moved } = this.state;

    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerUp);

    if (this.prevCursor !== null && this.canvasEl) {
      this.canvasEl.style.cursor = this.prevCursor;
      this.prevCursor = null;
    }
    if (this.canvasEl && this.capturedPointerId !== null) {
      try {
        this.canvasEl.releasePointerCapture(this.capturedPointerId);
      } catch {
        // Already released by the browser (pointer ended / cancelled).
      }
    }
    this.capturedPointerId = null;

    this.ctxRef?.camera.viewport.plugins.resume('drag');
    this.state = null;

    // Only emit `drag-end` when we actually emitted `drag-start` — a plain
    // click (pointerdown + pointerup, no movement) is a no-op gesture.
    if (moved && this.layer) {
      // Order matters: pin first, then emit drag-end. The layout's
      // `node:drag-end` handler clears its transient `fx/fy` lock *unless*
      // the node is now permanently pinned (`pinnedIds.has(id)`), so the
      // store mutation has to land first to be observed.
      if (this.pinOnRelease) {
        this.layer.store.setPinned(id, true);
      }
      this.layer.events.emit('node:drag-end', { nodeId: id });
    }
  }

  private readonly onWindowPointerMove = (e: PointerEvent): void => {
    if (!this.state || !this.ctxRef || !this.layer) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctxRef.camera.toWorld(screenX, screenY);

    // First real pointermove: refresh the gesture anchors against the node's
    // current store position (so an active layout's per-tick movement doesn't
    // leave us measuring deltas from a stale anchor) and emit `node:drag-start`
    // so layouts can clamp the node's transient position.
    if (!this.state.moved) {
      const fresh = this.layer.store.getNode(this.state.id)?.position;
      if (fresh) this.state.nodePosStart = { x: fresh.x, y: fresh.y };
      this.state.pointerWorldStart = { x: world.x, y: world.y };
      this.state.moved = true;
      this.layer.events.emit('node:drag-start', { nodeId: this.state.id });
    }

    const dx = world.x - this.state.pointerWorldStart.x;
    const dy = world.y - this.state.pointerWorldStart.y;
    const nextX = this.state.nodePosStart.x + dx;
    const nextY = this.state.nodePosStart.y + dy;

    // Group-aware drag: when the moved node is itself a compound group,
    // translate every descendant by the same per-tick delta so the
    // subtree moves together.
    //
    // The per-tick delta is computed against the group's **current**
    // stored position (pre-update), not against `nodePosStart`. Using
    // `nextX − nodePosStart.x` would be the *cumulative* delta from
    // drag-start — applied every tick, it snowballs and the descendants
    // fly off-screen on a small drag. Reading the current position right
    // before the update gives the correct per-frame increment regardless
    // of how many ticks have elapsed.
    if (this.groupAware && this.layer.getGroupRole(this.state.id) === 'expanded') {
      const layer = this.layer;
      const current = layer.store.getNode(this.state.id)?.position;
      const groupDx = nextX - (current?.x ?? this.state.nodePosStart.x);
      const groupDy = nextY - (current?.y ?? this.state.nodePosStart.y);
      // Store's `batch` collapses the group + descendant updates into a
      // single flush so the layer projects them coherently.
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
