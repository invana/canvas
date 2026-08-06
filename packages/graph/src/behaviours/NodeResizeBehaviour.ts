/**
 * `NodeResizeBehaviour` — drag-resize any node (group or regular) whose
 * resolved style opts into resizing.
 *
 * The behaviour:
 * 1. mounts a single `SelectionFrameDecoration` on every eligible node.
 *    The decoration paints a dashed AABB outline plus round handles at
 *    the corners (and edge midpoints for rect hosts). For circle hosts
 *    only the radial `'right'` handle is exposed so the user always
 *    grows / shrinks the radius isotropically. Eligibility =
 *    `style.resizable === true` (regular nodes) OR
 *    `style.group?.userResizable === true` (compound groups);
 * 2. listens at the **canvas DOM level** for `pointerdown`. The handles
 *    sit at AABB corners, which fall outside the silhouette for circles
 *    and on the edge for rects — PixiJS's shape hit-test rejects those
 *    clicks. Canvas-level listening sidesteps the issue: every click is
 *    tested against the decoration's cached per-handle hit geometry;
 * 3. on drag (window-level `pointermove`), writes the new size back via
 *    `store.updateNode`. The target field depends on the eligibility
 *    flag: groups go to `style.group.width / height / radius`, regular
 *    nodes go to `style.shape.width / height / radius`. Position is also
 *    rewritten so the opposite anchor stays fixed on rect drags (except
 *    for auto-fit groups, where the layer derives the frame's position
 *    from the children bbox).
 *
 * Layer-scoped. Default `enabled: false`.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new NodeResizeBehaviour({ id: 'resize', targetLayerId: 'graph', enabled: true }),
 * );
 * ```
 */

import {
  Behaviour,
  type BehaviourOptions,
  type CanvasContext,
} from '@invana/canvas';
import type { SelectionFrameHandleHit, SelectionFramePlacement } from '@invana/canvas/specs';

import { GraphLayer } from '../layer/GraphLayer';
import type { GroupOptions, NodeStyle } from '../layer/types';
import type { GraphNode } from '../store/types';

/**
 * Duck-typed gate for the selection-frame decoration instance. See the
 * matching helper in `CollapseExpandBehaviour` for the rationale —
 * `instanceof` checks fail under workspace bundlers that double-load
 * `@invana/canvas`.
 */
function asSelectionFrame(
  deco: unknown,
): { getLocalHandleHits(): ReadonlyArray<SelectionFrameHandleHit> } | null {
  if (
    deco &&
    typeof (deco as { getLocalHandleHits?: unknown }).getLocalHandleHits === 'function'
  ) {
    return deco as { getLocalHandleHits(): ReadonlyArray<SelectionFrameHandleHit> };
  }
  return null;
}

/** Slot id the behaviour reserves on the renderer for its selection frame. */
const FRAME_SLOT = 'resize-frame';

/** Rect hosts get all 8 anchors — corners drive diagonal resize, midpoints drive axial. */
const RECT_HANDLES: SelectionFramePlacement[] = [
  'top-left',
  'top',
  'top-right',
  'right',
  'bottom-right',
  'bottom',
  'bottom-left',
  'left',
];

/** Circle hosts get a single radial handle on the right; radius math is isotropic. */
const CIRCLE_HANDLES: SelectionFramePlacement[] = ['right'];

export interface NodeResizeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;
  /** Handle outer radius in px. Default `5`. */
  handleRadius?: number;
  /** Handle fill colour. Default `0xffffff`. */
  handleFill?: number;
  /** Frame border + handle outline colour. Default `0x6b7fff`. */
  frameColor?: number;
  /** Dash pattern `[dashLength, gapLength]` in px. Default `[5, 4]`. */
  dashArray?: readonly [number, number];
  /** Gap between host silhouette and the dashed frame. Default `4`. */
  framePadding?: number;
  /** Minimum width / height / radius the behaviour allows during drag. Default `20`. */
  minSize?: number;
}

interface ResolvedOptions {
  handleRadius: number;
  handleFill: number;
  frameColor: number;
  dashArray: readonly [number, number];
  framePadding: number;
  minSize: number;
}

function resolveOptions(patch: Partial<NodeResizeBehaviourOptions>): ResolvedOptions {
  return {
    handleRadius: patch.handleRadius ?? 5,
    handleFill: patch.handleFill ?? 0xffffff,
    frameColor: patch.frameColor ?? 0x6b7fff,
    dashArray: patch.dashArray ?? ([5, 4] as const),
    framePadding: patch.framePadding ?? 4,
    minSize: patch.minSize ?? 20,
  };
}

/**
 * What `style.*` field a drag writes back into. `group` targets
 * `style.group.width / height / radius`; `shape` targets
 * `style.shape.width / height / radius` directly. Decided at drag-start
 * based on which flag enabled the resize.
 */
type WriteTarget = 'group' | 'shape';

interface DragState {
  readonly id: string;
  readonly placement: SelectionFramePlacement;
  readonly shapeKind: 'rect' | 'circle';
  readonly target: WriteTarget;
  /** Group's `style.group` snapshot at drag start. `undefined` for non-group nodes. */
  readonly startGroup: GroupOptions | undefined;
  /** Full prior style — preserved verbatim outside the fields we mutate. */
  readonly startStyle: NodeStyle;
  /** Renderer-projected world bounds at drag start. */
  readonly startBounds: { left: number; top: number; right: number; bottom: number };
  /** AABB centroid (for circle radial drags). */
  readonly startCentre: { x: number; y: number };
}

export class NodeResizeBehaviour extends Behaviour {
  override readonly kind = 'node-resize';
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  private prevCursor: string | null = null;
  private state: DragState | null = null;
  private subs: Array<() => void> = [];

  private readonly opts: ResolvedOptions;
  /** Node ids that currently have a selection-frame decoration mounted. */
  private readonly mountedNodes: Set<string> = new Set();

  constructor(opts: NodeResizeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['handle+drag'] });
    this.opts = resolveOptions(opts);
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `NodeResizeBehaviour "${this.id}": layer "${this.targetLayerId}" not found.`,
      );
    }
    if (!layer.getRenderer()) {
      throw new Error(
        `NodeResizeBehaviour "${this.id}": target layer is not mounted.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    if (!this.canvasEl) {
      throw new Error(
        `NodeResizeBehaviour "${this.id}": canvas element is not available on the context.`,
      );
    }

    if (this._enabled) this.refreshAllFrames();

    // Re-mount frames after every store flush — `rerenderNode` may have
    // disposed our slot (when the underlying shape's kind rebuilt) and
    // newly-added eligible nodes need their frame wired up.
    const offChanged = layer.events.on('data:changed', () => {
      if (this._enabled) this.refreshAllFrames();
    });
    this.subs.push(offChanged);

    // Canvas-level pointerdown — same rationale as `CollapseExpandBehaviour`.
    // Capture-phase so we beat pixi's federated dispatcher to the gesture
    // when the click does land on a handle.
    this.canvasEl.addEventListener('pointerdown', this.onCanvasPointerDown, true);
  }

  protected override onDestroy(): void {
    this.endDrag();
    this.clearAllFrames();
    for (const off of this.subs) off();
    this.subs.length = 0;
    if (this.canvasEl) {
      this.canvasEl.removeEventListener('pointerdown', this.onCanvasPointerDown, true);
    }
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }

  protected override onEnable(): void {
    this.refreshAllFrames();
  }

  protected override onDisable(): void {
    if (this.state) this.endDrag();
    this.clearAllFrames();
  }

  // ─── Eligibility ────────────────────────────────────────────────────────

  /**
   * Returns the write-target a drag on this node would use, or `null` when
   * the node isn't resizable. A group with `userResizable: true` always
   * writes to `style.group.*`; a non-group with `style.resizable: true`
   * writes to `style.shape.*`.
   */
  private resizeTarget(node: GraphNode): WriteTarget | null {
    if (!this.layer) return null;
    const style = this.layer.resolveNodeStyle(node);
    const group = style.group;
    // A closed frame isn't resizable — its geometry is the collapsed form, not
    // the declared one, so a drag would write sizes nothing is reading.
    if (group?.userResizable && !this.layer.isCollapsedGroup(node)) return 'group';
    if (style.resizable) {
      const kind = style.shape?.kind;
      if (kind === 'rect' || kind === 'circle') return 'shape';
    }
    return null;
  }

  // ─── Frame mount / unmount ──────────────────────────────────────────────

  private refreshAllFrames(): void {
    if (!this.layer) return;
    const visited = new Set<string>();
    for (const node of this.layer.store.nodes()) {
      const target = this.resizeTarget(node);
      if (!target) {
        if (this.mountedNodes.has(node.id)) this.clearFrameFor(node.id);
        continue;
      }
      const style = this.layer.resolveNodeStyle(node);
      const kind = style.shape?.kind as 'rect' | 'circle' | undefined;
      if (kind !== 'rect' && kind !== 'circle') {
        if (this.mountedNodes.has(node.id)) this.clearFrameFor(node.id);
        continue;
      }
      this.mountFrameFor(node.id, kind);
      visited.add(node.id);
    }
    for (const id of [...this.mountedNodes]) {
      if (!visited.has(id)) this.clearFrameFor(id);
    }
  }

  private mountFrameFor(nodeId: string, kind: 'rect' | 'circle'): void {
    if (!this.layer) return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    const handles = kind === 'rect' ? RECT_HANDLES : CIRCLE_HANDLES;
    renderer.setDecoration(nodeId, FRAME_SLOT, {
      kind: 'selection-frame',
      style: {
        borderColor: this.opts.frameColor,
        dashArray: this.opts.dashArray,
        padding: this.opts.framePadding,
        handleRadius: this.opts.handleRadius,
        handleFill: this.opts.handleFill,
        handleStrokeColor: this.opts.frameColor,
        handles,
      },
    });
    this.mountedNodes.add(nodeId);
  }

  private clearFrameFor(nodeId: string): void {
    if (!this.layer) return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    try {
      renderer.setDecoration(nodeId, FRAME_SLOT, null);
    } catch {
      // Node may have been removed before we got here — swallow.
    }
    this.mountedNodes.delete(nodeId);
  }

  private clearAllFrames(): void {
    for (const id of [...this.mountedNodes]) this.clearFrameFor(id);
  }

  // ─── Drag flow ──────────────────────────────────────────────────────────

  private readonly onCanvasPointerDown = (e: PointerEvent): void => {
    if (!this._enabled) return;
    if (e.button !== 0) return;
    if (this.state) return; // a drag is already in flight
    const hit = this.findHandleHit(e);
    if (!hit) return;
    e.stopPropagation();
    this.startDrag(hit.nodeId, hit.placement);
  };

  private findHandleHit(
    e: PointerEvent,
  ): { nodeId: string; placement: SelectionFramePlacement } | null {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const canvasEl = this.canvasEl;
    if (!layer || !ctx || !canvasEl) return null;
    const renderer = layer.getRenderer();
    if (!renderer) return null;

    const rect = canvasEl.getBoundingClientRect();
    const world = ctx.camera.toWorld(e.clientX - rect.left, e.clientY - rect.top);

    for (const nodeId of this.mountedNodes) {
      const frame = asSelectionFrame(renderer.getDecoration(nodeId, FRAME_SLOT));
      if (!frame) continue;
      const pos = renderer.getShapePosition(nodeId);
      if (!pos) continue;
      for (const h of frame.getLocalHandleHits()) {
        if (h.radius <= 0) continue;
        const dx = world.x - (pos.x + h.cx);
        const dy = world.y - (pos.y + h.cy);
        if (dx * dx + dy * dy <= h.radius * h.radius) {
          return { nodeId, placement: h.placement };
        }
      }
    }
    return null;
  }

  private startDrag(nodeId: string, placement: SelectionFramePlacement): void {
    if (!this.layer) return;
    const node = this.layer.store.getNode(nodeId);
    if (!node) return;
    const target = this.resizeTarget(node);
    if (!target) return;
    const style = this.layer.resolveNodeStyle(node);
    const shape = style.shape;
    if (shape?.kind !== 'rect' && shape?.kind !== 'circle') return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    const worldBounds = renderer.getShapeWorldBounds(nodeId);
    if (!worldBounds) return;

    // Take the pointer after every eligibility check has passed — claiming for
    // a drag we then abandon would block the camera and other gestures for
    // nothing. A refusal means another behaviour is already mid-gesture.
    if (!this.claimGesture()) return;

    this.state = {
      id: nodeId,
      placement,
      shapeKind: shape.kind as 'rect' | 'circle',
      target,
      startGroup: target === 'group' ? { ...(style.group as GroupOptions) } : undefined,
      startStyle: (node.style ?? {}) as NodeStyle,
      startBounds: {
        left: worldBounds.x,
        top: worldBounds.y,
        right: worldBounds.x + worldBounds.width,
        bottom: worldBounds.y + worldBounds.height,
      },
      startCentre: {
        x: worldBounds.x + worldBounds.width / 2,
        y: worldBounds.y + worldBounds.height / 2,
      },
    };

    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);

    if (this.canvasEl) {
      this.prevCursor = this.canvasEl.style.cursor;
      this.canvasEl.style.cursor = cursorFor(placement);
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
    if (!this.state || !this.ctxRef || !this.layer) return;
    const rect = this.canvasEl?.getBoundingClientRect();
    const screenX = rect ? e.clientX - rect.left : e.clientX;
    const screenY = rect ? e.clientY - rect.top : e.clientY;
    const world = this.ctxRef.camera.toWorld(screenX, screenY);

    const st = this.state;
    if (st.shapeKind === 'circle') {
      const dx = world.x - st.startCentre.x;
      const dy = world.y - st.startCentre.y;
      const r = Math.max(this.opts.minSize, Math.hypot(dx, dy));
      this.commit(st, { radius: r });
      return;
    }

    let left = st.startBounds.left;
    let top = st.startBounds.top;
    let right = st.startBounds.right;
    let bottom = st.startBounds.bottom;
    const min = this.opts.minSize;

    if (st.placement === 'top-left' || st.placement === 'left' || st.placement === 'bottom-left') {
      left = Math.min(world.x, right - min);
    }
    if (st.placement === 'top-right' || st.placement === 'right' || st.placement === 'bottom-right') {
      right = Math.max(world.x, left + min);
    }
    if (st.placement === 'top' || st.placement === 'top-left' || st.placement === 'top-right') {
      top = Math.min(world.y, bottom - min);
    }
    if (st.placement === 'bottom' || st.placement === 'bottom-left' || st.placement === 'bottom-right') {
      bottom = Math.max(world.y, top + min);
    }

    const width = right - left;
    const height = bottom - top;
    this.commit(st, { width, height, posX: left, posY: top });
  };

  private readonly onWindowPointerUp = (): void => {
    this.endDrag();
  };

  /**
   * Apply the new geometry to the store. Branch on `target`:
   *
   * - `target === 'group'` — write to `style.group.width / height / radius`.
   *   Position is updated for rect drags only when `autoFit !== true` (the
   *   layer derives the position from the children bbox when auto-fit is on,
   *   so writing it would either be redundant or fight the recompute).
   * - `target === 'shape'` — write to `style.shape.width / height / radius`.
   *   Position is updated for rect drags so the opposite anchor stays put.
   *
   * Either way the store replaces `style` wholesale on update (see
   * `feedback_updatenode_replaces_style`), so the spread preserves every
   * other field.
   */
  private commit(
    st: DragState,
    next: { width?: number; height?: number; radius?: number; posX?: number; posY?: number },
  ): void {
    if (!this.layer) return;
    let nextStyle: NodeStyle;
    let mayWritePos = false;
    if (st.target === 'group') {
      const priorGroup = st.startGroup ?? {};
      nextStyle = {
        ...st.startStyle,
        group: {
          ...priorGroup,
          ...(next.width !== undefined ? { width: next.width } : {}),
          ...(next.height !== undefined ? { height: next.height } : {}),
          ...(next.radius !== undefined ? { radius: next.radius } : {}),
        },
      };
      mayWritePos = !priorGroup.autoFit && st.shapeKind === 'rect';
    } else {
      // Shape target — mutate the shape options' size fields directly.
      // The shape kind discriminator is preserved by the spread. The cast
      // through `unknown` is required because the discriminated union's
      // variants don't have a common index signature, but the shape we're
      // assembling is one of the same variants with size fields rewritten.
      const priorShape = (st.startStyle.shape ?? { kind: st.shapeKind }) as unknown as Record<string, unknown>;
      const shapePatch: Record<string, unknown> = { ...priorShape };
      if (next.width !== undefined) shapePatch.width = next.width;
      if (next.height !== undefined) shapePatch.height = next.height;
      if (next.radius !== undefined) shapePatch.radius = next.radius;
      nextStyle = {
        ...st.startStyle,
        shape: shapePatch as unknown as NodeStyle['shape'],
      };
      mayWritePos = st.shapeKind === 'rect';
    }
    const patch: Partial<GraphNode> = { style: nextStyle };
    if (mayWritePos && next.posX !== undefined && next.posY !== undefined) {
      patch.position = { x: next.posX, y: next.posY };
    }
    this.layer.store.updateNode(st.id, patch);
  }
}

function cursorFor(placement: SelectionFramePlacement): string {
  switch (placement) {
    case 'top':
    case 'bottom':
      return 'ns-resize';
    case 'left':
    case 'right':
      return 'ew-resize';
    case 'top-left':
    case 'bottom-right':
      return 'nwse-resize';
    case 'top-right':
    case 'bottom-left':
      return 'nesw-resize';
  }
}
