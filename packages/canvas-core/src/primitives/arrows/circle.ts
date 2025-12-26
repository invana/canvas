/**
 * Circle Arrow Heads
 */

import type { Graphics } from 'pixi.js';
import type { ArrowParams, ArrowStyle } from './types';

/**
 * Draw a filled circle arrow head
 */
export function drawCircleArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const radius = size / 2;

  // Position circle center behind the edge endpoint
  const centerX = x - Math.cos(angle) * radius;
  const centerY = y - Math.sin(angle) * radius;

  g.circle(centerX, centerY, radius);

  if (style.fill) {
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }
}

/**
 * Draw an outline circle arrow head
 */
export function drawCircleOutlineArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const radius = size / 2;

  const centerX = x - Math.cos(angle) * radius;
  const centerY = y - Math.sin(angle) * radius;

  g.circle(centerX, centerY, radius);

  if (style.fill) {
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }
  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.circle(centerX, centerY, radius);
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}
