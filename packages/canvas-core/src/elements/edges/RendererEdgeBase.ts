/**
 * RendererEdgeBase
 * 
 * Abstract base class for all edge shapes.
 * Provides common functionality: hover, selection, arrows, and style management.
 * Subclasses must implement: drawPath(), calculateTangents()
 * 
 * @example
 * ```typescript
 * class CustomEdge extends RendererEdgeBase {
 *   get pathType() { return 'custom'; }
 *   
 *   protected drawPath(source: Point, target: Point, style: PathStyle): void {
 *     // Custom path rendering
 *   }
 *   
 *   protected calculateTangents(source: Point, target: Point): Tangents {
 *     // Calculate path tangents for arrow placement
 *   }
 * }
 * ```
 */

import type { PathStyle, Point, Direction } from '../../primitives/paths';
import type { ArrowType, ArrowStyle } from '../../primitives/arrows';
import { getArrowOffset } from '../../primitives/arrows';
import { RendererBase, type RendererBaseData, type RendererBaseOptions } from '../RendererBase';
import { EdgeStates, type EdgeStateName } from '../../types/states';


/**
 * Edge path types
 */
export type EdgePathType = 'line' | 'bezier' | 'orthogonal' | string;

/**
 * Tangent information for arrow placement
 */
export interface EdgeTangents {
  /** Angle at source point (radians) */
  sourceTangent: number;
  /** Angle at target point (radians) */
  targetTangent: number;
}

/**
 * Internal: Runtime edge data stored by edge shape instances
 * This is NOT the public API - users should use CanvasEdge instead
 * 
 * Differences from CanvasEdge (public API):
 * - No `style` field (stored separately in _edgeStyle)
 * - No `states` field (managed by state system)
 * - source/target are always Point objects (resolved from string IDs)
 */
export interface RendererEdge extends RendererBaseData {
  /** Source point */
  source: Point;
  /** Target point */
  target: Point;
  /** Path type */
  pathType?: EdgePathType;
  /** Curvature for bezier paths */
  curvature?: number;
  /** Source direction hint for orthogonal */
  sourceDirection?: Direction;
  /** Target direction hint for orthogonal */
  targetDirection?: Direction;
  /** Arrow at source */
  arrowSource?: ArrowType | 'none';
  /** Arrow at target */
  arrowTarget?: ArrowType | 'none';
  /** Arrow size */
  arrowSize?: number;
  /** Edge label */
  label?: string;
  /** Optional data payload */
  payload?: Record<string, unknown>;
}

/**
 * Style for an edge
 */
export interface EdgeStyle {
  /** Stroke color */
  stroke: string;
  /** Stroke width */
  strokeWidth: number;
  /** Stroke alpha */
  strokeAlpha?: number;
  /** Stroke style */
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  /** Custom dash pattern [dash, gap] */
  strokeDashPattern?: number[];
  /** Dash pattern offset for animation or alignment */
  strokeDashOffset?: number;
  /** Line cap style */
  lineCap?: 'butt' | 'round' | 'square';
  /** Line join style */
  lineJoin?: 'miter' | 'round' | 'bevel';
  /** Corner radius for orthogonal edges (0 = sharp corners) */
  cornerRadius?: number;
  /** Visibility */
  visible?: boolean;
  /** Overall alpha */
  alpha?: number;
  /** Cursor style */
  cursor?: string;
  /** Arrow fill color (defaults to stroke) */
  arrowFill?: string;
  /** Arrow stroke color */
  arrowStroke?: string;
  /** Stroke alignment: 0 = outside, 0.5 = centered (default), 1 = inside */
  strokeAlignment?: number;
  /** Stroke cap style: 'butt' (default), 'round', 'square' (alias for lineCap) */
  strokeCap?: 'butt' | 'round' | 'square';
  /** State-based style overrides */
  states?: {
    [stateName: string]: Partial<EdgeStyle>;
  };
}

/**
 * Edge shape options
 */
export interface EdgeShapeOptions extends Omit<RendererBaseOptions<RendererEdge>, 'style' | 'data'> {
  data: Omit<RendererEdge, 'x' | 'y'> & { x?: number; y?: number };
  style?: Partial<EdgeStyle>;
  /** Initial states to activate (e.g., ['selected', 'highlighted']) */
  states?: string[];
}

/**
 * Abstract base class for edge shapes
 */
export abstract class RendererEdgeBase extends RendererBase<RendererEdge> {
  protected _edgeStyle: Partial<EdgeStyle>;
  private _activeStates = new Set<string>([EdgeStates.DEFAULT]);
  
  // Style caching for performance
  private _cachedStyle: PathStyle | null = null;
  private _styleDirty = true;
  private _styleHash = '';
  private static _globalStyleCache = new Map<string, PathStyle>();
  
  // Batch mode for bulk operations (set to true to defer rendering)
  private static _batchMode = false;
  private static _batchedEdges = new Set<RendererEdgeBase>();

  constructor(options: EdgeShapeOptions) {
    // Edges don't use x/y positioning - they draw from source to target
    const data = {
      ...options.data,
      x: options.data.x ?? 0,
      y: options.data.y ?? 0,
    } as RendererEdge;

    super({ ...options, data } as RendererBaseOptions<RendererEdge>);
    this._edgeStyle = options.style ?? {};
    
    // CRITICAL: Edges draw using absolute coordinates, so container must be at origin
    // Override any position set by parent constructor
    this.position.set(0, 0);

    // Always activate DEFAULT state
    this._activeStates.add(EdgeStates.DEFAULT);

    // Activate initial states if provided
    if (options.states && options.states.length > 0) {
      for (const state of options.states) {
        this._activeStates.add(state);
      }
      this._styleDirty = true;
    }

    // Update interaction mode based on disabled state
    this.updateInteractionMode();

    // Set up hover events
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);

    // Initial render
    this.forceRender();
  }

  // =========================================================================
  // ABSTRACT METHODS - Must be implemented by subclasses
  // =========================================================================

  /**
   * Get the path type identifier
   */
  abstract get pathType(): EdgePathType;

  /**
   * Draw the path between source and target points
   * @param source - Adjusted source point (after arrow offset)
   * @param target - Adjusted target point (after arrow offset)
   * @param style - Path style to use
   */
  protected abstract drawPath(source: Point, target: Point, style: PathStyle): void;

  /**
   * Calculate tangent angles at source and target for arrow placement
   * Also returns the direction vectors for boundary intersection
   * @param source - Source point (node center)
   * @param target - Target point (node center)
   */
  protected abstract calculateTangents(source: Point, target: Point): EdgeTangents;

  /**
   * Calculate the direction vector at which the edge leaves/enters a node
   * Used for accurate boundary intersection calculation
   * By default, uses a straight line direction, but bezier/orthogonal edges should override
   * @param source - Source point (node center)
   * @param target - Target point (node center)
   * @param isSource - true for source node, false for target node
   * @public - Renderer needs to call this when updating edge endpoints
   */
  public calculateBoundaryDirection(source: Point, target: Point, isSource: boolean): Point {
    // Default: straight line direction
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist === 0) return { x: 1, y: 0 };
    
    return {
      x: (isSource ? dx : -dx) / dist,
      y: (isSource ? dy : -dy) / dist,
    };
  }

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  get edgeStyle(): Partial<EdgeStyle> {
    return this._edgeStyle;
  }

  set edgeStyle(value: Partial<EdgeStyle>) {
    this._edgeStyle = value;
    this._style = value;
    this._styleDirty = true;
    this.markDirty();
  }

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================

  /**
   * Set a state on the edge
   * @param name - State name (use EdgeStates constants or custom string)
   * @param active - Whether the state is active
   */
  setState(name: EdgeStateName, active: boolean): void {
    const hasState = this._activeStates.has(name);
    
    if (active && !hasState) {
      this._activeStates.add(name);
      this._styleDirty = true;
      
      // Update interaction mode if disabled/muted state changed
      if (name === EdgeStates.DISABLED || name === 'muted') {
        this.updateInteractionMode();
      }
      
      this.markDirty();
      
      // If in batch mode, defer update; otherwise update immediately
      if (RendererEdgeBase._batchMode) {
        RendererEdgeBase._batchedEdges.add(this);
      } else {
        this.update();
      }
    } else if (!active && hasState && name !== EdgeStates.DEFAULT) {
      this._activeStates.delete(name);
      this._styleDirty = true;
      
      // Update interaction mode if disabled/muted state changed
      if (name === EdgeStates.DISABLED || name === 'muted') {
        this.updateInteractionMode();
      }
      
      this.markDirty();
      
      // If in batch mode, defer update; otherwise update immediately
      if (RendererEdgeBase._batchMode) {
        RendererEdgeBase._batchedEdges.add(this);
      } else {
        this.update();
      }
    }
  }

  /**
   * Get the current value of a state
   * @param name - State name to check
   */
  getState(name: EdgeStateName): boolean {
    return this._activeStates.has(name);
  }

  /**
   * Get all currently active states
   */
  getActiveStates(): string[] {
    return Array.from(this._activeStates);
  }

  /**
   * Check if the edge is disabled (should not respond to interactions)
   * 
   * @returns true if the edge is in disabled or muted state
   */
  isDisabled(): boolean {
    return this._activeStates.has(EdgeStates.DISABLED) || this._activeStates.has('muted');
  }

  /**
   * Start batch mode - defers all rendering until endBatch() is called
   * Use this when updating state on many edges at once for better performance
   * 
   * @example
   * ```typescript
   * RendererEdgeBase.startBatch();
   * edges.forEach(edge => edge.setState(EdgeStates.HIGHLIGHTED, true));
   * RendererEdgeBase.endBatch();
   * ```
   */
  static startBatch(): void {
    RendererEdgeBase._batchMode = true;
    RendererEdgeBase._batchedEdges.clear();
  }

  /**
   * End batch mode and render all edges that were modified
   * @returns Number of edges that were updated
   */
  static endBatch(): number {
    RendererEdgeBase._batchMode = false;
    const count = RendererEdgeBase._batchedEdges.size;
    
    // Update all batched edges
    for (const edge of RendererEdgeBase._batchedEdges) {
      edge.update();
    }
    
    RendererEdgeBase._batchedEdges.clear();
    return count;
  }

  /**
   * Check if batch mode is active
   */
  static isBatchMode(): boolean {
    return RendererEdgeBase._batchMode;
  }

  /**
   * Update interaction mode based on disabled state
   * Disabled edges are not interactive (no hover, click)
   * @internal
   */
  private updateInteractionMode(): void {
    if (this.isDisabled()) {
      this.eventMode = 'none';
      this.cursor = 'default';
    } else {
      this.eventMode = 'static';
      this.cursor = 'pointer';
    }
  }

  /**
   * Clear specific states or all states (except default)
   * @param names - Optional array of state names to clear. If not provided, clears all except default.
   */
  clearStates(names?: string[]): void {
    if (names) {
      for (const name of names) {
        if (name !== EdgeStates.DEFAULT) {
          this._activeStates.delete(name);
        }
      }
    } else {
      this._activeStates.clear();
      this._activeStates.add(EdgeStates.DEFAULT);
    }
    this._styleDirty = true;
    this.markDirty();
    this.update();
  }

  get source(): Point {
    return this._data.source;
  }

  get target(): Point {
    return this._data.target;
  }

  // =========================================================================
  // RENDERING
  // =========================================================================

  protected render(): void {
    const style = this.getActiveStyle();
    const { source, target } = this._data;
    console.log(`[Edge ${this.id}] render() using:`, { source, target });
    console.log(`[Edge ${this.id}] Container position:`, { x: this.x, y: this.y, position: this.position });
    console.log(`[Edge ${this.id}] Graphics position:`, { x: this._graphics.x, y: this._graphics.y, position: this._graphics.position });
    const arrowSize = this._data.arrowSize ?? 10;

    // Calculate arrow offsets
    const sourceArrow = this._data.arrowSource ?? 'none';
    const targetArrow = this._data.arrowTarget ?? 'triangle';
    const sourceOffset = getArrowOffset(sourceArrow as ArrowType, arrowSize);
    const targetOffset = getArrowOffset(targetArrow as ArrowType, arrowSize);

    // Get tangents for arrow placement based on the actual path direction
    const { sourceTangent, targetTangent } = this.calculateTangents(source, target);

    // Calculate adjusted endpoints for the path (shortening the path to make room for arrows)
    const adjustedSource = this.adjustPointForArrow(source, sourceTangent, sourceOffset);
    const adjustedTarget = this.adjustPointForArrow(target, targetTangent + Math.PI, targetOffset);

    // Draw path between adjusted points
    this.drawPath(adjustedSource, adjustedTarget, style);

    // Draw arrows
    const arrowStyle: ArrowStyle = {
      fill: this._edgeStyle.arrowFill ?? style.stroke,
      stroke: this._edgeStyle.arrowStroke,
      strokeWidth: style.strokeWidth,
    };

    if (sourceArrow !== 'none') {
      // Source arrow: tip at source node boundary, pointing away from source (in direction of path)
      this.drawArrowAtPoint(source, sourceTangent, arrowSize, sourceArrow as ArrowType, arrowStyle);
    }

    if (targetArrow !== 'none') {
      // Target arrow: tip at target node boundary, pointing toward target (in direction of path)
      this.drawArrowAtPoint(target, targetTangent, arrowSize, targetArrow as ArrowType, arrowStyle);
    }
  }

  /**
   * Adjust a point along a tangent for arrow offset
   */
  protected adjustPointForArrow(point: Point, tangent: number, offset: number): Point {
    return {
      x: point.x + Math.cos(tangent) * offset,
      y: point.y + Math.sin(tangent) * offset,
    };
  }

  /**
   * Draw arrow at a specific point
   */
  protected drawArrowAtPoint(
    point: Point,
    angle: number,
    size: number,
    type: ArrowType,
    style: ArrowStyle
  ): void {
    this._registry.drawArrowByName(this._graphics, type, {
      x: point.x,
      y: point.y,
      angle,
      size,
    }, style);
  }

  /**
   * Get the active style based on current states
   * Uses 3-tier caching: clean check → instance cache → global cache
   */
  protected getActiveStyle(): PathStyle {
    // Tier 1: If style is clean and only default state is active, return base style directly
    if (!this._styleDirty && this._activeStates.size === 1 && this._activeStates.has(EdgeStates.DEFAULT)) {
      return this.getBaseStyle();
    }

    // Create hash of active states for cache key
    const stateHash = Array.from(this._activeStates).sort().join(',');
    
    // Tier 2: Check if style is clean and hash matches (instance cache hit)
    if (!this._styleDirty && this._styleHash === stateHash && this._cachedStyle) {
      return this._cachedStyle;
    }

    // Tier 3: Check global cache
    const cacheKey = `${JSON.stringify(this._edgeStyle)}_${stateHash}`;
    const globalCached = RendererEdgeBase._globalStyleCache.get(cacheKey);
    if (globalCached) {
      this._cachedStyle = globalCached;
      this._styleHash = stateHash;
      this._styleDirty = false;
      return globalCached;
    }

    // Cache miss: compute style
    const computed = this.computeStateStyle();
    
    // Update caches
    this._cachedStyle = computed;
    this._styleHash = stateHash;
    this._styleDirty = false;
    RendererEdgeBase._globalStyleCache.set(cacheKey, computed);
    
    return computed;
  }

  /**
   * Get base style without any state overrides
   */
  private getBaseStyle(): PathStyle {
    const base = this._edgeStyle;
    return {
      stroke: base.stroke ?? '#666666',
      strokeWidth: base.strokeWidth ?? 2,
      strokeAlpha: base.strokeAlpha,
      strokeStyle: base.strokeStyle,
      strokeDashPattern: base.strokeDashPattern,
      strokeDashOffset: base.strokeDashOffset,
      lineCap: base.lineCap,
      lineJoin: base.lineJoin,
    };
  }

  /**
   * Compute style by merging base style with active state styles
   */
  private computeStateStyle(): PathStyle {
    const base = this._edgeStyle;
    let result: Partial<EdgeStyle> = { ...base };

    // Apply state-based styles in order of state activation
    if (base.states) {
      for (const state of this._activeStates) {
        if (base.states[state]) {
          result = { ...result, ...base.states[state] };
        }
      }
    }

    return {
      stroke: result.stroke ?? '#666666',
      strokeWidth: result.strokeWidth ?? 2,
      strokeAlpha: result.strokeAlpha,
      strokeStyle: result.strokeStyle,
      strokeDashPattern: result.strokeDashPattern,
      strokeDashOffset: result.strokeDashOffset,
      lineCap: result.lineCap,
      lineJoin: result.lineJoin,
    };
  }

  // =========================================================================
  // INTERACTION
  // =========================================================================

  private onPointerOver(): void {
    if (this.isDisabled()) return;
    this.setState(EdgeStates.ACTIVE, true);
  }

  private onPointerOut(): void {
    if (this.isDisabled()) return;
    this.setState(EdgeStates.ACTIVE, false);
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Update edge endpoints
   */
  updateEndpoints(source: Point, target: Point): void {
    console.log(`[Edge ${this.id}] updateEndpoints called:`, { source, target });
    this._data.source = source;
    this._data.target = target;
    console.log(`[Edge ${this.id}] _data updated:`, { source: this._data.source, target: this._data.target });
    
    // CRITICAL: Edges draw using absolute coordinates, so container must stay at origin
    // This ensures the rendered path matches the calculated source/target coordinates
    this.position.set(0, 0);
    
    this.forceRender();
  }

  /**
   * Update edge style
   */
  updateEdgeStyle(style: Partial<EdgeStyle>): void {
    this._edgeStyle = { ...this._edgeStyle, ...style };
    this._style = this._edgeStyle;
    this.markDirty();
    this.update();
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  destroy(): void {
    this.off('pointerover', this.onPointerOver, this);
    this.off('pointerout', this.onPointerOut, this);
    super.destroy();
  }
}
