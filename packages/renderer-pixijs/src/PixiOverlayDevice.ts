/**
 * Pixi implementation of {@link IOverlayDevice}.
 *
 * Owns one `Graphics` inside a labelled `Container` so the overlay shows up in
 * the devtools scene tree under its own name (the naming contract from
 * `rfc:feat-2026-08-05-render-tree-not-inspectable`). Moves to
 * `@invana/renderer-pixijs` with the rest of the drawing code in P6.
 */

import { Container, Graphics } from 'pixi.js';
import { emitDashedStroke } from './paint/dashedStroke';
import type { IOverlayDevice, OverlayFillLike, OverlayStroke } from '@invana/canvas';

export class PixiOverlayDevice implements IOverlayDevice {
  private readonly root: Container;
  private readonly gfx: Graphics;
  /** Points of the current sub-path, kept for dashed strokes (pixi has no dash). */
  private current: Array<{ x: number; y: number }> = [];
  private closed = false;

  constructor(parent: Container, label: string, zIndex = 9999) {
    this.root = new Container();
    this.root.label = label;
    this.root.zIndex = zIndex;
    this.gfx = new Graphics();
    this.gfx.label = `${label}:path`;
    this.root.addChild(this.gfx);
    parent.addChild(this.root);
    parent.sortableChildren = true;
  }

  clear(): this {
    this.gfx.clear();
    this.current = [];
    this.closed = false;
    return this;
  }

  moveTo(x: number, y: number): this {
    this.gfx.moveTo(x, y);
    this.current = [{ x, y }];
    this.closed = false;
    return this;
  }

  lineTo(x: number, y: number): this {
    this.gfx.lineTo(x, y);
    this.current.push({ x, y });
    return this;
  }

  quadraticCurveTo(cx: number, cy: number, x: number, y: number): this {
    this.gfx.quadraticCurveTo(cx, cy, x, y);
    this.current.push({ x, y });
    return this;
  }

  closePath(): this {
    this.gfx.closePath();
    this.closed = true;
    return this;
  }

  rect(x: number, y: number, width: number, height: number): this {
    this.gfx.rect(x, y, width, height);
    this.current = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
    this.closed = true;
    return this;
  }

  roundRect(x: number, y: number, width: number, height: number, radius: number): this {
    this.gfx.roundRect(x, y, width, height, radius);
    // Dashing a rounded rect would need the arc segments; callers that dash use
    // `rect` or `poly`, so the straight-edge approximation is enough here.
    this.current = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
    this.closed = true;
    return this;
  }

  ellipse(cx: number, cy: number, radiusX: number, radiusY: number): this {
    this.gfx.ellipse(cx, cy, radiusX, radiusY);
    this.current = [];
    this.closed = true;
    return this;
  }

  poly(
    points: readonly number[] | ReadonlyArray<{ x: number; y: number }>,
    close = true,
  ): this {
    const pts = toPoints(points);
    if (pts.length === 0) return this;
    this.gfx.poly(pts.flatMap((p) => [p.x, p.y]), close);
    this.current = pts;
    this.closed = close;
    return this;
  }

  fill(style: OverlayFillLike): this {
    if (typeof style === 'number' || typeof style === 'string') {
      this.gfx.fill(style);
      return this;
    }
    this.gfx.fill({ color: style.color, alpha: style.alpha ?? 1 });
    return this;
  }

  stroke(style: OverlayStroke): this {
    if (style.dashArray && style.dashArray[0] > 0 && style.dashArray[1] > 0) {
      // Pixi strokes are solid; the dashed emitter walks the polyline itself.
      if (this.current.length > 1) {
        emitDashedStroke(this.gfx, this.current, {
          color: style.color,
          alpha: style.alpha ?? 1,
          width: style.width,
          dashArray: style.dashArray,
          closed: this.closed,
        });
      }
      return this;
    }
    this.gfx.stroke({ color: style.color, width: style.width, alpha: style.alpha ?? 1 });
    return this;
  }

  setVisible(visible: boolean): this {
    this.root.visible = visible;
    return this;
  }

  setZIndex(z: number): this {
    this.root.zIndex = z;
    return this;
  }

  setPosition(x: number, y: number): this {
    this.root.position.set(x, y);
    return this;
  }

  destroy(): void {
    this.root.destroy({ children: true });
  }
}

function toPoints(
  points: readonly number[] | ReadonlyArray<{ x: number; y: number }>,
): Array<{ x: number; y: number }> {
  if (points.length === 0) return [];
  if (typeof points[0] === 'number') {
    const flat = points as readonly number[];
    const out: Array<{ x: number; y: number }> = [];
    for (let i = 0; i + 1 < flat.length; i += 2) out.push({ x: flat[i]!, y: flat[i + 1]! });
    return out;
  }
  return [...(points as ReadonlyArray<{ x: number; y: number }>)];
}
