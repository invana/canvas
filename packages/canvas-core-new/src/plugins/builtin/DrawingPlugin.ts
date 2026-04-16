import { Graphics, Text, TextStyle } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { CanvasPlugin, PluginContext } from '../types.js';
import {
  drawCircle,
  drawRect,
  drawEllipse,
  drawPolygon,
  drawStar,
  drawLine,
  drawBezier,
  drawAutoBezier,
  drawDashedCircle,
  drawDottedCircle,
  drawDashedRect,
  drawDottedRect,
  drawDashedLine,
  drawDottedLine,
  drawOrthogonalPath,
  drawRoundedOrthogonalPath,
  drawTriangleArrow,
  drawTriangleOutlineArrow,
  drawThinTriangleArrow,
  drawDiamondArrow,
  drawDiamondOutlineArrow,
  drawSquareArrow,
  drawSquareOutlineArrow,
  drawCircleArrow,
  drawCircleOutlineArrow,
  drawCircleGlow,
  drawRectGlow,
  drawSelectionHighlight,
  drawRippleRing,
  drawRippleEffect,
} from '../../graphics-utils/index.js';
import type { DrawStyle, PathStyle } from '../../graphics-utils/types.js';
import type { BezierPoint } from '../../graphics-utils/paths/bezier.js';
import type { DashStyle } from '../../graphics-utils/shapes/dashed.js';
import type { OrthogonalParams, OrthogonalStyle } from '../../graphics-utils/paths/orthogonal.js';
import type { ArrowStyle, ArrowParams, ArrowType } from '../../graphics-utils/arrows/types.js';
import type { EffectStyle, CircleGlowParams, RectGlowParams, RippleParams } from '../../graphics-utils/effects/index.js';

export type { DrawStyle, PathStyle, BezierPoint, DashStyle, OrthogonalStyle, OrthogonalParams, ArrowStyle, ArrowParams, ArrowType, EffectStyle, CircleGlowParams, RectGlowParams, RippleParams };

export interface DrawingPluginOptions {
  key?: string;
  /** z-index for the drawing layer (default: 10) */
  zIndex?: number;
}

/**
 * DrawingPlugin — a canvas plugin that exposes a clean drawing API.
 * Stories and demos use this to draw shapes without touching PixiJS directly.
 *
 * Usage:
 *   const draw = new DrawingPlugin();
 *   await canvas.plugins.register(draw);
 *   draw.circle(100, 100, 40, { fill: '#3fcbeb', stroke: '#fff', strokeWidth: 2 });
 */
export class DrawingPlugin implements CanvasPlugin {
  readonly id: string;
  private _zIndex: number;
  private _layer!: Container;
  private _g!: Graphics;

  constructor(options: DrawingPluginOptions = {}) {
    this.id = options.key ?? 'drawing';
    this._zIndex = options.zIndex ?? 10;
  }

  register(ctx: PluginContext): void {
    this._layer = ctx.createLayer({ id: `${this.id}-layer`, zIndex: this._zIndex, label: 'Drawing' });
    this._g = new Graphics();
    this._layer.addChild(this._g);
  }

  /** Remove all drawn content. */
  clear(): void {
    this._g.clear();
  }

  // -----------------------------------------------------------------------
  // Shapes
  // -----------------------------------------------------------------------

  circle(x: number, y: number, radius: number, style: DrawStyle = {}): this {
    drawCircle(this._g, x, y, radius, style);
    return this;
  }

  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    style: DrawStyle & { cornerRadius?: number } = {},
  ): this {
    drawRect(this._g, x, y, width, height, style);
    return this;
  }

  ellipse(x: number, y: number, radiusX: number, radiusY: number, style: DrawStyle = {}): this {
    drawEllipse(this._g, x, y, radiusX, radiusY, style);
    return this;
  }

  /**
   * Regular polygon. sides: 3=triangle, 4=diamond, 5=pentagon, 6=hexagon …
   * x,y = center.
   */
  polygon(
    x: number,
    y: number,
    radius: number,
    sides: number,
    style: DrawStyle & { rotation?: number } = {},
  ): this {
    drawPolygon(this._g, x, y, radius, sides, style);
    return this;
  }

  /**
   * Star shape. x,y = center. points = number of star tips.
   */
  star(
    x: number,
    y: number,
    radius: number,
    style: DrawStyle & { points?: number; innerRatio?: number; rotation?: number } = {},
  ): this {
    drawStar(this._g, x, y, radius, style);
    return this;
  }

  // -----------------------------------------------------------------------
  // Paths
  // -----------------------------------------------------------------------

  line(x1: number, y1: number, x2: number, y2: number, style: PathStyle = {}): this {
    drawLine(this._g, x1, y1, x2, y2, style);
    return this;
  }

  bezier(
    from: BezierPoint,
    cp1: BezierPoint,
    to: BezierPoint,
    style: PathStyle = {},
    cp2?: BezierPoint,
  ): this {
    drawBezier(this._g, from, cp1, to, style, cp2);
    return this;
  }

  autoBezier(
    from: BezierPoint,
    to: BezierPoint,
    style: PathStyle = {},
    curvature = 80,
  ): this {
    drawAutoBezier(this._g, from, to, style, curvature);
    return this;
  }

  // -----------------------------------------------------------------------
  // Dashed / dotted strokes
  // -----------------------------------------------------------------------

  dashedCircle(x: number, y: number, radius: number, style: DashStyle = {}): this {
    drawDashedCircle(this._g, x, y, radius, style);
    return this;
  }

  dottedCircle(x: number, y: number, radius: number, style: DashStyle = {}): this {
    drawDottedCircle(this._g, x, y, radius, style);
    return this;
  }

  dashedRect(x: number, y: number, width: number, height: number, style: DashStyle = {}): this {
    drawDashedRect(this._g, x, y, width, height, style);
    return this;
  }

  dottedRect(x: number, y: number, width: number, height: number, style: DashStyle = {}): this {
    drawDottedRect(this._g, x, y, width, height, style);
    return this;
  }

  dashedLine(x1: number, y1: number, x2: number, y2: number, style: DashStyle = {}): this {
    drawDashedLine(this._g, x1, y1, x2, y2, style);
    return this;
  }

  dottedLine(x1: number, y1: number, x2: number, y2: number, style: DashStyle = {}): this {
    drawDottedLine(this._g, x1, y1, x2, y2, style);
    return this;
  }

  // -----------------------------------------------------------------------
  // Orthogonal paths (right-angle routing)
  // -----------------------------------------------------------------------

  orthogonal(params: OrthogonalParams, style: OrthogonalStyle = {}): this {
    drawOrthogonalPath(this._g, params, style);
    return this;
  }

  roundedOrthogonal(params: OrthogonalParams, style: OrthogonalStyle = {}): this {
    drawRoundedOrthogonalPath(this._g, params, style);
    return this;
  }

  // -----------------------------------------------------------------------
  // Arrow heads
  // -----------------------------------------------------------------------

  /**
   * Draw an arrowhead of the given type.
   * x,y is the arrow tip; angle 0 = pointing right.
   */
  arrowHead(params: ArrowParams, type: ArrowType = 'triangle', style: ArrowStyle = {}): this {
    switch (type) {
      case 'triangle':         drawTriangleArrow(this._g, params, style); break;
      case 'triangleOutline':  drawTriangleOutlineArrow(this._g, params, style); break;
      case 'thinTriangle':     drawThinTriangleArrow(this._g, params, style); break;
      case 'diamond':          drawDiamondArrow(this._g, params, style); break;
      case 'diamondOutline':   drawDiamondOutlineArrow(this._g, params, style); break;
      case 'square':           drawSquareArrow(this._g, params, style); break;
      case 'squareOutline':    drawSquareOutlineArrow(this._g, params, style); break;
      case 'circle':           drawCircleArrow(this._g, params, style); break;
      case 'circleOutline':    drawCircleOutlineArrow(this._g, params, style); break;
    }
    return this;
  }

  // -----------------------------------------------------------------------
  // Effects — glow & ripple
  // -----------------------------------------------------------------------

  circleGlow(params: CircleGlowParams, style: EffectStyle): this {
    drawCircleGlow(this._g, params, style);
    return this;
  }

  rectGlow(params: RectGlowParams, style: EffectStyle): this {
    drawRectGlow(this._g, params, style);
    return this;
  }

  selectionHighlight(
    x: number,
    y: number,
    width: number,
    height: number,
    style: EffectStyle,
    cornerRadius = 0,
  ): this {
    drawSelectionHighlight(this._g, { x, y, width, height, cornerRadius }, style);
    return this;
  }

  rippleRing(x: number, y: number, radius: number, style: EffectStyle): this {
    drawRippleRing(this._g, x, y, radius, style);
    return this;
  }

  ripple(params: RippleParams, style: EffectStyle): this {
    drawRippleEffect(this._g, params, style);
    return this;
  }

  // -----------------------------------------------------------------------
  // Text label
  // -----------------------------------------------------------------------

  label(
    text: string,
    x: number,
    y: number,
    style: { color?: string | number; fontSize?: number; align?: 'left' | 'center' | 'right' } = {},
  ): this {
    const { color = '#ffffff', fontSize = 12, align = 'center' } = style;
    const t = new Text({
      text,
      style: new TextStyle({
        fill: color,
        fontSize,
        align,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }),
      resolution: Math.min(window.devicePixelRatio, 2),
    });
    t.anchor.set(align === 'center' ? 0.5 : 0, 0);
    t.position.set(x, y);
    this._layer.addChild(t);
    return this;
  }

  destroy(): void {
    this._g.destroy();
  }
}
