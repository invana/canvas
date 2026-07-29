/**
 * `GeometricLayout` — dependency-free geometric `Layout`s for `@invana/graph`:
 * `grid`, `snake` (serpentine grid), and `circular`. Pure index→position math,
 * no external libraries and no edge/topology analysis — every node is placed by
 * its position in store iteration order.
 *
 * One-shot: extends {@link SubgraphPositionLayout}, so it only implements
 * `computeSubgraphLayout()` (a single position pass over whatever node set it's
 * handed). The base owns `transition` / `transitionEase` (these are pure
 * position moves, so they glide by default), cancellation, the `start` / `tick`
 * / `end` lifecycle — and, via `includeGroups`, running this layout once per
 * group so members are packed inside their frame.
 *
 * Having no topology analysis makes this the most forgiving group layout in the
 * set: any node set can be gridded or circled, so a group's members always have
 * a solution no matter how they connect.
 *
 * @example
 * const layout = new GeometricLayout({ mode: 'circular', radius: 300 });
 * await layout.apply(graphLayer);
 */

import { SubgraphPositionLayout, type LayoutPositions, type LayoutSubgraph } from '@invana/graph';

import type { GeometricLayoutMode, GeometricLayoutOptions } from './types';

const DEFAULT_MODE: GeometricLayoutMode = 'grid';
const DEFAULT_GAP = 60;
const DEFAULT_CIRCULAR_SPACING = 50;
/** Padding added around the largest node's footprint when it exceeds the gap. */
const SIZE_GAP = 24;

export class GeometricLayout extends SubgraphPositionLayout<GeometricLayoutOptions> {
  override readonly kind = 'geometric-layout';
  protected computeSubgraphLayout(sub: LayoutSubgraph): LayoutPositions | null {
    const ids = [...sub.ids];
    // Track the largest node footprint so the pitch / spacing grows to fit it —
    // otherwise big nodes (composite cards) overlap. Additive: for small nodes
    // `maxW/maxH` stay below the gap, so the configured spacing wins and
    // existing layouts are unchanged. Under `includeGroups` a nested group's
    // footprint is its computed box, so a frame gets a cell that fits it.
    let maxW = 0;
    let maxH = 0;
    for (const id of ids) {
      const size = sub.sizeOf(id);
      if (size.width > maxW) maxW = size.width;
      if (size.height > maxH) maxH = size.height;
    }
    const n = ids.length;
    if (n === 0) return null;

    const cx = this.opts.center?.x ?? 0;
    const cy = this.opts.center?.y ?? 0;
    const positions = new Float32Array(n * 2);
    const mode = this.opts.mode ?? DEFAULT_MODE;

    if (mode === 'circular') {
      const startAngle = this.opts.startAngle ?? -Math.PI / 2;
      const dir = this.opts.clockwise === false ? -1 : 1;
      // Auto radius: lay the nodes out so neighbours sit ~`nodeSpacing` apart
      // along the circumference (circumference = n * spacing → r = that / 2π).
      const spacing = Math.max(this.opts.nodeSpacing ?? DEFAULT_CIRCULAR_SPACING, Math.max(maxW, maxH) + SIZE_GAP);
      const radius = this.opts.radius ?? Math.max(spacing, (n * spacing) / (2 * Math.PI));
      for (let i = 0; i < n; i++) {
        const angle = startAngle + (dir * (2 * Math.PI * i)) / n;
        positions[i * 2] = cx + radius * Math.cos(angle);
        positions[i * 2 + 1] = cy + radius * Math.sin(angle);
      }
      return { ids, positions };
    }

    // grid / snake — fill a column×row block, centred on the origin.
    const columns = Math.max(1, Math.floor(this.opts.columns ?? Math.ceil(Math.sqrt(n))));
    const rows = Math.ceil(n / columns);
    // Cell pitch grows to fit the largest node footprint (+ gap) when that
    // exceeds the configured gap — so cards don't overlap; small nodes keep the
    // configured gap unchanged.
    const gx = Math.max(this.opts.columnGap ?? DEFAULT_GAP, maxW + SIZE_GAP);
    const gy = Math.max(this.opts.rowGap ?? DEFAULT_GAP, maxH + SIZE_GAP);
    const offsetX = ((columns - 1) * gx) / 2;
    const offsetY = ((rows - 1) * gy) / 2;
    const snake = mode === 'snake';

    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / columns);
      // Serpentine: reverse the column order on odd rows so node i and i+1 stay
      // adjacent across the row break instead of jumping back to the left edge.
      const col = snake && row % 2 === 1 ? columns - 1 - (i % columns) : i % columns;
      positions[i * 2] = cx + col * gx - offsetX;
      positions[i * 2 + 1] = cy + row * gy - offsetY;
    }

    return { ids, positions };
  }
}
