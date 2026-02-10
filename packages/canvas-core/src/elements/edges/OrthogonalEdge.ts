/**
 * OrthogonalEdge
 * 
 * Right-angle orthogonal edge implementation following invana-studio-mvp pattern.
 * Draws paths that only use horizontal and vertical segments.
 */

import type { PathStyle, Direction } from '../../primitives/paths';
import { RendererEdgeBase, type EdgeShapeOptions, type EdgePathType } from './RendererEdgeBase';

/**
 * Orthogonal edge options (same as base edge options)
 */
export type OrthogonalEdgeOptions = EdgeShapeOptions;

/**
 * Orthogonal edge with right-angle corners
 */
export class OrthogonalEdge extends RendererEdgeBase {
  get pathType(): EdgePathType {
    return 'orthogonal';
  }

  protected renderEdge(sourceNode: any, targetNode: any, style: PathStyle): void {
    if (!sourceNode || !targetNode) {
      console.warn('OrthogonalEdge: Missing source or target node');
      return;
    }

    const sourceDir = this._data.sourceDirection ?? this.inferDirection(sourceNode, targetNode, 'source');
    const targetDir = this._data.targetDirection ?? this.inferDirection(sourceNode, targetNode, 'target');
    
    // Get edge endpoints based on direction
    const sourceAngle = this.directionToAngle(sourceDir);
    const targetAngle = this.directionToAngle(targetDir) + Math.PI; // opposite direction
    
    const start = this.getEdgeEndpointByAngle(sourceNode, sourceAngle, 0);
    const end = this.getEdgeEndpointByAngle(targetNode, targetAngle, 0);
    
    // Convert to container-relative coordinates
    const relStart = {
      x: start.x - sourceNode.x,
      y: start.y - sourceNode.y
    };
    const relEnd = {
      x: end.x - sourceNode.x,
      y: end.y - sourceNode.y
    };
    
    // Draw orthogonal path
    this._graphics.clear();
    this._registry.drawPath(this._graphics, 'orthogonal', {
      from: relStart,
      to: relEnd,
      sourceDirection: sourceDir,
      targetDirection: targetDir,
      cornerRadius: style.cornerRadius,
    }, style);
    
    // Draw arrows if needed
    const arrowSize = this._data.arrowSize ?? 5;
    const strokeColor = typeof style.stroke === 'string' 
      ? parseInt(style.stroke.replace('#', ''), 16)
      : 0x000000;
    
    const sourceArrow = this._data.arrowSource ?? 'none';
    if (sourceArrow !== 'none') {
      this.drawArrowAtPoint(relStart, sourceAngle, sourceArrow, arrowSize, strokeColor);
    }
    
    const targetArrow = this._data.arrowTarget ?? 'triangle';
    if (targetArrow !== 'none') {
      this.drawArrowAtPoint(relEnd, targetAngle - Math.PI, targetArrow, arrowSize, strokeColor);
    }
  }

  /**
   * Infer direction based on relative positions
   */
  protected inferDirection(source: any, target: any, end: 'source' | 'target'): Direction {
    const dx = target.x - source.x;
    const dy = target.y - source.y;

    if (end === 'source') {
      // Source exits in the direction of the target
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'right' : 'left';
      } else {
        return dy > 0 ? 'bottom' : 'top';
      }
    } else {
      // Target enters from the opposite direction
      if (Math.abs(dx) > Math.abs(dy)) {
        return dx > 0 ? 'left' : 'right';
      } else {
        return dy > 0 ? 'top' : 'bottom';
      }
    }
  }

  /**
   * Convert direction to angle
   */
  protected directionToAngle(direction: Direction): number {
    switch (direction) {
      case 'right': return 0;
      case 'bottom': return Math.PI / 2;
      case 'left': return Math.PI;
      case 'top': return -Math.PI / 2;
      default: return 0;
    }
  }
}


