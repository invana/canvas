/**
 * ArrowRenderer - Renders arrow heads for edges
 * Supports multiple arrow types with customizable styling
 */

import { Graphics } from 'pixi.js';
import type { ArrowHeadConfig, ArrowHeadType } from '../../types/index.js';

export interface ArrowRenderOptions {
  x: number;           // Position x
  y: number;           // Position y
  angle: number;       // Angle in radians (direction arrow points)
  size: number;        // Overall size
  width?: number;      // Width override
  height?: number;     // Height override
  fill?: string;       // Fill color
  stroke?: string;     // Stroke color (for open arrows)
  strokeWidth?: number; // Stroke width
}

/**
 * Normalize arrow config - convert string type to full config
 */
export function normalizeArrowConfig(
  config: ArrowHeadConfig | ArrowHeadType | null | undefined,
  defaultFill: string = '#666666',
): ArrowHeadConfig | null {
  if (!config || config === 'none') return null;

  if (typeof config === 'string') {
    return {
      type: config,
      size: 10,
      fill: defaultFill,
    };
  }

  return {
    size: 10,
    fill: defaultFill,
    ...config,
  };
}

/**
 * ArrowRenderer singleton for rendering arrow heads
 */
export class ArrowRenderer {
  private static _instance: ArrowRenderer | null = null;

  private constructor() {}

  static getInstance(): ArrowRenderer {
    if (!ArrowRenderer._instance) {
      ArrowRenderer._instance = new ArrowRenderer();
    }
    return ArrowRenderer._instance;
  }

  /**
   * Draw an arrow head on a graphics object
   */
  draw(graphics: Graphics, config: ArrowHeadConfig, options: ArrowRenderOptions): void {
    const type = config.type;
    if (type === 'none') return;

    const opts: ArrowRenderOptions = {
      ...options,
      size: config.size ?? options.size,
      width: config.width ?? options.width,
      height: config.height ?? options.height,
      fill: config.fill ?? options.fill,
      stroke: config.stroke ?? options.stroke,
      strokeWidth: config.strokeWidth ?? options.strokeWidth ?? 1,
    };

    switch (type) {
      case 'triangle':
        this._drawTriangle(graphics, opts, true);
        break;
      case 'triangleOpen':
        this._drawTriangle(graphics, opts, false);
        break;
      case 'circle':
        this._drawCircle(graphics, opts, true);
        break;
      case 'circleOpen':
        this._drawCircle(graphics, opts, false);
        break;
      case 'diamond':
        this._drawDiamond(graphics, opts, true);
        break;
      case 'diamondOpen':
        this._drawDiamond(graphics, opts, false);
        break;
      case 'vee':
        this._drawVee(graphics, opts);
        break;
      case 'rect':
        this._drawRect(graphics, opts, true);
        break;
      case 'rectOpen':
        this._drawRect(graphics, opts, false);
        break;
      case 'triangleRect':
        this._drawTriangleRect(graphics, opts);
        break;
      case 'simple':
        this._drawSimple(graphics, opts);
        break;
    }
  }

  /**
   * Get the length of an arrow (for offset calculations)
   */
  getArrowLength(config: ArrowHeadConfig): number {
    const size = config.size ?? 10;
    const height = config.height ?? size;

    switch (config.type) {
      case 'none':
        return 0;
      case 'circle':
      case 'circleOpen':
        return size; // Diameter
      case 'triangle':
      case 'triangleOpen':
      case 'vee':
        return height;
      case 'diamond':
      case 'diamondOpen':
        return height;
      case 'rect':
      case 'rectOpen':
        return height * 0.6;
      case 'triangleRect':
        return height + size * 0.4;
      case 'simple':
        return 0;
      default:
        return size;
    }
  }

  // ============================================================================
  // Arrow Drawing Methods
  // ============================================================================

  private _drawTriangle(graphics: Graphics, opts: ArrowRenderOptions, filled: boolean): void {
    const { x, y, angle, size, fill, stroke, strokeWidth } = opts;
    const width = opts.width ?? size * 0.8;
    const height = opts.height ?? size;

    // Calculate triangle points
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Tip of the arrow (at x, y)
    const tipX = x;
    const tipY = y;

    // Base corners (perpendicular to direction)
    const baseX = x - height * cos;
    const baseY = y - height * sin;

    const perpX = -sin * (width / 2);
    const perpY = cos * (width / 2);

    const p1 = { x: tipX, y: tipY };
    const p2 = { x: baseX + perpX, y: baseY + perpY };
    const p3 = { x: baseX - perpX, y: baseY - perpY };

    graphics.moveTo(p1.x, p1.y);
    graphics.lineTo(p2.x, p2.y);
    graphics.lineTo(p3.x, p3.y);
    graphics.closePath();

    if (filled && fill) {
      graphics.fill({ color: fill });
    }
    if (!filled && stroke) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    } else if (filled && stroke && stroke !== fill) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    }
  }

  private _drawCircle(graphics: Graphics, opts: ArrowRenderOptions, filled: boolean): void {
    const { x, y, angle, size, fill, stroke, strokeWidth } = opts;
    const radius = (opts.width ?? size) / 2;

    // Center the circle so its edge touches the line end
    const centerX = x - radius * Math.cos(angle);
    const centerY = y - radius * Math.sin(angle);

    graphics.circle(centerX, centerY, radius);

    if (filled && fill) {
      graphics.fill({ color: fill });
    }
    if (!filled && stroke) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    } else if (filled && stroke && stroke !== fill) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    }
  }

  private _drawDiamond(graphics: Graphics, opts: ArrowRenderOptions, filled: boolean): void {
    const { x, y, angle, size, fill, stroke, strokeWidth } = opts;
    const width = opts.width ?? size * 0.6;
    const height = opts.height ?? size;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Diamond vertices relative to tip
    const tipX = x;
    const tipY = y;
    const midX = x - (height / 2) * cos;
    const midY = y - (height / 2) * sin;
    const backX = x - height * cos;
    const backY = y - height * sin;

    const perpX = -sin * (width / 2);
    const perpY = cos * (width / 2);

    graphics.moveTo(tipX, tipY);
    graphics.lineTo(midX + perpX, midY + perpY);
    graphics.lineTo(backX, backY);
    graphics.lineTo(midX - perpX, midY - perpY);
    graphics.closePath();

    if (filled && fill) {
      graphics.fill({ color: fill });
    }
    if (!filled && stroke) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    } else if (filled && stroke && stroke !== fill) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    }
  }

  private _drawVee(graphics: Graphics, opts: ArrowRenderOptions): void {
    const { x, y, angle, size, stroke, strokeWidth } = opts;
    const width = opts.width ?? size * 0.8;
    const height = opts.height ?? size;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Tip of the arrow
    const tipX = x;
    const tipY = y;

    // Base corners
    const baseX = x - height * cos;
    const baseY = y - height * sin;

    const perpX = -sin * (width / 2);
    const perpY = cos * (width / 2);

    graphics.moveTo(baseX + perpX, baseY + perpY);
    graphics.lineTo(tipX, tipY);
    graphics.lineTo(baseX - perpX, baseY - perpY);

    graphics.stroke({ color: stroke ?? '#666666', width: strokeWidth ?? 2 });
  }

  private _drawRect(graphics: Graphics, opts: ArrowRenderOptions, filled: boolean): void {
    const { x, y, angle, size, fill, stroke, strokeWidth } = opts;
    const width = opts.width ?? size * 0.5;
    const height = opts.height ?? size * 0.6;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Rectangle corners
    const frontX = x;
    const frontY = y;
    const backX = x - height * cos;
    const backY = y - height * sin;

    const perpX = -sin * (width / 2);
    const perpY = cos * (width / 2);

    graphics.moveTo(frontX + perpX, frontY + perpY);
    graphics.lineTo(frontX - perpX, frontY - perpY);
    graphics.lineTo(backX - perpX, backY - perpY);
    graphics.lineTo(backX + perpX, backY + perpY);
    graphics.closePath();

    if (filled && fill) {
      graphics.fill({ color: fill });
    }
    if (!filled && stroke) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    } else if (filled && stroke && stroke !== fill) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    }
  }

  private _drawTriangleRect(graphics: Graphics, opts: ArrowRenderOptions): void {
    const { x, y, angle, size, fill, stroke, strokeWidth } = opts;
    const triWidth = opts.width ?? size * 0.8;
    const triHeight = opts.height ?? size;
    const rectWidth = size * 0.4;
    const rectHeight = size * 0.4;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Draw triangle first
    const tipX = x;
    const tipY = y;
    const triBaseX = x - triHeight * cos;
    const triBaseY = y - triHeight * sin;

    const perpX = -sin * (triWidth / 2);
    const perpY = cos * (triWidth / 2);

    graphics.moveTo(tipX, tipY);
    graphics.lineTo(triBaseX + perpX, triBaseY + perpY);
    graphics.lineTo(triBaseX - perpX, triBaseY - perpY);
    graphics.closePath();
    if (fill) graphics.fill({ color: fill });

    // Draw rect behind triangle
    const rectFrontX = triBaseX - 2 * cos; // Small gap
    const rectFrontY = triBaseY - 2 * sin;
    const rectBackX = rectFrontX - rectHeight * cos;
    const rectBackY = rectFrontY - rectHeight * sin;

    const rectPerpX = -sin * (rectWidth / 2);
    const rectPerpY = cos * (rectWidth / 2);

    graphics.moveTo(rectFrontX + rectPerpX, rectFrontY + rectPerpY);
    graphics.lineTo(rectFrontX - rectPerpX, rectFrontY - rectPerpY);
    graphics.lineTo(rectBackX - rectPerpX, rectBackY - rectPerpY);
    graphics.lineTo(rectBackX + rectPerpX, rectBackY + rectPerpY);
    graphics.closePath();
    if (fill) graphics.fill({ color: fill });

    if (stroke && stroke !== fill) {
      graphics.stroke({ color: stroke, width: strokeWidth });
    }
  }

  private _drawSimple(graphics: Graphics, opts: ArrowRenderOptions): void {
    const { x, y, angle, stroke, strokeWidth } = opts;
    const length = 4;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Just a short line perpendicular to the edge
    const perpX = -sin * length;
    const perpY = cos * length;

    graphics.moveTo(x + perpX, y + perpY);
    graphics.lineTo(x - perpX, y - perpY);
    graphics.stroke({ color: stroke ?? '#666666', width: strokeWidth ?? 2 });
  }
}

// Export singleton getter
export const getArrowRenderer = (): ArrowRenderer => ArrowRenderer.getInstance();
