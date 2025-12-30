/**
 * Triangle Arrow Heads
 * Various triangle-based arrow styles
 */

import type { Graphics } from 'pixi.js';
import type { ArrowParams, ArrowStyle } from './types';

/**
 * Draw a filled triangle arrow head
 */
export function drawTriangleArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.6;

  // Calculate triangle points
  const tipX = x;
  const tipY = y;
  const baseX = x - Math.cos(angle) * size;
  const baseY = y - Math.sin(angle) * size;

  // Perpendicular offset for base corners
  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: baseX + Math.cos(perpAngle) * halfWidth,
    y: baseY + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: baseX - Math.cos(perpAngle) * halfWidth,
    y: baseY - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(tipX, tipY);
  g.lineTo(left.x, left.y);
  g.lineTo(right.x, right.y);
  g.closePath();

  if (style.fill) {
  }
}

/**
 * Draw an outline triangle arrow head
 */
export function drawTriangleOutlineArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.6;

  const tipX = x;
  const tipY = y;
  const baseX = x - Math.cos(angle) * size;
  const baseY = y - Math.sin(angle) * size;

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: baseX + Math.cos(perpAngle) * halfWidth,
    y: baseY + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: baseX - Math.cos(perpAngle) * halfWidth,
    y: baseY - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(tipX, tipY);
  g.lineTo(left.x, left.y);
  g.lineTo(right.x, right.y);
  g.closePath();

  if (style.fill) {
  }
  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
      alignment: 0.5,
    });
  }
}

/**
 * Draw a thin/elongated triangle arrow head
 */
export function drawThinTriangleArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.35;
  const length = size * 1.5;

  const tipX = x;
  const tipY = y;
  const baseX = x - Math.cos(angle) * length;
  const baseY = y - Math.sin(angle) * length;

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: baseX + Math.cos(perpAngle) * halfWidth,
    y: baseY + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: baseX - Math.cos(perpAngle) * halfWidth,
    y: baseY - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(tipX, tipY);
  g.lineTo(left.x, left.y);
  g.lineTo(right.x, right.y);
  g.closePath();

  if (style.fill) {
  }
}

/**
 * Draw a vee/chevron arrow head (open, not filled)
 */
export function drawVeeArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.6;

  const tipX = x;
  const tipY = y;
  const baseX = x - Math.cos(angle) * size;
  const baseY = y - Math.sin(angle) * size;

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: baseX + Math.cos(perpAngle) * halfWidth,
    y: baseY + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: baseX - Math.cos(perpAngle) * halfWidth,
    y: baseY - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(left.x, left.y);
  g.lineTo(tipX, tipY);
  g.lineTo(right.x, right.y);

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 2,
      alpha: style.strokeAlpha ?? 1,
      cap: 'round',
      join: 'round',
      alignment: 0.5,
    });
  }
}
