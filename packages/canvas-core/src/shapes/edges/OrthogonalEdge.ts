/**
 * Orthogonal Edge Shape - Right-angle paths
 */

import type { EdgeStyle, Point } from '../../types/index.js';
import { BaseEdgeShape } from './BaseEdgeShape.js';
import { normalizeArrowConfig } from './ArrowRenderer.js';

export class OrthogonalEdge extends BaseEdgeShape {
  protected _getDefaultStyle(): EdgeStyle {
    return {
      type: 'orthogonal',
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
    const midX = (source.x + target.x) / 2;

    // Get arrow lengths and gap offsets
    const sourceArrowLength = this._getArrowOffset(normalizeArrowConfig(style.sourceArrow));
    const targetArrowLength = this._getArrowOffset(normalizeArrowConfig(style.targetArrow));
    const sourceOffset = this._getSourceOffset();
    const targetOffset = this._getTargetOffset();

    // Total offset from original endpoint = gap + arrow length
    const totalSourceOffset = sourceOffset + sourceArrowLength;
    const totalTargetOffset = targetOffset + targetArrowLength;

    // Create orthogonal path with horizontal-vertical-horizontal segments
    const basePath = [
      source,
      { x: midX, y: source.y },
      { x: midX, y: target.y },
      target,
    ];

    // Adjust source point (moves in direction of first segment)
    if (totalSourceOffset > 0 && basePath.length >= 2) {
      const p0 = basePath[0]!;
      const p1 = basePath[1]!;
      const dx = p1.x - p0.x;
      const dy = p1.y - p0.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        basePath[0] = {
          x: p0.x + (dx / len) * totalSourceOffset,
          y: p0.y + (dy / len) * totalSourceOffset,
        };
      }
    }

    // Adjust target point (moves back from end)
    if (totalTargetOffset > 0 && basePath.length >= 2) {
      const pn = basePath[basePath.length - 1]!;
      const pn1 = basePath[basePath.length - 2]!;
      const dx = pn.x - pn1.x;
      const dy = pn.y - pn1.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        basePath[basePath.length - 1] = {
          x: pn.x - (dx / len) * totalTargetOffset,
          y: pn.y - (dy / len) * totalTargetOffset,
        };
      }
    }

    return basePath;
  }

  draw(): void {
    const style = this.getComputedStyle();
    const path = this._calculatePath();

    this._graphics.clear();

    // Draw orthogonal path
    if (path.length > 0) {
      this._graphics.moveTo(path[0]!.x, path[0]!.y);
      for (let i = 1; i < path.length; i++) {
        this._graphics.lineTo(path[i]!.x, path[i]!.y);
      }
    }

    this._graphics.stroke({
      color: style.stroke ?? '#999999',
      width: style.strokeWidth ?? 2,
      alpha: style.strokeOpacity ?? 1,
    });

    // Apply container opacity
    this._container.alpha = style.opacity ?? 1;

    // Draw arrows
    this._drawArrows(path);

    // Draw label
    this._drawLabel();
  }
}
