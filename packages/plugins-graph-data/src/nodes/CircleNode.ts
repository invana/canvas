// ── CircleNode ────────────────────────────────────────────────────────────────

import { BaseNode, LOD } from '../BaseNode.js';
import type { DrawContext } from '../DrawContext.js';
import type { BaseNodeSpec, BBox, Point } from '../spec/index.js';

/** Spec for a circle node. */
export interface CircleNodeSpec extends BaseNodeSpec {
  /** Outer radius in world-space pixels. */
  radius: number;
}

/**
 * A filled/stroked circle node.
 *
 * @remarks
 * `getConnectionPoint()` returns a point on the circumference in the exact
 * direction of the target — ideal for graph nodes.
 *
 * @example
 * ```ts
 * graphPlugin.addNode('circle', {
 *   id: 'n1', x: 0, y: 0, radius: 30,
 *   style: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
 *   label: 'Node 1',
 *   interactive: true,
 *   states: {
 *     hovered:  { stroke: '#58a6ff', strokeWidth: 3 },
 *     selected: { stroke: '#f78166', strokeWidth: 3 },
 *   },
 * });
 * ```
 */
export class CircleNode extends BaseNode<CircleNodeSpec> {
  draw(ctx: DrawContext, detail: LOD): void {
    const { x, y, radius, label } = this.spec;
    const style = this.resolveStyle();

    if (detail === LOD.DOT) {
      ctx.fillCircle(x, y, 2, { fill: style.fill ?? '#888888' });
      return;
    }

    ctx.fillCircle(x, y, radius, style);

    if (detail >= LOD.DETAIL && label) {
      ctx.drawLabel(label, x, y);
    }
  }

  getBBox(): BBox {
    const { x, y, radius } = this.spec;
    return { minX: x - radius, minY: y - radius, maxX: x + radius, maxY: y + radius };
  }

  getCenter(): Point {
    return { x: this.spec.x, y: this.spec.y };
  }

  getConnectionPoint(toX: number, toY: number): Point {
    const { x, y, radius } = this.spec;
    const dx = toX - x, dy = toY - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: x + (dx / len) * radius, y: y + (dy / len) * radius };
  }

  hitTest(wx: number, wy: number): boolean {
    const { x, y, radius } = this.spec;
    const dx = wx - x, dy = wy - y;
    return dx * dx + dy * dy <= radius * radius;
  }
}
