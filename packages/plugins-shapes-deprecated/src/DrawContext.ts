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
  drawPolyline,
  drawStar,
} from '@invana/canvas-deprecated';
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
} from '@invana/canvas-deprecated';
import type { DrawStyle, PathStyle } from '@invana/canvas-deprecated';
import type { GraphicsDrawContext, GraphicsPathCommand as PathCommand } from '@invana/canvas-deprecated';
import type { BadgeSpec, IconSpec, Point } from './spec/index.js';

/**
 * Drawing surface passed to every shape and connector's `drawBody` / `drawHalo`.
 *
 * Extends the engine-level {@link GraphicsDrawContext} with shape-decoration
 * primitives (icons + badges) that are specific to `plugins-shapes`.
 */
export interface DrawContext extends GraphicsDrawContext {
  /**
   * Draw an icon at (x, y), centred. Supports font codepoints, unicode/emoji,
   * or inline SVG path data (24×24 viewBox assumed for SVG).
   *
   * @param x            - World-space x of the icon centre.
   * @param y            - World-space y of the icon centre.
   * @param icon         - Icon source.
   * @param fallbackSize - Used when `icon.size` is omitted.
   */
  drawIcon(x: number, y: number, icon: IconSpec, fallbackSize?: number): void;

  /**
   * Draw a badge centred at (cx, cy). Background shape (`pill` / `circle` /
   * `rect`) is drawn first, then text and/or inner icon are layered on top.
   * Width is estimated heuristically from `text.length * fontSize * 0.6`.
   */
  drawBadge(cx: number, cy: number, badge: BadgeSpec): void;
}

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
  /** Pool of `Graphics` children used to render SVG-source icons. */
  private _svgIcons: Graphics[] = [];
  private _svgIconIdx = 0;

  constructor(g: Graphics, container: Container) {
    this._g = g;
    this._container = container;
  }

  reset(): void {
    this._g.clear();
    for (const t of this._texts) t.visible = false;
    this._textIdx = 0;
    for (const g of this._svgIcons) {
      g.visible = false;
      g.clear();
    }
    this._svgIconIdx = 0;
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

  fillPolyline(
    points: ArrayLike<number>,
    style: DrawStyle & { closed?: boolean },
  ): void {
    drawPolyline(this._g, points, style);
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

  drawIcon(x: number, y: number, icon: IconSpec, fallbackSize?: number): void {
    const size = icon.size ?? fallbackSize ?? 16;
    const color = icon.color ?? '#ffffff';

    if (icon.type === 'svg') {
      this._drawSvgIcon(x, y, icon.value, size, color);
      return;
    }

    // 'font' and 'unicode' both render as a single-glyph Text.
    this.drawLabel(icon.value, x, y, {
      fontSize: size,
      fill: color,
      fontFamily: icon.fontFamily ?? 'sans-serif',
      fontWeight: icon.fontWeight,
    });
  }

  /**
   * Render an SVG icon. Two input shapes are accepted via `IconSpec.value`:
   *
   * 1. **Full SVG markup** (starts with `<svg`) — used as-is. Required for
   *    stroke-based icon sets like Lucide whose icons are
   *    `<path stroke="..." fill="none" />` rather than filled paths.
   * 2. **Path 'd' string** — wrapped in a 24×24 viewBox with
   *    `fill="${color}"` so single-path filled icons (Material Symbols paths,
   *    FontAwesome SVG paths) still work with minimal user effort.
   *
   * The result is rendered into a pooled child `Graphics`, then translated
   * and scaled so the SVG's 24-unit canvas fits a `size`-px square centred
   * at (x, y).
   */
  private _drawSvgIcon(x: number, y: number, value: string, size: number, color: string): void {
    let g: Graphics;
    if (this._svgIconIdx < this._svgIcons.length) {
      g = this._svgIcons[this._svgIconIdx]!;
      g.visible = true;
    } else {
      g = new Graphics();
      this._container.addChild(g);
      this._svgIcons.push(g);
    }
    this._svgIconIdx++;

    const svg = value.trimStart().startsWith('<svg')
      ? value
      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="${value}" fill="${color}"/></svg>`;
    g.svg(svg);
    const s = size / 24;
    g.scale.set(s, s);
    g.position.set(x - size / 2, y - size / 2);
  }

  drawBadge(cx: number, cy: number, badge: BadgeSpec): void {
    const fontSize    = badge.fontSize    ?? 10;
    const paddingX    = badge.paddingX    ?? 6;
    const paddingY    = badge.paddingY    ?? 3;
    const fill        = badge.fill        ?? '#1f2937';
    const stroke      = badge.stroke;
    const strokeWidth = badge.strokeWidth ?? 0;
    const textColor   = badge.textColor   ?? '#ffffff';
    const shape       = badge.shape       ?? 'pill';
    const text        = badge.text        ?? '';

    // Heuristic width estimate (sans-serif averages ~0.6 × fontSize per char).
    const estTextW = text.length * fontSize * 0.6;
    const estTextH = fontSize;

    const bgStyle: DrawStyle & { cornerRadius?: number } = {
      fill,
      ...(stroke ? { stroke, strokeWidth } : {}),
    };

    if (shape === 'circle') {
      const r = Math.max(estTextW, estTextH) / 2 + Math.max(paddingX, paddingY);
      this.fillCircle(cx, cy, r, bgStyle);
    } else {
      const w = estTextW + paddingX * 2;
      const h = estTextH + paddingY * 2;
      const cornerRadius = shape === 'pill' ? h / 2 : 3;
      this.fillRect(cx - w / 2, cy - h / 2, w, h, { ...bgStyle, cornerRadius });
    }

    if (badge.icon) {
      this.drawIcon(cx, cy, badge.icon, fontSize);
    } else if (text) {
      this.drawLabel(text, cx, cy, { fontSize, fill: textColor });
    }
  }
}
