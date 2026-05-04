/**
 * `path` — primitive shape: arbitrary path expressed as typed commands.
 *
 * Supports `moveTo` / `lineTo` / `quadTo` / `cubicTo` / `close`. Coords are
 * local to spec `(x, y)`. AABB is computed over on-curve endpoints (control
 * points excluded — the on-curve hull is correct for the simple icon-style
 * paths this primitive targets).
 *
 * `rot` rotates all on-curve and control points around the local origin.
 */

import type { Graphics } from 'pixi.js';
import type { BaseShapeSpec, Rect, ShapeKind } from '../types';

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

export interface PathSpec extends BaseShapeSpec {
  readonly kind: 'path';
  readonly commands: ReadonlyArray<PathCommand>;
  readonly fill?: number;
  readonly fillAlpha?: number;
  readonly stroke?: number;
  readonly strokeWidth?: number;
  readonly strokeAlpha?: number;
}

export function drawPath(
  g: Graphics,
  spec: PathSpec,
  ox: number = 0,
  oy: number = 0,
  rot: number = 0,
): void {
  const cx = spec.x + ox;
  const cy = spec.y + oy;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const tx = (x: number, y: number): { x: number; y: number } => ({
    x: cx + x * c - y * s,
    y: cy + x * s + y * c,
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
        const cp = tx(cmd.cpx, cmd.cpy);
        const p = tx(cmd.x, cmd.y);
        g.quadraticCurveTo(cp.x, cp.y, p.x, p.y);
        break;
      }
      case 'cubicTo': {
        const cp1 = tx(cmd.cp1x, cmd.cp1y);
        const cp2 = tx(cmd.cp2x, cmd.cp2y);
        const p = tx(cmd.x, cmd.y);
        g.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y);
        break;
      }
      case 'close':
        g.closePath();
        break;
    }
  }

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

export function pathBounds(spec: PathSpec): Rect {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let any = false;
  const visit = (x: number, y: number): void => {
    any = true;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };
  for (const cmd of spec.commands) {
    switch (cmd.kind) {
      case 'moveTo':
      case 'lineTo':
      case 'quadTo':
      case 'cubicTo':
        visit(cmd.x, cmd.y);
        break;
      case 'close':
        break;
    }
  }
  if (!any) return { x: 0, y: 0, width: 0, height: 0 };
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export const pathKind: ShapeKind<PathSpec> = {
  draw: drawPath,
  bounds: pathBounds,
};
