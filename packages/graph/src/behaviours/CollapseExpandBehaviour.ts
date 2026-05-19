/**
 * `CollapseExpandBehaviour` — clicks on a group node's `+` / `−` toggle
 * decoration flip the group between expanded and collapsed states.
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
 *     layerId: 'graph',
 *     enabled: true,
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';
import type { ToggleHitGeometry } from '@invana/canvas/primitives';

import { GraphLayer } from '../layer/GraphLayer';
import type { GroupOptions, NodeStyle } from '../layer/types';

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
  layerId: string;
}

export class CollapseExpandBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private canvasEl: HTMLCanvasElement | null = null;

  constructor(opts: CollapseExpandBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+click'] });
  }

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `CollapseExpandBehaviour "${this.id}": layer "${this.layerId}" not found. ` +
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
  }

  protected override onDestroy(): void {
    if (this.canvasEl) {
      this.canvasEl.removeEventListener('pointerdown', this.onPointerDown, true);
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
   * Flip `style.group.collapsed` via `store.updateNode`, preserving the
   * rest of the prior style. Per `feedback_updatenode_replaces_style` the
   * store replaces `style` wholesale on update — the spread keeps every
   * other field intact.
   */
  private toggleCollapsed(nodeId: string): void {
    const layer = this.layer;
    if (!layer) return;
    const node = layer.store.getNode(nodeId);
    if (!node) return;
    const priorStyle = (node.style ?? {}) as NodeStyle;
    const priorGroup = (priorStyle.group ?? {}) as GroupOptions;
    const nextStyle: NodeStyle = {
      ...priorStyle,
      group: { ...priorGroup, collapsed: !priorGroup.collapsed },
    };
    layer.store.updateNode(nodeId, { style: nextStyle });
  }
}
