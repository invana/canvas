/**
 * MiniMap Plugin
 * 
 * Simple bird's eye view of the entire world with viewport indicator.
 * 
 * Design:
 * - Shows ALL nodes in the world, scaled to fit the minimap
 * - Viewport indicator shows what portion is currently visible on main canvas
 * - Dragging the indicator pans the main canvas
 * - Clicking anywhere jumps to that location
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
  /** Padding around world content */
  padding?: number;
  /** Enable viewport dragging */
  enableDrag?: boolean;
  /** Position of minimap */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * MiniMap Plugin - Simple world overview with viewport indicator
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
  private _worldGraphics: Graphics | null = null;
  private _viewportGraphics: Graphics | null = null;
  
  // World bounds (fixed based on node positions)
  private _worldBounds = { x: 0, y: 0, width: 1000, height: 1000 };
  
  // Scale factor to fit world into minimap
  private _scale: number = 1;
  private _offsetX: number = 0;
  private _offsetY: number = 0;
  
  // Interaction state
  private _isDragging = false;
  private _dragOffset = { x: 0, y: 0 };

  constructor(options: MiniMapOptions = {}) {
    this._options = {
      width: options.width ?? 200,
      height: options.height ?? 150,
      backgroundColor: options.backgroundColor ?? 0x1a1a2e,
      viewportFill: options.viewportFill ?? 0x4a90d9,
      viewportStroke: options.viewportStroke ?? 0x2a70b9,
      viewportFillAlpha: options.viewportFillAlpha ?? 0.3,
      viewportStrokeWidth: options.viewportStrokeWidth ?? 2,
      padding: options.padding ?? 20,
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

    // Create container element
    this._minimapContainer = this.createContainer();
    
    // Initialize PixiJS application for minimap
    this._minimapApp = new Application();
    const resolution = window.devicePixelRatio || 1;
    await this._minimapApp.init({
      width: this._options.width,
      height: this._options.height,
      backgroundColor: this._options.backgroundColor,
      antialias: true,
      resolution: resolution,
      autoDensity: true, // Automatically adjusts CSS size for resolution
    });

    // Ensure canvas has correct CSS dimensions
    const minimapCanvas = this._minimapApp.canvas as HTMLCanvasElement;
    minimapCanvas.style.width = `${this._options.width}px`;
    minimapCanvas.style.height = `${this._options.height}px`;

    this._minimapContainer.appendChild(minimapCanvas);

    // Create graphics layers
    this._worldGraphics = new Graphics();
    this._viewportGraphics = new Graphics();
    
    this._minimapApp.stage.addChild(this._worldGraphics);
    this._minimapApp.stage.addChild(this._viewportGraphics);

    // Setup interactions
    if (this._options.enableDrag) {
      this._minimapApp.stage.eventMode = 'static';
      this._minimapApp.stage.hitArea = { contains: () => true };
      this._minimapApp.stage.on('pointerdown', this.onPointerDown);
      this._minimapApp.stage.on('pointermove', this.onPointerMove);
      this._minimapApp.stage.on('pointerup', this.onPointerUp);
      this._minimapApp.stage.on('pointerupoutside', this.onPointerUp);
    }

    // Calculate initial world bounds
    this.calculateWorldBounds();

    // Start render loop
    this._minimapApp.ticker.add(this.render, this);
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
   * Calculate the world bounds from viewport's world dimensions
   * This shows the ENTIRE world, not just where nodes are
   */
  private calculateWorldBounds(): void {
    if (!this._viewport) {
      this._worldBounds = { x: -500, y: -500, width: 1000, height: 1000 };
      this.calculateScale();
      return;
    }

    // Use the viewport's world dimensions - this is the entire navigable world
    const worldWidth = this._viewport.worldWidth;
    const worldHeight = this._viewport.worldHeight;
    
    // Center the world at origin (0,0)
    this._worldBounds = {
      x: -worldWidth / 2,
      y: -worldHeight / 2,
      width: worldWidth,
      height: worldHeight,
    };

    this.calculateScale();
  }

  /**
   * Calculate scale and offset to fit world into minimap
   */
  private calculateScale(): void {
    const { width, height } = this._options;
    const world = this._worldBounds;

    // Calculate scale to fit world in minimap (maintain aspect ratio)
    const scaleX = width / world.width;
    const scaleY = height / world.height;
    this._scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave margin

    // Calculate offset to center the world in minimap
    const scaledWidth = world.width * this._scale;
    const scaledHeight = world.height * this._scale;
    this._offsetX = (width - scaledWidth) / 2;
    this._offsetY = (height - scaledHeight) / 2;
  }

  /**
   * Convert world coordinates to minimap coordinates
   */
  private worldToMinimap(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: (worldX - this._worldBounds.x) * this._scale + this._offsetX,
      y: (worldY - this._worldBounds.y) * this._scale + this._offsetY,
    };
  }

  /**
   * Convert minimap coordinates to world coordinates
   */
  private minimapToWorld(minimapX: number, minimapY: number): { x: number; y: number } {
    return {
      x: (minimapX - this._offsetX) / this._scale + this._worldBounds.x,
      y: (minimapY - this._offsetY) / this._scale + this._worldBounds.y,
    };
  }

  /**
   * Render loop - draws world and viewport indicator
   */
  private render = (): void => {
    this.renderWorld();
    this.renderViewportIndicator();
  };

  /**
   * Render all nodes and edges in the world
   */
  private renderWorld(): void {
    if (!this._worldGraphics || !this._canvas) return;

    const nodes = this._canvas.renderer.getNodes();
    const edges = this._canvas.renderer.getEdges();

    this._worldGraphics.clear();

    // Draw edges
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.data.source?.toString());
      const target = nodes.find(n => n.id === edge.data.target?.toString());
      
      if (source && target) {
        const p1 = this.worldToMinimap(source.x, source.y);
        const p2 = this.worldToMinimap(target.x, target.y);
        
        this._worldGraphics!.moveTo(p1.x, p1.y);
        this._worldGraphics!.lineTo(p2.x, p2.y);
        this._worldGraphics!.stroke({ width: 1, color: 0x555555 });
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      const pos = this.worldToMinimap(node.x, node.y);
      // Use a minimum visible size for nodes (at least 3px, up to 8px)
      const scaledSize = ((node.data.size ?? 30) / 2) * this._scale;
      const radius = Math.max(3, Math.min(8, scaledSize * 3)); // Boost visibility
      
      // Get node color
      let color = 0x4CAF50;
      if (node.nodeStyle?.fill) {
        const fill = node.nodeStyle.fill;
        if (typeof fill === 'string' && fill.startsWith('#')) {
          color = parseInt(fill.slice(1), 16);
        } else if (typeof fill === 'number') {
          color = fill;
        }
      }
      
      this._worldGraphics!.circle(pos.x, pos.y, radius);
      this._worldGraphics!.fill(color);
    });
  }

  /**
   * Render the viewport indicator (shows what's visible on main canvas)
   */
  private renderViewportIndicator(): void {
    if (!this._viewportGraphics || !this._viewport) return;

    this._viewportGraphics.clear();

    // Get the visible world bounds from viewport
    const visibleBounds = this._viewport.getVisibleBounds();

    // Convert to minimap coordinates
    const topLeft = this.worldToMinimap(visibleBounds.x, visibleBounds.y);
    const bottomRight = this.worldToMinimap(
      visibleBounds.x + visibleBounds.width,
      visibleBounds.y + visibleBounds.height
    );

    const x = topLeft.x;
    const y = topLeft.y;
    const w = bottomRight.x - topLeft.x;
    const h = bottomRight.y - topLeft.y;

    // Draw viewport indicator
    this._viewportGraphics.rect(x, y, w, h);
    this._viewportGraphics.fill({
      color: this._options.viewportFill,
      alpha: this._options.viewportFillAlpha,
    });
    this._viewportGraphics.rect(x, y, w, h);
    this._viewportGraphics.stroke({
      width: this._options.viewportStrokeWidth,
      color: this._options.viewportStroke,
    });
  }

  /**
   * Handle pointer down - start dragging or jump to location
   */
  private onPointerDown = (event: FederatedPointerEvent): void => {
    if (!this._viewport) return;

    const localPos = event.getLocalPosition(this._minimapApp!.stage);
    const worldPos = this.minimapToWorld(localPos.x, localPos.y);

    // Get current viewport center
    const visibleBounds = this._viewport.getVisibleBounds();
    const viewCenterX = visibleBounds.x + visibleBounds.width / 2;
    const viewCenterY = visibleBounds.y + visibleBounds.height / 2;

    // Check if clicking inside the viewport indicator
    const isInsideViewport = 
      worldPos.x >= visibleBounds.x && 
      worldPos.x <= visibleBounds.x + visibleBounds.width &&
      worldPos.y >= visibleBounds.y && 
      worldPos.y <= visibleBounds.y + visibleBounds.height;

    this._isDragging = true;

    if (isInsideViewport) {
      // Drag from current position
      this._dragOffset = {
        x: worldPos.x - viewCenterX,
        y: worldPos.y - viewCenterY,
      };
    } else {
      // Jump to clicked position
      this._dragOffset = { x: 0, y: 0 };
      this._viewport.moveCenter(worldPos.x, worldPos.y);
    }
  };

  /**
   * Handle pointer move - drag viewport
   */
  private onPointerMove = (event: FederatedPointerEvent): void => {
    if (!this._isDragging || !this._viewport) return;

    const localPos = event.getLocalPosition(this._minimapApp!.stage);
    const worldPos = this.minimapToWorld(localPos.x, localPos.y);

    // Move viewport center to new position (accounting for drag offset)
    this._viewport.moveCenter(
      worldPos.x - this._dragOffset.x,
      worldPos.y - this._dragOffset.y
    );
  };

  /**
   * Handle pointer up - stop dragging
   */
  private onPointerUp = (): void => {
    this._isDragging = false;
  };

  /**
   * Refresh minimap (call after adding/removing nodes)
   */
  refresh(): void {
    this.calculateWorldBounds();
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
      this._minimapApp.ticker.remove(this.render, this);
      this._minimapApp.destroy(true);
      this._minimapApp = null;
    }

    if (this._minimapContainer) {
      this._minimapContainer.remove();
    }

    this._canvas = null;
    this._viewport = null;
    this._worldGraphics = null;
    this._viewportGraphics = null;
    this._minimapContainer = null;
  }
}

// Auto-register plugin
PluginRegistry.register('minimap', MiniMapPlugin);
