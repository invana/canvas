/**
 * Square Arrow Heads
 */

import type { Graphics } from 'pixi.js';
import type { ArrowParams, ArrowStyle } from './types';

/**
 * Draw a filled square arrow head
 */
export function drawSquareArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfSize = size / 2;

  // Position square center behind the edge endpoint
  const centerX = x - Math.cos(angle) * halfSize;
  const centerY = y - Math.sin(angle) * halfSize;

  // Calculate rotated corners
  const perpAngle = angle + Math.PI / 2;
  const corners = [
    { dx: halfSize, dy: halfSize },
    { dx: -halfSize, dy: halfSize },
    { dx: -halfSize, dy: -halfSize },
    { dx: halfSize, dy: -halfSize },
  ].map(({ dx, dy }) => ({
    x: centerX + Math.cos(angle) * dx + Math.cos(perpAngle) * dy,
    y: centerY + Math.sin(angle) * dx + Math.sin(perpAngle) * dy,
  }));

  const c0 = corners[0]!;
  g.moveTo(c0.x, c0.y);
  for (let i = 1; i < corners.length; i++) {
    const c = corners[i]!;
    g.lineTo(c.x, c.y);
  }
  g.closePath();

  if (style.fill) {
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }
}

/**
 * Draw an outline square arrow head
 */
export function drawSquareOutlineArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfSize = size / 2;

  const centerX = x - Math.cos(angle) * halfSize;
  const centerY = y - Math.sin(angle) * halfSize;

  const perpAngle = angle + Math.PI / 2;
  const corners = [
    { dx: halfSize, dy: halfSize },
    { dx: -halfSize, dy: halfSize },
    { dx: -halfSize, dy: -halfSize },
    { dx: halfSize, dy: -halfSize },
  ].map(({ dx, dy }) => ({
    x: centerX + Math.cos(angle) * dx + Math.cos(perpAngle) * dy,
    y: centerY + Math.sin(angle) * dx + Math.sin(perpAngle) * dy,
  }));

  const co0 = corners[0]!;
  g.moveTo(co0.x, co0.y);
  for (let i = 1; i < corners.length; i++) {
    const c = corners[i]!;
    g.lineTo(c.x, c.y);
  }
  g.closePath();

  if (style.fill) {
    g.fill({ color: style.fill, alpha: style.fillAlpha ?? 1 });
  }
  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 1,
      alpha: style.strokeAlpha ?? 1,
    });
  }
}

/**
 * Draw a tee/bar arrow head (perpendicular line)
 */
export function drawTeeArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.6;

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: x + Math.cos(perpAngle) * halfWidth,
    y: y + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: x - Math.cos(perpAngle) * halfWidth,
    y: y - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(left.x, left.y);
  g.lineTo(right.x, right.y);

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 2,
      alpha: style.strokeAlpha ?? 1,
      cap: 'round',
    });
  }
}

/**
 * Draw a bar arrow head (shorter perpendicular line)
 */
export function drawBarArrow(
  g: Graphics,
  params: ArrowParams,
  style: ArrowStyle
): void {
  const { x, y, angle, size } = params;
  const halfWidth = size * 0.4;

  const perpAngle = angle + Math.PI / 2;
  const left = {
    x: x + Math.cos(perpAngle) * halfWidth,
    y: y + Math.sin(perpAngle) * halfWidth,
  };
  const right = {
    x: x - Math.cos(perpAngle) * halfWidth,
    y: y - Math.sin(perpAngle) * halfWidth,
  };

  g.moveTo(left.x, left.y);
  g.lineTo(right.x, right.y);

  if (style.stroke && (style.strokeWidth ?? 0) > 0) {
    g.stroke({
      color: style.stroke,
      width: style.strokeWidth ?? 2,
      alpha: style.strokeAlpha ?? 1,
      cap: 'square',
    });
  }
}
