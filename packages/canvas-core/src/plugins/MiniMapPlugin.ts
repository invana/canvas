/**
 * MiniMap Plugin
 * 
 * Bird's eye view navigator for the canvas, inspired by Cytoscape.js Navigator.
 * 
 * Key concepts:
 * - The minimap shows a THUMBNAIL of ALL content (nodes) in the world
 * - The VIEW INDICATOR shows what portion of the world is currently visible in the main canvas
 * - Dragging the view indicator pans the main canvas
 * - Clicking outside the view indicator jumps to that location
 * 
 * Coordinate system:
 * - World coordinates: Where nodes actually exist
 * - Thumbnail coordinates: Scaled world coords to fit in minimap panel
 * - View coordinates: The viewport indicator position/size in thumbnail coords
 */

import { Application, Graphics, FederatedPointerEvent } from 'pixi.js';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { Viewport } from '../viewport/Viewport';
import { PluginRegistry } from './registry';

export interface MiniMapOptions {
  /** Width of minimap in pixels */
  width?: number;
  /** Height of minimap in pixels */
  height?: number;
  /** Background color of minimap */
  backgroundColor?: number;
  /** Viewport indicator fill color */
  viewportFill?: number;
  /** Viewport indicator stroke color */
  viewportStroke?: number;
  /** Viewport indicator fill alpha */
  viewportFillAlpha?: number;
  /** Viewport indicator stroke width */
  viewportStrokeWidth?: number;
  /** Padding around content (as fraction of size) */
  padding?: number;
  /** Enable viewport dragging */
  enableDrag?: boolean;
  /** Position of minimap */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  w: number;
  h: number;
}

/**
 * MiniMap Plugin - Cytoscape-style navigator
 */
export class MiniMapPlugin implements CanvasPlugin {
  readonly id = 'minimap';
  readonly name = 'MiniMap';
  readonly layerGroups = [];

  private _canvas: Canvas | null = null;
  private _viewport: Viewport | null = null;
  private _options: Required<MiniMapOptions>;
  
  private _minimapApp: Application | null = null;
  private _minimapContainer: HTMLElement | null = null;
  private _thumbnailGraphics: Graphics | null = null;
  private _viewGraphics: Graphics | null = null;
  
  // Cached values (like Cytoscape navigator)
  private _boundingBox: BoundingBox = { x1: 0, y1: 0, x2: 100, y2: 100, w: 100, h: 100 };
  private _thumbnailZoom: number = 1;
  private _thumbnailPan: { x: number; y: number } = { x: 0, y: 0 };
  
  // View indicator values
  private _viewW: number = 0;
  private _viewH: number = 0;
  private _viewX: number = 0;
  private _viewY: number = 0;
  
  // Interaction state
  private _isDragging = false;
  private _hookPoint: { x: number; y: number } = { x: 0, y: 0 };

  constructor(options: MiniMapOptions = {}) {
    this._options = {
      width: options.width ?? 200,
      height: options.height ?? 150,
      backgroundColor: options.backgroundColor ?? 0x1a1a2e,
      viewportFill: options.viewportFill ?? 0x4a90d9,
      viewportStroke: options.viewportStroke ?? 0x2a70b9,
      viewportFillAlpha: options.viewportFillAlpha ?? 0.25,
      viewportStrokeWidth: options.viewportStrokeWidth ?? 2,
      padding: options.padding ?? 0.1, // 10% padding
      enableDrag: options.enableDrag ?? true,
      position: options.position ?? 'bottom-right',
    };
  }

  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._viewport = canvas.viewport;

    if (!this._viewport) {
      throw new Error('Viewport is required for MiniMapPlugin');
    }

    // Create container
    this._minimapContainer = this.createContainer();
    
    // Initialize PixiJS application for minimap
    this._minimapApp = new Application();
    await this._minimapApp.init({
      width: this._options.width,
      height: this._options.height,
      backgroundColor: this._options.backgroundColor,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
    });

    this._minimapContainer.appendChild(this._minimapApp.canvas);

    // Create graphics layers
    this._thumbnailGraphics = new Graphics();
    this._viewGraphics = new Graphics();
    
    this._minimapApp.stage.addChild(this._thumbnailGraphics);
    this._minimapApp.stage.addChild(this._viewGraphics);

    // Setup interactions
    if (this._options.enableDrag) {
      this._minimapApp.stage.eventMode = 'static';
      this._minimapApp.stage.hitArea = { contains: () => true };
      this._minimapApp.stage.on('pointerdown', this.onPointerDown);
      this._minimapApp.stage.on('pointermove', this.onPointerMove);
      this._minimapApp.stage.on('pointerup', this.onPointerUp);
      this._minimapApp.stage.on('pointerupoutside', this.onPointerUp);
    }

    // Use ticker for reactive updates
    this._minimapApp.ticker.add(this.update, this);

    // Initial setup
    this.setupThumbnail();
    this.renderThumbnail();
  }

  /**
   * Create the minimap container element
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.border = '2px solid #333';
    container.style.borderRadius = '4px';
    container.style.overflow = 'hidden';
    container.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
    container.style.zIndex = '1000';
    container.style.cursor = 'pointer';
    
    const margin = '10px';
    switch (this._options.position) {
      case 'top-left':
        container.style.top = margin;
        container.style.left = margin;
        break;
      case 'top-right':
        container.style.top = margin;
        container.style.right = margin;
        break;
      case 'bottom-left':
        container.style.bottom = margin;
        container.style.left = margin;
        break;
      case 'bottom-right':
        container.style.bottom = margin;
        container.style.right = margin;
        break;
    }

    if (this._canvas?.app?.canvas?.parentElement) {
      this._canvas.app.canvas.parentElement.appendChild(container);
    }

    return container;
  }

  /**
   * Get bounding box of all nodes in world coordinates
   * Similar to Cytoscape's cy.elements().boundingBox()
   * 
   * We calculate a fixed world bounds based on node positions,
   * NOT including the viewport. The viewport indicator shows what
   * portion of this world is currently visible.
   */
  private getBoundingBox(): BoundingBox {
    const nodes = this._canvas?.renderer.getNodes() ?? [];
    
    if (nodes.length === 0) {
      // Default bounds if no nodes
      return { x1: -500, y1: -500, x2: 500, y2: 500, w: 1000, h: 1000 };
    }

    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;

    // Include all nodes
    nodes.forEach(node => {
      const size = (node.data.size ?? 30) / 2;
      x1 = Math.min(x1, node.x - size);
      y1 = Math.min(y1, node.y - size);
      x2 = Math.max(x2, node.x + size);
      y2 = Math.max(y2, node.y + size);
    });

    // Add significant padding (50% on each side) so there's always
    // room around the content for panning
    const w = x2 - x1;
    const h = y2 - y1;
    const padX = Math.max(w * 0.5, 200); // At least 200px padding
    const padY = Math.max(h * 0.5, 200);
    
    x1 -= padX;
    y1 -= padY;
    x2 += padX;
    y2 += padY;

    return {
      x1, y1, x2, y2,
      w: x2 - x1,
      h: y2 - y1,
    };
  }

  /**
   * Setup thumbnail zoom and pan to fit all content
   * Like Cytoscape's _setupThumbnailSizes
   */
  private setupThumbnail(): void {
    // Update bounding box
    this._boundingBox = this.getBoundingBox();

    // Calculate zoom to fit content in panel
    this._thumbnailZoom = Math.min(
      this._options.height / this._boundingBox.h,
      this._options.width / this._boundingBox.w
    );

    // Calculate pan to center content
    this._thumbnailPan = {
      x: (this._options.width - this._thumbnailZoom * (this._boundingBox.x1 + this._boundingBox.x2)) / 2,
      y: (this._options.height - this._thumbnailZoom * (this._boundingBox.y1 + this._boundingBox.y2)) / 2,
    };
  }

  /**
   * Convert world coordinates to thumbnail coordinates
   */
  private worldToThumbnail(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX * this._thumbnailZoom + this._thumbnailPan.x,
      y: worldY * this._thumbnailZoom + this._thumbnailPan.y,
    };
  }

  /**
   * Render all nodes and edges to the thumbnail
   */
  private renderThumbnail(): void {
    if (!this._canvas || !this._thumbnailGraphics) return;

    const nodes = this._canvas.renderer.getNodes();
    const edges = this._canvas.renderer.getEdges();

    // Clear and redraw
    this._thumbnailGraphics.clear();

    // Draw edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.data.source?.toString());
      const target = nodes.find(n => n.id === edge.data.target?.toString());
      
      if (source && target) {
        const p1 = this.worldToThumbnail(source.x, source.y);
        const p2 = this.worldToThumbnail(target.x, target.y);
        
        this._thumbnailGraphics!.moveTo(p1.x, p1.y);
        this._thumbnailGraphics!.lineTo(p2.x, p2.y);
        this._thumbnailGraphics!.stroke({ width: 1, color: 0x555555 });
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = this.worldToThumbnail(node.x, node.y);
      // Use a small fixed size for minimap nodes (3-6px radius)
      const radius = Math.max(3, Math.min(6, ((node.data.size ?? 30) / 2) * this._thumbnailZoom * 0.3));
      
      // Get node color
      let color = 0x4CAF50; // Default green
      if (node.nodeStyle?.fill) {
        const fill = node.nodeStyle.fill;
        if (typeof fill === 'string' && fill.startsWith('#')) {
          color = parseInt(fill.slice(1), 16);
        } else if (typeof fill === 'number') {
          color = fill;
        }
      }
      
      this._thumbnailGraphics!.circle(pos.x, pos.y, radius);
      this._thumbnailGraphics!.fill(color);
    });
  }

  /**
   * Setup view indicator position and size
   * Uses pixi-viewport's getVisibleBounds() for accurate positioning
   */
  private setupView(): void {
    if (!this._viewport) return;

    // Get the visible world bounds from pixi-viewport
    // This tells us exactly what part of the world is visible
    const visibleBounds = this._viewport.getVisibleBounds();
    
    // Convert visible bounds to thumbnail coordinates
    const topLeft = this.worldToThumbnail(visibleBounds.x, visibleBounds.y);
    const bottomRight = this.worldToThumbnail(
      visibleBounds.x + visibleBounds.width, 
      visibleBounds.y + visibleBounds.height
    );
    
    this._viewX = topLeft.x;
    this._viewY = topLeft.y;
    this._viewW = bottomRight.x - topLeft.x;
    this._viewH = bottomRight.y - topLeft.y;
  }

  /**
   * Render the view indicator
   */
  private renderView(): void {
    if (!this._viewGraphics) return;

    this._viewGraphics.clear();
    
    // Clamp view indicator to minimap bounds
    const x = Math.max(0, Math.min(this._viewX, this._options.width - 2));
    const y = Math.max(0, Math.min(this._viewY, this._options.height - 2));
    const w = Math.min(this._viewW, this._options.width - x);
    const h = Math.min(this._viewH, this._options.height - y);
    
    // Only draw if there's something visible
    if (w > 0 && h > 0) {
      // Fill
      this._viewGraphics.rect(x, y, w, h);
      this._viewGraphics.fill({
        color: this._options.viewportFill,
        alpha: this._options.viewportFillAlpha,
      });
      
      // Stroke
      this._viewGraphics.rect(x, y, w, h);
      this._viewGraphics.stroke({
        width: this._options.viewportStrokeWidth,
        color: this._options.viewportStroke,
      });
    }
  }

  /**
   * Main update loop - called every frame
   * Updates both the thumbnail (for node movements) and view indicator
   */
  private update = (): void => {
    // Re-render thumbnail to reflect node position changes
    this.renderThumbnail();
    // Update view indicator
    this.setupView();
    this.renderView();
  };

  /**
   * Move the main canvas viewport based on view indicator position
   * Converts thumbnail coordinates back to world coordinates and moves viewport
   */
  private moveViewport(): void {
    if (!this._viewport) return;

    // Convert thumbnail position to world coordinates
    // We want to move the viewport so that this world position is at the top-left of the visible area
    const worldX = (this._viewX - this._thumbnailPan.x) / this._thumbnailZoom;
    const worldY = (this._viewY - this._thumbnailPan.y) / this._thumbnailZoom;
    
    // Use pixi-viewport's moveCorner to position the viewport's top-left corner at the world position
    this._viewport.moveCorner(worldX, worldY);
  }

  /**
   * Check if point is inside view indicator
   */
  private isInsideView(x: number, y: number): boolean {
    return x >= this._viewX && x <= this._viewX + this._viewW &&
           y >= this._viewY && y <= this._viewY + this._viewH;
  }

  /**
   * Handle pointer down
   */
  private onPointerDown = (event: FederatedPointerEvent): void => {
    // Get local position within the minimap (event.global is relative to minimap stage)
    const localPos = event.getLocalPosition(this._minimapApp!.stage);
    const x = localPos.x;
    const y = localPos.y;

    this._isDragging = true;

    if (this.isInsideView(x, y)) {
      // Started inside view - drag from current position
      this._hookPoint = {
        x: x - this._viewX,
        y: y - this._viewY,
      };
    } else {
      // Started outside view - center view on click point
      this._hookPoint = {
        x: this._viewW / 2,
        y: this._viewH / 2,
      };
      // Immediately move view to click position
      this._viewX = x - this._hookPoint.x;
      this._viewY = y - this._hookPoint.y;
      this.moveViewport();
    }
  };

  /**
   * Handle pointer move
   */
  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this._isDragging) return;

    // Get local position within the minimap
    const localPos = event.getLocalPosition(this._minimapApp!.stage);
    const x = localPos.x;
    const y = localPos.y;

    // Update view position
    this._viewX = x - this._hookPoint.x;
    this._viewY = y - this._hookPoint.y;

    // Move viewport
    this.moveViewport();
  };

  /**
   * Handle pointer up
   */
  private onPointerUp = (): void => {
    this._isDragging = false;
  };

  /**
   * Refresh minimap content (call after adding/removing nodes)
   */
  refresh(): void {
    this.setupThumbnail();
    this.renderThumbnail();
  }

  show(): void {
    if (this._minimapContainer) {
      this._minimapContainer.style.display = 'block';
    }
  }

  hide(): void {
    if (this._minimapContainer) {
      this._minimapContainer.style.display = 'none';
    }
  }

  destroy(): void {
    if (this._minimapApp) {
      this._minimapApp.ticker.remove(this.update, this);
      this._minimapApp.destroy(true);
      this._minimapApp = null;
    }

    if (this._minimapContainer) {
      this._minimapContainer.remove();
    }

    this._canvas = null;
    this._viewport = null;
    this._thumbnailGraphics = null;
    this._viewGraphics = null;
    this._minimapContainer = null;
  }
}

// Auto-register plugin
PluginRegistry.register('minimap', MiniMapPlugin);
