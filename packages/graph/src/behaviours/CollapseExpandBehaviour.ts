/**
 * `CollapseExpandBehaviour` — flips a group frame between its expanded and
 * collapsed states. Two routes to the same flip: a click on the group's
 * `+` / `−` toggle decoration, and (unless `doubleClickToToggle: false`) a
 * double-click anywhere on the frame itself. The camera stays where it is;
 * opt in to re-flowing the graph around the toggled frame with
 * `relayoutOnToggle`, and to re-centring on it with `centerOnToggle`.
 *
 * With `countBadge` on, the behaviour also marks every collapsed frame with a
 * small pill showing how many nodes it hides. It writes that badge into the
 * frame's own `style.badges` (slot {@link COLLAPSED_COUNT_BADGE_ID}) — a node's
 * `style` is presentation, never persisted to the graph backend (only `.data`
 * is), so a behaviour may keep derived presentation there as long as it owns
 * the slot, keeps it in step, and removes it when switched off.
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
import type { ToggleHitGeometry } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import { COLLAPSED_STATE, type BadgePlacement, type NodeBadge, type NodeStyle } from '../layer/types';
import type { GraphNode } from '../store/types';
import type { RolePalette } from '../theme/roles';
import { DEFAULT_THEME } from '../theme/themes';

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

/**
 * `NodeBadge.id` of the collapsed-count badge this behaviour writes into a
 * collapsed frame's `style.badges` when `countBadge` is on. Other badges on
 * the same node are never touched.
 */
export const COLLAPSED_COUNT_BADGE_ID = 'collapsed-count';

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
   * `false` — the camera stays put, so the frame stays where the user
   * clicked it.
   *
   * Opt in when frames are large enough that closing one pulls its toggle far
   * from where the user left it; the pan then glides over
   * {@link centerDurationMs}. Zoom is untouched; this is a pan only.
   */
  centerOnToggle?: boolean;
  /**
   * How long the {@link centerOnToggle} pan glides for, in milliseconds.
   * Default `300`, eased out. `0` jumps straight to the frame.
   *
   * The frame itself changes size in a single frame, so an instant re-centre
   * lands in that same frame and the whole scene jumps with it — hundreds of
   * pixels when the frame sat near the edge of the view. Gliding lets the eye
   * follow the frame to the centre. Any pan or zoom by the user during the
   * glide cancels it.
   */
  centerDurationMs?: number;
  /**
   * Re-run the canvas's active layout after a frame opens or closes. Default
   * `false`.
   *
   * A toggle on its own only swaps the frame's geometry: closing one leaves its
   * old footprint empty, and opening one whose neighbours have since moved in
   * lands its members on top of them. With this on, the graph re-flows with
   * the layout's own transition, **anchored on the toggled frame** — it stays
   * where the user clicked it and everything else moves around it — and the
   * camera is left alone (the run carries `preserveCamera`, so no fitter
   * re-frames the view). Off by default because it moves nodes the user may
   * have placed by hand.
   */
  relayoutOnToggle?: boolean;
  /**
   * Mark each collapsed frame with a small pill showing how many nodes it
   * hides, like a notification count. Default `false`.
   *
   * Coloured from the active theme (`accent` fill, `surface` text, `cardBg`
   * ring) and re-coloured on every theme change. Applies to every group frame
   * in the target layer, however it was collapsed — by this behaviour, by a
   * dataset's `states: ['collapsed']`, or by code — and disappears when the
   * frame opens, when the frame is itself hidden inside a collapsed parent,
   * or when the behaviour is disabled.
   *
   * The pill is written into the frame's `style.badges` under
   * {@link COLLAPSED_COUNT_BADGE_ID}, next to any badges the frame already
   * declares. For the count as centred text instead, use
   * `GroupOptions.showCollapsedCount`.
   */
  countBadge?: boolean;
  /**
   * Which corner or edge of the collapsed frame the {@link countBadge} pill
   * sits on. The pill is centred on that point, so it hangs half over the
   * frame's edge. Default `'top-right'`.
   */
  countBadgePlacement?: BadgePlacement;
}

/**
 * How far past a frame's edge a double-click on one of its badges may land and
 * still count as the frame — a badge centred on a corner overhangs it by half
 * its size. World units.
 */
const BADGE_REACH = 16;

/** Default {@link CollapseExpandBehaviourOptions.centerDurationMs}. */
const DEFAULT_CENTER_DURATION_MS = 300;

/** Colours used for the count badge until a theme is published. */
const { categorical: _fallbackCategorical, ...FALLBACK_PALETTE } = DEFAULT_THEME.light;

export class CollapseExpandBehaviour extends Behaviour<CollapseExpandBehaviourOptions> {
  override readonly kind = 'collapse-expand';
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private canvasEl: HTMLCanvasElement | null = null;
  /** Unsubscribers for the layer / canvas events the count badge follows. */
  private subs: (() => void)[] = [];
  /** Active theme roles for the count badge, over {@link FALLBACK_PALETTE}. */
  private palette: RolePalette = FALLBACK_PALETTE;

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

    // The count badge follows the collapsed state, whatever changed it:
    // `data:changed` fires after every store flush (a toggle, a dataset
    // `states` entry, a member added or removed, a re-import), and
    // `theme:change` re-colours it.
    this.palette = { ...FALLBACK_PALETTE, ...ctx.theme.current()?.palette };
    this.subs.push(
      layer.events.on('data:changed', () => this.syncCountBadges()),
      ctx.events.on('theme:change', (theme) => {
        this.palette = { ...FALLBACK_PALETTE, ...theme.palette };
        this.syncCountBadges();
      }),
    );
  }

  protected override onEnable(): void {
    this.syncCountBadges();
  }

  protected override onDisable(): void {
    this.syncCountBadges();
  }

  protected override onOptionsChanged(): void {
    this.syncCountBadges();
  }

  protected override onDestroy(): void {
    // `destroy()` clears `enabled` before calling us, so this removes every
    // count badge the behaviour wrote.
    this.syncCountBadges();
    for (const off of this.subs) off();
    this.subs = [];
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
   *
   * Shapes that aren't nodes — a badge (e.g. the {@link
   * CollapseExpandBehaviourOptions.countBadge} pill) is its own small shape on
   * top of its host — are looked through: the hit test runs again excluding them, so a
   * double-click on a frame's badge reaches the frame. Member cards are nodes,
   * so a double-click on one still belongs to the card.
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
    const exclude = new Set<string>();
    let hit = renderer.hitTest(world.x, world.y);
    // Bounded: each pass excludes one more non-node shape.
    while (hit && hit.kind === 'shape' && !layer.store.getNode(hit.id) && exclude.size < 8) {
      exclude.add(hit.id);
      hit = renderer.hitTest(world.x, world.y, exclude);
    }
    // A badge half-overhangs its host's edge, so under the part outside the
    // frame there may be nothing at all. Fall back to the frame it belongs to:
    // the smallest group whose box, grown by a badge's reach, holds the point.
    if (exclude.size > 0 && (!hit || hit.kind !== 'shape')) return this.groupNear(world.x, world.y);
    if (!hit || hit.kind !== 'shape') return null;
    // `'none'` = a regular node, `undefined` = unknown id; only a frame
    // (expanded or collapsed) is a valid double-click target.
    const role = layer.getGroupRole(hit.id);
    return role === 'expanded' || role === 'collapsed' ? hit.id : null;
  }

  /**
   * The smallest group frame whose on-screen box, grown by
   * {@link BADGE_REACH}, contains `(x, y)` — how a double-click on the part of
   * a badge hanging outside its frame finds that frame. `null` when none does.
   */
  private groupNear(x: number, y: number): string | null {
    const layer = this.layer;
    const renderer = layer?.getRenderer();
    if (!layer || !renderer) return null;
    let best: string | null = null;
    let bestArea = Infinity;
    for (const node of layer.store.nodes()) {
      if (!layer.isGroupNode(node) || !layer.store.isNodeVisible(node.id)) continue;
      const b = renderer.getShapeWorldBounds(node.id);
      if (!b) continue;
      const inside =
        x >= b.x - BADGE_REACH && x <= b.x + b.width + BADGE_REACH &&
        y >= b.y - BADGE_REACH && y <= b.y + b.height + BADGE_REACH;
      const area = b.width * b.height;
      if (inside && area < bestArea) {
        best = node.id;
        bestArea = area;
      }
    }
    return best;
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
    this.afterReproject(nodeId);
    layer.store.setNodeState(nodeId, COLLAPSED_STATE, !open, { actor: this.id });
    if (open && node.states?.includes(COLLAPSED_STATE)) {
      layer.store.updateNode(nodeId, {
        states: node.states.filter((s) => s !== COLLAPSED_STATE),
      });
    }
  }

  /**
   * Follow up on a toggle once the frame has re-projected: re-flow the graph
   * ({@link CollapseExpandBehaviourOptions.relayoutOnToggle}), then centre the
   * camera on the frame ({@link CollapseExpandBehaviourOptions.centerOnToggle}).
   * Each is opt-in; with neither on this is a no-op.
   *
   * Timing is the whole point of the indirection. The toggle only writes
   * state; the frame's new geometry — collapsed silhouette or re-fitted body —
   * lands when `GraphLayer` drains its dirty groups during the store flush,
   * which with the default frame-coalesced store is the next rAF. Acting
   * inline would measure the geometry the user is leaving — a re-flow would
   * anchor on the old frame, a re-centre would overshoot by exactly the amount
   * the frame is about to change by. So we take a one-shot `data:changed`
   * subscription (emitted at the *end* of the flush, after the group drain).
   *
   * When both are on, the centre waits for the re-flow to settle, so it aims
   * at where the frame finally lands.
   */
  private afterReproject(nodeId: string): void {
    const layer = this.layer;
    const ctx = this.ctxRef;
    if (!layer || !ctx) return;
    const relayout = this._options.relayoutOnToggle === true;
    const center = this._options.centerOnToggle === true;
    if (!relayout && !center) return;
    const off = layer.events.on('data:changed', () => {
      off();
      if (!relayout) {
        this.centerOn(nodeId);
        return;
      }
      const run = ctx.runActiveLayout?.({ anchorNodeId: nodeId, preserveCamera: true }) ?? Promise.resolve();
      run.then(
        () => {
          if (center) this.centerOn(nodeId);
        },
        (err: unknown) => console.warn(`CollapseExpandBehaviour "${this.id}": re-layout failed`, err),
      );
    });
  }

  /**
   * Glide the camera to centre `nodeId`'s frame.
   *
   * Bounds rather than `node.position`: an auto-fit frame's stored position is
   * its top-left, and a collapsed one keeps the position of the frame it used
   * to be — neither is the centre of what's on screen.
   */
  private centerOn(nodeId: string): void {
    const bounds = this.layer?.getRenderer()?.getShapeWorldBounds(nodeId);
    if (!bounds || !this.ctxRef) return;
    this.ctxRef.camera.centerOn(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2, {
      durationMs: this._options.centerDurationMs ?? DEFAULT_CENTER_DURATION_MS,
      easing: 'easeOutCubic',
    });
  }

  /**
   * Bring every group frame's {@link COLLAPSED_COUNT_BADGE_ID} badge in line
   * with the current state: present, with the hidden-node count, on each
   * collapsed frame while the behaviour is enabled with `countBadge` on;
   * absent everywhere else.
   *
   * Idempotent and convergent: a frame whose badge already matches is not
   * written, so the flush a write causes finds nothing more to change. That
   * is also what clears a stale badge carried in by an import (the frame
   * comes back open, so its badge is removed on the first flush).
   */
  private syncCountBadges(): void {
    const layer = this.layer;
    if (!layer) return;
    const on = this.isEnabled && this._options.countBadge === true;
    layer.store.batch(() => {
      for (const node of layer.store.nodes()) {
        if (!layer.isGroupNode(node) && !hasCountBadge(node)) continue;
        const badge =
          on && layer.isCollapsedGroup(node) ? this.countBadgeFor(node.id) : undefined;
        this.writeCountBadge(node, badge);
      }
    });
  }

  /**
   * The count pill for frame `id`: a rounded rect sized to the digits, centred
   * on {@link CollapseExpandBehaviourOptions.countBadgePlacement}, in theme
   * colours.
   */
  private countBadgeFor(id: string): NodeBadge {
    let count = 0;
    for (const _ of this.layer!.store.descendantsOf(id)) count++;
    const text = String(count);
    const fontSize = 11;
    const height = 18;
    const width = Math.max(height, Math.round(text.length * fontSize * 0.62) + 12);
    return {
      id: COLLAPSED_COUNT_BADGE_ID,
      placement: this._options.countBadgePlacement ?? 'top-right',
      origin: 'center',
      shape: { kind: 'rect', width, height, cornerRadius: height / 2 },
      fill: this.palette.accent,
      strokeColor: this.palette.cardBg,
      strokeWidth: 1.5,
      labelText: text,
      labelColor: this.palette.surface,
      labelFontSize: fontSize,
    };
  }

  /**
   * Put `badge` in `node.style.badges` under {@link COLLAPSED_COUNT_BADGE_ID}
   * (or remove that entry when `badge` is `undefined`), leaving the node's
   * other badges alone. Skips the write when nothing would change.
   */
  private writeCountBadge(node: GraphNode, badge: NodeBadge | undefined): void {
    const style = (node.style ?? {}) as NodeStyle;
    const current = style.badges?.find((b) => b.id === COLLAPSED_COUNT_BADGE_ID);
    if (JSON.stringify(current) === JSON.stringify(badge)) return;
    const others = (style.badges ?? []).filter((b) => b.id !== COLLAPSED_COUNT_BADGE_ID);
    const badges = badge ? [...others, badge] : others;
    const { badges: _prev, ...rest } = style;
    const next: NodeStyle = badges.length > 0 ? { ...rest, badges } : rest;
    this.layer!.store.updateNode(node.id, { style: next });
  }
}

/** Whether `node` carries a collapsed-count badge written by this behaviour. */
function hasCountBadge(node: GraphNode): boolean {
  return ((node.style ?? {}) as NodeStyle).badges?.some((b) => b.id === COLLAPSED_COUNT_BADGE_ID) === true;
}
