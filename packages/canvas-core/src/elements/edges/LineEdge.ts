/**
 * LineEdge
 * 
 * Straight line edge implementation following invana-studio-mvp pattern.
 */

import type { PathStyle } from '../../primitives/paths';
import { RendererEdgeBase, type EdgeShapeOptions, type EdgePathType } from './RendererEdgeBase';

export type LineEdgeOptions = EdgeShapeOptions;

export class LineEdge extends RendererEdgeBase {
  get pathType(): EdgePathType {
    return 'line';
  }

  protected renderEdge(sourceNode: any, targetNode: any, style: PathStyle): void {
    // Calculate angle from source to target
    const angle = this.calculateAngle(sourceNode.x, sourceNode.y, targetNode.x, targetNode.y);
    
    // Get edge endpoints at shape boundaries (shortest path)
    const start = this.getEdgeEndpoint(sourceNode, targetNode, 0);
    
    // Target offset includes space for arrow
    const arrowSize = this._data.arrowSize ?? 5;
    const targetArrow = this._data.arrowTarget ?? 'triangle';
    const targetOffset = targetArrow !== 'none' ? 5 : 0;
    const targetIntersection = this.getEdgeEndpoint(targetNode, sourceNode, targetOffset);
    
    // Calculate where line should end (pull back by arrow size if arrow present)
    let end = targetIntersection;
    if (targetArrow !== 'none') {
      const arrowBackDistance = arrowSize * Math.cos(Math.PI / 6); // triangle back distance
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length > 0) {
        end = {
          x: targetIntersection.x - (dx / length) * arrowBackDistance,
          y: targetIntersection.y - (dy / length) * arrowBackDistance
        };
      }
    }
    
    // Draw line (relative to source node center)
    this._graphics.clear();
    this._graphics.moveTo(start.x - sourceNode.x, start.y - sourceNode.y);
    this._graphics.lineTo(end.x - sourceNode.x, end.y - sourceNode.y);
    this._graphics.stroke({
      width: style.strokeWidth ?? 2,
      color: style.stroke ?? '#000000',
    });
    
    // Draw arrows - convert hex string to number for arrows
    const strokeColor = typeof style.stroke === 'string' 
      ? parseInt(style.stroke.replace('#', ''), 16)
      : 0x000000;
    
    const sourceArrow = this._data.arrowSource ?? 'none';
    if (sourceArrow !== 'none') {
      const relStart = { x: start.x - sourceNode.x, y: start.y - sourceNode.y };
      this.drawArrowAtPoint(relStart, angle + Math.PI, sourceArrow, arrowSize, strokeColor);
    }
    
    if (targetArrow !== 'none') {
      const relEnd = { x: end.x - sourceNode.x, y: end.y - sourceNode.y };
      this.drawArrowAtPoint(relEnd, angle, targetArrow, arrowSize, strokeColor);
    }
  }
}
