/**
 * DragManager - Manages drag and drop interactions
 * 
 * Handles node dragging with viewport coordinates
 */

import type { FederatedPointerEvent } from 'pixi.js';
import type { NodeShapeBase } from '../elements/nodes/NodeShapeBase';
import type { Viewport } from '../viewport/Viewport';

export interface DragConfig {
  threshold?: number; // Minimum pixels to move before drag starts
  constrainToViewport?: boolean;
}

export interface DragData {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  deltaX: number;
  deltaY: number;
}

export type DragEventType = 'start' | 'move' | 'end';
export type DragEventCallback = (node: NodeShapeBase, data: DragData) => void;

export class DragManager {
  private readonly viewport: Viewport;
  private readonly config: Required<DragConfig>;
  private readonly listeners: Map<DragEventType, Set<DragEventCallback>> = new Map();
  
  private dragTarget: NodeShapeBase | null = null;
  private dragData: DragData | null = null;
  private isDragging = false;

  constructor(viewport: Viewport, config: DragConfig = {}) {
    this.viewport = viewport;
    this.config = {
      threshold: config.threshold ?? 3,
      constrainToViewport: config.constrainToViewport ?? false,
    };
  }

  /**
   * Register a node for dragging
   */
  registerNode(node: NodeShapeBase): void {
    node.eventMode = 'static';
    node.cursor = 'grab';

    node.on('pointerdown', (event: FederatedPointerEvent) => {
      this.onDragStart(node, event);
    });
  }

  /**
   * Unregister a node
   */
  unregisterNode(node: NodeShapeBase): void {
    node.off('pointerdown');
    node.off('pointermove');
    node.off('pointerup');
    node.off('pointerupoutside');
  }

  /**
   * Handle drag start
   */
  private onDragStart(node: NodeShapeBase, event: FederatedPointerEvent): void {
    // Don't start drag if already dragging or if disabled
    if (this.isDragging) return;

    this.dragTarget = node;
    
    const worldPos = this.viewport.toWorld(event.global.x, event.global.y);
    
    this.dragData = {
      startX: worldPos.x,
      startY: worldPos.y,
      currentX: worldPos.x,
      currentY: worldPos.y,
      deltaX: 0,
      deltaY: 0,
    };

    // Change cursor
    node.cursor = 'grabbing';

    // Listen to global pointer events
    const stage = node.parent;
    if (stage) {
      stage.on('pointermove', this.onDragMove as any);
      stage.on('pointerup', this.onDragEnd as any);
      stage.on('pointerupoutside', this.onDragEnd as any);
    }
  }

  /**
   * Handle drag move
   */
  private onDragMove = (event: FederatedPointerEvent): void => {
    if (!this.dragTarget || !this.dragData) return;

    const worldPos = this.viewport.toWorld(event.global.x, event.global.y);
    
    // Calculate delta from start position
    const deltaX = worldPos.x - this.dragData.startX;
    const deltaY = worldPos.y - this.dragData.startY;
    
    // Check if we've moved past the threshold
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (!this.isDragging && distance > this.config.threshold) {
      this.isDragging = true;
      this.emit('start', this.dragTarget, { ...this.dragData });
    }

    if (this.isDragging) {
      // Update drag data
      this.dragData.currentX = worldPos.x;
      this.dragData.currentY = worldPos.y;
      this.dragData.deltaX = deltaX;
      this.dragData.deltaY = deltaY;

      // Move the node
      this.dragTarget.x = this.dragData.startX - this.dragData.deltaX + deltaX;
      this.dragTarget.y = this.dragData.startY - this.dragData.deltaY + deltaY;

      this.emit('move', this.dragTarget, { ...this.dragData });
    }
  };

  /**
   * Handle drag end
   */
  private onDragEnd = (): void => {
    if (!this.dragTarget) return;

    const node = this.dragTarget;
    const stage = node.parent;

    // Clean up event listeners
    if (stage) {
      stage.off('pointermove', this.onDragMove as any);
      stage.off('pointerup', this.onDragEnd as any);
      stage.off('pointerupoutside', this.onDragEnd as any);
    }

    // Restore cursor
    node.cursor = 'grab';

    // Emit drag end if we were dragging
    if (this.isDragging && this.dragData) {
      this.emit('end', node, { ...this.dragData });
    }

    // Reset state
    this.dragTarget = null;
    this.dragData = null;
    this.isDragging = false;
  };

  /**
   * Check if currently dragging
   */
  isDraggingNode(): boolean {
    return this.isDragging;
  }

  /**
   * Get current drag target
   */
  getDragTarget(): NodeShapeBase | null {
    return this.dragTarget;
  }

  /**
   * Cancel ongoing drag
   */
  cancelDrag(): void {
    if (this.dragTarget) {
      const node = this.dragTarget;
      const stage = node.parent;

      if (stage) {
        stage.off('pointermove', this.onDragMove as any);
        stage.off('pointerup', this.onDragEnd as any);
        stage.off('pointerupoutside', this.onDragEnd as any);
      }

      node.cursor = 'grab';

      // Reset to start position if we have drag data
      if (this.dragData) {
        node.x = this.dragData.startX;
        node.y = this.dragData.startY;
      }

      this.dragTarget = null;
      this.dragData = null;
      this.isDragging = false;
    }
  }

  /**
   * Subscribe to drag events
   */
  on(event: DragEventType, callback: DragEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from drag events
   */
  off(event: DragEventType, callback: DragEventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit drag event
   */
  private emit(event: DragEventType, node: NodeShapeBase, data: DragData): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(node, data));
    }
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DragConfig>): void {
    Object.assign(this.config, config);
  }

  /**
   * Destroy the drag manager
   */
  destroy(): void {
    this.cancelDrag();
    this.listeners.clear();
  }
}
