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
 * **Selection-aware.** With `dragSelection` (default on), grabbing a node that
 * is part of the current selection drags the whole selection together. The
 * selection is read from the layer's `selectionState` visual state, so it works
 * with any select behaviour (click / lasso / brush) — this behaviour is not
 * coupled to a specific one.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph', enabled: true }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** Constructor options for `DragNodeBehaviour`. */
export interface DragNodeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id whose nodes this behaviour drags. */
  targetLayerId: string;

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

  /**
   * When `true` (the default), grabbing a node that is part of the current
   * selection drags the **whole selection** together — every selected node
   * moves by the same delta. Grabbing an unselected node (or a selection of
   * one) falls back to a plain single-node drag. Set `false` to always drag
   * just the grabbed node regardless of selection.
   *
   * Selection is read from the layer's visual state (see `selectionState`),
   * so this works uniformly whatever set it — click, lasso, or brush — with
   * no coupling to a specific select behaviour.
   */
  dragSelection?: boolean;

  /**
   * Name of the layer visual-state that marks a node as selected. Default
   * `'selected'`, matching `ClickSelectBehaviour`'s default `state`. Only
   * consulted when `dragSelection` is on. Override if your select behaviour
   * writes a different state name.
   */
  selectionState?: string;

  /**
   * When `true` (the default), a plain (no-modifier) press anywhere inside the
   * current selection's union bounding box — *including the empty world space
   * between the selected nodes* — grabs the whole selection and drags it, the
   * way Figma / PowerPoint let you drag a multi-selection by its body rather
   * than by a specific item.
   *
   * Without this, a selection is only draggable by pressing squarely on one of
   * the selected nodes; pressing in the gaps does nothing (no shape is hit, so
   * no drag starts). Off the back of a brush/lasso selection that almost always
   * reads as "the selection won't move" — hence default on.
   *
   * Only meaningful when `dragSelection` is also on. The press must carry no
   * modifier key (so it never collides with brush / lasso / shift-to-add) and
   * must not land on a node (those go through the normal per-node path). This
   * does mean panning the camera by dragging from *inside* the selection box is
   * no longer possible — drag from outside the box, or set this `false`.
   */
  selectionBodyDrag?: boolean;

  /**
   * Extra world-space padding added around the selection's union bounding box
   * when testing a press for {@link selectionBodyDrag}. Widens the grab target
   * so presses just outside the tightest box still catch. Default `0`.
   */
  selectionBodyPadding?: number;
}

interface DragState {
  /** The grabbed node — the gesture's primary, emitted as `nodeId`. */
  readonly primaryId: string;
  /**
   * All *primary* nodes being dragged together — `[primaryId]` for a plain
   * single-node drag, or the full selection for a multi-selection drag.
   * Emitted as the `nodeIds` event payload. Group descendants are NOT here;
   * they're folded into `moveIds` instead.
   */
  readonly ids: readonly string[];
  /**
   * Pointer's world position at the gesture's anchoring moment. Captured at
   * pointerdown initially and re-captured on the first real pointermove (the
   * same instant we emit `node:drag-start`) so the gesture's delta is
   * measured from a *fresh* cursor position — see the `starts` note.
   */
  pointerWorldStart: { x: number; y: number };
  /**
   * The full set of nodes actually translated each tick: every primary in
   * `ids` plus the group descendants of any primary that is an expanded
   * compound group. Computed once on the first real pointermove.
   */
  moveIds: readonly string[];
  /**
   * Each `moveIds` entry's position at the gesture's anchoring moment,
   * captured on the first real pointermove. Per-tick targets are
   * `start + cumulativeDelta`, so reading from a fixed start (rather than the
   * live position) is correct by construction and never snowballs. Capturing
   * on first move — not pointerdown — also refreshes the anchor against an
   * active layout (e.g. `D3ForceLayout`) that may have moved the nodes between
   * pointerdown and the first move, which would otherwise make them teleport.
   */
  starts: Map<string, { x: number; y: number }>;
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
  private readonly dragSelection: boolean;
  private readonly selectionState: string;
  private readonly selectionBodyDrag: boolean;
  private readonly selectionBodyPadding: number;

  private state: DragState | null = null;
  private offShapeDown: (() => void) | null = null;
  private offCanvasDown: (() => void) | null = null;
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
    this.dragSelection = opts.dragSelection ?? true;
    this.selectionState = opts.selectionState ?? 'selected';
    this.selectionBodyDrag = opts.selectionBodyDrag ?? true;
    this.selectionBodyPadding = opts.selectionBodyPadding ?? 0;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `DragNodeBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`,
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
      if (!layer.store.hasNode(e.id)) return;
      this.capturedPointerId = e.pointerId;
      this.startDrag(e.id, e.worldX, e.worldY);
    };
    renderer.events.on('shape:pointerdown', onShapeDown);
    this.offShapeDown = () => renderer.events.off('shape:pointerdown', onShapeDown);

    // Figma-style "grab the selection by its body". Empty-space presses never
    // reach `shape:pointerdown` (the renderer emits nothing for a no-hit
    // pointerdown), so we listen on the canvas DOM element directly — the same
    // carve-out `BrushSelectBehaviour` uses for its rubber-band.
    if (this.selectionBodyDrag && this.canvasEl) {
      const el = this.canvasEl;
      const onCanvasDown = (e: PointerEvent): void => this.onCanvasPointerDown(e);
      el.addEventListener('pointerdown', onCanvasDown);
      this.offCanvasDown = () => el.removeEventListener('pointerdown', onCanvasDown);
    }
  }

  protected override onDestroy(): void {
    this.endDrag();
    this.offShapeDown?.();
    this.offShapeDown = null;
    this.offCanvasDown?.();
    this.offCanvasDown = null;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }

  protected override onDisable(): void {
    if (this.state) this.endDrag();
  }

  // ─── Drag flow ──────────────────────────────────────────────────────────

  /**
   * Resolve the set of *primary* nodes a gesture on `grabbedId` should drag.
   * With `dragSelection` on, a grab on a selected node drags every selected
   * node (filtered by `filter`); otherwise — or for a selection of one — just
   * the grabbed node. Group descendants are added later, in the first move.
   */
  private resolveDragSet(grabbedId: string): readonly string[] {
    const layer = this.layer;
    if (!layer || !this.dragSelection) return [grabbedId];
    if (!layer.store.hasNodeState(grabbedId, this.selectionState)) return [grabbedId];
    // Need more than one to be a multi-drag. `grabbedId` is guaranteed present
    // — it carries the state and already passed `filter` at pointerdown.
    const selected = this.selectedNodeIds();
    return selected.length > 1 ? selected : [grabbedId];
  }

  /** Current selection (nodes carrying `selectionState`), filtered by `filter`. */
  private selectedNodeIds(): string[] {
    const layer = this.layer;
    if (!layer) return [];
    const ids: string[] = [];
    for (const id of layer.store.nodesWithState(this.selectionState)) {
      if (this.filter && !this.filter(id)) continue;
      ids.push(id);
    }
    return ids;
  }

  /**
   * World-space union AABB of the given nodes, or `null` if none resolve. Each
   * node contributes its `boundsOfNode` rect (centre-relative, so offset by the
   * node's stored position); a node whose shape kind reports no bounds collapses
   * to a zero-size point at its centre.
   */
  private selectionBounds(
    ids: readonly string[],
  ): { minX: number; minY: number; maxX: number; maxY: number } | null {
    const layer = this.layer;
    if (!layer) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const id of ids) {
      const node = layer.store.getNode(id);
      if (!node) continue;
      const pos = node.position ?? { x: 0, y: 0 };
      const local = layer.boundsOfNode(node);
      const x0 = pos.x + (local?.x ?? 0);
      const y0 = pos.y + (local?.y ?? 0);
      const x1 = x0 + (local?.width ?? 0);
      const y1 = y0 + (local?.height ?? 0);
      if (x0 < minX) minX = x0;
      if (y0 < minY) minY = y0;
      if (x1 > maxX) maxX = x1;
      if (y1 > maxY) maxY = y1;
    }
    if (minX === Infinity) return null;
    return { minX, minY, maxX, maxY };
  }

  /**
   * Selection-body drag entry point (see `selectionBodyDrag`). A plain press on
   * empty world space that falls inside the selection's union bounds grabs the
   * whole selection. Presses on a node, with a modifier held, or outside the
   * bounds are left alone so the per-node / brush / lasso / pan paths win.
   */
  private onCanvasPointerDown(e: PointerEvent): void {
    if (!this._enabled || !this.dragSelection) return;
    if (e.button !== 0) return;
    // Any modifier means a brush / lasso / shift-to-add gesture — never a body drag.
    if (e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return;
    // Ignore presses on overlaid DOM chrome (lil-gui, HTML controls).
    if (e.target !== this.canvasEl) return;
    // A node press already won the race via `shape:pointerdown` — don't double-start.
    if (this.state) return;

    const ctx = this.ctxRef;
    const layer = this.layer;
    if (!ctx || !layer) return;

    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = ctx.camera.toWorld(screenX, screenY);

    // A press squarely on a node flows through the normal per-node path.
    if (layer.getRenderer()?.hitTest(world.x, world.y)?.kind === 'shape') return;

    const ids = this.selectedNodeIds();
    if (ids.length === 0) return;
    const b = this.selectionBounds(ids);
    if (!b) return;
    const pad = this.selectionBodyPadding;
    if (
      world.x < b.minX - pad ||
      world.x > b.maxX + pad ||
      world.y < b.minY - pad ||
      world.y > b.maxY + pad
    ) {
      return;
    }

    this.capturedPointerId = e.pointerId;
    this.beginDrag(ids[0]!, ids, world.x, world.y);
  }

  private startDrag(grabbedId: string, worldX: number, worldY: number): void {
    if (!this.layer) return;
    this.beginDrag(grabbedId, this.resolveDragSet(grabbedId), worldX, worldY);
  }

  /**
   * Low-level drag start shared by the per-node path ({@link startDrag}) and the
   * selection-body path ({@link onCanvasPointerDown}). `primaryId` is the gesture's
   * emitted primary; `ids` is the full primary set to translate together.
   */
  private beginDrag(
    primaryId: string,
    ids: readonly string[],
    worldX: number,
    worldY: number,
  ): void {
    if (!this.layer) return;
    this.state = {
      primaryId,
      ids,
      pointerWorldStart: { x: worldX, y: worldY },
      moveIds: [],
      starts: new Map(),
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
    const { primaryId, ids, moved } = this.state;

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
      // store mutation has to land first to be observed. Pin every primary
      // (one batched flush), not just the grabbed one.
      if (this.pinOnRelease) {
        this.layer.store.batch(() => {
          for (const id of ids) this.layer!.store.setPinned(id, true);
        });
      }
      this.layer.events.emit('node:drag-end', { nodeId: primaryId, nodeIds: ids });
    }
  }

  private readonly onWindowPointerMove = (e: PointerEvent): void => {
    if (!this.state || !this.ctxRef || !this.layer) return;
    const layer = this.layer;
    const state = this.state;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctxRef.camera.toWorld(screenX, screenY);

    // First real pointermove: expand the move set and snapshot anchors.
    //
    // The move set is every primary in `ids` plus, for any primary that is an
    // expanded compound group, its descendants — so a group (or a selection of
    // groups) carries its subtree. Start positions are captured *now*, against
    // the live store, rather than at pointerdown: an active layout (e.g.
    // `D3ForceLayout`) may have moved the nodes in between, and anchoring to a
    // stale position would make them teleport. Emitting `node:drag-start` here
    // (deferred past a plain click) lets layouts clamp every dragged primary.
    if (!state.moved) {
      const moveIds: string[] = [];
      const seen = new Set<string>();
      const add = (id: string): void => {
        if (seen.has(id)) return;
        const pos = layer.store.getNode(id)?.position;
        if (!pos) return;
        seen.add(id);
        moveIds.push(id);
        state.starts.set(id, { x: pos.x, y: pos.y });
      };
      for (const id of state.ids) {
        add(id);
        if (this.groupAware && layer.getGroupRole(id) === 'expanded') {
          for (const descId of layer.store.descendantsOf(id)) add(descId);
        }
      }
      state.moveIds = moveIds;
      state.pointerWorldStart = { x: world.x, y: world.y };
      state.moved = true;
      layer.events.emit('node:drag-start', {
        nodeId: state.primaryId,
        nodeIds: state.ids,
      });
    }

    const dx = world.x - state.pointerWorldStart.x;
    const dy = world.y - state.pointerWorldStart.y;

    // Translate every node in the move set by the cumulative delta from its
    // captured start. Reading from a fixed start (not the live position) is
    // correct by construction and never snowballs across ticks. One
    // `setPositionsBulk` inside a `batch` collapses the whole set into a single
    // coherent flush — shape repaints plus incident-edge reroutes — and is
    // non-silent so the layer's `node:update` subscriber runs.
    const xy = new Float32Array(state.moveIds.length * 2);
    for (let i = 0; i < state.moveIds.length; i++) {
      const start = state.starts.get(state.moveIds[i]!)!;
      xy[i * 2] = start.x + dx;
      xy[i * 2 + 1] = start.y + dy;
    }
    layer.store.batch(() => {
      layer.store.setPositionsBulk(state.moveIds, xy);
    });
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
