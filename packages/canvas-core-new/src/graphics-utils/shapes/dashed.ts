/**
 * Dashed and dotted stroke helpers.
 * PixiJS v8 has no native dash support so we simulate it by drawing
 * short segments along the path perimeter.
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
  /** dot spacing (for dotted variants) */
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
  const { color = 0xffffff, strokeWidth = 1, alpha = 1, dashLength = 8, gapLength = 4, offset = 0 } = style;
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

export function drawDottedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: DashStyle = {},
): void {
  const { color = 0xffffff, strokeWidth = 1, alpha = 1, dotSpacing = 6, offset = 0 } = style;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const normalizedOffset = offset % dotSpacing;
  const dotCount = Math.ceil((length + normalizedOffset) / dotSpacing);
  const unitX = dx / length;
  const unitY = dy / length;

  for (let i = 0; i < dotCount; i++) {
    const dist = i * dotSpacing - normalizedOffset;
    if (dist < 0 || dist >= length) continue;
    const px = x1 + unitX * dist;
    const py = y1 + unitY * dist;
    g.circle(px, py, strokeWidth / 2);
    g.fill({ color, alpha });
  }
}

// ─── Circle variants ──────────────────────────────────────────────────────────

export function drawDashedCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DashStyle = {},
): void {
  const { color = 0xffffff, strokeWidth = 1, alpha = 1, dashLength = 8, gapLength = 4, offset = 0 } = style;
  const circumference = 2 * Math.PI * radius;
  const pattern = dashLength + gapLength;
  const segmentCount = Math.floor(circumference / pattern);
  const angleOffset = (offset / circumference) * 2 * Math.PI;

  for (let i = 0; i < segmentCount; i++) {
    const startAngle = (i * pattern) / radius + angleOffset;
    const endAngle = (i * pattern + dashLength) / radius + angleOffset;
    const x1 = x + radius * Math.cos(startAngle);
    const y1 = y + radius * Math.sin(startAngle);
    const x2 = x + radius * Math.cos(endAngle);
    const y2 = y + radius * Math.sin(endAngle);
    g.moveTo(x1, y1);
    g.arcTo(x1, y1, x2, y2, radius);
    g.stroke({ color, width: strokeWidth, alpha, alignment: 0.5 });
  }
}

export function drawDottedCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  style: DashStyle = {},
): void {
  const { color = 0xffffff, strokeWidth = 2, alpha = 1, dotSpacing = 8, offset = 0 } = style;
  const circumference = 2 * Math.PI * radius;
  const dotCount = Math.floor(circumference / dotSpacing);
  const angleOffset = (offset / circumference) * 2 * Math.PI;

  for (let i = 0; i < dotCount; i++) {
    const angle = (i * 2 * Math.PI) / dotCount + angleOffset;
    const px = x + radius * Math.cos(angle);
    const py = y + radius * Math.sin(angle);
    g.circle(px, py, strokeWidth / 2);
    g.fill({ color, alpha });
  }
}

// ─── Rect variants ────────────────────────────────────────────────────────────

export function drawDashedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  style: DashStyle = {},
): void {
  drawDashedLine(g, x, y, x + width, y, style);
  drawDashedLine(g, x + width, y, x + width, y + height, style);
  drawDashedLine(g, x + width, y + height, x, y + height, style);
  drawDashedLine(g, x, y + height, x, y, style);
}

export function drawDottedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  style: DashStyle = {},
): void {
  drawDottedLine(g, x, y, x + width, y, style);
  drawDottedLine(g, x + width, y, x + width, y + height, style);
  drawDottedLine(g, x + width, y + height, x, y + height, style);
  drawDottedLine(g, x, y + height, x, y, style);
}
