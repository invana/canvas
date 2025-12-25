/**
 * Orthogonal Edge Shape - Right-angle paths
 */

import { Graphics } from 'pixi.js';
import type { EdgeStyle, Point } from '../../types/index.js';
import { BaseEdgeShape } from './BaseEdgeShape.js';
import { getArrowRenderer, normalizeArrowConfig } from './ArrowRenderer.js';

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

    // Get arrow lengths and gap offsets
    const sourceArrowLength = this._getArrowOffset(normalizeArrowConfig(style.sourceArrow));
    const targetArrowLength = this._getArrowOffset(normalizeArrowConfig(style.targetArrow));
    const sourceOffset = this._getSourceOffset();
    const targetOffset = this._getTargetOffset();

    // Total offset from original endpoint = gap + arrow length
    const totalSourceOffset = sourceOffset + sourceArrowLength;
    const totalTargetOffset = targetOffset + targetArrowLength;

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Get direction hints from style (for layout engines like Dagre/ELK)
    const sourceDirection = style.sourceDirection ?? 'auto';
    const targetDirection = style.targetDirection ?? 'auto';

    let basePath: Point[];

    // Determine routing based on direction hints or auto-detect
    const isSourceVertical = sourceDirection === 'top' || sourceDirection === 'bottom';
    const isSourceHorizontal = sourceDirection === 'left' || sourceDirection === 'right';
    const isTargetVertical = targetDirection === 'top' || targetDirection === 'bottom';
    const isTargetHorizontal = targetDirection === 'left' || targetDirection === 'right';

    if (absDx < 10 && absDy < 10) {
      // Very close - straight line
      basePath = [{ ...source }, { ...target }];
    } else if (isSourceVertical && isTargetVertical) {
      // Both vertical (e.g., top-to-bottom layout: source exits bottom, target enters top)
      // Path: source → vertical to midY → horizontal to target X → vertical to target
      const midY = source.y + dy / 2;
      basePath = [
        { ...source },
        { x: source.x, y: midY },  // Go vertical to midpoint
        { x: target.x, y: midY },  // Go horizontal to target X
        { ...target },              // Go vertical to target
      ];
    } else if (isSourceHorizontal && isTargetHorizontal) {
      // Both horizontal (e.g., left-to-right layout: source exits right, target enters left)
      // Path: source → horizontal to midX → vertical to target Y → horizontal to target
      const midX = source.x + dx / 2;
      basePath = [
        { ...source },
        { x: midX, y: source.y },  // Go horizontal to midpoint
        { x: midX, y: target.y },  // Go vertical to target Y
        { ...target },              // Go horizontal to target
      ];
    } else if (isSourceVertical || isTargetHorizontal) {
      // Mixed: source exits vertically, target enters horizontally
      // L-shape: vertical first, then horizontal
      basePath = [
        { ...source },
        { x: source.x, y: target.y },  // Go vertical to target Y
        { ...target },                  // Then horizontal to target
      ];
    } else if (isSourceHorizontal || isTargetVertical) {
      // Mixed: source exits horizontally, target enters vertically
      // L-shape: horizontal first, then vertical
      basePath = [
        { ...source },
        { x: target.x, y: source.y },  // Go horizontal to target X
        { ...target },                  // Then vertical to target
      ];
    } else {
      // Auto-detect based on which direction dominates
      if (absDx >= absDy) {
        // Horizontal-first routing
        const midX = source.x + dx / 2;
        basePath = [
          { ...source },
          { x: midX, y: source.y },
          { x: midX, y: target.y },
          { ...target },
        ];
      } else {
        // Vertical-first routing
        const midY = source.y + dy / 2;
        basePath = [
          { ...source },
          { x: source.x, y: midY },
          { x: target.x, y: midY },
          { ...target },
        ];
      }
    }

    // Adjust source point along first segment
    if (totalSourceOffset > 0 && basePath.length >= 2) {
      const p0 = basePath[0]!;
      const p1 = basePath[1]!;
      const segDx = p1.x - p0.x;
      const segDy = p1.y - p0.y;
      const len = Math.sqrt(segDx * segDx + segDy * segDy);
      if (len > totalSourceOffset) {
        basePath[0] = {
          x: p0.x + (segDx / len) * totalSourceOffset,
          y: p0.y + (segDy / len) * totalSourceOffset,
        };
      }
    }

    // Adjust target point along last segment
    if (totalTargetOffset > 0 && basePath.length >= 2) {
      const pn = basePath[basePath.length - 1]!;
      const pn1 = basePath[basePath.length - 2]!;
      const segDx = pn.x - pn1.x;
      const segDy = pn.y - pn1.y;
      const len = Math.sqrt(segDx * segDx + segDy * segDy);
      if (len > totalTargetOffset) {
        basePath[basePath.length - 1] = {
          x: pn.x - (segDx / len) * totalTargetOffset,
          y: pn.y - (segDy / len) * totalTargetOffset,
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

    // Draw arrows using path segment directions
    this._drawOrthogonalArrows(path);

    // Draw label
    this._drawLabel();
  }

  /**
   * Draw arrows using the orthogonal path's first/last segment directions
   */
  private _drawOrthogonalArrows(path: Point[]): void {
    const style = this.getComputedStyle();
    const arrowRenderer = getArrowRenderer();
    const defaultFill = style.stroke ?? '#999999';

    if (path.length < 2) return;

    // Source arrow - use first segment direction
    if (style.sourceArrow) {
      const sourceConfig = normalizeArrowConfig(style.sourceArrow, defaultFill);
      if (sourceConfig && sourceConfig.type !== 'none') {
        if (!this._sourceArrow) {
          this._sourceArrow = new Graphics();
          this._container.addChild(this._sourceArrow);
        }
        this._sourceArrow.clear();

        const p0 = path[0]!;
        const p1 = path[1]!;
        // Direction of the first segment (from source toward first bend)
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const segmentAngle = Math.atan2(dy, dx);
        // Arrow points back (opposite direction)
        const arrowAngle = segmentAngle + Math.PI;

        // Position arrow at source endpoint with offset
        const sourceOffset = this._getSourceOffset();
        const arrowTipX = this._endpoints.source.x + Math.cos(segmentAngle) * sourceOffset;
        const arrowTipY = this._endpoints.source.y + Math.sin(segmentAngle) * sourceOffset;

        arrowRenderer.draw(this._sourceArrow, sourceConfig, {
          x: arrowTipX,
          y: arrowTipY,
          angle: arrowAngle,
          size: sourceConfig.size ?? 10,
          fill: sourceConfig.fill ?? defaultFill,
          stroke: sourceConfig.stroke ?? defaultFill,
          strokeWidth: sourceConfig.strokeWidth ?? 1,
        });
      }
    } else if (this._sourceArrow) {
      this._sourceArrow.clear();
    }

    // Target arrow - use last segment direction
    if (style.targetArrow) {
      const targetConfig = normalizeArrowConfig(style.targetArrow, defaultFill);
      if (targetConfig && targetConfig.type !== 'none') {
        if (!this._targetArrow) {
          this._targetArrow = new Graphics();
          this._container.addChild(this._targetArrow);
        }
        this._targetArrow.clear();

        const pLast = path[path.length - 1]!;
        const pSecondLast = path[path.length - 2]!;
        // Direction of the last segment (from second-last toward target)
        const dx = pLast.x - pSecondLast.x;
        const dy = pLast.y - pSecondLast.y;
        const segmentAngle = Math.atan2(dy, dx);
        // Arrow points in direction of the segment
        const arrowAngle = segmentAngle;

        // Position arrow at target endpoint with offset
        const targetOffset = this._getTargetOffset();
        const arrowTipX = this._endpoints.target.x - Math.cos(segmentAngle) * targetOffset;
        const arrowTipY = this._endpoints.target.y - Math.sin(segmentAngle) * targetOffset;

        arrowRenderer.draw(this._targetArrow, targetConfig, {
          x: arrowTipX,
          y: arrowTipY,
          angle: arrowAngle,
          size: targetConfig.size ?? 10,
          fill: targetConfig.fill ?? defaultFill,
          stroke: targetConfig.stroke ?? defaultFill,
          strokeWidth: targetConfig.strokeWidth ?? 1,
        });
      }
    } else if (this._targetArrow) {
      this._targetArrow.clear();
    }
  }
}
