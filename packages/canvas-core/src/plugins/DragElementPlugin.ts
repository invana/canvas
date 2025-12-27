/**
 * Drag Element Plugin
 * 
 * Enables dragging of nodes with high-performance event delegation.
 * Uses viewport-level events instead of per-node listeners for better performance with large graphs.
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   plugins: [
 *     {
 *       plugin: 'drag-element',
 *       options: {
 *         threshold: 5,
 *         updateEdges: true
 *       }
 *     }
 *   ]
 * });
 * ```
 */

import { FederatedPointerEvent } from 'pixi.js';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import { NodeShapeBase } from '../elements/nodes/NodeShapeBase';
import type { Viewport } from '../viewport/Viewport';
import { PluginRegistry } from './registry';

export interface DragElementOptions {
  /** Minimum pixels to move before drag starts */
  threshold?: number;
  /** Whether to constrain dragging to viewport bounds */
  constrainToViewport?: boolean;
  /** Whether to update connected edges during drag */
  updateEdges?: boolean;
  /** Cursor style when dragging */
  dragCursor?: string;
  /** Cursor style when hovering draggable element */
  hoverCursor?: string;
}

interface DragData {
  node: NodeShapeBase;
  startX: number;
  startY: number;
  startNodeX: number;
  startNodeY: number;
  hasMoved: boolean;
}

/**
 * Drag Element Plugin
 * Handles node dragging with event delegation for performance
 */
export class DragElementPlugin implements CanvasPlugin {
  readonly id = 'drag-element';
  readonly name = 'Drag Element';
  readonly layerGroups = [];

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: Required<DragElementOptions>;
  
  // Event delegation - single listener instead of per-node
  private _dragData: DragData | null = null;
  private _isDragging = false;
  
  // Store original cursors
  private _originalCursors = new WeakMap<NodeShapeBase, string>();

  constructor(options: DragElementOptions = {}) {
    this._options = {
      threshold: options.threshold ?? 3,
      constrainToViewport: options.constrainToViewport ?? false,
      updateEdges: options.updateEdges ?? true,
      dragCursor: options.dragCursor ?? 'grabbing',
      hoverCursor: options.hoverCursor ?? 'grab',
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('Viewport is required for DragElementPlugin');
    }

    // Setup draggable state for existing nodes
    this.setupExistingNodes();

    // Event delegation - attach to viewport, not individual nodes
    this._viewport.on('pointerdown', this.onPointerDown);
    this._viewport.on('globalpointermove', this.onPointerMove);
    this._viewport.on('pointerup', this.onPointerUp);
    this._viewport.on('pointerupoutside', this.onPointerUp);
  }

  /**
   * Setup existing nodes as draggable
   */
  private setupExistingNodes(): void {
    if (!this._canvas) return;

    const nodes = this._canvas.renderer.getNodes();
    nodes.forEach(node => {
      this.makeNodeDraggable(node);
    });
  }

  /**
   * Make a node draggable
   */
  private makeNodeDraggable(node: NodeShapeBase): void {
    node.eventMode = 'static';
    
    // Store original cursor
    this._originalCursors.set(node, node.cursor as string);
    node.cursor = this._options.hoverCursor;

    // Add hover effects
    node.on('pointerover', () => {
      if (!this._isDragging) {
        node.cursor = this._options.hoverCursor;
      }
    });

    node.on('pointerout', () => {
      if (!this._isDragging) {
        const original = this._originalCursors.get(node) || 'default';
        node.cursor = original;
      }
    });
  }

  /**
   * Handle pointer down (start potential drag)
   */
  private onPointerDown = (event: FederatedPointerEvent): void => {
    // Check if target is a node
    const target = event.target;
    if (!target || !(target instanceof NodeShapeBase)) {
      return;
    }

    const node = target as NodeShapeBase;

    // Get world coordinates
    const worldPos = this._viewport!.toWorld(event.global.x, event.global.y);

    this._dragData = {
      node,
      startX: worldPos.x,
      startY: worldPos.y,
      startNodeX: node.x,
      startNodeY: node.y,
      hasMoved: false,
    };

    // Change cursor immediately
    node.cursor = this._options.dragCursor;
    
    // Don't stop propagation - other plugins (like ClickSelectPlugin) need events too
  };

  /**
   * Handle pointer move (dragging)
   */
  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this._dragData) return;

    const { node, startX, startY, startNodeX, startNodeY } = this._dragData;
    
    // Get current world position
    const worldPos = this._viewport!.toWorld(event.global.x, event.global.y);
    
    const dx = worldPos.x - startX;
    const dy = worldPos.y - startY;

    // Check if we've moved enough to start dragging
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (!this._dragData.hasMoved && distance < this._options.threshold) {
      return;
    }

    // Mark as dragging
    if (!this._dragData.hasMoved) {
      this._dragData.hasMoved = true;
      this._isDragging = true;
      
      // Emit drag start event
      node.emit('dragstart', { node, x: startNodeX, y: startNodeY });
    }

    // Calculate new position
    let newX = startNodeX + dx;
    let newY = startNodeY + dy;

    // Constrain to viewport if needed
    if (this._options.constrainToViewport) {
      // TODO: Implement viewport bounds constraint when method is available
      // const bounds = this._viewport!.getVisibleBounds();
      // newX = Math.max(bounds.x, Math.min(bounds.x + bounds.width, newX));
      // newY = Math.max(bounds.y, Math.min(bounds.y + bounds.height, newY));
    }

    // Update node position
    node.x = newX;
    node.y = newY;

    // Update connected edges if enabled
    if (this._options.updateEdges) {
      this.updateConnectedEdges(node);
    }

    // Emit drag move event
    node.emit('drag', { node, x: newX, y: newY });
  };

  /**
   * Handle pointer up (end drag)
   */
  private onPointerUp = (): void => {
    if (!this._dragData) return;

    const { node } = this._dragData;

    // Restore cursor
    const originalCursor = this._originalCursors.get(node) || 'default';
    node.cursor = originalCursor;

    // Emit drag end event if we actually dragged
    if (this._dragData.hasMoved) {
      node.emit('dragend', { node, x: node.x, y: node.y });
    }

    // Reset drag state
    this._dragData = null;
    this._isDragging = false;
  };

  /**
   * Update connected edges for a node
   */
  private updateConnectedEdges(node: NodeShapeBase): void {
    if (!this._canvas) return;

    // Use renderer's update method which handles edge updates
    this._canvas.renderer.updateNode(node.id, {
      x: node.x,
      y: node.y,
    });
  }

  /**
   * Get current options
   */
  get options(): Readonly<Required<DragElementOptions>> {
    return this._options;
  }

  /**
   * Update plugin options
   */
  setOptions(options: Partial<DragElementOptions>): void {
    this._options = {
      ...this._options,
      ...options,
    };
  }

  destroy(): void {
    if (this._viewport) {
      this._viewport.off('pointerdown', this.onPointerDown);
      this._viewport.off('globalpointermove', this.onPointerMove);
      this._viewport.off('pointerup', this.onPointerUp);
      this._viewport.off('pointerupoutside', this.onPointerUp);
    }

    // Clean up node cursors
    if (this._canvas) {
      const nodes = this._canvas.renderer.getNodes();
      nodes.forEach(node => {
        const original = this._originalCursors.get(node) || 'default';
        node.cursor = original;
        node.off('pointerover');
        node.off('pointerout');
      });
    }

    this._canvas = null;
    this._viewport = null;
    this._dragData = null;
    this._originalCursors = new WeakMap();
  }
}

// Auto-register plugin
PluginRegistry.register('drag-element', DragElementPlugin);
