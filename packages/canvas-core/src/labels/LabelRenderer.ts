/**
 * LabelRenderer - Centralized factory for creating and managing labels
 */

import { Label } from './Label.js';
import type {
  LabelStyle,
  NodeLabelConfig,
  EdgeLabelConfig,
  NodeLabelPosition,
  EdgeLabelPosition,
} from './types.js';
import { DEFAULT_NODE_LABEL_STYLE, DEFAULT_EDGE_LABEL_STYLE } from './types.js';

export interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface EdgePath {
  source: { x: number; y: number };
  target: { x: number; y: number };
  controlPoints?: { x: number; y: number }[];
}

export class LabelRenderer {
  private static _instance: LabelRenderer | null = null;

  // Configuration
  private _minZoomForLabels = 0.3;
  private _currentZoom = 1;

  private constructor() {}

  static getInstance(): LabelRenderer {
    if (!LabelRenderer._instance) {
      LabelRenderer._instance = new LabelRenderer();
    }
    return LabelRenderer._instance;
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  setZoom(zoom: number): void {
    this._currentZoom = zoom;
  }

  setMinZoomForLabels(minZoom: number): void {
    this._minZoomForLabels = minZoom;
  }

  shouldShowLabels(): boolean {
    return this._currentZoom >= this._minZoomForLabels;
  }

  // ============================================================================
  // Factory Methods
  // ============================================================================

  createNodeLabel(config: NodeLabelConfig): Label {
    const style: Partial<LabelStyle> = {
      ...DEFAULT_NODE_LABEL_STYLE,
      ...config.style,
    };
    return new Label(config.text, style);
  }

  createEdgeLabel(config: EdgeLabelConfig): Label {
    const style: Partial<LabelStyle> = {
      ...DEFAULT_EDGE_LABEL_STYLE,
      ...config.style,
    };
    return new Label(config.text, style);
  }

  // ============================================================================
  // Node Label Positioning
  // ============================================================================

  /**
   * Calculate the position for a node label based on node bounds and position setting
   */
  calculateNodeLabelPosition(
    label: Label,
    nodeBounds: NodeBounds,
    position: NodeLabelPosition,
    offset: { x: number; y: number } = { x: 0, y: 0 },
  ): { x: number; y: number } {
    const nodeCenter = {
      x: nodeBounds.x,
      y: nodeBounds.y,
    };
    const nodeRadius = Math.max(nodeBounds.width, nodeBounds.height) / 2;
    const labelWidth = label.width;
    const labelHeight = label.height;
    const gap = 4; // Gap between node and label

    let x: number;
    let y: number;

    switch (position) {
      case 'center':
        x = nodeCenter.x - labelWidth / 2;
        y = nodeCenter.y - labelHeight / 2;
        break;

      case 'top':
        x = nodeCenter.x - labelWidth / 2;
        y = nodeCenter.y - nodeRadius - labelHeight - gap;
        break;

      case 'bottom':
        x = nodeCenter.x - labelWidth / 2;
        y = nodeCenter.y + nodeRadius + gap;
        break;

      case 'left':
        x = nodeCenter.x - nodeRadius - labelWidth - gap;
        y = nodeCenter.y - labelHeight / 2;
        break;

      case 'right':
        x = nodeCenter.x + nodeRadius + gap;
        y = nodeCenter.y - labelHeight / 2;
        break;

      case 'top-left':
        x = nodeCenter.x - nodeRadius - labelWidth / 2;
        y = nodeCenter.y - nodeRadius - labelHeight;
        break;

      case 'top-right':
        x = nodeCenter.x + nodeRadius - labelWidth / 2;
        y = nodeCenter.y - nodeRadius - labelHeight;
        break;

      case 'bottom-left':
        x = nodeCenter.x - nodeRadius - labelWidth / 2;
        y = nodeCenter.y + nodeRadius;
        break;

      case 'bottom-right':
        x = nodeCenter.x + nodeRadius - labelWidth / 2;
        y = nodeCenter.y + nodeRadius;
        break;

      default:
        x = nodeCenter.x - labelWidth / 2;
        y = nodeCenter.y + nodeRadius + gap;
    }

    return {
      x: x + offset.x,
      y: y + offset.y,
    };
  }

  /**
   * Position a node label
   */
  positionNodeLabel(
    label: Label,
    nodeBounds: NodeBounds,
    position: NodeLabelPosition,
    offset: { x: number; y: number } = { x: 0, y: 0 },
  ): void {
    const pos = this.calculateNodeLabelPosition(label, nodeBounds, position, offset);
    label.setPosition(pos.x, pos.y);
  }

  // ============================================================================
  // Edge Label Positioning
  // ============================================================================

  /**
   * Calculate position along an edge path
   */
  calculateEdgeLabelPosition(
    label: Label,
    path: EdgePath,
    position: EdgeLabelPosition,
    offset: { x: number; y: number } = { x: 0, y: 0 },
  ): { x: number; y: number; angle: number } {
    const labelWidth = label.width;
    const labelHeight = label.height;

    let point: { x: number; y: number };
    let angle = 0;

    // Calculate point on path based on position
    switch (position) {
      case 'start':
        point = this._getPointOnPath(path, 0.15);
        break;

      case 'end':
        point = this._getPointOnPath(path, 0.85);
        break;

      case 'middle':
      default:
        point = this._getPointOnPath(path, 0.5);
        break;
    }

    // Calculate angle for edge alignment (optional)
    const dx = path.target.x - path.source.x;
    const dy = path.target.y - path.source.y;
    angle = Math.atan2(dy, dx);

    return {
      x: point.x - labelWidth / 2 + offset.x,
      y: point.y - labelHeight / 2 + offset.y,
      angle,
    };
  }

  /**
   * Position an edge label
   */
  positionEdgeLabel(
    label: Label,
    path: EdgePath,
    position: EdgeLabelPosition,
    offset: { x: number; y: number } = { x: 0, y: 0 },
  ): void {
    const pos = this.calculateEdgeLabelPosition(label, path, position, offset);
    label.setPosition(pos.x, pos.y);
  }

  // ============================================================================
  // State-Based Styling
  // ============================================================================

  /**
   * Get merged style based on current states
   */
  getMergedStyle(
    baseStyle: Partial<LabelStyle>,
    stateStyles: Record<string, Partial<LabelStyle> | undefined>,
    activeStates: string[],
  ): Partial<LabelStyle> {
    let merged = { ...baseStyle };

    // Apply state styles in priority order
    const statePriority = ['muted', 'default', 'hovered', 'highlighted', 'selected'];

    for (const state of statePriority) {
      if (activeStates.includes(state) && stateStyles[state]) {
        merged = { ...merged, ...stateStyles[state] };
      }
    }

    return merged;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Get a point along a path at a given t (0-1)
   */
  private _getPointOnPath(path: EdgePath, t: number): { x: number; y: number } {
    const { source, target, controlPoints } = path;

    if (!controlPoints || controlPoints.length === 0) {
      // Linear interpolation for straight lines
      return {
        x: source.x + (target.x - source.x) * t,
        y: source.y + (target.y - source.y) * t,
      };
    }

    if (controlPoints.length === 1) {
      // Quadratic bezier
      const cp = controlPoints[0]!;
      const mt = 1 - t;
      return {
        x: mt * mt * source.x + 2 * mt * t * cp.x + t * t * target.x,
        y: mt * mt * source.y + 2 * mt * t * cp.y + t * t * target.y,
      };
    }

    if (controlPoints.length >= 2) {
      // Cubic bezier
      const cp1 = controlPoints[0]!;
      const cp2 = controlPoints[1]!;
      const mt = 1 - t;
      const mt2 = mt * mt;
      const mt3 = mt2 * mt;
      const t2 = t * t;
      const t3 = t2 * t;
      return {
        x: mt3 * source.x + 3 * mt2 * t * cp1.x + 3 * mt * t2 * cp2.x + t3 * target.x,
        y: mt3 * source.y + 3 * mt2 * t * cp1.y + 3 * mt * t2 * cp2.y + t3 * target.y,
      };
    }

    // Fallback
    return {
      x: (source.x + target.x) / 2,
      y: (source.y + target.y) / 2,
    };
  }
}

// Export singleton getter
export const getLabelRenderer = (): LabelRenderer => LabelRenderer.getInstance();
