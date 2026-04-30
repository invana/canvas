// ── DrawContext (plugins-shapes) ───────────────────────────────────────────────
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
} from '@invana/canvas';
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
} from '@invana/canvas';
import type { DrawStyle, PathStyle } from '@invana/canvas';
import type { GraphicsDrawContext as DrawContext, GraphicsPathCommand as PathCommand } from '@invana/canvas';
import type { Point } from './spec/index.js';

// Re-export so shape files can keep their existing import path.
export type { DrawContext };

// ── PixiJS-backed implementation ──────────────────────────────────────────────

/**
 * Concrete {@link DrawContext} implementation backed by a PixiJS `Graphics` + `Container`.
 *
 * @remarks
 * One `PixiDrawContext` is created per `ShapeObject` and lives for the element's
 * lifetime.  Call {@link reset} at the start of each draw cycle to clear the
 * previous frame's geometry.
 *
 * This class is **internal** to `ShapesPlugin` — shape authors only use the
 * {@link DrawContext} interface.
 */
export class PixiDrawContext implements DrawContext {
  private _g: Graphics;
  private _container: Container;
  private _texts: Text[] = [];
  private _textIdx = 0;

  constructor(g: Graphics, container: Container) {
    this._g = g;
    this._container = container;
  }

  reset(): void {
    this._g.clear();
    for (const t of this._texts) t.visible = false;
    this._textIdx = 0;
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
    const strokeOpts: Record<string, unknown> = {
      color: style.stroke      ?? '#999999',
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    };
    if (style.strokeCap        !== undefined) strokeOpts.cap        = style.strokeCap;
    if (style.strokeJoin       !== undefined) strokeOpts.join       = style.strokeJoin;
    if (style.strokeAlignment  !== undefined) strokeOpts.alignment  = style.strokeAlignment;
    if (style.strokeMiterLimit !== undefined) strokeOpts.miterLimit = style.strokeMiterLimit;
    this._g.stroke(strokeOpts);
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
    const fontSize   = style.fontSize   ?? 12;
    const fill       = style.fill       ?? '#ffffff';
    const fontFamily = style.fontFamily ?? 'sans-serif';
    const fontWeight = (style.fontWeight ?? 'normal') as TextStyle['fontWeight'];
    const align      = style.align      ?? 'center';

    let t: Text;
    if (this._textIdx < this._texts.length) {
      t = this._texts[this._textIdx]!;
      if (t.text !== text) t.text = text;
      const ts = t.style as TextStyle;
      ts.fontSize   = fontSize;
      ts.fill       = fill;
      ts.fontFamily = fontFamily;
      ts.fontWeight = fontWeight;
      ts.align      = align;
      t.visible = true;
    } else {
      t = new Text({
        text,
        style: new TextStyle({ fontSize, fill, fontFamily, fontWeight, align }),
      });
      t.anchor.set(0.5, 0.5);
      this._container.addChild(t);
      this._texts.push(t);
      t.visible = true;
    }
    t.position.set(x, y);
    this._textIdx++;
  }
}
