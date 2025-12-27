/**
 * Diamond Arrow Heads
 */

import type { Graphics } from 'pixi.js';
import type { ArrowParams, ArrowStyle } from './types';

/**
 * Draw a filled diamond arrow head
 */
export function drawDiamondArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.5;

  // Diamond points
  const tip = { x, y };
  const back = {
    x: x - Math.cos(angle) * size,
    y: y - Math.sin(angle) * size,
  };
  const mid = {
    x: x - Math.cos(angle) * (size / 2),
    y: y - Math.sin(angle) * (size / 2),
  };

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: mid.x + Math.cos(perpAngle) * halfWidth,
    y: mid.y + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: mid.x - Math.cos(perpAngle) * halfWidth,
    y: mid.y - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(tip.x, tip.y);
  g.lineTo(left.x, left.y);
  g.lineTo(back.x, back.y);
  g.lineTo(right.x, right.y);
  g.closePath();

  if (style.fill) {
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }
}

/**
 * Draw an outline diamond arrow head
 */
export function drawDiamondOutlineArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.5;

  const tip = { x, y };
  const back = {
    x: x - Math.cos(angle) * size,
    y: y - Math.sin(angle) * size,
  };
  const mid = {
    x: x - Math.cos(angle) * (size / 2),
    y: y - Math.sin(angle) * (size / 2),
  };

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: mid.x + Math.cos(perpAngle) * halfWidth,
    y: mid.y + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: mid.x - Math.cos(perpAngle) * halfWidth,
    y: mid.y - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(tip.x, tip.y);
  g.lineTo(left.x, left.y);
  g.lineTo(back.x, back.y);
  g.lineTo(right.x, right.y);
  g.closePath();

  if (style.fill) {
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
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
