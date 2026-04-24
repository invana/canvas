// ── DrawContext (element-plugin) ───────────────────────────────────────────────
// Re-exports the DrawContext interface from the shared drawing module and
// provides the PixiJS-backed PixiDrawContext implementation (internal only).

import { Graphics, Text, TextStyle } from 'pixi.js';
import type { Container } from 'pixi.js';
import {
  drawCircle,
  drawRect,
  drawEllipse,
  drawPolygon,
  drawStar,
} from '../../../graphics-utils/shapes/index.js';
import {
  drawTriangleArrow,
  drawTriangleOutlineArrow,
  drawDiamondArrow,
  drawDiamondOutlineArrow,
  drawCircleArrow,
  drawCircleOutlineArrow,
  drawSquareArrow,
  drawSquareOutlineArrow,
  drawClassicArrow,
  drawBlockArrow,
  drawEllipseArrow,
  drawCrossArrow,
  drawAsyncArrow,
  drawCirclePlusArrow,
} from '../../../graphics-utils/arrows/index.js';
import type { DrawStyle, PathStyle } from '../../../graphics-utils/types.js';
import type { DrawContext, PathCommand } from '../../../drawing/DrawContext.js';
import type { Point } from './spec/index.js';

// Re-export so element files can keep their existing import path.
export type { DrawContext };

// ── PixiJS-backed implementation ──────────────────────────────────────────────

/**
 * Concrete {@link DrawContext} implementation backed by a PixiJS `Graphics` + `Container`.
 *
 * @remarks
 * One `PixiDrawContext` is created per `ElementObject` and lives for the element's
 * lifetime.  Call {@link reset} at the start of each draw cycle to clear the
 * previous frame's geometry.  `Text` children are removed and re-created on each
 * draw to avoid stale labels when text content changes.
 *
 * This class is **internal** to `ElementPlugin` — element authors only use the
 * {@link DrawContext} interface.
 */
export class PixiDrawContext implements DrawContext {
  private _g: Graphics;
  private _container: Container;
  /** Text nodes added during the current draw cycle. Cleared by reset(). */
  private _texts: Text[] = [];

  constructor(g: Graphics, container: Container) {
    this._g = g;
    this._container = container;
  }

  /**
   * Clear Graphics geometry and remove all Text children from the container.
   * Must be called at the start of every `draw()` invocation.
   */
  reset(): void {
    this._g.clear();
    for (const t of this._texts) {
      this._container.removeChild(t);
      t.destroy();
    }
    this._texts = [];
  }

  fillCircle(cx: number, cy: number, r: number, style: DrawStyle): void {
    drawCircle(this._g, cx, cy, r, style);
  }

  fillRect(
    x: number,
    y: number,
    w: number,
    h: number,
    style: DrawStyle & { cornerRadius?: number },
  ): void {
    drawRect(this._g, x, y, w, h, style);
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, style: DrawStyle): void {
    drawEllipse(this._g, cx, cy, rx, ry, style);
  }

  fillPolygon(
    cx: number,
    cy: number,
    radius: number,
    sides: number,
    style: DrawStyle & { rotation?: number },
  ): void {
    drawPolygon(this._g, cx, cy, radius, sides, style);
  }

  fillStar(
    cx: number,
    cy: number,
    radius: number,
    style: DrawStyle & { points?: number; innerRatio?: number; rotation?: number },
  ): void {
    drawStar(this._g, cx, cy, radius, style);
  }

  strokePath(commands: PathCommand[], style: PathStyle): void {
    if (commands.length === 0) return;
    for (const cmd of commands) {
      switch (cmd.cmd) {
        case 'M':
          this._g.moveTo(cmd.x, cmd.y);
          break;
        case 'L':
          this._g.lineTo(cmd.x, cmd.y);
          break;
        case 'C':
          this._g.bezierCurveTo(
            cmd.cp1x, cmd.cp1y,
            cmd.cp2x, cmd.cp2y,
            cmd.x, cmd.y,
          );
          break;
        case 'Q':
          this._g.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y);
          break;
        case 'Z':
          this._g.closePath();
          break;
      }
    }
    this._g.stroke({
      color:  style.stroke      ?? '#999999',
      width:  style.strokeWidth ?? 1,
      alpha:  style.strokeAlpha ?? 1,
    });
  }

  drawArrow(
    tip: Point,
    angle: number,
    type: string,
    size: number,
    color: string,
    alpha = 1,
    extraArgs?: Record<string, unknown>,
  ): void {
    const params = { x: tip.x, y: tip.y, angle, size };
    const style  = { fill: color, fillAlpha: alpha, stroke: color, strokeAlpha: alpha };
    switch (type) {
      case 'triangle':         drawTriangleArrow(this._g, params, style); break;
      case 'triangle-outline': drawTriangleOutlineArrow(this._g, params, style); break;
      case 'diamond':          drawDiamondArrow(this._g, params, style); break;
      case 'diamond-outline':  drawDiamondOutlineArrow(this._g, params, style); break;
      case 'circle':           drawCircleArrow(this._g, params, style); break;
      case 'circle-outline':   drawCircleOutlineArrow(this._g, params, style); break;
      case 'square':           drawSquareArrow(this._g, params, style); break;
      case 'square-outline':   drawSquareOutlineArrow(this._g, params, style); break;
      case 'block':            drawBlockArrow(this._g, params, style); break;
      case 'classic':          drawClassicArrow(this._g, params, style); break;
      case 'cross':            drawCrossArrow(this._g, params, style); break;
      case 'async':            drawAsyncArrow(this._g, params, style); break;
      case 'circle-plus':      drawCirclePlusArrow(this._g, params, style); break;
      case 'ellipse': {
        const rx = extraArgs?.rx as number | undefined;
        const ry = extraArgs?.ry as number | undefined;
        drawEllipseArrow(this._g, params, style, rx, ry);
        break;
      }
      case 'none':             break;
      // custom types are dispatched by BaseConnector via the marker registry
      default:                 break;
    }
  }

  drawLabel(
    text: string,
    x: number,
    y: number,
    style: {
      fontSize?: number;
      fill?: string;
      fontFamily?: string;
      fontWeight?: string;
      align?: 'left' | 'center' | 'right';
    } = {},
  ): void {
    const t = new Text({
      text,
      style: new TextStyle({
        fontSize:   style.fontSize   ?? 12,
        fill:       style.fill       ?? '#ffffff',
        fontFamily: style.fontFamily ?? 'sans-serif',
        fontWeight: (style.fontWeight ?? 'normal') as TextStyle['fontWeight'],
        align:      style.align      ?? 'center',
      }),
    });
    t.anchor.set(0.5, 0.5);
    t.position.set(x, y);
    this._container.addChild(t);
    this._texts.push(t);
  }
}
