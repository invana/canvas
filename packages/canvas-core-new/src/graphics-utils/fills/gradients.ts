import { FillGradient } from 'pixi.js';
import type { LinearGradientFill, RadialGradientFill, ColorStop, FillBounds } from './types.js';

export function createLinearGradient(fill: LinearGradientFill, _bounds?: FillBounds): FillGradient {
  return new FillGradient({
    type: 'linear',
    start: { x: fill.x0, y: fill.y0 },
    end: { x: fill.x1, y: fill.y1 },
    colorStops: fill.stops.map(s => ({ offset: s.offset, color: s.color })),
    textureSpace: 'local',
  });
}

export function createRadialGradient(fill: RadialGradientFill, _bounds?: FillBounds): FillGradient {
  return new FillGradient({
    type: 'radial',
    center: { x: fill.x, y: fill.y },
    innerRadius: 0,
    outerCenter: { x: fill.x, y: fill.y },
    outerRadius: fill.radius,
    colorStops: fill.stops.map(s => ({ offset: s.offset, color: s.color })),
    textureSpace: 'local',
  });
}

export function createLineGradient(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  stops: ColorStop[],
): FillGradient {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  return new FillGradient({
    type: 'linear',
    start: { x: startX, y: startY },
    end: { x: startX + dx / len, y: startY + dy / len },
    colorStops: stops.map(s => ({ offset: s.offset, color: s.color })),
    textureSpace: 'global',
  });
}
