/**
 * `HoverActivateBehaviour` — toggles a named visual state on hovered nodes /
 * edges (and optionally their N-hop neighbours), with optional dimming of
 * everything else.
 *
 * Layer-scoped: constructed with a target `layerId` referencing a
 * {@link GraphLayer}. Subscribes to that layer's renderer pointer events
 * (`shape:pointerover` / `connector:pointerover`) and drives layer state via
 * `layer.setNodeState` / `layer.setEdgeState`.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * @example
 * ```ts
 * graph.setNodeStateConfig('active',   { stroke: 0xfacc15, strokeWidth: 3 });
 * graph.setNodeStateConfig('inactive', { alpha: 0.25 });
 * graph.setEdgeStateConfig('active',   { stroke: 0xfacc15, strokeWidth: 2 });
 * graph.setEdgeStateConfig('inactive', { alpha: 0.2 });
 *
 * canvas.behaviours.register(
 *   new HoverActivateBehaviour({
 *     id: 'hover',
 *     layerId: 'graph',
 *     enabled: true,
 *     state: 'active',
 *     inactiveState: 'inactive',
 *     degree: 1,
 *   }),
 * );
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** Element kind for hover targets. */
export type HoverableElementType = 'shape' | 'connector';

/** Edge-traversal direction filter for neighbour expansion. */
export type HoverDirection = 'in' | 'out' | 'both';

/** Element handed to hover callbacks. */
export interface HoverableElement {
  readonly id: string;
  readonly type: HoverableElementType;
  /** Arbitrary user payload from `node.data` or `edge.data`. */
  readonly data: unknown;
}

/** Constructor options for `HoverActivateBehaviour`. */
export interface HoverActivateBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour drives. */
  layerId: string;

  /**
   * Per-target enable predicate. `boolean` is a global on/off; a function
   * runs per pointer-over and may veto activation. Default `true`.
   */
  enable?: boolean | ((element: HoverableElement) => boolean);

  /** Active-state name (configured on the layer). Default `'active'`. */
  state?: string;

  /**
   * State name applied to every element *not* in the active set. Leave
   * `undefined` to skip inactive dimming. Default `undefined`.
   */
  inactiveState?: string;

  /**
   * N-hop neighbour radius. `0` = hovered element only; `1` = direct
   * neighbours + connecting edges; `N` = N-hop. Default `0`.
   */
  degree?: number;

  /** Direction for neighbour traversal. Default `'both'`. */
  direction?: HoverDirection;

  /** Fired when an element first becomes hovered. */
  onHover?: (element: HoverableElement) => void;
  /** Fired when hover ends on a previously hovered element. */
  onHoverEnd?: (element: HoverableElement) => void;
}

interface ResolvedOptions {
  enable: boolean | ((element: HoverableElement) => boolean);
  state: string;
  inactiveState: string | undefined;
  degree: number;
  direction: HoverDirection;
  onHover: ((element: HoverableElement) => void) | undefined;
  onHoverEnd: ((element: HoverableElement) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<HoverActivateBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable: true,
    state: 'active',
    inactiveState: undefined,
    degree: 0,
    direction: 'both',
    onHover: undefined,
    onHoverEnd: undefined,
  };
  return {
    enable: patch.enable ?? base.enable,
    state: patch.state ?? base.state,
    inactiveState: 'inactiveState' in patch ? patch.inactiveState : base.inactiveState,
    degree: patch.degree ?? base.degree,
    direction: patch.direction ?? base.direction,
    onHover: 'onHover' in patch ? patch.onHover : base.onHover,
    onHoverEnd: 'onHoverEnd' in patch ? patch.onHoverEnd : base.onHoverEnd,
  };
}

export class HoverActivateBehaviour extends Behaviour {
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private subs: Array<() => void> = [];

  /** Currently hovered element, or `null`. */
  private current: HoverableElement | null = null;
  /** Neighbour ids that received the active state (excluding `current`). */
  private activeIds = new Set<string>();
  /** Element ids that received the inactive state. */
  private inactiveIds = new Set<string>();

  constructor(opts: HoverActivateBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+hover'] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(
        `HoverActivateBehaviour "${this.id}": layer "${this.layerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `HoverActivateBehaviour "${this.id}": target layer "${this.layerId}" is not mounted. ` +
          `Add the GraphLayer to the canvas before registering this behaviour.`,
      );
    }

    const onShapeOver = (e: { id: string }) => this.handlePointerOver(e.id, 'shape');
    const onShapeOut = (e: { id: string }) => this.handlePointerOut(e.id, 'shape');
    const onConnOver = (e: { id: string }) => this.handlePointerOver(e.id, 'connector');
    const onConnOut = (e: { id: string }) => this.handlePointerOut(e.id, 'connector');

    renderer.events.on('shape:pointerover', onShapeOver);
    renderer.events.on('shape:pointerout', onShapeOut);
    renderer.events.on('connector:pointerover', onConnOver);
    renderer.events.on('connector:pointerout', onConnOut);

    this.subs.push(
      () => renderer.events.off('shape:pointerover', onShapeOver),
      () => renderer.events.off('shape:pointerout', onShapeOut),
      () => renderer.events.off('connector:pointerover', onConnOver),
      () => renderer.events.off('connector:pointerout', onConnOut),
    );
  }

  protected override onDestroy(): void {
    this.clearHover();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
  }

  protected override onDisable(): void {
    this.clearHover();
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** The element currently driving the hover effect, or `null`. */
  get hoveredElement(): HoverableElement | null {
    return this.current;
  }

  /** Read-only snapshot of resolved options. */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /**
   * Runtime option update. State-affecting changes clear any in-flight hover
   * so the next hover applies the new visuals cleanly.
   */
  setOptions(patch: Partial<HoverActivateBehaviourOptions>): void {
    const stateChanged =
      (patch.state !== undefined && patch.state !== this.opts.state) ||
      ('inactiveState' in patch && patch.inactiveState !== this.opts.inactiveState);
    if (stateChanged) this.clearHover();
    this.opts = resolveOptions(this.opts, patch);
  }

  /** Clear all states applied by the current hover. */
  clearHover(): void {
    if (!this.layer) {
      this.current = null;
      this.activeIds.clear();
      this.inactiveIds.clear();
      return;
    }
    if (this.current) {
      if (this.current.type === 'shape') {
        this.layer.setNodeState(this.current.id, this.opts.state, false);
      } else {
        this.layer.setEdgeState(this.current.id, this.opts.state, false);
      }
    }
    for (const id of this.activeIds) {
      // Active ids can be either nodes or edges; try both.
      this.layer.setNodeState(id, this.opts.state, false);
      this.layer.setEdgeState(id, this.opts.state, false);
    }
    this.activeIds.clear();

    const inactive = this.opts.inactiveState;
    if (inactive) {
      for (const id of this.inactiveIds) {
        this.layer.setNodeState(id, inactive, false);
        this.layer.setEdgeState(id, inactive, false);
      }
    }
    this.inactiveIds.clear();
    this.current = null;
  }

  // ─── Pointer handlers ───────────────────────────────────────────────────

  private handlePointerOver(id: string, type: HoverableElementType): void {
    if (!this._enabled) return;
    const target = this.resolveElement(id, type);
    if (!target) return;

    const { enable } = this.opts;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(target)) return;

    if (this.current && this.current.id !== id) {
      this.clearHover();
    } else if (this.current && this.current.id === id) {
      return;
    }
    this.activate(target);
  }

  private handlePointerOut(id: string, _type: HoverableElementType): void {
    if (!this.current || this.current.id !== id) return;
    const ending = this.current;
    this.opts.onHoverEnd?.(ending);
    this.clearHover();
  }

  private activate(target: HoverableElement): void {
    const layer = this.layer;
    if (!layer) return;

    this.current = target;
    if (target.type === 'shape') layer.setNodeState(target.id, this.opts.state, true);
    else layer.setEdgeState(target.id, this.opts.state, true);

    if (this.opts.degree > 0 && target.type === 'shape') {
      const { nodeIds, edgeIds } = this.collectNeighbours(target.id, this.opts.degree);
      for (const nid of nodeIds) {
        layer.setNodeState(nid, this.opts.state, true);
        this.activeIds.add(nid);
      }
      for (const eid of edgeIds) {
        layer.setEdgeState(eid, this.opts.state, true);
        this.activeIds.add(eid);
      }
    }

    if (this.opts.inactiveState) this.applyInactive(target.id);

    this.opts.onHover?.(target);
  }

  /** BFS neighbourhood expansion using the store's adjacency index. */
  private collectNeighbours(
    rootId: string,
    degree: number,
  ): { nodeIds: Set<string>; edgeIds: Set<string> } {
    const nodeIds = new Set<string>();
    const edgeIds = new Set<string>();
    const layer = this.layer;
    if (!layer) return { nodeIds, edgeIds };
    const store = layer.store;

    let frontier: string[] = [rootId];
    const visited = new Set<string>([rootId]);
    for (let hop = 0; hop < degree; hop++) {
      const next: string[] = [];
      for (const u of frontier) {
        for (const e of store.edgesOf(u, this.opts.direction)) {
          edgeIds.add(e.id);
          const otherId = e.source === u ? e.target : e.source;
          if (!visited.has(otherId)) {
            visited.add(otherId);
            nodeIds.add(otherId);
            next.push(otherId);
          }
        }
      }
      frontier = next;
      if (frontier.length === 0) break;
    }
    return { nodeIds, edgeIds };
  }

  private applyInactive(hoveredId: string): void {
    const inactive = this.opts.inactiveState;
    if (!inactive) return;
    const layer = this.layer;
    if (!layer) return;

    const activeIds = new Set<string>([hoveredId, ...this.activeIds]);
    for (const node of layer.store.nodes()) {
      if (activeIds.has(node.id)) continue;
      layer.setNodeState(node.id, inactive, true);
      this.inactiveIds.add(node.id);
    }
    for (const edge of layer.store.edges()) {
      if (activeIds.has(edge.id)) continue;
      layer.setEdgeState(edge.id, inactive, true);
      this.inactiveIds.add(edge.id);
    }
  }

  private resolveElement(id: string, type: HoverableElementType): HoverableElement | null {
    const layer = this.layer;
    if (!layer) return null;
    if (type === 'shape') {
      const node = layer.store.getNode(id);
      return node ? { id, type, data: node.data } : null;
    }
    const edge = layer.store.getEdge(id);
    return edge ? { id, type, data: edge.data } : null;
  }
}
