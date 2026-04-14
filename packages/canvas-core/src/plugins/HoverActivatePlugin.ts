/**
 * Hover Activate Plugin
 *
 * Activates a state on hovered nodes/edges with optional neighbor traversal,
 * inactive state dimming, directional edge filtering, and event callbacks.
 *
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'hover-activate',
 *       options: {
 *         state: 'active',
 *         inactiveState: 'muted',
 *         degree: 1,
 *         direction: 'both',
 *         hoverDelay: 50,
 *         onHover: (el) => console.log('hover', el.id),
 *         onHoverEnd: (el) => console.log('hoverEnd', el.id),
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
import type { RendererEdgeBase } from '../elements/edges/RendererEdgeBase';
import { PluginRegistry } from './registry';
import type { GraphDataPlugin } from './GraphDataPlugin';

export type HoverableElement = RendererNodeBase | RendererEdgeBase;

/** Edge direction filter for neighbor traversal */
export type HoverDirection = 'both' | 'in' | 'out';

export interface HoverActivateOptions {
  /**
   * Whether to enable hover interactions.
   * Can be a boolean or a predicate called with the hovered element.
   * @default true
   */
  enable?: boolean | ((element: HoverableElement) => boolean);

  /**
   * State name applied to the directly hovered element.
   * @default 'active'
   */
  state?: string;

  /**
   * State name applied to all elements that are NOT in the active/neighbor set.
   * Useful for dimming the rest of the graph.
   * Set to `undefined` (default) to disable inactive dimming.
   */
  inactiveState?: string;

  /**
   * Number of hops to traverse from the hovered node when highlighting neighbors.
   * - `0` — only the hovered element itself
   * - `1` — direct neighbors + their connecting edges
   * - `2` — 2-hop neighbors
   * @default 0
   */
  degree?: number;

  /**
   * Edge direction to follow during neighbor traversal.
   * - `both` — follow all connected edges
   * - `in`   — only edges where the hovered node is the target
   * - `out`  — only edges where the hovered node is the source
   * @default 'both'
   */
  direction?: HoverDirection;

  /**
   * State name applied to neighbor nodes/edges (when degree > 0).
   * @default 'highlighted'
   */
  neighborState?: string;

  /**
   * Delay in milliseconds before activating hover.
   * @default 0
   */
  hoverDelay?: number;

  /**
   * Whether to enable enter/exit animations (reserved — no-op until CSS transitions are supported).
   * @default true
   */
  animation?: boolean;

  /** Called immediately when an element is hovered. */
  onHover?: (element: HoverableElement) => void;

  /** Called when hover ends on an element. */
  onHoverEnd?: (element: HoverableElement) => void;
}

/** Resolved options with all defaults filled in */
type ResolvedHoverOptions = Required<Omit<HoverActivateOptions, 'inactiveState' | 'onHover' | 'onHoverEnd'>> & {
  inactiveState: string | undefined;
  onHover: ((element: HoverableElement) => void) | undefined;
  onHoverEnd: ((element: HoverableElement) => void) | undefined;
};

/**
 * Hover Activate Plugin
 *
 * Applies state to hovered elements with optional multi-hop neighbor
 * highlighting, inactive state dimming, and directional traversal.
 */
export class HoverActivatePlugin implements CanvasPlugin {
  readonly id = 'hover-activate';
  readonly name = 'Hover Activate';
  getLayers() { return []; }

  private _options: ResolvedHoverOptions;
  private _canvas: Canvas | null = null;
  private _currentHover: HoverableElement | null = null;
  /** Elements that got neighborState applied */
  private _neighborElements = new Set<HoverableElement>();
  /** Elements that got inactiveState applied */
  private _inactiveElements = new Set<HoverableElement>();
  private _hoverTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HoverActivateOptions = {}) {
    this._options = {
      enable:        options.enable        ?? true,
      state:         options.state         ?? 'active',
      inactiveState: options.inactiveState ?? undefined,
      degree:        options.degree        ?? 0,
      direction:     options.direction     ?? 'both',
      neighborState: options.neighborState ?? 'highlighted',
      hoverDelay:    options.hoverDelay    ?? 0,
      animation:     options.animation     ?? true,
      onHover:       options.onHover       ?? undefined,
      onHoverEnd:    options.onHoverEnd    ?? undefined,
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    canvas.on('node:hover',    (e) => this.onHoverStart(e.node));
    canvas.on('node:hoverend', (e) => this.onHoverEnd(e.node));
    canvas.on('edge:hover',    (e) => this.onHoverStart(e.edge));
    canvas.on('edge:hoverend', (e) => this.onHoverEnd(e.edge));
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private onHoverStart(element: HoverableElement): void {
    // Check enable predicate
    const { enable } = this._options;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(element)) return;

    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }

    if (this._currentHover && this._currentHover !== element) {
      this.clearHover();
    }

    if (this._options.hoverDelay > 0) {
      this._hoverTimeout = setTimeout(() => this.activateHover(element), this._options.hoverDelay);
    } else {
      this.activateHover(element);
    }
  }

  private onHoverEnd(element: HoverableElement): void {
    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }
    if (this._currentHover === element) {
      // element.setState(this._options.neighborState, false);
      this._options.onHoverEnd?.(element);
      this.clearHover();
    }
  }

  // ---------------------------------------------------------------------------
  // Core logic
  // ---------------------------------------------------------------------------

  private activateHover(element: HoverableElement): void {
    this._currentHover = element;
    element.setState(this._options.state, true);
    // element.setState(this._options.neighborState, true);

    if (this._options.degree > 0 && element instanceof RendererNodeBase) {
      this._neighborElements.add(element);
      this.traverseNeighbors(element, this._options.degree);
    }

    if (this._options.inactiveState) {
      this.applyInactiveState();
    }

    this._options.onHover?.(element);
  }

  /**
   * BFS neighbor traversal up to `maxDegree` hops.
   * Respects `direction` to filter which edges to follow.
   */
  private traverseNeighbors(startNode: RendererNodeBase, maxDegree: number): void {
    if (!this._canvas) return;
    const graphPlugin = this._canvas.getPlugin<GraphDataPlugin>('graph-data');
    const renderer = graphPlugin?.renderer;
    if (!renderer) return;

    const visited = new Set<string>([startNode.id]);
    let frontier: RendererNodeBase[] = [startNode];

    for (let hop = 0; hop < maxDegree; hop++) {
      const nextFrontier: RendererNodeBase[] = [];

      for (const node of frontier) {
        const connectedEdges = renderer.getNodeEdges(node.id);

        for (const edge of connectedEdges) {
          const sourceNode: RendererNodeBase | null = (edge as any)._sourceNode ?? null;
          const targetNode: RendererNodeBase | null = (edge as any)._targetNode ?? null;
          const isSource = sourceNode?.id === node.id;

          // Direction filter
          const { direction } = this._options;
          if (direction === 'out' && !isSource) continue;
          if (direction === 'in'  &&  isSource) continue;

          // Apply neighborState to edge
          edge.setState(this._options.neighborState, true);
          this._neighborElements.add(edge);

          // Find the neighbor node
          const neighbor = isSource ? targetNode : sourceNode;
          if (neighbor && !visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            neighbor.setState(this._options.neighborState, true);
            this._neighborElements.add(neighbor);
            nextFrontier.push(neighbor);
          }
        }
      }

      frontier = nextFrontier;
      if (frontier.length === 0) break;
    }
  }

  /**
   * Apply inactiveState to all nodes/edges that are NOT in the active set.
   */
  private applyInactiveState(): void {
    if (!this._canvas || !this._options.inactiveState) return;
    const graphPlugin = this._canvas.getPlugin<GraphDataPlugin>('graph-data');
    const renderer = graphPlugin?.renderer;
    if (!renderer) return;

    // Build the set of "active" element IDs
    const activeIds = new Set<string>();
    if (this._currentHover) activeIds.add(this._currentHover.id);
    this._neighborElements.forEach(el => activeIds.add(el.id));

    // Apply inactive state to everything else
    for (const node of renderer.getNodes()) {
      if (!activeIds.has(node.id)) {
        node.setState(this._options.inactiveState!, true);
        this._inactiveElements.add(node);
      }
    }
    for (const edge of renderer.getEdges()) {
      if (!activeIds.has(edge.id)) {
        edge.setState(this._options.inactiveState!, true);
        this._inactiveElements.add(edge);
      }
    }
  }

  /** Clear all hover, neighbor, and inactive states */
  clearHover(): void {
    if (this._currentHover) {
      this._currentHover.setState(this._options.state, false);
      this._currentHover.setState(this._options.neighborState, false);
      this._currentHover = null;
    }
  
    this._neighborElements.forEach(el => el.setState(this._options.neighborState, false));
    this._neighborElements.clear();

    if (this._options.inactiveState) {
      this._inactiveElements.forEach(el => el.setState(this._options.inactiveState!, false));
      this._inactiveElements.clear();
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  get hoveredElement(): HoverableElement | null {
    return this._currentHover;
  }

  get options(): Readonly<ResolvedHoverOptions> {
    return this._options;
  }

  setOptions(options: Partial<HoverActivateOptions>): void {
    // When changing state names, clear existing hover first to avoid orphaned states
    const stateChanged =
      (options.state         !== undefined && options.state         !== this._options.state) ||
      (options.neighborState !== undefined && options.neighborState !== this._options.neighborState) ||
      (options.inactiveState !== undefined && options.inactiveState !== this._options.inactiveState);

    if (stateChanged) this.clearHover();

    this._options = { ...this._options, ...options } as ResolvedHoverOptions;
  }

  destroy(): void {
    this.clearHover();
    if (this._hoverTimeout) {
      clearTimeout(this._hoverTimeout);
      this._hoverTimeout = null;
    }
    this._canvas = null;
  }
}

// Auto-register plugin
PluginRegistry.register('hover-activate', HoverActivatePlugin);
