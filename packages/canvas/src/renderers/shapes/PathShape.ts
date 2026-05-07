/**
 * `PathShape` — built-in primitive registered as kind `'path'`.
 *
 * Accepts an array of typed path commands (avoids parsing SVG path strings —
 * keeps this primitive small + fully type-checked + dependency-free). For
 * complex authoring workflows, a domain package can add a sugar wrapper that
 * parses SVG `d=` strings into this command array.
 *
 * Local-space bounds are the AABB of all explicit on-curve points (curve
 * control points are excluded — the visual stays inside the on-curve hull
 * for the simple paths typical of icons/glyphs).
 */

import { Container, Graphics } from 'pixi.js';
import type { BaseShapeSpec, IShape, Point, Rect, ShapeHostInfo, ShapePaintStyle } from '../types';

export type PathCommand =
  | { readonly kind: 'moveTo'; readonly x: number; readonly y: number }
  | { readonly kind: 'lineTo'; readonly x: number; readonly y: number }
  | {
      readonly kind: 'quadTo';
      readonly cpx: number;
      readonly cpy: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly kind: 'cubicTo';
      readonly cp1x: number;
      readonly cp1y: number;
      readonly cp2x: number;
      readonly cp2y: number;
      readonly x: number;
      readonly y: number;
    }
  | { readonly kind: 'close' };

export interface PathShapeSpec extends BaseShapeSpec {
  readonly kind: 'path';
  readonly commands: ReadonlyArray<PathCommand>;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export class PathShape implements IShape<PathShapeSpec> {
  readonly gfx: Container;
  private readonly graphics: Graphics;
  private currentBounds: Rect = { x: 0, y: 0, width: 0, height: 0 };

  constructor(_spec: PathShapeSpec, host: ShapeHostInfo) {
    this.gfx = new Container();
    this.gfx.label = 'shape:path';
    this.graphics = new Graphics();
    this.gfx.addChild(this.graphics);
    host.surface.addChild(this.gfx);
  }

  draw(spec: PathShapeSpec): void {
    this.gfx.position.set(spec.x, spec.y);
    this.gfx.alpha = spec.alpha ?? 1;
    this.gfx.visible = spec.visible ?? true;
    if (spec.zIndex !== undefined) this.gfx.zIndex = spec.zIndex;

    const g = this.graphics;
    g.clear();
    this.currentBounds = traceCommands(g, spec.commands);
    if (spec.fill !== undefined) {
      g.fill({ color: spec.fill, alpha: spec.fillAlpha ?? 1 });
    }
    if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
      g.stroke({
        color: spec.stroke,
        width: spec.strokeWidth ?? 1,
        alpha: spec.strokeAlpha ?? 1,
      });
    }
  }

  bounds(): Rect {
    return this.currentBounds;
  }

  destroy(): void {
    this.gfx.destroy({ children: true });
  }

  /**
   * Paint a `PathShapeSpec` into a caller-supplied `Graphics`, with every
   * command point rotated by `angleRad` and translated by `anchor` so the
   * authored path renders oriented along the connector tangent. `style`
   * overrides spec colour/alpha.
   */
  static paintInto(
    g: Graphics,
    spec: Omit<PathShapeSpec, 'x' | 'y'>,
    anchor: Point,
    angleRad: number,
    style?: ShapePaintStyle,
  ): void {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    const tx = (x: number, y: number): Point => ({
      x: anchor.x + x * cos - y * sin,
      y: anchor.y + x * sin + y * cos,
    });
    for (const cmd of spec.commands) {
      switch (cmd.kind) {
        case 'moveTo': {
          const p = tx(cmd.x, cmd.y);
          g.moveTo(p.x, p.y);
          break;
        }
        case 'lineTo': {
          const p = tx(cmd.x, cmd.y);
          g.lineTo(p.x, p.y);
          break;
        }
        case 'quadTo': {
          const c = tx(cmd.cpx, cmd.cpy);
          const p = tx(cmd.x, cmd.y);
          g.quadraticCurveTo(c.x, c.y, p.x, p.y);
          break;
        }
        case 'cubicTo': {
          const c1 = tx(cmd.cp1x, cmd.cp1y);
          const c2 = tx(cmd.cp2x, cmd.cp2y);
          const p = tx(cmd.x, cmd.y);
          g.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, p.x, p.y);
          break;
        }
        case 'close':
          g.closePath();
          break;
      }
    }
    const fillColor = style?.color ?? spec.fill;
    if (fillColor !== undefined) {
      g.fill({ color: fillColor, alpha: style?.alpha ?? spec.fillAlpha ?? 1 });
    }
    if (spec.stroke !== undefined && (spec.strokeWidth ?? 0) > 0) {
      g.stroke({
        color: style?.color ?? spec.stroke,
        width: spec.strokeWidth ?? 1,
        alpha: style?.alpha ?? spec.strokeAlpha ?? 1,
      });
    }
  }
}

/**
 * Replays the command list onto a `Graphics` and accumulates an AABB over
 * the on-curve endpoints (start of each segment + each command's destination).
 */
function traceCommands(g: Graphics, commands: ReadonlyArray<PathCommand>): Rect {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let any = false;

  const visit = (x: number, y: number): void => {
    any = true;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  for (const cmd of commands) {
    switch (cmd.kind) {
      case 'moveTo':
        g.moveTo(cmd.x, cmd.y);
        visit(cmd.x, cmd.y);
        break;
      case 'lineTo':
        g.lineTo(cmd.x, cmd.y);
        visit(cmd.x, cmd.y);
        break;
      case 'quadTo':
        g.quadraticCurveTo(cmd.cpx, cmd.cpy, cmd.x, cmd.y);
        visit(cmd.x, cmd.y);
        break;
      case 'cubicTo':
        g.bezierCurveTo(cmd.cp1x, cmd.cp1y, cmd.cp2x, cmd.cp2y, cmd.x, cmd.y);
        visit(cmd.x, cmd.y);
        break;
      case 'close':
        g.closePath();
        break;
    }
  }

  if (!any) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
