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
import type { BaseShapeSpec, FillFit, FillInput, Point, Rect, ShapeKind } from '../types';
import { applyFill } from './textureMatrix';

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
  readonly fill?: FillInput;
  readonly fillAlpha?: number;
  readonly fillFit?: FillFit;
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
    // Compute world-space AABB of on-curve endpoints for the texture matrix.
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const cmd of spec.commands) {
      if (cmd.kind !== 'close') {
        const p = tx(cmd.x, cmd.y);
        if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
      }
    }
    if (minX !== Infinity) {
      applyFill(g, spec.fill, spec.fillAlpha, (minX + maxX) / 2, (minY + maxY) / 2, maxX - minX, maxY - minY, spec.fillFit);
    }
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

/**
 * Tessellate a path spec into a closed polyline outline suitable for
 * decorations (halo, ring, marching-ants, pulse-ring, breathing,
 * `offsetPolygon`, etc.).
 *
 * Curve commands (`quadTo`, `cubicTo`) are sampled into `samplesPerCurve`
 * sub-segments using their Bernstein-form parameterisation; straight
 * commands (`moveTo`, `lineTo`) emit single points. The result is in
 * world coordinates — `spec.x`, `spec.y`, and `rot` are baked in, matching
 * `drawPath`'s convention so callers can pass the same spec to both.
 *
 * Default `samplesPerCurve = 16`. At typical viewport zoom each sub-segment
 * is sub-pixel, so the offset polygon reads as a smooth curve. Bump to 32+
 * for designs that zoom far past 4×.
 *
 * The returned array is closed: if a `close` command is encountered (or the
 * last on-curve point already equals the first), the final point duplicates
 * the first so callers can detect closure.
 */
export function pathOutline(spec: PathSpec, samplesPerCurve: number = 16): Point[] {
  const cx = spec.x;
  const cy = spec.y;
  const rot = 0;
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const tx = (x: number, y: number): Point => ({
    x: cx + x * c - y * s,
    y: cy + x * s + y * c,
  });

  const out: Point[] = [];
  let curX = 0;
  let curY = 0;
  let firstX = 0;
  let firstY = 0;
  let started = false;
  const N = Math.max(2, samplesPerCurve | 0);

  for (const cmd of spec.commands) {
    switch (cmd.kind) {
      case 'moveTo': {
        const p = tx(cmd.x, cmd.y);
        out.push(p);
        curX = cmd.x;
        curY = cmd.y;
        if (!started) {
          firstX = cmd.x;
          firstY = cmd.y;
          started = true;
        }
        break;
      }
      case 'lineTo': {
        out.push(tx(cmd.x, cmd.y));
        curX = cmd.x;
        curY = cmd.y;
        break;
      }
      case 'quadTo': {
        // B(t) = (1-t)²·P0 + 2(1-t)t·CP + t²·P1
        for (let i = 1; i <= N; i++) {
          const t = i / N;
          const u = 1 - t;
          const x = u * u * curX + 2 * u * t * cmd.cpx + t * t * cmd.x;
          const y = u * u * curY + 2 * u * t * cmd.cpy + t * t * cmd.y;
          out.push(tx(x, y));
        }
        curX = cmd.x;
        curY = cmd.y;
        break;
      }
      case 'cubicTo': {
        // B(t) = (1-t)³·P0 + 3(1-t)²t·CP1 + 3(1-t)t²·CP2 + t³·P1
        for (let i = 1; i <= N; i++) {
          const t = i / N;
          const u = 1 - t;
          const u2 = u * u;
          const u3 = u2 * u;
          const t2 = t * t;
          const t3 = t2 * t;
          const x = u3 * curX + 3 * u2 * t * cmd.cp1x + 3 * u * t2 * cmd.cp2x + t3 * cmd.x;
          const y = u3 * curY + 3 * u2 * t * cmd.cp1y + 3 * u * t2 * cmd.cp2y + t3 * cmd.y;
          out.push(tx(x, y));
        }
        curX = cmd.x;
        curY = cmd.y;
        break;
      }
      case 'close': {
        if (started && (curX !== firstX || curY !== firstY)) {
          out.push(tx(firstX, firstY));
        }
        break;
      }
    }
  }

  if (out.length >= 2) {
    const f = out[0]!;
    const l = out[out.length - 1]!;
    if (f.x !== l.x || f.y !== l.y) out.push({ x: f.x, y: f.y });
  }
  return out;
}

export const pathKind: ShapeKind<PathSpec> = {
  draw: drawPath,
  bounds: pathBounds,
};
