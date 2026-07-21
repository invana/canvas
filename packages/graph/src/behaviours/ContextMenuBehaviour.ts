/**
 * `ContextMenuBehaviour` — surfaces right-click (context-menu) gestures on
 * nodes, edges, and the empty canvas as a single `onContextMenu` callback.
 *
 * Layer-scoped: constructed with a `targetLayerId`. Subscribes to that
 * layer's renderer `shape:contextmenu` / `connector:contextmenu` events and to
 * the engine-level `background:contextmenu` (empty-canvas right-click).
 *
 * **Headless.** The behaviour does not render any menu UI — it resolves the
 * target (node id + `data`, edge id + `data`, or canvas) and hands the caller
 * everything needed to position and populate their own menu. The browser's
 * native menu is suppressed by `Canvas` (`suppressBrowserContextMenu`, default
 * `true`), so no `preventDefault` is needed here.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new ContextMenuBehaviour({
 *     id: 'context-menu',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     onContextMenu: ({ targetType, id, screen }) => {
 *       showMenu(targetType, id, screen.x, screen.y);
 *     },
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** Which kind of target a context-menu gesture landed on. */
export type ContextMenuTargetType = 'node' | 'edge' | 'canvas';

/** Payload handed to {@link ContextMenuBehaviourOptions.onContextMenu}. */
export interface ContextMenuEvent {
  /** What was right-clicked. */
  readonly targetType: ContextMenuTargetType;
  /** Node/edge id, or `null` for an empty-canvas right-click. */
  readonly id: string | null;
  /**
   * Arbitrary user payload from `node.data` / `edge.data`. `undefined` for a
   * canvas right-click or when the resolved item carries no `data`.
   */
  readonly data: unknown;
  /** Pointer position in world (scene) coordinates. */
  readonly world: { readonly x: number; readonly y: number };
  /**
   * Pointer position in screen (canvas-relative) coordinates, via
   * `camera.toScreen`. Add the canvas element's bounding-rect offset to place
   * a `position: fixed` menu, or use directly inside a `position: relative`
   * canvas container.
   */
  readonly screen: { readonly x: number; readonly y: number };
}

/** Constructor options for `ContextMenuBehaviour`. */
export interface ContextMenuBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  targetLayerId: string;

  /**
   * Which targets fire `onContextMenu`. A right-click on a target not in this
   * list is ignored. Default `['node', 'edge', 'canvas']`.
   */
  targets?: readonly ContextMenuTargetType[];

  /**
   * Optional transient state name applied to the right-clicked node/edge (e.g.
   * `'context-open'`). The previously marked target is cleared first, so at
   * most one element carries it at a time. Cleared on disable/destroy.
   * `null`/`undefined` disables this. Default `null`.
   */
  state?: string | null;

  /** Fired on a qualifying right-click. */
  onContextMenu?: (event: ContextMenuEvent) => void;
}

interface ResolvedOptions {
  targets: readonly ContextMenuTargetType[];
  state: string | null;
  onContextMenu: ((event: ContextMenuEvent) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<ContextMenuBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    targets: ['node', 'edge', 'canvas'],
    state: null,
    onContextMenu: undefined,
  };
  return {
    targets: patch.targets ?? base.targets,
    state: 'state' in patch ? (patch.state ?? null) : base.state,
    onContextMenu: 'onContextMenu' in patch ? patch.onContextMenu : base.onContextMenu,
  };
}

export class ContextMenuBehaviour extends Behaviour {
  override readonly kind = 'context-menu';
  private layer: GraphLayer | null = null;
  private opts: ResolvedOptions;

  /** Subscription disposers. */
  private subs: Array<() => void> = [];

  /** Element currently carrying `opts.state`, so we can clear it on the next open. */
  private statedTarget: { type: 'node' | 'edge'; id: string } | null = null;

  constructor(opts: ContextMenuBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+rclick'] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `ContextMenuBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `ContextMenuBehaviour "${this.id}": target layer is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }

    const onShape = (e: { id: string; worldX: number; worldY: number }): void => {
      this.handle('node', e.id, e.worldX, e.worldY);
    };
    const onConn = (e: { id: string; worldX: number; worldY: number }): void => {
      this.handle('edge', e.id, e.worldX, e.worldY);
    };
    const onBackground = (e: { worldX: number; worldY: number }): void => {
      this.handle('canvas', null, e.worldX, e.worldY);
    };

    renderer.events.on('shape:contextmenu', onShape);
    renderer.events.on('connector:contextmenu', onConn);
    renderer.events.on('background:contextmenu', onBackground);

    this.subs.push(
      () => renderer.events.off('shape:contextmenu', onShape),
      () => renderer.events.off('connector:contextmenu', onConn),
      () => renderer.events.off('background:contextmenu', onBackground),
    );
  }

  protected override onDestroy(): void {
    this.clearStatedTarget();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  protected override onDisable(): void {
    this.clearStatedTarget();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /** Merge new options. Unspecified fields keep their current value. */
  setOptions(patch: Partial<ContextMenuBehaviourOptions>): void {
    this.opts = resolveOptions(this.opts, patch);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private handle(
    targetType: ContextMenuTargetType,
    id: string | null,
    worldX: number,
    worldY: number,
  ): void {
    if (!this.isEnabled) return;
    if (!this.opts.targets.includes(targetType)) return;
    const layer = this.layer;
    const ctx = this.ctx;
    if (!layer || !ctx) return;

    let data: unknown;
    if (targetType === 'node' && id !== null) {
      data = layer.store.getNode(id)?.data;
    } else if (targetType === 'edge' && id !== null) {
      data = layer.store.getEdge(id)?.data;
    }

    this.applyStatedTarget(targetType, id);

    const screen = ctx.camera.toScreen(worldX, worldY);
    this.opts.onContextMenu?.({
      targetType,
      id,
      data,
      world: { x: worldX, y: worldY },
      screen: { x: screen.x, y: screen.y },
    });
  }

  /** Move the transient `opts.state` marker onto the freshly clicked target. */
  private applyStatedTarget(targetType: ContextMenuTargetType, id: string | null): void {
    const state = this.opts.state;
    if (!state) return;
    this.clearStatedTarget();
    if (id === null || targetType === 'canvas') return;
    if (targetType === 'node') this.layer?.store.setNodeState(id, state, true);
    else this.layer?.store.setEdgeState(id, state, true);
    this.statedTarget = { type: targetType, id };
  }

  private clearStatedTarget(): void {
    const state = this.opts.state;
    const target = this.statedTarget;
    if (!state || !target) {
      this.statedTarget = null;
      return;
    }
    if (target.type === 'node') this.layer?.store.setNodeState(target.id, state, false);
    else this.layer?.store.setEdgeState(target.id, state, false);
    this.statedTarget = null;
  }
}
