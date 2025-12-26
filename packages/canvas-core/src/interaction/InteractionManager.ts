/**
 * InteractionManager - Centralized interaction handling
 * 
 * Coordinates all user interactions (click, hover, drag, selection)
 * and delegates to specialized managers.
 */

import { SelectionManager } from './SelectionManager';
import { DragManager } from './DragManager';
import { HoverManager } from './HoverManager';
import type { NodeShapeBase } from '../elements/nodes/NodeShapeBase';
import type { EdgeShapeBase } from '../elements/edges/EdgeShapeBase';
import type { Viewport } from '../viewport/Viewport';

export interface InteractionConfig {
  enableSelection?: boolean;
  enableDrag?: boolean;
  enableHover?: boolean;
  multiSelect?: boolean;
  dragThreshold?: number;
}

export type InteractionEventType = 
  | 'selectionChanged'
  | 'dragStart'
  | 'dragMove'
  | 'dragEnd'
  | 'hoverStart'
  | 'hoverEnd'
  | 'click'
  | 'doubleClick';

export type InteractionEventCallback = (event: {
  type: InteractionEventType;
  target?: NodeShapeBase | EdgeShapeBase;
  targets?: Array<NodeShapeBase | EdgeShapeBase>;
  data?: any;
}) => void;

export class InteractionManager {
  public readonly selection: SelectionManager;
  public readonly drag: DragManager;
  public readonly hover: HoverManager;
  
  private readonly viewport: Viewport;
  private readonly config: Required<InteractionConfig>;
  private readonly listeners: Map<InteractionEventType, Set<InteractionEventCallback>> = new Map();

  constructor(viewport: Viewport, config: InteractionConfig = {}) {
    this.viewport = viewport;
    this.config = {
      enableSelection: config.enableSelection ?? true,
      enableDrag: config.enableDrag ?? true,
      enableHover: config.enableHover ?? true,
      multiSelect: config.multiSelect ?? true,
      dragThreshold: config.dragThreshold ?? 3,
    };

    // Initialize sub-managers
    this.selection = new SelectionManager({
      multiSelect: this.config.multiSelect,
    });
    
    this.drag = new DragManager(this.viewport, {
      threshold: this.config.dragThreshold,
    });
    
    this.hover = new HoverManager();

    // Forward events from sub-managers
    this.setupEventForwarding();
  }

  /**
   * Setup event forwarding from sub-managers
   */
  private setupEventForwarding(): void {
    // Selection events
    this.selection.on('changed', (selected) => {
      this.emit('selectionChanged', {
        type: 'selectionChanged',
        targets: selected,
      });
    });

    // Drag events
    this.drag.on('start', (target, data) => {
      this.emit('dragStart', {
        type: 'dragStart',
        target,
        data,
      });
    });

    this.drag.on('move', (target, data) => {
      this.emit('dragMove', {
        type: 'dragMove',
        target,
        data,
      });
    });

    this.drag.on('end', (target, data) => {
      this.emit('dragEnd', {
        type: 'dragEnd',
        target,
        data,
      });
    });

    // Hover events
    this.hover.on('start', (target) => {
      this.emit('hoverStart', {
        type: 'hoverStart',
        target,
      });
    });

    this.hover.on('end', (target) => {
      this.emit('hoverEnd', {
        type: 'hoverEnd',
        target,
      });
    });
  }

  /**
   * Register a node for interactions
   */
  registerNode(node: NodeShapeBase): void {
    if (this.config.enableSelection) {
      this.selection.registerElement(node);
    }

    if (this.config.enableDrag) {
      this.drag.registerNode(node);
    }

    if (this.config.enableHover) {
      this.hover.registerElement(node);
    }
  }

  /**
   * Register an edge for interactions
   */
  registerEdge(edge: EdgeShapeBase): void {
    if (this.config.enableSelection) {
      this.selection.registerElement(edge);
    }

    if (this.config.enableHover) {
      this.hover.registerElement(edge);
    }
  }

  /**
   * Unregister a node
   */
  unregisterNode(node: NodeShapeBase): void {
    this.selection.unregisterElement(node);
    this.drag.unregisterNode(node);
    this.hover.unregisterElement(node);
  }

  /**
   * Unregister an edge
   */
  unregisterEdge(edge: EdgeShapeBase): void {
    this.selection.unregisterElement(edge);
    this.hover.unregisterElement(edge);
  }

  /**
   * Enable/disable interaction types
   */
  setEnabled(type: 'selection' | 'drag' | 'hover', enabled: boolean): void {
    switch (type) {
      case 'selection':
        this.config.enableSelection = enabled;
        if (!enabled) {
          this.selection.clear();
        }
        break;
      case 'drag':
        this.config.enableDrag = enabled;
        break;
      case 'hover':
        this.config.enableHover = enabled;
        if (!enabled) {
          this.hover.clear();
        }
        break;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<InteractionConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<InteractionConfig>): void {
    if (config.enableSelection !== undefined) {
      this.setEnabled('selection', config.enableSelection);
    }
    if (config.enableDrag !== undefined) {
      this.setEnabled('drag', config.enableDrag);
    }
    if (config.enableHover !== undefined) {
      this.setEnabled('hover', config.enableHover);
    }
    if (config.multiSelect !== undefined) {
      this.config.multiSelect = config.multiSelect;
      this.selection.setMultiSelect(config.multiSelect);
    }
    if (config.dragThreshold !== undefined) {
      this.config.dragThreshold = config.dragThreshold;
    }
  }

  /**
   * Subscribe to interaction events
   */
  on(event: InteractionEventType, callback: InteractionEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Unsubscribe from interaction events
   */
  off(event: InteractionEventType, callback: InteractionEventCallback): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit interaction event
   */
  private emit(event: InteractionEventType, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  /**
   * Clear all interactions
   */
  clear(): void {
    this.selection.clear();
    this.hover.clear();
  }

  /**
   * Destroy the interaction manager
   */
  destroy(): void {
    this.clear();
    this.selection.destroy();
    this.drag.destroy();
    this.hover.destroy();
    this.listeners.clear();
  }
}
