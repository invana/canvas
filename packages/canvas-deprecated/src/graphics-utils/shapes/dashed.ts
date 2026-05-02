/**
 * Dashed line primitives.
 * PixiJS v8 has no native dash support so we simulate it by drawing
 * short segments along the path perimeter.
 * A dotted look is achieved by setting dashLength ≈ strokeWidth with cap:'round'.
 *
 * Shape-specific variants live in their own files:
 *   drawDashedCircle  → circle.ts
 *   drawDashedEllipse → ellipse.ts
 *   drawDashedPolyline → polygon.ts
 *   drawDashedRect    → rect.ts
 */

import type { Graphics } from 'pixi.js';

export interface DashStyle {
  color?: string | number;
  strokeWidth?: number;
  alpha?: number;
  /** dash length in px */
  dashLength?: number;
  /** gap between dashes in px */
  gapLength?: number;
  /**
   * Dot spacing in px — used as gap between dots when the caller wants a
   * dotted look (dashLength ≈ strokeWidth). Falls back to gapLength.
   */
  dotSpacing?: number;
  /** animation phase offset in px */
  offset?: number;
}

// ─── Line variants ────────────────────────────────────────────────────────────

export function drawDashedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: DashStyle = {},
): void {
  const { color = 0xffffff, strokeWidth = 1, alpha = 1, dashLength = 8, gapLength: _gap, dotSpacing, offset = 0 } = style;
  const gapLength = _gap ?? dotSpacing ?? 4;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const pattern = dashLength + gapLength;
  const normalizedOffset = offset % pattern;
  const segmentCount = Math.ceil((length + normalizedOffset) / pattern);
  const unitX = dx / length;
  const unitY = dy / length;

  for (let i = 0; i < segmentCount; i++) {
    const startDist = i * pattern - normalizedOffset;
    const endDist = Math.min(i * pattern + dashLength - normalizedOffset, length);
    if (endDist < 0) continue;
    if (startDist >= length) break;
    const sx = x1 + unitX * Math.max(0, startDist);
    const sy = y1 + unitY * Math.max(0, startDist);
    const ex = x1 + unitX * endDist;
    const ey = y1 + unitY * endDist;
    g.moveTo(sx, sy);
    g.lineTo(ex, ey);
    g.stroke({ color, width: strokeWidth, alpha, cap: 'round', alignment: 0.5 });
  }
}


