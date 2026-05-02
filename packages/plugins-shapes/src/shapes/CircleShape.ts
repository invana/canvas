// ── CircleShape ───────────────────────────────────────────────────────────────

import { rayPointAt, rayVsCircle } from '@invana/canvas';
import { BaseShape, LOD } from '../BaseShape.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseShapeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a circle shape. */
export interface CircleShapeSpec extends BaseShapeSpec {
  /** Outer radius in world-space pixels. */
  radius: number;
}

/** @deprecated Use {@link CircleShapeSpec} instead. */
export type CircleNodeSpec = CircleShapeSpec;

/**
 * A filled/stroked circle shape.
 *
 * @example
 * ```ts
 * shapesPlugin.addShape('circle', {
 *   id: 's1', x: 0, y: 0, radius: 30,
 *   style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
 *   label: 'Shape 1',
 *   interactive: true,
 *   states: {
 *     hovered:  { stroke: '#58a6ff', strokeWidth: 3 },
 *     selected: { stroke: '#f78166', strokeWidth: 3 },
 *   },
 * });
 * ```
 */
export class CircleShape extends BaseShape<CircleShapeSpec> {
  drawBody(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x, y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillCircle(x, y, radius, style);
  }

  drawHalo(ctx: DrawContext, detail: LOD): void {
    if (detail === LOD.DOT || !this.isHaloActive()) return;
    const { x, y, radius } = this.spec;
    const halo = this.resolveHalo();
    ctx.fillCircle(x, y, radius + halo.offset + halo.width / 2, this.resolveHaloStyle());
  }

  getBBox(): BBox {
    const { x, y, radius } = this.spec;
    return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  rayBoundaryHit(origin: Point, dir: Point): Point | null {
    const { x, y, radius } = this.spec;
    const t = rayVsCircle(origin.x, origin.y, dir.x, dir.y, x, y, radius);
    if (t === null) return null;
    return rayPointAt(origin.x, origin.y, dir.x, dir.y, t);
  }

  hitTest(wx: number, wy: number): boolean {
    const { x, y, radius } = this.spec;
    const dx = wx - x, dy = wy - y;
    return dx * dx + dy * dy <= radius * radius;
  }
}

/** @deprecated Use {@link CircleShape} instead. */
export { CircleShape as CircleNode };
