/**
 * Interaction Manager - Handles all user interactions
 */

import type { Container, FederatedPointerEvent, FederatedWheelEvent } from 'pixi.js';
import type { InteractionConfig, Point } from '../types/index.js';
import type { BaseEdgeShape } from '../shapes/edges/BaseEdgeShape.js';
import type { BaseNodeShape } from '../shapes/nodes/BaseNodeShape.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { CanvasEvents } from '../events/CanvasEvents.js';
import type { Viewport } from '../core/Viewport.js';

export interface InteractionManagerConfig {
  viewport: Viewport;
  stage: Container;
  getNodes: () => Map<string, BaseNodeShape>;
  getEdges: () => Map<string, BaseEdgeShape>;
  events: EventEmitter;
}

export class InteractionManager {
  private _config: Required<InteractionConfig>;
  private _viewport: Viewport;
  private _stage: Container;
  private _getNodes: () => Map<string, BaseNodeShape>;
  private _getEdges: () => Map<string, BaseEdgeShape>;
  private _events: EventEmitter;

  // State
  private _enabled = true;
  private _hoveredNode: BaseNodeShape | null = null;
  private _hoveredEdge: BaseEdgeShape | null = null;
  private _draggedNode: BaseNodeShape | null = null;
  private _dragOffset: Point = { x: 0, y: 0 };
  private _isPanning = false;
  private _panStart: Point = { x: 0, y: 0 };
  private _lastClickTime = 0;
  private _lastClickTarget: string | null = null;

  constructor(config: InteractionManagerConfig) {
    this._viewport = config.viewport;
    this._stage = config.stage;
    this._getNodes = config.getNodes;
    this._getEdges = config.getEdges;
    this._events = config.events;

    this._config = {
      hover: true,
      click: true,
      doubleClick: true,
      drag: true,
      select: true,
      multiSelect: true,
      pan: true,
      zoom: true,
      contextMenu: true,
    };

    this._setupEventListeners();
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  configure(config: Partial<InteractionConfig>): void {
    Object.assign(this._config, config);
  }

  get config(): Required<InteractionConfig> {
    return { ...this._config };
  }

  enable(): void {
    this._enabled = true;
  }

  disable(): void {
    this._enabled = false;
    this._cleanup();
  }

  disableAll(): void {
    this._config = {
      hover: false,
      click: false,
      doubleClick: false,
      drag: false,
      select: false,
      multiSelect: false,
      pan: false,
      zoom: false,
      contextMenu: false,
    };
  }

  enableAll(): void {
    this._config = {
      hover: true,
      click: true,
      doubleClick: true,
      drag: true,
      select: true,
      multiSelect: true,
      pan: true,
      zoom: true,
      contextMenu: true,
    };
  }

  // ============================================================================
  // Event Setup
  // ============================================================================

  private _setupEventListeners(): void {
    this._stage.eventMode = 'static';
    this._stage.hitArea = { contains: () => true };

    // Pointer events
    this._stage.on('pointerdown', this._onPointerDown.bind(this));
    this._stage.on('pointermove', this._onPointerMove.bind(this));
    this._stage.on('pointerup', this._onPointerUp.bind(this));
    this._stage.on('pointerupoutside', this._onPointerUp.bind(this));

    // Wheel for zoom
    this._stage.on('wheel', this._onWheel.bind(this));

    // Right click
    this._stage.on('rightclick', this._onRightClick.bind(this));
  }

  private _cleanup(): void {
    if (this._hoveredNode) {
      this._hoveredNode.removeState('hovered');
      this._events.emit(CanvasEvents.NODE_HOVER_END, { node: this._hoveredNode.data });
      this._hoveredNode = null;
    }
    if (this._hoveredEdge) {
      this._hoveredEdge.removeState('hovered');
      this._events.emit(CanvasEvents.EDGE_HOVER_END, { edge: this._hoveredEdge.data });
      this._hoveredEdge = null;
    }
    if (this._draggedNode) {
      this._events.emit(CanvasEvents.NODE_DRAG_END, { node: this._draggedNode.data });
      this._draggedNode = null;
    }
    this._isPanning = false;
  }

  // ============================================================================
  // Pointer Events
  // ============================================================================

  private _onPointerDown(event: FederatedPointerEvent): void {
    if (!this._enabled) return;

    const worldPos = this._getWorldPosition(event);
    const node = this._findNodeAtPosition(worldPos);
    const edge = node ? null : this._findEdgeAtPosition(worldPos);

    if (node) {
      // Handle node interaction
      if (this._config.click) {
        this._handleClick(node, null, event);
      }

      if (this._config.drag) {
        this._draggedNode = node;
        this._dragOffset = {
          x: worldPos.x - node.position.x,
          y: worldPos.y - node.position.y,
        };
        this._events.emit(CanvasEvents.NODE_DRAG_START, {
          node: node.data,
          position: worldPos,
        });
      }
    } else if (edge) {
      // Handle edge interaction
      if (this._config.click) {
        this._handleClick(null, edge, event);
      }
    } else {
      // Handle background interaction (pan start)
      if (this._config.pan && event.button === 0) {
        this._isPanning = true;
        this._panStart = { x: event.globalX, y: event.globalY };
      }

      // Background click
      if (this._config.click) {
        this._events.emit(CanvasEvents.CANVAS_CLICK, {
          position: { x: event.globalX, y: event.globalY },
          worldPosition: worldPos,
        });
      }
    }
  }

  private _onPointerMove(event: FederatedPointerEvent): void {
    if (!this._enabled) return;

    const worldPos = this._getWorldPosition(event);

    // Handle dragging
    if (this._draggedNode && this._config.drag) {
      const newX = worldPos.x - this._dragOffset.x;
      const newY = worldPos.y - this._dragOffset.y;
      this._draggedNode.setPosition(newX, newY);

      this._events.emit(CanvasEvents.NODE_DRAG, {
        node: this._draggedNode.data,
        position: { x: newX, y: newY },
      });
      return;
    }

    // Handle panning
    if (this._isPanning && this._config.pan) {
      const dx = event.globalX - this._panStart.x;
      const dy = event.globalY - this._panStart.y;
      this._viewport.panBy(dx, dy);
      this._panStart = { x: event.globalX, y: event.globalY };
      return;
    }

    // Handle hover
    if (this._config.hover) {
      this._handleHover(worldPos);
    }
  }

  private _onPointerUp(_event: FederatedPointerEvent): void {
    if (this._draggedNode) {
      this._events.emit(CanvasEvents.NODE_DRAG_END, {
        node: this._draggedNode.data,
        position: this._draggedNode.position,
      });
      this._draggedNode = null;
    }

    this._isPanning = false;
  }

  private _onWheel(event: FederatedWheelEvent): void {
    if (!this._enabled || !this._config.zoom) return;

    event.preventDefault?.();

    const delta = -event.deltaY * 0.001;
    const zoomFactor = 1 + delta;
    const newZoom = this._viewport.zoom * zoomFactor;

    this._viewport.zoomTo(newZoom, {
      x: event.globalX,
      y: event.globalY,
    });
  }

  private _onRightClick(event: FederatedPointerEvent): void {
    if (!this._enabled || !this._config.contextMenu) return;

    event.preventDefault?.();

    const worldPos = this._getWorldPosition(event);
    const node = this._findNodeAtPosition(worldPos);
    const edge = node ? null : this._findEdgeAtPosition(worldPos);

    if (node) {
      this._events.emit(CanvasEvents.NODE_CONTEXT_MENU, {
        node: node.data,
        position: { x: event.globalX, y: event.globalY },
        worldPosition: worldPos,
      });
    } else if (edge) {
      this._events.emit(CanvasEvents.EDGE_CONTEXT_MENU, {
        edge: edge.data,
        position: { x: event.globalX, y: event.globalY },
        worldPosition: worldPos,
      });
    } else {
      this._events.emit(CanvasEvents.CANVAS_CONTEXT_MENU, {
        position: { x: event.globalX, y: event.globalY },
        worldPosition: worldPos,
      });
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private _getWorldPosition(event: FederatedPointerEvent): Point {
    return this._viewport.screenToWorld({
      x: event.globalX,
      y: event.globalY,
    });
  }

  private _findNodeAtPosition(worldPos: Point): BaseNodeShape | null {
    const nodes = this._getNodes();
    // Iterate in reverse to check topmost nodes first
    const nodeArray = Array.from(nodes.values()).reverse();

    for (const node of nodeArray) {
      if (node.hitTest(worldPos.x, worldPos.y)) {
        return node;
      }
    }
    return null;
  }

  private _findEdgeAtPosition(worldPos: Point): BaseEdgeShape | null {
    const edges = this._getEdges();

    for (const edge of edges.values()) {
      if (edge.hitTest(worldPos.x, worldPos.y)) {
        return edge;
      }
    }
    return null;
  }

  private _handleClick(
    node: BaseNodeShape | null,
    edge: BaseEdgeShape | null,
    event: FederatedPointerEvent,
  ): void {
    const now = Date.now();
    const targetId = node?.id ?? edge?.id ?? null;

    // Check for double click
    if (
      this._config.doubleClick &&
      now - this._lastClickTime < 300 &&
      this._lastClickTarget === targetId
    ) {
      if (node) {
        node.addState('clicked');
        this._events.emit(CanvasEvents.NODE_DOUBLE_CLICK, {
          node: node.data,
          originalEvent: event,
        });
        setTimeout(() => node.removeState('clicked'), 100);
      } else if (edge) {
        edge.addState('clicked');
        this._events.emit(CanvasEvents.EDGE_DOUBLE_CLICK, {
          edge: edge.data,
          originalEvent: event,
        });
        setTimeout(() => edge.removeState('clicked'), 100);
      } else {
        this._events.emit(CanvasEvents.CANVAS_DOUBLE_CLICK, {
          position: { x: event.globalX, y: event.globalY },
        });
      }
    } else {
      // Single click
      if (node) {
        node.addState('clicked');
        this._events.emit(CanvasEvents.NODE_CLICK, {
          node: node.data,
          originalEvent: event,
        });
        setTimeout(() => node.removeState('clicked'), 100);
      } else if (edge) {
        edge.addState('clicked');
        this._events.emit(CanvasEvents.EDGE_CLICK, {
          edge: edge.data,
          originalEvent: event,
        });
        setTimeout(() => edge.removeState('clicked'), 100);
      }
    }

    this._lastClickTime = now;
    this._lastClickTarget = targetId;
  }

  private _handleHover(worldPos: Point): void {
    const node = this._findNodeAtPosition(worldPos);
    const edge = node ? null : this._findEdgeAtPosition(worldPos);

    // Handle node hover
    if (node !== this._hoveredNode) {
      if (this._hoveredNode) {
        this._hoveredNode.removeState('hovered');
        this._events.emit(CanvasEvents.NODE_HOVER_END, {
          node: this._hoveredNode.data,
        });
      }
      if (node) {
        node.addState('hovered');
        this._events.emit(CanvasEvents.NODE_HOVER, { node: node.data });
      }
      this._hoveredNode = node;
    }

    // Handle edge hover
    if (edge !== this._hoveredEdge) {
      if (this._hoveredEdge) {
        this._hoveredEdge.removeState('hovered');
        this._events.emit(CanvasEvents.EDGE_HOVER_END, {
          edge: this._hoveredEdge.data,
        });
      }
      if (edge) {
        edge.addState('hovered');
        this._events.emit(CanvasEvents.EDGE_HOVER, { edge: edge.data });
      }
      this._hoveredEdge = edge;
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this._cleanup();
    this._stage.removeAllListeners();
  }
}
