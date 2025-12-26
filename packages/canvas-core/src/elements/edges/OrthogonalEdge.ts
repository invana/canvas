/**
 * OrthogonalEdge
 * 
 * Right-angle orthogonal edge implementation.
 * Draws paths that only use horizontal and vertical segments.
 */

import type { PathStyle, Point, Direction } from '../../primitives/paths';
import { EdgeShapeBase, type EdgeShapeOptions, type EdgeTangents, type EdgePathType } from './EdgeShapeBase';

/**
 * Orthogonal edge options (same as base edge options)
 */
export type OrthogonalEdgeOptions = EdgeShapeOptions;

/**
 * Orthogonal edge with right-angle corners
 */
export class OrthogonalEdge extends EdgeShapeBase {
  get pathType(): EdgePathType {
    return 'orthogonal';
  }

  protected drawPath(source: Point, target: Point, style: PathStyle): void {
    const sourceDir = this._data.sourceDirection ?? this.inferDirection(source, target, 'source');
    const targetDir = this._data.targetDirection ?? this.inferDirection(source, target, 'target');
    
    this._registry.drawPath(this._graphics, 'orthogonal', {
      from: source,
      to: target,
      sourceDirection: sourceDir,
      targetDirection: targetDir,
      cornerRadius: style.cornerRadius,
    }, style);
  }

  protected calculateTangents(source: Point, target: Point): EdgeTangents {
    const sourceDir = this._data.sourceDirection ?? this.inferDirection(source, target, 'source');
    const targetDir = this._data.targetDirection ?? this.inferDirection(source, target, 'target');

    return {
      sourceTangent: this.directionToAngle(sourceDir),
      targetTangent: this.directionToAngle(targetDir),
    };
  }

  /**
   * Infer direction based on relative positions
   */
  protected inferDirection(source: Point, target: Point, end: 'source' | 'target'): Direction {
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


