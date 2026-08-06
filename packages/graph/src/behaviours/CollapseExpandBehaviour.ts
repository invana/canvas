/**
 * `CollapseExpandBehaviour` — flips a group frame between its expanded and
 * collapsed states. Two routes to the same flip: a click on the group's
 * `+` / `−` toggle decoration, and (unless `doubleClickToToggle: false`) a
 * double-click anywhere on the frame itself. Either way the camera re-centres
 * on the frame once it has re-projected (`centerOnToggle`).
 *
 * Listens for native DOM `pointerdown` on the canvas element rather than
 * the renderer's `shape:pointerdown` channel. The reason: the toggle
 * decoration is typically anchored to (or *outside*) the host's
 * silhouette — outside-`'bottom'` for collapsed circles in the reference
 * UI — and PixiJS's hit-test rejects clicks outside the silhouette so a
 * shape-level subscription would never fire for those placements. A
 * canvas-wide listener tests the click against the toggle's cached hit
 * geometry regardless of where it sits.
 *
 * Layer-scoped. Default `enabled: false` per the no-auto-registration rule.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new CollapseExpandBehaviour({
 *     id: 'collapse-expand',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';
import type { ToggleHitGeometry } from '@invana/canvas/specs';

import { GraphLayer } from '../layer/GraphLayer';
import { COLLAPSED_STATE } from '../layer/types';

/**
 * Duck-typed gate for the toggle decoration instance — checks for the
 * presence of {@link ToggleDecoration.getLocalHitGeometry} instead of
 * relying on `instanceof`. Module-identity-sensitive checks break in
 * dev when a workspace bundler (Storybook's Vite, etc.) ends up loading
 * `@invana/canvas` through two different module paths, so the behaviour
 * never matches the decoration and silently no-ops.
 */
function asToggleDecoration(
  deco: unknown,
): { getLocalHitGeometry(): ToggleHitGeometry } | null {
  if (
    deco &&
    typeof (deco as { getLocalHitGeometry?: unknown }).getLocalHitGeometry === 'function'
  ) {
    return deco as { getLocalHitGeometry(): ToggleHitGeometry };
  }
  return null;
}

/**
 * Slot id the `GraphLayer` mounts the group's `+` / `−` toggle decoration on.
 * Re-exported for advanced consumers that want to read or override the
 * decoration; most callers shouldn't need it.
 */
export const GROUP_TOGGLE_SLOT = 'group-toggle';

export interface CollapseExpandBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;
  /**
   * Double-clicking a group frame toggles it, as a second route to the same
   * flip the `+` / `−` button performs. Default `true`.
   *
   * The target is the frame itself, anywhere it is the topmost thing under the
   * pointer — its tab, its padding, the gaps between its members. A
   * double-click that lands on a **member node** belongs to that node and is
   * ignored here (the renderer's hit test ranks by z-index, and an expanded
   * frame deliberately paints *under* its children). Double-clicking a
   * collapsed frame re-opens it.
   */
  doubleClickToToggle?: boolean;
  /**
   * Pan the camera to centre the frame after it opens or closes. Default
   * `true`.
   *
   * Both directions move a lot of pixels — closing pulls a large frame down to
   * a tab, opening pushes it back out — and the toggle the user just clicked
   * ends up somewhere other than where they left it. Re-centring keeps the
   * frame under the eye instead. Zoom is untouched; this is a pan only.
   */
  centerOnToggle?: boolean;
}

export class CollapseExpandBehaviour extends Behaviour<CollapseExpandBehaviourOptions> {
  override readonly kind = 'collapse-expand';
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private canvasEl: HTMLCanvasElement | null = null;

  constructor(opts: CollapseExpandBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    if (!layer.getRenderer()) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": target layer is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;
    if (!this.canvasEl) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": canvas element is not available on the context.`,
      );
    }
    // Capture-phase so we see the event before pixi's federated dispatcher
    // turns it into a shape:pointerdown — keeps the behaviour responsive
    // even when other shape-level handlers run on the same gesture.
    this.canvasEl.addEventListener('pointerdown', this.onPointerDown, true);
    // Native `dblclick` rather than counting clicks ourselves: the browser
    // already owns the platform's double-click interval and movement
    // tolerance, and it fires on the canvas element the same way the toggle's
    // `pointerdown` does.
    this.canvasEl.addEventListener('dblclick', this.onDoubleClick, true);
  }

  protected override onDestroy(): void {
    if (this.canvasEl) {
      this.canvasEl.removeEventListener('pointerdown', this.onPointerDown, true);
      this.canvasEl.removeEventListener('dblclick', this.onDoubleClick, true);
    }
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }

  private readonly onPointerDown = (e: PointerEvent): void => {
    if (!this.isEnabled) return;
    if (e.button !== 0) return; // left click only
    const hit = this.findToggleHit(e);
    if (!hit) return;
    // Consume the gesture — stop pan / drag behaviours from also grabbing
    // it. `e.stopPropagation()` keeps it from bubbling to other listeners
    // on the canvas element; the gesture is ours.
    e.stopPropagation();
    this.toggleCollapsed(hit.nodeId);
  };

  /**
   * Double-click anywhere on a group frame toggles it — the same flip the
   * `+` / `−` button performs, on a target that's far easier to hit.
   *
   * Resolution is one hit test, and the z-order does the discrimination for
   * us: an expanded frame paints *under* its members (`behindChildren`), so a
   * double-click over a member returns the member and we leave it alone,
   * while one over the frame's own tab / padding / gaps returns the frame. A
   * collapsed frame is a normal node and is returned directly.
   *
   * Opt out with `doubleClickToToggle: false`.
   */
  private readonly onDoubleClick = (e: MouseEvent): void => {
    if (!this.isEnabled) return;
    if (this._options.doubleClickToToggle === false) return;
    if (e.button !== 0) return; // left button only
    const nodeId = this.groupUnder(e);
    if (!nodeId) return;
    // Ours — keep it from also reaching a double-click-to-inspect / zoom
    // handler on the same element, and suppress the browser's text selection.
    e.stopPropagation();
    e.preventDefault();
    this.toggleCollapsed(nodeId);
  };

  /**
   * The group frame under the pointer, or `null` when the topmost element
   * there is a regular node, a connector, or nothing at all.
   */
  private groupUnder(e: MouseEvent): string | null {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const canvasEl = this.canvasEl;
    if (!layer || !ctx || !canvasEl) return null;
    const renderer = layer.getRenderer();
    if (!renderer) return null;

    const rect = canvasEl.getBoundingClientRect();
    const world = ctx.camera.toWorld(e.clientX - rect.left, e.clientY - rect.top);
    const hit = renderer.hitTest(world.x, world.y);
    if (!hit || hit.kind !== 'shape') return null;
    // `'none'` = a regular node, `undefined` = unknown id; only a frame
    // (expanded or collapsed) is a valid double-click target.
    const role = layer.getGroupRole(hit.id);
    return role === 'expanded' || role === 'collapsed' ? hit.id : null;
  }

  /**
   * Convert a `PointerEvent` into world coordinates and walk every group
   * node in the layer. Return the first group whose mounted toggle
   * decoration's hit area contains the click, or `null` if none match.
   */
  private findToggleHit(e: PointerEvent): { nodeId: string } | null {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const canvasEl = this.canvasEl;
    if (!layer || !ctx || !canvasEl) return null;
    const renderer = layer.getRenderer();
    if (!renderer) return null;

    const rect = canvasEl.getBoundingClientRect();
    const world = ctx.camera.toWorld(e.clientX - rect.left, e.clientY - rect.top);

    for (const node of layer.store.nodes()) {
      const style = layer.resolveNodeStyle(node);
      if (!style.group) continue;

      const toggle = asToggleDecoration(renderer.getDecoration(node.id, GROUP_TOGGLE_SLOT));
      if (!toggle) continue;
      const hg = toggle.getLocalHitGeometry();
      if (hg.radius <= 0) continue;

      const pos = renderer.getShapePosition(node.id);
      if (!pos) continue;

      const dx = world.x - (pos.x + hg.cx);
      const dy = world.y - (pos.y + hg.cy);
      if (dx * dx + dy * dy <= hg.radius * hg.radius) {
        return { nodeId: node.id };
      }
    }
    return null;
  }

  /**
   * Flip the {@link COLLAPSED_STATE} state on the group.
   *
   * Collapse is interaction state, so the write goes to the store's presence
   * set — the same channel as `hovered` / `selected` — and never to `style`.
   * The visual consequences follow from the state: `GraphLayer` hides the
   * descendants, closes the silhouette to its minimal form, and applies
   * whatever `state.collapsed` overlay the node (or its template) declares.
   *
   * The one wrinkle is the document `states[]`: `nodeStatesOf` is the *union*
   * of the feed's states and the runtime set, so a node authored as
   * `states: ['collapsed']` would stay closed forever if we only cleared the
   * runtime flag. Opening therefore strips the document state too — the user's
   * click wins over the feed's initial condition.
   */
  private toggleCollapsed(nodeId: string): void {
    const layer = this.layer;
    if (!layer) return;
    const node = layer.store.getNode(nodeId);
    if (!node) return;
    const open = layer.isCollapsedGroup(node);
    // Armed *before* the write: with a synchronous store the flush happens
    // inside `setNodeState`, so a subscription taken afterwards would miss it.
    if (this._options.centerOnToggle !== false) this.centerAfterReproject(nodeId);
    layer.store.setNodeState(nodeId, COLLAPSED_STATE, !open, { actor: this.id });
    if (open && node.states?.includes(COLLAPSED_STATE)) {
      layer.store.updateNode(nodeId, {
        states: node.states.filter((s) => s !== COLLAPSED_STATE),
      });
    }
  }

  /**
   * Centre the camera on `nodeId` once the frame has re-projected.
   *
   * Timing is the whole point of the indirection. The toggle only writes
   * state; the frame's new geometry — collapsed silhouette or re-fitted body —
   * lands when `GraphLayer` drains its dirty groups during the store flush,
   * which with the default frame-coalesced store is the next rAF. Centring
   * inline would aim at the geometry the user is leaving, overshooting by
   * exactly the amount the frame is about to change by. So we take a one-shot
   * `data:changed` subscription (emitted at the *end* of the flush, after the
   * group drain) and read the renderer's world bounds then.
   *
   * Bounds rather than `node.position`: an auto-fit frame's stored position is
   * its top-left, and a collapsed one keeps the position of the frame it used
   * to be — neither is the centre of what's on screen.
   */
  private centerAfterReproject(nodeId: string): void {
    const layer = this.layer;
    const ctx = this.ctxRef;
    if (!layer || !ctx) return;
    const off = layer.events.on('data:changed', () => {
      off();
      const bounds = layer.getRenderer()?.getShapeWorldBounds(nodeId);
      if (!bounds) return;
      ctx.camera.centerOn(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
    });
  }
}
