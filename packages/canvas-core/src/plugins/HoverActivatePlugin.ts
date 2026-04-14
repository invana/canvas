/**
 * Hover Activate Plugin
 *
 * Activates a state on hovered nodes/edges with optional neighbor traversal
 * and inactive state dimming.
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
 *         inactiveState: 'inactive',
 *         degree: 1,
 *         direction: 'both',
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
  /** Whether to enable hover. Accepts a boolean or a predicate. @default true */
  enable?: boolean | ((element: HoverableElement) => boolean);

  /** State applied to the hovered element and its neighbors. @default 'active' */
  state?: string;

  /** State applied to all elements NOT in the active set. Disabled when undefined. */
  inactiveState?: string;

  /**
   * Degree of relationship to activate.
   * - `0` — hovered element only
   * - `1` — direct neighbors + connecting edges
   * @default 0
   */
  degree?: number;

  /** Edge direction to follow during neighbor traversal. @default 'both' */
  direction?: HoverDirection;

  /** Whether to enable animation (reserved). @default true */
  animation?: boolean;

  /** Called when an element is hovered. */
  onHover?: (element: HoverableElement) => void;

  /** Called when hover ends. */
  onHoverEnd?: (element: HoverableElement) => void;
}

type ResolvedOptions = Required<Omit<HoverActivateOptions, 'inactiveState' | 'onHover' | 'onHoverEnd'>> & {
  inactiveState: string | undefined;
  onHover: ((element: HoverableElement) => void) | undefined;
  onHoverEnd: ((element: HoverableElement) => void) | undefined;
};

export class HoverActivatePlugin implements CanvasPlugin {
  readonly id = 'hover-activate';
  readonly name = 'Hover Activate';
  getLayers() { return []; }

  private _options: ResolvedOptions;
  private _canvas: Canvas | null = null;
  private _currentHover: HoverableElement | null = null;
  /** Neighbor elements (and their edges) that got `state` applied */
  private _activeElements = new Set<HoverableElement>();
  /** Elements that got `inactiveState` applied */
  private _inactiveElements = new Set<HoverableElement>();

  constructor(options: HoverActivateOptions = {}) {
    this._options = {
      enable:        options.enable        ?? true,
      state:         options.state         ?? 'active',
      inactiveState: options.inactiveState ?? undefined,
      degree:        options.degree        ?? 0,
      direction:     options.direction     ?? 'both',
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
    const { enable } = this._options;
    if (enable === false) return;
    if (typeof enable === 'function' && !enable(element)) return;

    if (this._currentHover && this._currentHover !== element) {
      this.clearHover();
    }

    this.activateHover(element);
  }

  private onHoverEnd(element: HoverableElement): void {
    if (this._currentHover === element) {
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

    if (this._options.degree > 0 && element instanceof RendererNodeBase) {
      this.traverseNeighbors(element, this._options.degree);
    }

    if (this._options.inactiveState) {
      this.applyInactiveState();
    }

    this._options.onHover?.(element);
  }

  /** BFS neighbor traversal. Applies `state` to all reachable nodes/edges. */
  private traverseNeighbors(startNode: RendererNodeBase, maxDegree: number): void {
    if (!this._canvas) return;
    const renderer = this._canvas.getPlugin<GraphDataPlugin>('graph-data')?.renderer;
    if (!renderer) return;

    const visited = new Set<string>([startNode.id]);
    let frontier: RendererNodeBase[] = [startNode];

    for (let hop = 0; hop < maxDegree; hop++) {
      const nextFrontier: RendererNodeBase[] = [];

      for (const node of frontier) {
        for (const edge of renderer.getNodeEdges(node.id)) {
          const sourceNode: RendererNodeBase | null = (edge as any)._sourceNode ?? null;
          const targetNode: RendererNodeBase | null = (edge as any)._targetNode ?? null;
          const isSource = sourceNode?.id === node.id;

          const { direction } = this._options;
          if (direction === 'out' && !isSource) continue;
          if (direction === 'in'  &&  isSource) continue;

          edge.setState(this._options.state, true);
          this._activeElements.add(edge);

          const neighbor = isSource ? targetNode : sourceNode;
          if (neighbor && !visited.has(neighbor.id)) {
            visited.add(neighbor.id);
            neighbor.setState(this._options.state, true);
            this._activeElements.add(neighbor);
            nextFrontier.push(neighbor);
          }
        }
      }

      frontier = nextFrontier;
      if (frontier.length === 0) break;
    }
  }

  /** Apply `inactiveState` to all elements outside the active set. */
  private applyInactiveState(): void {
    if (!this._canvas || !this._options.inactiveState) return;
    const renderer = this._canvas.getPlugin<GraphDataPlugin>('graph-data')?.renderer;
    if (!renderer) return;

    const activeIds = new Set<string>();
    if (this._currentHover) activeIds.add(this._currentHover.id);
    this._activeElements.forEach(el => activeIds.add(el.id));

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

  /** Clear all active, neighbor, and inactive states. */
  clearHover(): void {
    if (this._currentHover) {
      this._currentHover.setState(this._options.state, false);
      this._currentHover = null;
    }

    this._activeElements.forEach(el => el.setState(this._options.state, false));
    this._activeElements.clear();

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

  get options(): Readonly<ResolvedOptions> {
    return this._options;
  }

  setOptions(options: Partial<HoverActivateOptions>): void {
    const stateChanged =
      (options.state         !== undefined && options.state         !== this._options.state) ||
      (options.inactiveState !== undefined && options.inactiveState !== this._options.inactiveState);

    if (stateChanged) this.clearHover();

    this._options = { ...this._options, ...options } as ResolvedOptions;
  }

  destroy(): void {
    this.clearHover();
    this._canvas = null;
  }
}

// Auto-register plugin
PluginRegistry.register('hover-activate', HoverActivatePlugin);
