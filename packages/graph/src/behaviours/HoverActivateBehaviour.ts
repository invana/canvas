/**
 * `HoverActivateBehaviour` — toggles a named visual state on hovered nodes /
 * edges (and optionally their N-hop neighbours), with optional dimming of
 * everything else.
 *
 * Layer-scoped: constructed with a `targetLayerId` referencing a
 * {@link GraphLayer}. Subscribes to that layer's renderer pointer events
 * (`shape:pointerover` / `connector:pointerover`) and drives layer state via
 * `layer.store.setNodeState` / `layer.store.setEdgeState`.
 *
 * Default `enabled: false` — register, then explicitly enable. Matches the
 * project rule that no behaviour auto-activates.
 *
 * Defaults align with the canonical state catalogue auto-merged into
 * every `GraphLayer`: `state: 'hovered'` for the focal (and N-hop
 * neighbours when `degree > 0`), and optional `inactiveState: 'dimmed'`
 * for everything else. Override these when the project's state
 * vocabulary diverges.
 *
 * @example
 * ```ts
 * // Layer defaults already include `hovered`, `highlighted`, `dimmed` —
 * // no setup needed beyond registering the behaviour.
 *
 * canvas.behaviours.register(
 *   new HoverActivateBehaviour({
 *     id: 'hover',
 *     targetLayerId: 'graph',
 *     enabled: true,
 *     // state defaults to 'hovered'
 *     inactiveState: 'dimmed',
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
  targetLayerId: string;

  /**
   * Per-target enable predicate. `boolean` is a global on/off; a function
   * runs per pointer-over and may veto activation. Default `true`.
   */
  enable?: boolean | ((element: HoverableElement) => boolean);

  /**
   * Whether hovering **directly** over an edge activates it. When `false` (the
   * default) the behaviour ignores `connector:pointerover` entirely, so only
   * nodes drive the hover. Neighbour-edge highlighting is unaffected: a hovered
   * node's connecting edges still light up when `degree > 0` (that path is
   * governed by `degree`, not this flag). Set `true` to also activate edges
   * under the pointer.
   *
   * Equivalent to `enable: (el) => el.type !== 'connector'`, but a discoverable
   * first-class flag (and surfaced in the settings editor). Toggling it off
   * while an edge is hovered releases that edge immediately.
   */
  hoverEdges?: boolean;

  /**
   * State name applied to the hovered focal element (and its N-hop
   * neighbours when `degree > 0`). Default `'hovered'` — matches the
   * canonical state catalogue auto-merged into every `GraphLayer`. Pass
   * a custom name when the behaviour should write a project-specific
   * state instead (e.g. `'focal'`).
   */
  state?: string;

  /**
   * State name applied to every element *not* in the active set. Leave
   * `undefined` to skip inactive dimming. Default `undefined`.
   */
  inactiveState?: string;

  /**
   * Lift the active set (the hovered focal element + its N-hop neighbours)
   * above the rest within its render layer for the duration of the hover, so
   * unrelated nodes / edges don't paint over the highlighted data. Edges raise
   * above other edges (still below all nodes); neighbour nodes raise above
   * other nodes. Reset when the hover clears. Visual-only — restacking doesn't
   * affect hit-testing. Default `true`.
   */
  raiseActive?: boolean;

  /**
   * N-hop neighbour radius. `0` = hovered element only; `1` = direct
   * neighbours + connecting edges; `N` = N-hop. Default `0`.
   */
  degree?: number;

  /** Direction for neighbour traversal. Default `'both'`. */
  direction?: HoverDirection;

  /**
   * Camera scale at or below which the behaviour swaps `state` for
   * `zoomedOutState` (and `zoomedOutEdgeState` for edges). The hovered set
   * gets re-painted through the swapped state names whenever the camera
   * crosses this threshold mid-hover. Omit (or leave both zoomed-out names
   * undefined) and the behaviour is identical to today.
   *
   * Typical use: at world-level zoom every node collapses to ~1 anti-aliased
   * pixel, so the normal `active` state is invisible against background
   * dots. A bigger `active-far` config (size + strokeWidth bumped) makes
   * the hovered node pop.
   */
  zoomThreshold?: number;

  /**
   * State name applied to the hovered node + N-hop neighbour nodes when
   * `camera.scale <= zoomThreshold`. Falls back to `state` when undefined
   * (no node-side zoom swap, but edges may still swap via
   * `zoomedOutEdgeState`).
   */
  zoomedOutState?: string;

  /**
   * State name applied to connecting edges when
   * `camera.scale <= zoomThreshold` AND `degree > 0`. Falls back to `state`
   * when undefined.
   */
  zoomedOutEdgeState?: string;

  /**
   * Gfx-transform scale multiplier applied to each hovered node (and the
   * N-hop neighbour nodes) when `camera.scale <= zoomThreshold`. Pure
   * transform write via {@link PrimitivesRenderer.scaleShape} — no geometry
   * rebuild, no styling change. Use this when you want the hovered node to
   * just *grow visually* at low zoom (so it stands out against ~1 px
   * background dots) while keeping its original colour, stroke, and label.
   *
   * Multiplies the existing `gfx.scale`, so if `NodeScaleLODBehaviour` is
   * also active it will overwrite the multiplier on the next zoom frame —
   * prefer `zoomedOutState` with a bigger `size` in that case. For stories
   * without an LOD behaviour, this is the cleanest "scale on hover" knob.
   *
   * Only nodes are scaled — connectors don't compose cleanly with
   * `gfx.scale` (the polyline would shift, not just thicken). The hovered
   * node's outgoing edges still anchor to its geometric position, which
   * sits inside the now-bigger silhouette — visually acceptable.
   *
   * `undefined` (default) and `1` both disable the multiplier.
   */
  zoomedOutScale?: number;

  /** Fired when an element first becomes hovered. */
  onHover?: (element: HoverableElement) => void;
  /** Fired when hover ends on a previously hovered element. */
  onHoverEnd?: (element: HoverableElement) => void;
}

interface ResolvedOptions {
  enable: boolean | ((element: HoverableElement) => boolean);
  hoverEdges: boolean;
  state: string;
  inactiveState: string | undefined;
  raiseActive: boolean;
  degree: number;
  direction: HoverDirection;
  zoomThreshold: number | undefined;
  zoomedOutState: string | undefined;
  zoomedOutEdgeState: string | undefined;
  zoomedOutScale: number | undefined;
  onHover: ((element: HoverableElement) => void) | undefined;
  onHoverEnd: ((element: HoverableElement) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: Partial<HoverActivateBehaviourOptions>,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable: true,
    hoverEdges: false,
    state: 'hovered',
    inactiveState: undefined,
    raiseActive: true,
    degree: 0,
    direction: 'both',
    zoomThreshold: undefined,
    zoomedOutState: undefined,
    zoomedOutEdgeState: undefined,
    zoomedOutScale: undefined,
    onHover: undefined,
    onHoverEnd: undefined,
  };
  return {
    enable: patch.enable ?? base.enable,
    hoverEdges: patch.hoverEdges ?? base.hoverEdges,
    state: patch.state ?? base.state,
    inactiveState: 'inactiveState' in patch ? patch.inactiveState : base.inactiveState,
    raiseActive: patch.raiseActive ?? base.raiseActive,
    degree: patch.degree ?? base.degree,
    direction: patch.direction ?? base.direction,
    zoomThreshold:
      'zoomThreshold' in patch ? patch.zoomThreshold : base.zoomThreshold,
    zoomedOutState:
      'zoomedOutState' in patch ? patch.zoomedOutState : base.zoomedOutState,
    zoomedOutEdgeState:
      'zoomedOutEdgeState' in patch
        ? patch.zoomedOutEdgeState
        : base.zoomedOutEdgeState,
    zoomedOutScale:
      'zoomedOutScale' in patch ? patch.zoomedOutScale : base.zoomedOutScale,
    onHover: 'onHover' in patch ? patch.onHover : base.onHover,
    onHoverEnd: 'onHoverEnd' in patch ? patch.onHoverEnd : base.onHoverEnd,
  };
}

export class HoverActivateBehaviour extends Behaviour {
  override readonly kind = 'hover-activate';
  /** Bound target layer — resolved in `onRegister`. */
  private layer: GraphLayer | null = null;

  private opts: ResolvedOptions;

  /** Subscription disposers, called in `onDestroy`. */
  private subs: Array<() => void> = [];

  /** Currently hovered element, or `null`. */
  private current: HoverableElement | null = null;

  /**
   * Kernel store — the focal hover id is mirrored into `view.interaction.hover`
   * so it's observable (`useStore`), tap-able, and syncable (Awareness) without
   * readers touching this behaviour. The behaviour keeps owning the hover
   * machinery + render visuals (`GraphStore` runtime states).
   */
  private _canvasStore?: CanvasContext['store'];
  /** Neighbour ids that received the active state (excluding `current`). */
  private activeIds = new Set<string>();
  /** Element ids that received the inactive state. */
  private inactiveIds = new Set<string>();

  /**
   * State name actually applied to nodes for the current hover — equals
   * `opts.state` normally, `opts.zoomedOutState` when the camera was below
   * `opts.zoomThreshold` at activation (or after a mid-hover swap). Tracked
   * so `clearHover` / `swapStates` remove whatever was actually applied,
   * not just whatever the current `opts.state` is now.
   */
  private appliedNodeState: string | null = null;
  /** Sibling of {@link appliedNodeState} for edges. */
  private appliedEdgeState: string | null = null;

  /**
   * Gfx-transform multiplier currently applied to the hovered node set.
   * `1` (or `null`) means no multiplier is active. Tracked so a threshold
   * cross or clear can reset only the ids we actually scaled.
   */
  private appliedScale: number = 1;
  /** Node ids currently scaled via `renderer.scaleShape` — reset on clear. */
  private readonly scaledNodeIds = new Set<string>();

  /**
   * `gfx.zIndex` written to the active set when `raiseActive` is on. Any value
   * above the default `0` lifts the element over its untouched peers; `1` is
   * enough and keeps hover- and selection-raises on the same tier.
   */
  private static readonly RAISED_Z_INDEX = 1;
  /** Ids currently raised via `renderer.raiseShape` / `raiseConnector`. */
  private readonly raisedIds = new Set<string>();

  constructor(opts: HoverActivateBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['pointer+hover'] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `HoverActivateBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this._canvasStore = ctx.store;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(
        `HoverActivateBehaviour "${this.id}": target layer "${this.targetLayerId}" is not mounted. ` +
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

    // When the pointer leaves the canvas entirely (onto a toolbar/panel or out
    // of the window), the renderer's `globalpointermove` stream stops, so no
    // `pointerout` fires for the element still under the cursor and the hover
    // states would stick. Clear on the canvas element's `pointerleave`.
    const el = ctx.canvasElement;
    if (el) {
      const onLeave = (): void => {
        if (!this.current) return;
        this.opts.onHoverEnd?.(this.current);
        this.clearHover();
      };
      el.addEventListener('pointerleave', onLeave);
      this.subs.push(() => el.removeEventListener('pointerleave', onLeave));
    }

    // Camera-zoom subscription is **conditional** — only wired when a
    // `zoomThreshold` is configured. Stories that don't use the zoom-tier
    // pay zero per-zoom cost.
    if (this.opts.zoomThreshold !== undefined) {
      const onZoom = (): void => this.handleCameraZoom();
      ctx.events.on('input:camera:zoom', onZoom);
      this.subs.push(() => ctx.events.off('input:camera:zoom', onZoom));
    }
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
      ('inactiveState' in patch && patch.inactiveState !== this.opts.inactiveState) ||
      ('zoomedOutState' in patch &&
        patch.zoomedOutState !== this.opts.zoomedOutState) ||
      ('zoomedOutEdgeState' in patch &&
        patch.zoomedOutEdgeState !== this.opts.zoomedOutEdgeState);
    const raiseChanged =
      patch.raiseActive !== undefined && patch.raiseActive !== this.opts.raiseActive;
    if (stateChanged) this.clearHover();
    this.opts = resolveOptions(this.opts, patch);
    // Turning edge-hover off mid-hover on an edge releases it right away; the
    // guards below then see no `current` and no-op.
    if (!this.opts.hoverEdges && this.current?.type === 'connector') this.clearHover();
    // Re-pick states / scale if the threshold or scale moved while a hover
    // is active — runtime knob changes (GUI sliders) should swap immediately.
    if (this.current) this.handleCameraZoom();
    // Toggle raise on/off live for the in-flight hover (e.g. a GUI checkbox).
    if (this.current && raiseChanged) {
      if (this.opts.raiseActive) this.applyRaise();
      else this.resetRaise();
    }
  }

  /** Mirror the focal hover id into `view.interaction.hover` (D11). */
  private mirrorHover(id: string | null): void {
    if (id === null) this._canvasStore?.actions.hover.clear();
    else this._canvasStore?.actions.hover.set(id);
  }

  /** Clear all states applied by the current hover. */
  clearHover(): void {
    if (!this.layer) {
      this.current = null;
      this.mirrorHover(null);
      this.activeIds.clear();
      this.inactiveIds.clear();
      this.scaledNodeIds.clear();
      this.raisedIds.clear();
      this.appliedNodeState = null;
      this.appliedEdgeState = null;
      this.appliedScale = 1;
      return;
    }
    // Use the state names that were *actually* applied — they may differ
    // from `opts.state` when a zoom-tier swap happened mid-hover, or when
    // the user changed `state` via `setOptions` after the hover started.
    const nodeState = this.appliedNodeState ?? this.opts.state;
    const edgeState = this.appliedEdgeState ?? this.opts.state;
    if (this.current) {
      if (this.current.type === 'shape') {
        this.layer.store.setNodeState(this.current.id, nodeState, false);
      } else {
        this.layer.store.setEdgeState(this.current.id, edgeState, false);
      }
    }
    for (const id of this.activeIds) {
      // Active ids can be either nodes or edges; try both.
      this.layer.store.setNodeState(id, nodeState, false);
      this.layer.store.setEdgeState(id, edgeState, false);
    }
    this.activeIds.clear();

    const inactive = this.opts.inactiveState;
    if (inactive) {
      for (const id of this.inactiveIds) {
        this.layer.store.setNodeState(id, inactive, false);
        this.layer.store.setEdgeState(id, inactive, false);
      }
    }
    this.inactiveIds.clear();

    // Reset any gfx.scale bumps we applied during this hover.
    if (this.scaledNodeIds.size > 0) {
      const renderer = this.layer.getRenderer();
      if (renderer) {
        for (const id of this.scaledNodeIds) renderer.scaleShape(id, 1);
      }
      this.scaledNodeIds.clear();
    }
    this.appliedScale = 1;

    // Drop the active set back to its natural stacking.
    this.resetRaise();

    this.current = null;
    this.mirrorHover(null);
    this.appliedNodeState = null;
    this.appliedEdgeState = null;
  }

  // ─── Pointer handlers ───────────────────────────────────────────────────

  private handlePointerOver(id: string, type: HoverableElementType): void {
    if (!this._enabled) return;
    // Edge hover can be switched off wholesale — ignore connector pointer-overs
    // before any resolution work. Node hover (and neighbour-edge highlighting
    // via `degree`) is untouched.
    if (type === 'connector' && !this.opts.hoverEdges) return;
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
    this.mirrorHover(target.id);
    const picked = this.pickTier();
    this.appliedNodeState = picked.node;
    this.appliedEdgeState = picked.edge;

    if (target.type === 'shape') layer.store.setNodeState(target.id, picked.node, true);
    else layer.store.setEdgeState(target.id, picked.edge, true);

    if (this.opts.degree > 0 && target.type === 'shape') {
      const { nodeIds, edgeIds } = this.collectNeighbours(target.id, this.opts.degree);
      for (const nid of nodeIds) {
        layer.store.setNodeState(nid, picked.node, true);
        this.activeIds.add(nid);
      }
      for (const eid of edgeIds) {
        layer.store.setEdgeState(eid, picked.edge, true);
        this.activeIds.add(eid);
      }
    }

    if (this.opts.inactiveState) this.applyInactive(target.id);

    // Visual scale-up bump must run AFTER the active set is finalised
    // (so neighbour shapes are included). State+scale are independent
    // dimensions of the zoom-tier — either, both, or neither may activate.
    if (picked.scale !== 1) this.applyScale(picked.scale);

    // Lift the finalised active set above the rest so unrelated nodes / edges
    // don't paint over the highlighted data.
    if (this.opts.raiseActive) this.applyRaise();

    this.opts.onHover?.(target);
  }

  /**
   * Choose which node + edge state names AND gfx scale to apply right now,
   * based on `camera.scale` vs. `opts.zoomThreshold`.
   *
   * - `node` / `edge`: `opts.state` (or `opts.zoomedOutState` /
   *   `opts.zoomedOutEdgeState` at far zoom). Each role falls back to
   *   `opts.state` independently.
   * - `scale`: `1` (or `opts.zoomedOutScale` at far zoom). The scale
   *   multiplier is independent of the state-name swap — a story can
   *   configure either, both, or neither.
   */
  private pickTier(): { node: string; edge: string; scale: number } {
    const o = this.opts;
    const scale = this.ctx?.camera.scale ?? Infinity;
    const usingZoomed =
      o.zoomThreshold !== undefined && scale <= o.zoomThreshold;
    return {
      node: usingZoomed && o.zoomedOutState ? o.zoomedOutState : o.state,
      edge: usingZoomed && o.zoomedOutEdgeState ? o.zoomedOutEdgeState : o.state,
      scale:
        usingZoomed && o.zoomedOutScale !== undefined && o.zoomedOutScale > 0
          ? o.zoomedOutScale
          : 1,
    };
  }

  /**
   * Handle a `camera:zoom` event while a hover is active. Two independent
   * dimensions may change as the camera crosses the threshold:
   *
   * - State names — swap via {@link swapStates} (state-config-driven
   *   restyle, composes with `NodeScaleLODBehaviour`).
   * - Scale multiplier — re-apply via {@link applyScale} (`gfx.scale`
   *   write, does NOT compose with LOD).
   *
   * Idempotent: a zoom that doesn't cross the threshold leaves both
   * dimensions unchanged and exits cheaply.
   */
  private handleCameraZoom(): void {
    if (!this.current || !this.layer) return;
    const picked = this.pickTier();
    const statesChanged =
      picked.node !== this.appliedNodeState ||
      picked.edge !== this.appliedEdgeState;
    const scaleChanged = picked.scale !== this.appliedScale;
    if (!statesChanged && !scaleChanged) return;
    if (statesChanged) {
      this.swapStates({ node: picked.node, edge: picked.edge });
    }
    if (scaleChanged) {
      this.applyScale(picked.scale);
    }
  }

  /**
   * Set / reset `gfx.scale` on the hovered node set. Pure transform write
   * via {@link PrimitivesRenderer.scaleShape} — no geometry rebuild,
   * preserves the node's spec-driven colour, stroke, label, etc.
   *
   * Resets any previously-scaled ids first so `applyScale(1)` is a clean
   * teardown. Only ids that resolve to shapes (not connectors) are
   * touched — `activeIds` is a flat set of mixed kinds; `renderer.hasShape`
   * filters out edge ids cheaply.
   */
  private applyScale(scale: number): void {
    const renderer = this.layer?.getRenderer();
    if (!renderer) {
      this.scaledNodeIds.clear();
      this.appliedScale = 1;
      return;
    }
    for (const id of this.scaledNodeIds) renderer.scaleShape(id, 1);
    this.scaledNodeIds.clear();
    this.appliedScale = 1;

    if (scale === 1) return;

    if (this.current?.type === 'shape') {
      renderer.scaleShape(this.current.id, scale);
      this.scaledNodeIds.add(this.current.id);
    }
    for (const id of this.activeIds) {
      if (!renderer.hasShape(id)) continue;
      renderer.scaleShape(id, scale);
      this.scaledNodeIds.add(id);
    }
    this.appliedScale = scale;
  }

  /**
   * Raise the current hovered set (`current` + `activeIds`) above their peers
   * via `renderer.raiseShape` / `raiseConnector`. `activeIds` is a flat set of
   * mixed kinds, so each id is dispatched by `hasShape` / `hasConnector`.
   * Tracked in {@link raisedIds} so {@link resetRaise} restores exactly the
   * ids we touched.
   *
   * **Expanded group frames raise their contents instead of themselves** — see
   * {@link raiseGroupContents}.
   */
  private applyRaise(): void {
    const renderer = this.layer?.getRenderer();
    if (!renderer) return;
    const z = HoverActivateBehaviour.RAISED_Z_INDEX;
    const raise = (id: string): void => {
      if (renderer.hasShape(id)) {
        if (this.isExpandedGroup(id)) {
          this.raiseGroupContents(id, z);
          return;
        }
        renderer.raiseShape(id, z);
      } else if (renderer.hasConnector(id)) {
        renderer.raiseConnector(id, z);
      } else return;
      this.raisedIds.add(id);
    };
    if (this.current) raise(this.current.id);
    for (const id of this.activeIds) raise(id);
  }

  /**
   * Lift what an expanded group *contains* — its descendants (recursive, so a
   * nested group brings its whole subtree) plus the edges with both ends inside
   * it — rather than the frame itself.
   *
   * Two reasons the frame stays put:
   *
   * - **It can't be lifted correctly.** The renderer's overlay sorts every
   *   raised shape far above every raised connector, so a lifted frame paints
   *   over its own members' edges — the arrows inside it vanish. No z-index
   *   avoids that; the bands are fixed.
   * - **Lifting a backdrop is meaningless.** A frame is the container behind
   *   its members; floating it above unrelated content while its contents stay
   *   behind isn't what "raise this element" means for a group.
   *
   * Left alone, the frame keeps its `behindChildren` z in the shape layer, so
   * the lifted members and their lifted edges both sit above it. A *collapsed*
   * group never reaches here — it renders as an ordinary node with nothing
   * inside to cover, and raises normally.
   */
  private raiseGroupContents(groupId: string, z: number): void {
    const layer = this.layer;
    const renderer = layer?.getRenderer();
    if (!layer || !renderer) return;
    const memberIds = new Set<string>([groupId, ...layer.store.descendantsOf(groupId)]);
    for (const id of memberIds) {
      if (id === groupId || !renderer.hasShape(id)) continue;
      renderer.raiseShape(id, z);
      this.raisedIds.add(id);
      // Only the group's *internal* wiring — an edge leaving the group belongs
      // as much to the other end, and lifting it would drag half of an
      // unrelated stage's arrow over the top.
      for (const edge of layer.store.edgesOf(id, 'both')) {
        if (!memberIds.has(edge.source) || !memberIds.has(edge.target)) continue;
        if (!renderer.hasConnector(edge.id)) continue;
        renderer.raiseConnector(edge.id, z);
        this.raisedIds.add(edge.id);
      }
    }
  }

  /** True for a group node that is currently expanded (i.e. drawn as a frame). */
  private isExpandedGroup(id: string): boolean {
    const layer = this.layer;
    const node = layer?.store.getNode(id);
    if (!layer || !node) return false;
    return layer.isGroupNode(node) && !layer.isCollapsedGroup(node);
  }

  /** Reset every id raised by {@link applyRaise} back to the default z (0). */
  private resetRaise(): void {
    if (this.raisedIds.size === 0) return;
    const renderer = this.layer?.getRenderer();
    if (renderer) {
      for (const id of this.raisedIds) {
        if (renderer.hasShape(id)) renderer.raiseShape(id, 0);
        else if (renderer.hasConnector(id)) renderer.raiseConnector(id, 0);
      }
    }
    this.raisedIds.clear();
  }

  /**
   * Walk the current hovered set (`current` + `activeIds`) and replace the
   * previously-applied state names with `picked.node` / `picked.edge`.
   * Skips work per-role when the state name didn't change for that role
   * (e.g. only the edge state swapped while the node state stayed put).
   *
   * `activeIds` is a flat set containing both node and edge ids — we don't
   * track type per id, so we call `setNodeState` / `setEdgeState` for both;
   * mismatched calls (an id that doesn't exist in that store) no-op
   * gracefully. Matches the existing pattern in {@link clearHover}.
   */
  private swapStates(picked: { node: string; edge: string }): void {
    const layer = this.layer;
    if (!layer) return;
    const prevNode = this.appliedNodeState ?? this.opts.state;
    const prevEdge = this.appliedEdgeState ?? this.opts.state;
    const nodeChanged = prevNode !== picked.node;
    const edgeChanged = prevEdge !== picked.edge;
    if (!nodeChanged && !edgeChanged) return;

    if (this.current) {
      if (this.current.type === 'shape' && nodeChanged) {
        layer.store.setNodeState(this.current.id, prevNode, false);
        layer.store.setNodeState(this.current.id, picked.node, true);
      } else if (this.current.type === 'connector' && edgeChanged) {
        layer.store.setEdgeState(this.current.id, prevEdge, false);
        layer.store.setEdgeState(this.current.id, picked.edge, true);
      }
    }
    for (const id of this.activeIds) {
      if (nodeChanged) {
        layer.store.setNodeState(id, prevNode, false);
        layer.store.setNodeState(id, picked.node, true);
      }
      if (edgeChanged) {
        layer.store.setEdgeState(id, prevEdge, false);
        layer.store.setEdgeState(id, picked.edge, true);
      }
    }

    this.appliedNodeState = picked.node;
    this.appliedEdgeState = picked.edge;
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
      layer.store.setNodeState(node.id, inactive, true);
      this.inactiveIds.add(node.id);
    }
    for (const edge of layer.store.edges()) {
      if (activeIds.has(edge.id)) continue;
      layer.store.setEdgeState(edge.id, inactive, true);
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
