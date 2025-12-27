/**
 * BackgroundPlugin - Adds customizable background patterns and fills
 * 
 * Supports:
 * - Solid colors
 * - Linear and radial gradients
 * - Patterns: dots, grid, cross (like ReactFlow)
 */

import { Graphics, FillGradient } from 'pixi.js';
import type { CanvasPlugin } from './types';
import type { Canvas } from '../core/Canvas';

/**
 * Background fill types
 */
export type BackgroundFillType = 'solid' | 'linear-gradient' | 'radial-gradient';

/**
 * Background pattern types
 */
export type BackgroundPatternType = 'dots' | 'grid' | 'cross' | 'none';

/**
 * Gradient stop configuration
 */
export interface GradientStop {
  /** Position of the stop (0-1) */
  offset: number;
  /** Color at this stop */
  color: string | number;
}

/**
 * Linear gradient configuration
 */
export interface LinearGradientConfig {
  /** Start X (0-1, relative to canvas width) */
  x0: number;
  /** Start Y (0-1, relative to canvas height) */
  y0: number;
  /** End X (0-1, relative to canvas width) */
  x1: number;
  /** End Y (0-1, relative to canvas height) */
  y1: number;
  /** Color stops */
  stops: GradientStop[];
}

/**
 * Radial gradient configuration
 */
export interface RadialGradientConfig {
  /** Center X (0-1, relative to canvas width) */
  cx: number;
  /** Center Y (0-1, relative to canvas height) */
  cy: number;
  /** Radius (0-1, relative to canvas diagonal) */
  radius: number;
  /** Color stops */
  stops: GradientStop[];
}

/**
 * Background configuration
 */
export interface BackgroundConfig {
  /** Fill type */
  fillType?: BackgroundFillType;
  /** Solid fill color (when fillType is 'solid') */
  fillColor?: string | number;
  /** Fill opacity */
  fillAlpha?: number;
  /** Linear gradient config (when fillType is 'linear-gradient') */
  linearGradient?: LinearGradientConfig;
  /** Radial gradient config (when fillType is 'radial-gradient') */
  radialGradient?: RadialGradientConfig;
  /** Pattern type */
  patternType?: BackgroundPatternType;
  /** Pattern color */
  patternColor?: string | number;
  /** Pattern opacity */
  patternAlpha?: number;
  /** Pattern size/spacing */
  patternSize?: number;
  /** Pattern line width (for grid and cross) */
  patternLineWidth?: number;
  /** Dot size (for dots pattern) */
  dotSize?: number;
}

/**
 * Background Plugin - adds customizable backgrounds to canvas
 */
export class BackgroundPlugin implements CanvasPlugin {
  public readonly id = 'background';
  public readonly name = 'Background Plugin';
  public readonly version = '1.0.0';
  public readonly layerGroups = [];

  private canvas: Canvas | null = null;
  private backgroundGraphics: Graphics | null = null;
  private patternGraphics: Graphics | null = null;
  private config: BackgroundConfig = {
    fillType: 'solid',
    fillColor: '#ffffff',
    fillAlpha: 1,
    patternType: 'none',
    patternColor: '#e0e0e0',
    patternAlpha: 1,
    patternSize: 20,
    patternLineWidth: 1,
    dotSize: 2,
  };

  /**
   * Initialize the plugin
   */
  async init(canvas: Canvas): Promise<void> {
    this.canvas = canvas;
    
    // Create graphics for background
    this.backgroundGraphics = new Graphics();
    this.backgroundGraphics.label = 'background-fill';
    
    this.patternGraphics = new Graphics();
    this.patternGraphics.label = 'background-pattern';

    // Add to background layer
    if (canvas.backgroundLayer) {
      canvas.backgroundLayer.addChild(this.backgroundGraphics);
      canvas.backgroundLayer.addChild(this.patternGraphics);
    }

    // Initial render
    this.render();
  }

  /**
   * Destroy the plugin
   */
  destroy(): void {
    this.backgroundGraphics?.destroy();
    this.patternGraphics?.destroy();
    this.backgroundGraphics = null;
    this.patternGraphics = null;
    this.canvas = null;
  }

  /**
   * Update background configuration
   */
  updateConfig(config: Partial<BackgroundConfig>): void {
    this.config = { ...this.config, ...config };
    this.render();
  }

  /**
   * Get current configuration
   */
  getConfig(): BackgroundConfig {
    return { ...this.config };
  }

  /**
   * Render the background
   */
  private render(): void {
    if (!this.canvas || !this.backgroundGraphics || !this.patternGraphics) {
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear previous graphics
    this.backgroundGraphics.clear();
    this.patternGraphics.clear();

    // Render fill
    this.renderFill(width, height);

    // Render pattern
    this.renderPattern(width, height);
  }

  /**
   * Render background fill (solid or gradient)
   */
  private renderFill(width: number, height: number): void {
    if (!this.backgroundGraphics) return;

    const { fillType, fillColor, fillAlpha, linearGradient, radialGradient } = this.config;

    this.backgroundGraphics.rect(0, 0, width, height);

    if (fillType === 'linear-gradient' && linearGradient) {
      const gradient = new FillGradient(
        linearGradient.x0 * width,
        linearGradient.y0 * height,
        linearGradient.x1 * width,
        linearGradient.y1 * height
      );

      linearGradient.stops.forEach(stop => {
        gradient.addColorStop(stop.offset, stop.color);
      });

      this.backgroundGraphics.fill({ fill: gradient, alpha: fillAlpha ?? 1 });
    } else if (fillType === 'radial-gradient' && radialGradient) {
      const diagonal = Math.sqrt(width * width + height * height);
      const gradient = new FillGradient(
        radialGradient.cx * width,
        radialGradient.cy * height,
        radialGradient.radius * diagonal
      );

      radialGradient.stops.forEach(stop => {
        gradient.addColorStop(stop.offset, stop.color);
      });

      this.backgroundGraphics.fill({ fill: gradient, alpha: fillAlpha ?? 1 });
    } else {
      // Solid fill
      this.backgroundGraphics.fill({
        color: fillColor ?? '#ffffff',
        alpha: fillAlpha ?? 1,
      });
    }
  }

  /**
   * Render background pattern
   */
  private renderPattern(width: number, height: number): void {
    if (!this.patternGraphics) return;

    const { patternType, patternColor, patternAlpha, patternSize, patternLineWidth, dotSize } = this.config;

    if (patternType === 'none') {
      return;
    }

    const size = patternSize ?? 20;
    const color = patternColor ?? '#e0e0e0';
    const alpha = patternAlpha ?? 1;
    const lineWidth = patternLineWidth ?? 1;

    switch (patternType) {
      case 'dots':
        this.renderDotPattern(width, height, size, dotSize ?? 2, color, alpha);
        break;
      case 'grid':
        this.renderGridPattern(width, height, size, lineWidth, color, alpha);
        break;
      case 'cross':
        this.renderCrossPattern(width, height, size, lineWidth, color, alpha);
        break;
    }
  }

  /**
   * Render dot pattern
   */
  private renderDotPattern(
    width: number,
    height: number,
    spacing: number,
    dotSize: number,
    color: string | number,
    alpha: number
  ): void {
    if (!this.patternGraphics) return;

    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing;
        const y = j * spacing;
        
        this.patternGraphics.circle(x, y, dotSize);
      }
    }

    this.patternGraphics.fill({ color, alpha });
  }

  /**
   * Render grid pattern
   */
  private renderGridPattern(
    width: number,
    height: number,
    spacing: number,
    lineWidth: number,
    color: string | number,
    alpha: number
  ): void {
    if (!this.patternGraphics) return;

    // Vertical lines
    const cols = Math.ceil(width / spacing) + 1;
    for (let i = 0; i < cols; i++) {
      const x = i * spacing;
      this.patternGraphics.moveTo(x, 0);
      this.patternGraphics.lineTo(x, height);
    }

    // Horizontal lines
    const rows = Math.ceil(height / spacing) + 1;
    for (let j = 0; j < rows; j++) {
      const y = j * spacing;
      this.patternGraphics.moveTo(0, y);
      this.patternGraphics.lineTo(width, y);
    }

    this.patternGraphics.stroke({ color, width: lineWidth, alpha });
  }

  /**
   * Render cross pattern
   */
  private renderCrossPattern(
    width: number,
    height: number,
    spacing: number,
    lineWidth: number,
    color: string | number,
    alpha: number
  ): void {
    if (!this.patternGraphics) return;

    const cols = Math.ceil(width / spacing) + 1;
    const rows = Math.ceil(height / spacing) + 1;
    const crossSize = spacing * 0.2; // Cross size relative to spacing

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const x = i * spacing;
        const y = j * spacing;

        // Vertical line of cross
        this.patternGraphics.moveTo(x, y - crossSize);
        this.patternGraphics.lineTo(x, y + crossSize);

        // Horizontal line of cross
        this.patternGraphics.moveTo(x - crossSize, y);
        this.patternGraphics.lineTo(x + crossSize, y);
      }
    }

    this.patternGraphics.stroke({ color, width: lineWidth, alpha });
  }

  /**
   * Set solid background
   */
  setSolidBackground(color: string | number, alpha: number = 1): void {
    this.updateConfig({
      fillType: 'solid',
      fillColor: color,
      fillAlpha: alpha,
    });
  }

  /**
   * Set linear gradient background
   */
  setLinearGradient(gradient: LinearGradientConfig, alpha: number = 1): void {
    this.updateConfig({
      fillType: 'linear-gradient',
      linearGradient: gradient,
      fillAlpha: alpha,
    });
  }

  /**
   * Set radial gradient background
   */
  setRadialGradient(gradient: RadialGradientConfig, alpha: number = 1): void {
    this.updateConfig({
      fillType: 'radial-gradient',
      radialGradient: gradient,
      fillAlpha: alpha,
    });
  }

  /**
   * Set pattern
   */
  setPattern(
    type: BackgroundPatternType,
    options?: {
      color?: string | number;
      alpha?: number;
      size?: number;
      lineWidth?: number;
      dotSize?: number;
    }
  ): void {
    this.updateConfig({
      patternType: type,
      patternColor: options?.color,
      patternAlpha: options?.alpha,
      patternSize: options?.size,
      patternLineWidth: options?.lineWidth,
      dotSize: options?.dotSize,
    });
  }

  /**
   * Clear pattern
   */
  clearPattern(): void {
    this.updateConfig({ patternType: 'none' });
  }
}
