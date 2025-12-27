/**
 * Dashed and Dotted Stroke Implementation
 * 
 * Custom implementation for dashed and dotted borders since PixiJS v8
 * doesn't natively support dash patterns in the Graphics API.
 * 
 * This module provides functions to draw dashed/dotted paths by
 * calculating points along the shape perimeter and drawing segments.
 */

import { Graphics } from 'pixi.js';

/**
 * Draw a dashed circle
 */
export function drawDashedCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  dashLength: number,
  gapLength: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
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
    g.stroke({ color, width, alpha });
  }
}

/**
 * Draw a dotted circle
 */
export function drawDottedCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  dotSpacing: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const circumference = 2 * Math.PI * radius;
  const dotCount = Math.floor(circumference / dotSpacing);
  const angleOffset = (offset / circumference) * 2 * Math.PI;
  
  for (let i = 0; i < dotCount; i++) {
    const angle = (i * 2 * Math.PI) / dotCount + angleOffset;
    const dotX = x + radius * Math.cos(angle);
    const dotY = y + radius * Math.sin(angle);
    
    g.circle(dotX, dotY, width / 2);
    g.fill({ color, alpha });
  }
}

/**
 * Draw a dashed rectangle
 */
export function drawDashedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  dashLength: number,
  gapLength: number,
  color: string | number,
  strokeWidth: number,
  alpha: number = 1,
  offset: number = 0
): void {
  // Top edge
  drawDashedLine(g, x, y, x + width, y, dashLength, gapLength, color, strokeWidth, alpha, offset);
  
  // Right edge  
  drawDashedLine(g, x + width, y, x + width, y + height, dashLength, gapLength, color, strokeWidth, alpha, offset);
  
  // Bottom edge
  drawDashedLine(g, x + width, y + height, x, y + height, dashLength, gapLength, color, strokeWidth, alpha, offset);
  
  // Left edge
  drawDashedLine(g, x, y + height, x, y, dashLength, gapLength, color, strokeWidth, alpha, offset);
}

/**
 * Draw a dotted rectangle
 */
export function drawDottedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  dotSpacing: number,
  color: string | number,
  strokeWidth: number,
  alpha: number = 1,
  offset: number = 0
): void {
  // Top edge
  drawDottedLine(g, x, y, x + width, y, dotSpacing, color, strokeWidth, alpha, offset);
  
  // Right edge
  drawDottedLine(g, x + width, y, x + width, y + height, dotSpacing, color, strokeWidth, alpha, offset);
  
  // Bottom edge
  drawDottedLine(g, x + width, y + height, x, y + height, dotSpacing, color, strokeWidth, alpha, offset);
  
  // Left edge
  drawDottedLine(g, x, y + height, x, y, dotSpacing, color, strokeWidth, alpha, offset);
}

/**
 * Draw a dashed line between two points
 */
export function drawDashedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dashLength: number,
  gapLength: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const pattern = dashLength + gapLength;
  
  // Apply offset by shifting the starting position
  const normalizedOffset = offset % pattern;
  const segmentCount = Math.ceil((length + normalizedOffset) / pattern);
  
  const unitX = dx / length;
  const unitY = dy / length;
  
  for (let i = 0; i < segmentCount; i++) {
    const startDist = i * pattern - normalizedOffset;
    const endDist = Math.min(i * pattern + dashLength - normalizedOffset, length);
    
    // Skip segments that are completely before the start
    if (endDist < 0) continue;
    if (startDist >= length) break;
    
    const sx = x1 + unitX * Math.max(0, startDist);
    const sy = y1 + unitY * Math.max(0, startDist);
    const ex = x1 + unitX * endDist;
    const ey = y1 + unitY * endDist;
    
    g.moveTo(sx, sy);
    g.lineTo(ex, ey);
    g.stroke({ color, width, alpha, cap: 'round' });
  }
}

/**
 * Draw a dotted line between two points
 */
export function drawDottedLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  dotSpacing: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Apply offset
  const normalizedOffset = offset % dotSpacing;
  const dotCount = Math.ceil((length + normalizedOffset) / dotSpacing);
  
  const unitX = dx / length;
  const unitY = dy / length;
  
  for (let i = 0; i <= dotCount; i++) {
    const dist = i * dotSpacing - normalizedOffset;
    if (dist < 0) continue;
    if (dist > length) break;
    
    const dotX = x1 + unitX * dist;
    const dotY = y1 + unitY * dist;
    
    g.circle(dotX, dotY, width * 0.6);
    g.fill({ color, alpha });
  }
}

/**
 * Draw a dashed ellipse
 */
export function drawDashedEllipse(
  g: Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  dashLength: number,
  gapLength: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  // Approximate circumference using Ramanujan's formula
  const h = Math.pow(radiusX - radiusY, 2) / Math.pow(radiusX + radiusY, 2);
  const circumference = Math.PI * (radiusX + radiusY) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  
  const pattern = dashLength + gapLength;
  const segmentCount = Math.floor(circumference / pattern);
  const angleOffset = (offset / circumference) * 2 * Math.PI;
  
  for (let i = 0; i < segmentCount; i++) {
    const startAngle = (i * 2 * Math.PI) / segmentCount + angleOffset;
    const endAngle = ((i + 0.5) * 2 * Math.PI) / segmentCount + angleOffset;
    
    const x1 = x + radiusX * Math.cos(startAngle);
    const y1 = y + radiusY * Math.sin(startAngle);
    const x2 = x + radiusX * Math.cos(endAngle);
    const y2 = y + radiusY * Math.sin(endAngle);
    
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
  }
  
  g.stroke({ color, width, alpha, cap: 'butt' });
}

/**
 * Draw a dotted ellipse
 */
export function drawDottedEllipse(
  g: Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  dotSpacing: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const h = Math.pow(radiusX - radiusY, 2) / Math.pow(radiusX + radiusY, 2);
  const circumference = Math.PI * (radiusX + radiusY) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  
  const dotCount = Math.floor(circumference / dotSpacing);
  const angleOffset = (offset / circumference) * 2 * Math.PI;
  
  for (let i = 0; i < dotCount; i++) {
    const angle = (i * 2 * Math.PI) / dotCount + angleOffset;
    const dotX = x + radiusX * Math.cos(angle);
    const dotY = y + radiusY * Math.sin(angle);
    
    g.circle(dotX, dotY, width / 2);
    g.fill({ color, alpha });
  }
}

/**
 * Draw a dashed polygon
 */
export function drawDashedPolygon(
  g: Graphics,
  points: number[],
  dashLength: number,
  gapLength: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[(i + 2) % points.length];
    const y2 = points[(i + 3) % points.length];
    
    // Skip if any coordinate is undefined
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
      continue;
    }
    
    drawDashedLine(g, x1, y1, x2, y2, dashLength, gapLength, color, width, alpha, offset);
  }
}

/**
 * Draw a dotted polygon
 */
export function drawDottedPolygon(
  g: Graphics,
  points: number[],
  dotSpacing: number,
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i];
    const y1 = points[i + 1];
    const x2 = points[(i + 2) % points.length];
    const y2 = points[(i + 3) % points.length];
    
    // Skip if any coordinate is undefined
    if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
      continue;
    }
    
    drawDottedLine(g, x1, y1, x2, y2, dotSpacing, color, width, alpha, offset);
  }
}

/**
 * Draw a dashed rounded rectangle
 */
export function drawDashedRoundedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  dashLength: number,
  gapLength: number,
  color: string | number,
  strokeWidth: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const r = Math.min(radius, width / 2, height / 2);
  let cumulativeOffset = offset;
  
  // Top edge
  const topLength = width - 2 * r;
  drawDashedLine(g, x + r, y, x + width - r, y, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += topLength;
  
  // Top-right corner arc
  const arcLength = (Math.PI / 2) * r;
  drawDashedArc(g, x + width - r, y + r, r, -Math.PI / 2, 0, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += arcLength;
  
  // Right edge  
  const rightLength = height - 2 * r;
  drawDashedLine(g, x + width, y + r, x + width, y + height - r, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += rightLength;
  
  // Bottom-right corner arc
  drawDashedArc(g, x + width - r, y + height - r, r, 0, Math.PI / 2, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += arcLength;
  
  // Bottom edge
  const bottomLength = width - 2 * r;
  drawDashedLine(g, x + width - r, y + height, x + r, y + height, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += bottomLength;
  
  // Bottom-left corner arc
  drawDashedArc(g, x + r, y + height - r, r, Math.PI / 2, Math.PI, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += arcLength;
  
  // Left edge
  const leftLength = height - 2 * r;
  drawDashedLine(g, x, y + height - r, x, y + r, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += leftLength;
  
  // Top-left corner arc
  drawDashedArc(g, x + r, y + r, r, Math.PI, 3 * Math.PI / 2, dashLength, gapLength, color, strokeWidth, alpha, cumulativeOffset);
}

/**
 * Draw a dotted rounded rectangle
 */
export function drawDottedRoundedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  dotSpacing: number,
  color: string | number,
  strokeWidth: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const r = Math.min(radius, width / 2, height / 2);
  let cumulativeOffset = offset;
  
  // Top edge
  const topLength = width - 2 * r;
  drawDottedLine(g, x + r, y, x + width - r, y, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += topLength;
  
  // Top-right corner arc
  const arcLength = (Math.PI / 2) * r;
  drawDottedArc(g, x + width - r, y + r, r, -Math.PI / 2, 0, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += arcLength;
  
  // Right edge  
  const rightLength = height - 2 * r;
  drawDottedLine(g, x + width, y + r, x + width, y + height - r, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += rightLength;
  
  // Bottom-right corner arc
  drawDottedArc(g, x + width - r, y + height - r, r, 0, Math.PI / 2, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += arcLength;
  
  // Bottom edge
  const bottomLength = width - 2 * r;
  drawDottedLine(g, x + width - r, y + height, x + r, y + height, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += bottomLength;
  
  // Bottom-left corner arc
  drawDottedArc(g, x + r, y + height - r, r, Math.PI / 2, Math.PI, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += arcLength;
  
  // Left edge
  const leftLength = height - 2 * r;
  drawDottedLine(g, x, y + height - r, x, y + r, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += leftLength;
  
  // Top-left corner arc
  drawDottedArc(g, x + r, y + r, r, Math.PI, 3 * Math.PI / 2, dotSpacing, color, strokeWidth, alpha, cumulativeOffset);
}

/**
 * Draw a dashed arc
 */
function drawDashedArc(
  g: Graphics,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  dashLength: number,
  gapLength: number,
  color: string | number,
  width: number,
  alpha: number,
  offset: number = 0
): void {
  const arcLength = radius * Math.abs(endAngle - startAngle);
  const pattern = dashLength + gapLength;
  const normalizedOffset = offset % pattern;
  
  let currentDist = -normalizedOffset;
  let isDash = true;
  
  // Determine if we start with a dash or gap based on offset
  if (normalizedOffset > dashLength) {
    isDash = false;
    currentDist = -(normalizedOffset - dashLength);
  }
  
  while (currentDist < arcLength) {
    const segmentLength = isDash ? dashLength : gapLength;
    const segmentEnd = Math.min(currentDist + segmentLength, arcLength);
    
    if (isDash && currentDist >= 0 && segmentEnd > 0) {
      const startA = startAngle + (Math.max(0, currentDist) / arcLength) * (endAngle - startAngle);
      const endA = startAngle + (segmentEnd / arcLength) * (endAngle - startAngle);
      
      // Draw arc segment as small line segments for smooth curve
      const steps = Math.max(2, Math.ceil(Math.abs(endA - startA) * radius / 2));
      for (let i = 0; i < steps; i++) {
        const a1 = startA + (i / steps) * (endA - startA);
        const a2 = startA + ((i + 1) / steps) * (endA - startA);
        
        g.moveTo(cx + radius * Math.cos(a1), cy + radius * Math.sin(a1));
        g.lineTo(cx + radius * Math.cos(a2), cy + radius * Math.sin(a2));
      }
      g.stroke({ color, width, alpha, cap: 'round' });
    }
    
    currentDist += segmentLength;
    isDash = !isDash;
  }
}

/**
 * Draw a dotted arc
 */
function drawDottedArc(
  g: Graphics,
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
  dotSpacing: number,
  color: string | number,
  width: number,
  alpha: number,
  offset: number = 0
): void {
  const arcLength = radius * Math.abs(endAngle - startAngle);
  const normalizedOffset = offset % dotSpacing;
  const dotCount = Math.ceil((arcLength + normalizedOffset) / dotSpacing);
  
  for (let i = 0; i <= dotCount; i++) {
    const dist = i * dotSpacing - normalizedOffset;
    if (dist < 0) continue;
    if (dist > arcLength) break;
    
    const angle = startAngle + (dist / arcLength) * (endAngle - startAngle);
    const dotX = cx + radius * Math.cos(angle);
    const dotY = cy + radius * Math.sin(angle);
    
    g.circle(dotX, dotY, width * 0.6);
    g.fill({ color, alpha });
  }
}

/**
 * Draw a line with a custom dash pattern array
 */
export function drawPatternLine(
  g: Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pattern: number[],
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Calculate total pattern length
  const patternLength = pattern.reduce((sum, val) => sum + val, 0);
  const normalizedOffset = offset % patternLength;
  
  const unitX = dx / length;
  const unitY = dy / length;
  
  let currentDist = -normalizedOffset;
  let patternIndex = 0;
  let isDash = true;
  
  while (currentDist < length) {
    const segmentLength = pattern[patternIndex % pattern.length]!;
    const nextDist = currentDist + segmentLength;
    
    if (isDash && nextDist > 0) {
      const startDist = Math.max(0, currentDist);
      const endDist = Math.min(nextDist, length);
      
      if (startDist < length) {
        const sx = x1 + unitX * startDist;
        const sy = y1 + unitY * startDist;
        const ex = x1 + unitX * endDist;
        const ey = y1 + unitY * endDist;
        
        g.moveTo(sx, sy);
        g.lineTo(ex, ey);
        g.stroke({ color, width, alpha, cap: 'round' });
      }
    }
    
    currentDist = nextDist;
    patternIndex++;
    isDash = !isDash;
  }
}

/**
 * Draw a rectangle with a custom dash pattern array
 */
export function drawPatternRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  pattern: number[],
  color: string | number,
  strokeWidth: number,
  alpha: number = 1,
  offset: number = 0
): void {
  // Top edge
  drawPatternLine(g, x, y, x + width, y, pattern, color, strokeWidth, alpha, offset);
  
  // Right edge  
  const topEdgeLength = width;
  drawPatternLine(g, x + width, y, x + width, y + height, pattern, color, strokeWidth, alpha, offset + topEdgeLength);
  
  // Bottom edge
  const rightEdgeLength = height;
  drawPatternLine(g, x + width, y + height, x, y + height, pattern, color, strokeWidth, alpha, offset + topEdgeLength + rightEdgeLength);
  
  // Left edge
  const bottomEdgeLength = width;
  drawPatternLine(g, x, y + height, x, y, pattern, color, strokeWidth, alpha, offset + topEdgeLength + rightEdgeLength + bottomEdgeLength);
}

/**
 * Draw a circle with a custom dash pattern array
 */
export function drawPatternCircle(
  g: Graphics,
  x: number,
  y: number,
  radius: number,
  pattern: number[],
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const circumference = 2 * Math.PI * radius;
  const patternLength = pattern.reduce((sum, val) => sum + val, 0);
  const normalizedOffset = offset % patternLength;
  
  let currentDist = -normalizedOffset;
  let patternIndex = 0;
  let isDash = true;
  
  while (currentDist < circumference) {
    const segmentLength = pattern[patternIndex % pattern.length]!;
    const nextDist = currentDist + segmentLength;
    
    if (isDash && nextDist > 0) {
      const startDist = Math.max(0, currentDist);
      const endDist = Math.min(nextDist, circumference);
      
      if (startDist < circumference) {
        const startAngle = (startDist / radius);
        const endAngle = (endDist / radius);
        
        const x1 = x + radius * Math.cos(startAngle);
        const y1 = y + radius * Math.sin(startAngle);
        const x2 = x + radius * Math.cos(endAngle);
        const y2 = y + radius * Math.sin(endAngle);
        
        g.moveTo(x1, y1);
        g.arcTo(x1, y1, x2, y2, radius);
        g.stroke({ color, width, alpha });
      }
    }
    
    currentDist = nextDist;
    patternIndex++;
    isDash = !isDash;
  }
}

/**
 * Draw an ellipse with a custom dash pattern array
 */
export function drawPatternEllipse(
  g: Graphics,
  x: number,
  y: number,
  radiusX: number,
  radiusY: number,
  pattern: number[],
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  // Ramanujan approximation for ellipse circumference
  const h = Math.pow((radiusX - radiusY), 2) / Math.pow((radiusX + radiusY), 2);
  const circumference = Math.PI * (radiusX + radiusY) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
  
  const patternLength = pattern.reduce((sum, val) => sum + val, 0);
  const normalizedOffset = offset % patternLength;
  
  let currentDist = -normalizedOffset;
  let patternIndex = 0;
  let isDash = true;
  
  while (currentDist < circumference) {
    const segmentLength = pattern[patternIndex % pattern.length]!;
    const nextDist = currentDist + segmentLength;
    
    if (isDash && nextDist > 0) {
      const startDist = Math.max(0, currentDist);
      const endDist = Math.min(nextDist, circumference);
      
      if (startDist < circumference) {
        const startAngle = (startDist / circumference) * 2 * Math.PI;
        const endAngle = (endDist / circumference) * 2 * Math.PI;
        
        const segments = Math.ceil((endAngle - startAngle) / (Math.PI / 16));
        for (let i = 0; i < segments; i++) {
          const a1 = startAngle + (i / segments) * (endAngle - startAngle);
          const a2 = startAngle + ((i + 1) / segments) * (endAngle - startAngle);
          
          const x1 = x + radiusX * Math.cos(a1);
          const y1 = y + radiusY * Math.sin(a1);
          const x2 = x + radiusX * Math.cos(a2);
          const y2 = y + radiusY * Math.sin(a2);
          
          if (i === 0) g.moveTo(x1, y1);
          g.lineTo(x2, y2);
        }
        g.stroke({ color, width, alpha, cap: 'round' });
      }
    }
    
    currentDist = nextDist;
    patternIndex++;
    isDash = !isDash;
  }
}

/**
 * Draw a polygon with a custom dash pattern array
 */
export function drawPatternPolygon(
  g: Graphics,
  points: number[],
  pattern: number[],
  color: string | number,
  width: number,
  alpha: number = 1,
  offset: number = 0
): void {
  let cumulativeOffset = offset;
  
  for (let i = 0; i < points.length; i += 2) {
    const x1 = points[i]!;
    const y1 = points[i + 1]!;
    const x2 = points[(i + 2) % points.length]!;
    const y2 = points[(i + 3) % points.length]!;
    
    drawPatternLine(g, x1, y1, x2, y2, pattern, color, width, alpha, cumulativeOffset);
    
    const edgeLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    cumulativeOffset += edgeLength;
  }
}

/**
 * Draw a rounded rectangle with a custom dash pattern array
 */
export function drawPatternRoundedRect(
  g: Graphics,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  pattern: number[],
  color: string | number,
  strokeWidth: number,
  alpha: number = 1,
  offset: number = 0
): void {
  const r = Math.min(radius, width / 2, height / 2);
  let cumulativeOffset = offset;
  
  // Top edge (with rounded corners)
  const topLength = width - 2 * r;
  drawPatternLine(g, x + r, y, x + width - r, y, pattern, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += topLength;
  
  // Top-right corner arc
  const arcLength = (Math.PI / 2) * r;
  // Draw corner as line segments for pattern continuity
  const cornerSegments = Math.max(4, Math.ceil(r / 5));
  for (let i = 0; i <= cornerSegments; i++) {
    const angle1 = -Math.PI / 2 + (i / cornerSegments) * (Math.PI / 2);
    const angle2 = -Math.PI / 2 + ((i + 1) / cornerSegments) * (Math.PI / 2);
    const cx = x + width - r;
    const cy = y + r;
    drawPatternLine(
      g,
      cx + r * Math.cos(angle1),
      cy + r * Math.sin(angle1),
      cx + r * Math.cos(angle2),
      cy + r * Math.sin(angle2),
      pattern,
      color,
      strokeWidth,
      alpha,
      cumulativeOffset
    );
    cumulativeOffset += (arcLength / cornerSegments);
  }
  
  // Right edge
  const rightLength = height - 2 * r;
  drawPatternLine(g, x + width, y + r, x + width, y + height - r, pattern, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += rightLength;
  
  // Bottom-right corner
  for (let i = 0; i <= cornerSegments; i++) {
    const angle1 = 0 + (i / cornerSegments) * (Math.PI / 2);
    const angle2 = 0 + ((i + 1) / cornerSegments) * (Math.PI / 2);
    const cx = x + width - r;
    const cy = y + height - r;
    drawPatternLine(
      g,
      cx + r * Math.cos(angle1),
      cy + r * Math.sin(angle1),
      cx + r * Math.cos(angle2),
      cy + r * Math.sin(angle2),
      pattern,
      color,
      strokeWidth,
      alpha,
      cumulativeOffset
    );
    cumulativeOffset += (arcLength / cornerSegments);
  }
  
  // Bottom edge
  const bottomLength = width - 2 * r;
  drawPatternLine(g, x + width - r, y + height, x + r, y + height, pattern, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += bottomLength;
  
  // Bottom-left corner
  for (let i = 0; i <= cornerSegments; i++) {
    const angle1 = Math.PI / 2 + (i / cornerSegments) * (Math.PI / 2);
    const angle2 = Math.PI / 2 + ((i + 1) / cornerSegments) * (Math.PI / 2);
    const cx = x + r;
    const cy = y + height - r;
    drawPatternLine(
      g,
      cx + r * Math.cos(angle1),
      cy + r * Math.sin(angle1),
      cx + r * Math.cos(angle2),
      cy + r * Math.sin(angle2),
      pattern,
      color,
      strokeWidth,
      alpha,
      cumulativeOffset
    );
    cumulativeOffset += (arcLength / cornerSegments);
  }
  
  // Left edge
  const leftLength = height - 2 * r;
  drawPatternLine(g, x, y + height - r, x, y + r, pattern, color, strokeWidth, alpha, cumulativeOffset);
  cumulativeOffset += leftLength;
  
  // Top-left corner
  for (let i = 0; i <= cornerSegments; i++) {
    const angle1 = Math.PI + (i / cornerSegments) * (Math.PI / 2);
    const angle2 = Math.PI + ((i + 1) / cornerSegments) * (Math.PI / 2);
    const cx = x + r;
    const cy = y + r;
    drawPatternLine(
      g,
      cx + r * Math.cos(angle1),
      cy + r * Math.sin(angle1),
      cx + r * Math.cos(angle2),
      cy + r * Math.sin(angle2),
      pattern,
      color,
      strokeWidth,
      alpha,
      cumulativeOffset
    );
    cumulativeOffset += (arcLength / cornerSegments);
  }
}
