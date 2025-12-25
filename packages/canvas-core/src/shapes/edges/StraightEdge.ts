/**
 * Straight Edge Shape
 */

import type { EdgeStyle, Point } from '../../types/index.js';
import { BaseEdgeShape } from './BaseEdgeShape.js';
import { normalizeArrowConfig } from './ArrowRenderer.js';

export class StraightEdge extends BaseEdgeShape {
  protected _getDefaultStyle(): EdgeStyle {
    return {
      type: 'straight',
      stroke: '#999999',
      strokeWidth: 2,
      strokeOpacity: 1,
      opacity: 1,
      targetArrow: {
        type: 'triangle',
        size: 10,
      },
      label: {
        visible: false,
        fontSize: 10,
        textColor: '#666666',
      },
    };
  }

  protected _calculatePath(): Point[] {
    const style = this.getComputedStyle();
    const { source, target } = this._endpoints;

    // Get arrow lengths (to shorten line so it doesn't overlap with arrows)
    const sourceArrowLength = this._getArrowOffset(normalizeArrowConfig(style.sourceArrow));
    const targetArrowLength = this._getArrowOffset(normalizeArrowConfig(style.targetArrow));

    // Get endpoint offsets (gap between node and edge)
    const sourceOffset = this._getSourceOffset();
    const targetOffset = this._getTargetOffset();

    // Total offset from original endpoint = gap + arrow length
    const totalSourceOffset = sourceOffset + sourceArrowLength;
    const totalTargetOffset = targetOffset + targetArrowLength;

    // Calculate direction
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) {
      return [source, target];
    }

    // Normalize direction
    const nx = dx / length;
    const ny = dy / length;

    // Adjust endpoints:
    // - Source: move toward target by total offset (gap + arrow)
    // - Target: move toward source by total offset (gap + arrow)
    const adjustedSource: Point = {
      x: source.x + nx * totalSourceOffset,
      y: source.y + ny * totalSourceOffset,
    };
    const adjustedTarget: Point = {
      x: target.x - nx * totalTargetOffset,
      y: target.y - ny * totalTargetOffset,
    };

    return [adjustedSource, adjustedTarget];
  }

  draw(): void {
    const style = this.getComputedStyle();
    const path = this._calculatePath();
    const adjustedSource = path[0]!;
    const adjustedTarget = path[1]!;

    this._graphics.clear();

    // Draw line
    this._graphics.moveTo(adjustedSource.x, adjustedSource.y);
    this._graphics.lineTo(adjustedTarget.x, adjustedTarget.y);
    this._graphics.stroke({
      color: style.stroke ?? '#999999',
      width: style.strokeWidth ?? 2,
      alpha: style.strokeOpacity ?? 1,
    });

    // Apply container opacity
    this._container.alpha = style.opacity ?? 1;

    // Draw arrows using the new ArrowRenderer
    this._drawArrows(path);

    // Draw label
    this._drawLabel();
  }
}
