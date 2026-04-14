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
import { RendererNodeBase } from '../elements/nodes/RendererNodeBase';
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
  node: RendererNodeBase;
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
  getLayers() {
    return [];
  }

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: Required<DragElementOptions>;
  
  // Event delegation - single listener instead of per-node
  private _dragData: DragData | null = null;
  
  // Store original cursors
  private _originalCursors = new WeakMap<RendererNodeBase, string>();

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

    // Event delegation - attach to viewport, not individual nodes
    this._viewport.on('pointerdown', this.onPointerDown);
    this._viewport.on('globalpointermove', this.onPointerMove);
    this._viewport.on('pointerup', this.onPointerUp);
    this._viewport.on('pointerupoutside', this.onPointerUp);
  }

  /**
   * Handle pointer down (start potential drag)
   */
  private onPointerDown = (event: FederatedPointerEvent): void => {
    // Check if target is a node
    const target = event.target;
    if (!target || !(target instanceof RendererNodeBase)) {
      return;
    }

    const node = target as RendererNodeBase;

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
    
    // Pause viewport's drag plugin to prevent canvas panning while dragging a node
    this._viewport!.plugins.pause('drag');
    
    // Stop event propagation to prevent viewport from starting a drag
    event.stopPropagation();
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
      
      // Emit drag start on element (legacy) and via canvas bus
      node.emit('dragstart', { node, x: startNodeX, y: startNodeY });
      this._canvas?.events.emit('node:dragstart', { node, x: startNodeX, y: startNodeY });
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
    this._canvas?.events.emit('node:drag', { node, x: newX, y: newY });
  };

  /**
   * Handle pointer up (end drag)
   */
  private onPointerUp = (): void => {
    // Always resume viewport drag plugin, even if we weren't dragging
    // This ensures it's resumed after any node click
    this._viewport?.plugins.resume('drag');
    
    if (!this._dragData) return;

    const { node } = this._dragData;

    // Restore cursor
    const originalCursor = this._originalCursors.get(node) || 'default';
    node.cursor = originalCursor;

    // Emit drag end event if we actually dragged
    if (this._dragData.hasMoved) {
      node.emit('dragend', { node, x: node.x, y: node.y });
      this._canvas?.events.emit('node:dragend', { node, x: node.x, y: node.y });
    }

    // Reset drag state
    this._dragData = null;
  };

  /**
   * Update connected edges for a node
   */
  private updateConnectedEdges(node: RendererNodeBase): void {
    if (!this._canvas) return;

    const graphPlugin = this._canvas.getPlugin('graph-data') as any;
    if (!graphPlugin?.renderer) return;

    // Use renderer's update method which handles edge updates
    graphPlugin.renderer.updateNode(node.id, {
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

    this._canvas = null;
    this._viewport = null;
    this._dragData = null;
    this._originalCursors = new WeakMap();
  }
}

// Auto-register plugin
PluginRegistry.register('drag-element', DragElementPlugin);
