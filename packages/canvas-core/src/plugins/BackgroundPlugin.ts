/**
 * Background Plugin
 * 
 * Adds background styling support to the canvas including:
 * - Solid colors
 * - Linear and radial gradients  
 * - Patterns (dots, grid, cross, lines)
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({ container });
 * await canvas.init();
 * 
 * const bgPlugin = new BackgroundPlugin();
 * canvas.registerPlugin(bgPlugin);
 * 
 * // Set background
 * bgPlugin.setOptions({
 *   type: 'pattern',
 *   patternType: 'dots',
 *   color: '#cccccc',
 *   backgroundColor: '#ffffff',
 *   size: 2,
 *   spacing: 20
 * });
 * ```
 * 
 * @example
 * ```typescript
 * const canvas = new Canvas({
 *   container,
 *   width: container.clientWidth || 800,
 *   height: container.clientHeight || 600,
 *   behavior: 'default',
 *   plugins: [
 *     {
 *       plugin: 'background',
 *       key: 'bg',
 *       options: {
 *         type: 'solid',
 *         color: '#202020',
 *       },
 *     }
 *   ],  
 * });
 * ```
 */

import { Container, Graphics } from 'pixi.js';
import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import type { BackgroundStyle } from '../types';
import { PluginRegistry } from './registry';

export class BackgroundPlugin implements CanvasPlugin {
  readonly id = 'background';

  getLayers() {
    // Note: We manually attach to stage in init() instead of using LayerManager
    return [];
  }

  private _canvas: Canvas | null = null;
  private _backgroundLayer: Container | null = null;
  private _graphics: Graphics | null = null;
  private _currentStyle: BackgroundStyle | null = null;
  private _width: number = 0;
  private _height: number = 0;
  private _lastViewportX: number = 0;
  private _lastViewportY: number = 0;
  private _lastViewportZoom: number = 1;

  /**
   * Initialize plugin
   */
  async init(canvas: Canvas): Promise<void> {
    this._canvas = canvas;
    this._width = canvas.width;
    this._height = canvas.height;

    // Create background layer and attach directly to stage (not viewport)
    // This ensures it doesn't pan/zoom with content by default
    this._backgroundLayer = new Container();
    this._backgroundLayer.label = 'background';
    this._backgroundLayer.zIndex = -1000; // Behind everything
    
    // Add to stage, not viewport.content
    canvas.app!.stage.addChildAt(this._backgroundLayer, 0);

    this._graphics = new Graphics();
    this._graphics.label = 'background-graphics';
    this._backgroundLayer.addChild(this._graphics);

    // Listen to PixiJS ticker for viewport changes when in follow mode
    // This way the plugin listens directly to the render loop, no custom events needed
    if (canvas.viewport) {
      this._lastViewportX = -canvas.viewport.x;
      this._lastViewportY = -canvas.viewport.y;
      this._lastViewportZoom = canvas.viewport.scaled;
    }

    canvas.app!.ticker.add(this.onTick, this);
  }

  /**
   * Check for viewport changes on each frame
   */
  private onTick(): void {
    if (!this._canvas?.viewport || !this._currentStyle) return;
    if (this._currentStyle.type !== 'pattern' || !this._currentStyle.follow) return;

    const viewport = this._canvas.viewport;
    const currentX = -viewport.x;
    const currentY = -viewport.y;
    const currentZoom = viewport.scaled;

    // Only re-render if viewport changed
    if (
      currentX !== this._lastViewportX ||
      currentY !== this._lastViewportY ||
      currentZoom !== this._lastViewportZoom
    ) {
      this._lastViewportX = currentX;
      this._lastViewportY = currentY;
      this._lastViewportZoom = currentZoom;
      this.render(this._currentStyle);
    }
  }

  /**
   * Set background style
   */
  setOptions(style: BackgroundStyle): void {
    if (!this._canvas || !this._graphics) {
      throw new Error('BackgroundPlugin not initialized');
    }

    this._currentStyle = style;

    // For solid colors, use PixiJS canvas background
    if (style.type === 'solid') {
      const color = typeof style.color === 'string' 
        ? parseInt(style.color.replace('#', ''), 16) 
        : style.color;
      this._canvas.app!.renderer.background.color = color;
      this._canvas.app!.renderer.background.alpha = style.alpha ?? 1;
      this._graphics.clear();
      return;
    }

    // For gradients and patterns, draw on layer
    this._canvas.app!.renderer.background.color = 0x000000;
    this._canvas.app!.renderer.background.alpha = 0;
    
    this.render(style);
  }

  /**
   * Clear background
   */
  clear(): void {
    if (!this._graphics || !this._canvas) return;
    
    this._graphics.clear();
    this._currentStyle = null;
    
    // Restore default background
    if (this._canvas.app) {
      this._canvas.app.renderer.background.color = '#ffffff';
      this._canvas.app.renderer.background.alpha = 1;
    }
  }

  /**
   * Update dimensions
   */
  resize(width: number, height: number): void {
    this._width = width;
    this._height = height;
    if (this._currentStyle) {
      this.render(this._currentStyle);
    }
  }

  /**
   * Render background
   */
  private render(style: BackgroundStyle): void {
    if (!this._graphics) return;

    this._graphics.clear();

    switch (style.type) {
      case 'gradient':
        this.renderGradient(style);
        break;
      case 'pattern':
        this.renderPattern(style);
        break;
    }
  }

  /**
   * Render gradient
   */
  private renderGradient(style: BackgroundStyle & { type: 'gradient' }): void {
    if (!this._graphics) return;

    const alpha = style.alpha ?? 1;
    
    // Convert color strings to numbers
    const colorStops = style.colors.map(c => ({
      offset: c.offset,
      color: typeof c.color === 'string' 
        ? parseInt(c.color.replace('#', ''), 16)
        : c.color
    }));

    if (style.gradientType === 'linear') {
      this.renderLinearGradient(colorStops, style as typeof style & { gradientType: 'linear' }, alpha);
    } else {
      this.renderRadialGradient(colorStops, style as typeof style & { gradientType: 'radial' }, alpha);
    }
  }

  /**
   * Render linear gradient
   */
  private renderLinearGradient(
    colorStops: Array<{ color: number; offset: number }>,
    style: BackgroundStyle & { type: 'gradient'; gradientType: 'linear' },
    alpha: number
  ): void {
    if (!this._graphics) return;

    let x0: number, y0: number, x1: number, y1: number;

    if (style.start && style.end) {
      x0 = style.start.x;
      y0 = style.start.y;
      x1 = style.end.x;
      y1 = style.end.y;
    } else {
      const angle = (style.angle ?? 0) * Math.PI / 180;
      const centerX = this._width / 2;
      const centerY = this._height / 2;
      const diagonal = Math.sqrt(this._width ** 2 + this._height ** 2) / 2;

      x0 = centerX - Math.cos(angle) * diagonal;
      y0 = centerY - Math.sin(angle) * diagonal;
      x1 = centerX + Math.cos(angle) * diagonal;
      y1 = centerY + Math.sin(angle) * diagonal;
    }

    // Render gradient using interpolated colors
    for (let i = 0; i < colorStops.length - 1; i++) {
      const currentStop = colorStops[i]!;
      const nextStop = colorStops[i + 1]!;
      
      const steps = 20;
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const nextT = (j + 1) / steps;
        
        const r = ((currentStop.color >> 16) & 0xFF) * (1 - t) + ((nextStop.color >> 16) & 0xFF) * t;
        const g = ((currentStop.color >> 8) & 0xFF) * (1 - t) + ((nextStop.color >> 8) & 0xFF) * t;
        const b = (currentStop.color & 0xFF) * (1 - t) + (nextStop.color & 0xFF) * t;
        const color = (r << 16) | (g << 8) | b;
        
        const px1 = x0 + (x1 - x0) * (currentStop.offset + (nextStop.offset - currentStop.offset) * t);
        const py1 = y0 + (y1 - y0) * (currentStop.offset + (nextStop.offset - currentStop.offset) * t);
        const px2 = x0 + (x1 - x0) * (currentStop.offset + (nextStop.offset - currentStop.offset) * nextT);
        const py2 = y0 + (y1 - y0) * (currentStop.offset + (nextStop.offset - currentStop.offset) * nextT);
        
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / len * Math.max(this._width, this._height);
        const perpY = dx / len * Math.max(this._width, this._height);
        
        this._graphics.poly([
          px1 - perpX, py1 - perpY,
          px1 + perpX, py1 + perpY,
          px2 + perpX, py2 + perpY,
          px2 - perpX, py2 - perpY,
        ]);
        this._graphics.fill({ color, alpha });
      }
    }
  }

  /**
   * Render radial gradient
   */
  private renderRadialGradient(
    colorStops: Array<{ color: number; offset: number }>,
    style: BackgroundStyle & { type: 'gradient'; gradientType: 'radial' },
    alpha: number
  ): void {
    if (!this._graphics) return;

    const centerX = style.center?.x ?? this._width / 2;
    const centerY = style.center?.y ?? this._height / 2;
    const radius = style.radius ?? Math.sqrt(this._width ** 2 + this._height ** 2) / 2;

    for (let i = 0; i < colorStops.length - 1; i++) {
      const currentStop = colorStops[i]!;
      const nextStop = colorStops[i + 1]!;
      
      const steps = 20;
      for (let j = 0; j < steps; j++) {
        const t = j / steps;
        const nextT = (j + 1) / steps;
        
        const r = ((currentStop.color >> 16) & 0xFF) * (1 - t) + ((nextStop.color >> 16) & 0xFF) * t;
        const g = ((currentStop.color >> 8) & 0xFF) * (1 - t) + ((nextStop.color >> 8) & 0xFF) * t;
        const b = (currentStop.color & 0xFF) * (1 - t) + (nextStop.color & 0xFF) * t;
        const color = (r << 16) | (g << 8) | b;
        
        const outerRadius = radius * (currentStop.offset + (nextStop.offset - currentStop.offset) * nextT);
        
        this._graphics.circle(centerX, centerY, outerRadius);
        this._graphics.fill({ color, alpha });
      }
    }
  }

  /**
   * Render pattern
   */
  private renderPattern(style: BackgroundStyle & { type: 'pattern' }): void {
    if (!this._graphics || !this._canvas) return;

    const color = typeof style.color === 'string'
      ? parseInt(style.color.replace('#', ''), 16)
      : style.color;
    
    const backgroundColor = style.backgroundColor
      ? typeof style.backgroundColor === 'string'
        ? parseInt(style.backgroundColor.replace('#', ''), 16)
        : style.backgroundColor
      : 0xffffff;

    const alpha = style.alpha ?? 1;
    const backgroundAlpha = style.backgroundAlpha ?? 1;
    const follow = style.follow ?? false;

    // Calculate offset and scale based on viewport if follow mode is enabled
    let offsetX = 0;
    let offsetY = 0;
    let scale = 1;

    if (follow) {
      const viewport = this._canvas.viewport;
      if (viewport) {
        // Use content position (which is negative when panned)
        offsetX = -viewport.x;
        offsetY = -viewport.y;
        scale = viewport.scaled;
      }
    }

    // Draw background
    this._graphics.rect(0, 0, this._width, this._height);
    this._graphics.fill({ color: backgroundColor, alpha: backgroundAlpha });

    // Draw pattern with viewport offset
    switch (style.patternType) {
      case 'dots':
        this.renderDotsPattern(color, alpha, style as typeof style & { patternType: 'dots' }, offsetX, offsetY, scale);
        break;
      case 'grid':
        this.renderGridPattern(color, alpha, style as typeof style & { patternType: 'grid' }, offsetX, offsetY, scale);
        break;
      case 'cross':
        this.renderCrossPattern(color, alpha, style as typeof style & { patternType: 'cross' }, offsetX, offsetY, scale);
        break;
      case 'lines':
        this.renderLinesPattern(color, alpha, style as typeof style & { patternType: 'lines' }, offsetX, offsetY, scale);
        break;
    }
  }

  private renderDotsPattern(
    color: number, 
    alpha: number, 
    style: BackgroundStyle & { type: 'pattern'; patternType: 'dots' },
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    if (!this._graphics) return;
    const size = (style.size ?? 2) * scale;
    const spacing = (style.spacing ?? 20) * scale;

    // Calculate world-space offset (where the pattern origin is in world coordinates)
    // Then convert to screen space for rendering
    const worldOffsetX = offsetX / scale;
    const worldOffsetY = offsetY / scale;
    const worldSpacing = style.spacing ?? 20;
    
    // Find the starting position in world space, then convert to screen
    const startWorldX = Math.floor(worldOffsetX / worldSpacing) * worldSpacing;
    const startWorldY = Math.floor(worldOffsetY / worldSpacing) * worldSpacing;
    
    const startX = (startWorldX - worldOffsetX) * scale;
    const startY = (startWorldY - worldOffsetY) * scale;

    for (let x = startX; x < this._width + spacing; x += spacing) {
      for (let y = startY; y < this._height + spacing; y += spacing) {
        this._graphics.circle(x, y, size);
        this._graphics.fill({ color, alpha });
      }
    }
  }

  private renderGridPattern(
    color: number, 
    alpha: number, 
    style: BackgroundStyle & { type: 'pattern'; patternType: 'grid' },
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    if (!this._graphics) return;
    const spacing = (style.spacing ?? 20) * scale;
    const lineWidth = (style.lineWidth ?? 1) * scale;

    this._graphics.setStrokeStyle({ width: lineWidth, color, alpha });

    // Calculate world-space offset and starting position
    const worldOffsetX = offsetX / scale;
    const worldOffsetY = offsetY / scale;
    const worldSpacing = style.spacing ?? 20;
    
    const startWorldX = Math.floor(worldOffsetX / worldSpacing) * worldSpacing;
    const startWorldY = Math.floor(worldOffsetY / worldSpacing) * worldSpacing;
    
    const startX = (startWorldX - worldOffsetX) * scale;
    const startY = (startWorldY - worldOffsetY) * scale;

    for (let x = startX; x < this._width + spacing; x += spacing) {
      this._graphics.moveTo(x, 0);
      this._graphics.lineTo(x, this._height);
    }

    for (let y = startY; y < this._height + spacing; y += spacing) {
      this._graphics.moveTo(0, y);
      this._graphics.lineTo(this._width, y);
    }

    this._graphics.stroke();
  }

  private renderCrossPattern(
    color: number, 
    alpha: number, 
    style: BackgroundStyle & { type: 'pattern'; patternType: 'cross' },
    offsetX: number,
    offsetY: number,
    scale: number
  ): void {
    if (!this._graphics) return;
    const size = (style.size ?? 5) * scale;
    const spacing = (style.spacing ?? 20) * scale;
    const lineWidth = (style.lineWidth ?? 1) * scale;

    this._graphics.setStrokeStyle({ width: lineWidth, color, alpha });

    // Calculate world-space offset and starting position
    const worldOffsetX = offsetX / scale;
    const worldOffsetY = offsetY / scale;
    const worldSpacing = style.spacing ?? 20;
    
    const startWorldX = Math.floor(worldOffsetX / worldSpacing) * worldSpacing;
    const startWorldY = Math.floor(worldOffsetY / worldSpacing) * worldSpacing;
    
    const startX = (startWorldX - worldOffsetX) * scale;
    const startY = (startWorldY - worldOffsetY) * scale;

    for (let x = startX; x < this._width + spacing; x += spacing) {
      for (let y = startY; y < this._height + spacing; y += spacing) {
        this._graphics.moveTo(x - size, y);
        this._graphics.lineTo(x + size, y);
        this._graphics.moveTo(x, y - size);
        this._graphics.lineTo(x, y + size);
      }
    }

    this._graphics.stroke();
  }

  private renderLinesPattern(
    color: number, 
    alpha: number, 
    style: BackgroundStyle & { type: 'pattern'; patternType: 'lines' },
    offsetX: number,
    _offsetY: number, // Unused but kept for consistency
    scale: number
  ): void {
    if (!this._graphics) return;
    const spacing = (style.spacing ?? 10) * scale;
    const lineWidth = (style.lineWidth ?? 1) * scale;

    this._graphics.setStrokeStyle({ width: lineWidth, color, alpha });

    // Calculate world-space offset and starting position
    const worldOffsetX = offsetX / scale;
    const worldSpacing = style.spacing ?? 10;
    const startWorldX = Math.floor(worldOffsetX / worldSpacing) * worldSpacing;
    const startX = (startWorldX - worldOffsetX) * scale;

    for (let offset = startX - this._height; offset < this._width + this._height; offset += spacing) {
      this._graphics.moveTo(offset, 0);
      this._graphics.lineTo(offset + this._height, this._height);
    }

    this._graphics.stroke();
  }

  /**
   * Get current background style
   */
  get currentStyle(): BackgroundStyle | null {
    return this._currentStyle;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    // Remove ticker listener
    if (this._canvas?.app) {
      this._canvas.app.ticker.remove(this.onTick, this);
    }

    if (this._backgroundLayer && this._canvas?.app) {
      this._canvas.app.stage.removeChild(this._backgroundLayer);
    }
    this._graphics?.destroy();
    this._backgroundLayer?.destroy();
    this._graphics = null;
    this._backgroundLayer = null;
    this._canvas = null;
    this._currentStyle = null;
  }
}

// Auto-register plugin
PluginRegistry.register('background', BackgroundPlugin);

