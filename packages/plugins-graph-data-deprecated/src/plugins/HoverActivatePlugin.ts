// ── HoverActivatePlugin ───────────────────────────────────────────────────────
// Behaviour plugin: applies a state to hovered nodes/edges (and optionally
// their neighbours up to N hops). Optionally dims every other element with a
// separate inactive state. All options are runtime-mutable via setOptions().
//
// This plugin is **opt-in** — register it explicitly when hover activation
// is desired. Without it, ShapesPlugin still emits `shape:pointerover` /
// `shape:pointerout` events but does not modify any visual state.

import type { CanvasPlugin, PluginContext, CanvasEventMap } from '@invana/canvas-deprecated';
import type { BaseShape, BaseConnector } from '@invana/plugins-shapes-deprecated';
import type { GraphDataPlugin } from '../GraphDataPlugin.js';
import type { TraversalDirection } from '../graph-types.js';
import { HoverStore } from '../state/HoverStore.js';

type Handler<K extends keyof CanvasEventMap> = (e: CanvasEventMap[K]) => void;

/** Element kind for hover targets. */
export type HoverableElementType = 'shape' | 'connector';

/**
 * Element handed to hover callbacks — `id`, `type`, and the underlying
 * rendered shape/connector instance.
 */
export interface HoverableElement {
  readonly id:      string;
  readonly type:    HoverableElementType;
  readonly element: BaseShape | BaseConnector;
}

/**
 * Edge direction filter for neighbour traversal.
 * Alias of {@link TraversalDirection} for plugin-local readability.
 */
export type HoverDirection = TraversalDirection;

/** Constructor / `setOptions` payload for {@link HoverActivatePlugin}. */
export interface HoverActivatePluginOptions {
  /** Plugin id override. Default: `'hover-activate'`. */
  key?: string;
  /**
   * Id of the {@link GraphDataPlugin} this plugin reads/writes through.
   * Default: `'graph-data'`.
   */
  graphDataId?: string;

  /**
   * Whether hover activation is enabled.
   * `boolean` — global on/off.
   * `(element) => boolean` — per-element predicate.
   * Default: `true`.
   */
  enable?: boolean | ((element: HoverableElement) => boolean);

  /** State applied to the hovered element and its neighbours. Default: `'active'`. */
  state?: string;

  /**
   * State applied to every element NOT in the active set.
   * When `undefined` (default), no inactive dimming is applied.
   */
  inactiveState?: string;

  /**
   * Degree of relationship to activate from the hovered node.
   * - `0` — hovered element only
   * - `1` — direct neighbours + connecting edges
   * - `N` — N-hop neighbours
   *
   * Default: `0`.
   */
  degree?: number;

  /** Edge direction to follow during neighbour traversal. Default: `'both'`. */
  direction?: HoverDirection;

  /**
   * Whether to enable animation transitions between states.
   * Reserved — currently a no-op flag stored for future use.
   * Default: `true`.
   */
  animation?: boolean;

  /** Called when an element becomes the hovered element. */
  onHover?: (element: HoverableElement) => void;
  /** Called when hover ends on a previously hovered element. */
  onHoverEnd?: (element: HoverableElement) => void;
}

interface ResolvedOptions {
  enable:        boolean | ((element: HoverableElement) => boolean);
  state:         string;
  inactiveState: string | undefined;
  degree:        number;
  direction:     HoverDirection;
  animation:     boolean;
  onHover:       ((element: HoverableElement) => void) | undefined;
  onHoverEnd:    ((element: HoverableElement) => void) | undefined;
}

function resolveOptions(
  prev: ResolvedOptions | null,
  patch: HoverActivatePluginOptions,
): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    enable:        true,
    state:         'active',
    inactiveState: undefined,
    degree:        0,
    direction:     'both',
    animation:     true,
    onHover:       undefined,
    onHoverEnd:    undefined,
  };
  return {
    enable:        patch.enable        ?? base.enable,
    state:         patch.state         ?? base.state,
    inactiveState: 'inactiveState' in patch ? patch.inactiveState : base.inactiveState,
    degree:        patch.degree        ?? base.degree,
    direction:     patch.direction     ?? base.direction,
    animation:     patch.animation     ?? base.animation,
    onHover:       'onHover'    in patch ? patch.onHover    : base.onHover,
    onHoverEnd:    'onHoverEnd' in patch ? patch.onHoverEnd : base.onHoverEnd,
  };
}

/**
 * `HoverActivatePlugin` — toggles a state on hovered nodes/edges with
 * optional N-degree neighbour highlighting and inactive dimming.
 *
 * @remarks
 * Looks up an existing {@link GraphDataPlugin} via `ctx.getPlugin()` at
 * registration time and uses its public methods to drive visuals. Exposes
 * a {@link HoverStore} (`plugin.store`) for downstream consumers.
 *
 * @example
 * ```ts
 * await canvas.plugins.register(new GraphDataPlugin({ data }));
 * await canvas.plugins.register(new HoverActivatePlugin({
 *   state: 'active',
 *   degree: 1,
 *   direction: 'both',
 *   inactiveState: 'inactive',
 *   onHover:    el => console.log('hover',    el.id),
 *   onHoverEnd: el => console.log('hoverEnd', el.id),
 * }));
 * ```
 */
export class HoverActivatePlugin implements CanvasPlugin {
  readonly id: string;

  /** Single-element hover store updated by this plugin. */
  readonly store = new HoverStore();

  private readonly _graphDataId: string;

  private _options: ResolvedOptions;
  private _graph: GraphDataPlugin | null = null;
  private _ctx:   PluginContext     | null = null;

  private _onOver: Handler<'shape:pointerover'> | null = null;
  private _onOut:  Handler<'shape:pointerout'>  | null = null;

  /** The element currently driving the hover effect, or `null`. */
  private _currentHover: HoverableElement | null = null;
  /** Neighbour ids that received `state` (excluding currentHover). */
  private _activeIds  = new Set<string>();
  /** Element ids that received `inactiveState`. */
  private _inactiveIds = new Set<string>();

  constructor(options: HoverActivatePluginOptions = {}) {
    this.id           = options.key         ?? 'hover-activate';
    this._graphDataId = options.graphDataId ?? 'graph-data';
    this._options     = resolveOptions(null, options);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  register(ctx: PluginContext): void {
    const graph = ctx.getPlugin<GraphDataPlugin>(this._graphDataId);
    if (!graph) {
      throw new Error(
        `[HoverActivatePlugin] requires a GraphDataPlugin registered with id "${this._graphDataId}". ` +
        `Register it before HoverActivatePlugin.`,
      );
    }
    this._graph = graph;
    this._ctx   = ctx;

    this._onOver = (e) => this._handlePointerOver(e.elementId, e.elementType);
    this._onOut  = (e) => this._handlePointerOut(e.elementId, e.elementType);

    ctx.events.on('shape:pointerover', this._onOver);
    ctx.events.on('shape:pointerout',  this._onOut);
  }

  destroy(): void {
    this.clearHover();
    if (this._ctx && this._onOver) this._ctx.events.off('shape:pointerover', this._onOver);
    if (this._ctx && this._onOut)  this._ctx.events.off('shape:pointerout',  this._onOut);
    this._onOver = null;
    this._onOut  = null;
    this._ctx    = null;
    this.store.clear();
    this.store.removeAllListeners();
    this._graph = null;
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /** The element currently driving the hover effect, or `null` when no hover. */
  get hoveredElement(): HoverableElement | null {
    return this._currentHover;
  }

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this._options;
  }

  /**
   * Update one or more options at runtime. Any in-flight hover effect is
   * cleared first when `state` or `inactiveState` change, so the next hover
   * applies the new visual cleanly.
   */
  setOptions(patch: Partial<HoverActivatePluginOptions>): void {
    const stateChanged =
      (patch.state         !== undefined && patch.state         !== this._options.state) ||
      ('inactiveState' in patch          && patch.inactiveState !== this._options.inactiveState);

    if (stateChanged) this.clearHover();

    this._options = resolveOptions(this._options, patch);
  }

  /** Clear all states applied by the current hover (active set + inactive set). */
  clearHover(): void {
    const graph = this._graph;
    if (!graph) {
      this._currentHover = null;
      this._activeIds.clear();
      this._inactiveIds.clear();
      this.store.clear();
      return;
    }

    if (this._currentHover) {
      graph.setState(this._currentHover.id, this._options.state, false);
      this._currentHover = null;
    }
    for (const id of this._activeIds) {
      graph.setState(id, this._options.state, false);
    }
    this._activeIds.clear();

    if (this._options.inactiveState) {
      for (const id of this._inactiveIds) {
        graph.setState(id, this._options.inactiveState, false);
      }
    }
    this._inactiveIds.clear();

    this.store.clear();
  }

  // ── Internal — pointer event handlers ─────────────────────────────────────

  private _handlePointerOver(id: string, type: HoverableElementType): void {
    const target = this._resolveElement(id, type);
    if (!target) return;

    const { enable } = this._options;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(target)) return;

    if (this._currentHover && this._currentHover.id !== id) {
      this.clearHover();
    } else if (this._currentHover && this._currentHover.id === id) {
      return;
    }

    this._activate(target);
  }

  private _handlePointerOut(id: string, _type: HoverableElementType): void {
    if (!this._currentHover || this._currentHover.id !== id) return;
    const ending = this._currentHover;
    this._options.onHoverEnd?.(ending);
    this.clearHover();
  }

  private _activate(target: HoverableElement): void {
    const graph = this._graph;
    if (!graph) return;

    this._currentHover = target;
    graph.setState(target.id, this._options.state, true);
    this.store.set(target.id, target.type);

    if (this._options.degree > 0 && target.type === 'shape') {
      const { nodeIds, edgeIds } = graph.getNeighborElements(
        target.id,
        this._options.degree,
        this._options.direction,
      );
      for (const nid of nodeIds) {
        graph.setState(nid, this._options.state, true);
        this._activeIds.add(nid);
      }
      for (const eid of edgeIds) {
        graph.setState(eid, this._options.state, true);
        this._activeIds.add(eid);
      }
    }

    if (this._options.inactiveState) {
      this._applyInactive(graph, target.id);
    }

    this._options.onHover?.(target);
  }

  private _applyInactive(graph: GraphDataPlugin, hoveredId: string): void {
    const inactiveState = this._options.inactiveState;
    if (!inactiveState) return;

    const activeIds = new Set<string>([hoveredId, ...this._activeIds]);
    for (const nid of graph.getRenderedNodeIds()) {
      if (activeIds.has(nid)) continue;
      graph.setState(nid, inactiveState, true);
      this._inactiveIds.add(nid);
    }
    for (const eid of graph.getRenderedEdgeIds()) {
      if (activeIds.has(eid)) continue;
      graph.setState(eid, inactiveState, true);
      this._inactiveIds.add(eid);
    }
  }

  private _resolveElement(id: string, type: HoverableElementType): HoverableElement | null {
    const graph = this._graph;
    if (!graph) return null;
    if (type === 'shape') {
      const element = graph.getNodeElement(id);
      return element ? { id, type, element } : null;
    }
    const element = graph.getEdgeElement(id);
    return element ? { id, type, element } : null;
  }
}
