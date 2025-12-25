/**
 * Base Edge Shape - Abstract class for all edge shapes
 */

import { Container, Graphics } from 'pixi.js';
import type {
  AnimationConfig,
  ArrowHeadConfig,
  EdgeData,
  EdgeShapeType,
  EdgeState,
  EdgeStyle,
  Point,
} from '../../types/index.js';
import { Label, getLabelRenderer } from '../../labels/index.js';
import type { EdgeLabelPosition, LabelStyle } from '../../labels/index.js';

export interface EdgeShapeConfig {
  data: EdgeData;
  style?: Partial<EdgeStyle>;
}

export interface EdgeEndpoints {
  source: Point;
  target: Point;
}

export abstract class BaseEdgeShape<T = Record<string, unknown>> {
  readonly id: string;
  readonly type: EdgeShapeType;

  protected _data: EdgeData<T>;
  protected _style: EdgeStyle;
  protected _states: Set<EdgeState> = new Set(['default']);
  protected _stateStyles: Map<EdgeState, Partial<EdgeStyle>> = new Map();

  // PixiJS display objects
  protected _container: Container;
  protected _graphics: Graphics;
  protected _label: Label | null = null;
  protected _labelConfig: {
    position: EdgeLabelPosition;
    offset: { x: number; y: number };
    stateStyles: Record<string, Partial<LabelStyle> | undefined>;
  } | null = null;
  protected _sourceArrow: Graphics | null = null;
  protected _targetArrow: Graphics | null = null;

  // Endpoints (set by parent canvas based on node positions)
  protected _endpoints: EdgeEndpoints = {
    source: { x: 0, y: 0 },
    target: { x: 100, y: 100 },
  };

  // Control points for bezier curves (used for label positioning)
  protected _controlPoints: Point[] = [];

  // Animation
  protected _animation: AnimationConfig | null = null;
  protected _animationTime = 0;

  constructor(config: EdgeShapeConfig) {
    this._data = config.data as EdgeData<T>;
    this.id = config.data.id;
    this.type = config.data.style?.type ?? 'straight';

    // Initialize default style
    this._style = this._getDefaultStyle();
    if (config.style) {
      Object.assign(this._style, config.style);
    }
    if (config.data.style) {
      Object.assign(this._style, config.data.style);
    }

    // Create container
    this._container = new Container();
    this._container.label = `edge-${this.id}`;
    this._container.eventMode = 'static';
    this._container.cursor = 'pointer';

    // Create graphics
    this._graphics = new Graphics();
    this._container.addChild(this._graphics);

    // Initialize state styles from data
    if (config.data.states) {
      for (const [state, style] of Object.entries(config.data.states)) {
        if (style) {
          this._stateStyles.set(state as EdgeState, style);
        }
      }
    }
  }

  // ============================================================================
  // Abstract Methods
  // ============================================================================

  /**
   * Draw the edge shape
   */
  abstract draw(): void;

  /**
   * Get default style for this edge type
   */
  protected abstract _getDefaultStyle(): EdgeStyle;

  /**
   * Calculate path for the edge
   */
  protected abstract _calculatePath(): Point[];

  // ============================================================================
  // Public API
  // ============================================================================

  get container(): Container {
    return this._container;
  }

  get data(): EdgeData<T> {
    return this._data;
  }

  get source(): string {
    return this._data.source;
  }

  get target(): string {
    return this._data.target;
  }

  get endpoints(): EdgeEndpoints {
    return { ...this._endpoints };
  }

  get style(): EdgeStyle {
    return { ...this._style };
  }

  get states(): EdgeState[] {
    return Array.from(this._states);
  }

  // ============================================================================
  // Endpoints
  // ============================================================================

  setEndpoints(source: Point, target: Point): void {
    this._endpoints = { source: { ...source }, target: { ...target } };
    this.draw();
  }

  // ============================================================================
  // Style
  // ============================================================================

  setStyle(style: Partial<EdgeStyle>): void {
    Object.assign(this._style, style);
    this.draw();
  }

  setStateStyle(state: EdgeState, style: Partial<EdgeStyle>): void {
    this._stateStyles.set(state, style);
    if (this._states.has(state)) {
      this.draw();
    }
  }

  /**
   * Get computed style based on current states
   */
  getComputedStyle(): EdgeStyle {
    const computed = { ...this._style };

    // Apply state styles in order of priority
    const statePriority: EdgeState[] = [
      'disabled',
      'locked',
      'muted',
      'highlighted',
      'selected',
      'clicked',
      'hovered',
    ];

    for (const state of statePriority) {
      if (this._states.has(state)) {
        const stateStyle = this._stateStyles.get(state);
        if (stateStyle) {
          Object.assign(computed, stateStyle);
        }
      }
    }

    return computed;
  }

  // ============================================================================
  // States
  // ============================================================================

  addState(state: EdgeState): void {
    if (this._states.has(state)) return;
    this._states.delete('default');
    this._states.add(state);
    this.draw();
  }

  removeState(state: EdgeState): void {
    if (!this._states.has(state)) return;
    this._states.delete(state);
    if (this._states.size === 0) {
      this._states.add('default');
    }
    this.draw();
  }

  hasState(state: EdgeState): boolean {
    return this._states.has(state);
  }

  setStates(states: EdgeState[]): void {
    this._states.clear();
    for (const state of states) {
      this._states.add(state);
    }
    if (this._states.size === 0) {
      this._states.add('default');
    }
    this.draw();
  }

  clearStates(): void {
    this._states.clear();
    this._states.add('default');
    this.draw();
  }

  // ============================================================================
  // Arrow Heads
  // ============================================================================

  protected _drawArrowHead(
    graphics: Graphics,
    position: Point,
    angle: number,
    config: ArrowHeadConfig,
  ): void {
    if (config.type === 'none') return;

    const size = config.size ?? 10;
    const fill = config.fill ?? this.getComputedStyle().stroke ?? '#999999';
    const stroke = config.stroke ?? fill;
    const strokeWidth = config.strokeWidth ?? 1;

    graphics.clear();

    switch (config.type) {
      case 'triangle':
      case 'triangleFilled':
        {
          const points = [
            0,
            0,
            -size,
            -size / 2,
            -size,
            size / 2,
          ];
          graphics.poly(points);
          if (config.type === 'triangleFilled') {
            graphics.fill({ color: fill });
          } else {
            graphics.stroke({ color: stroke, width: strokeWidth });
          }
        }
        break;

      case 'circle':
      case 'circleFilled':
        graphics.circle(-size / 2, 0, size / 2);
        if (config.type === 'circleFilled') {
          graphics.fill({ color: fill });
        } else {
          graphics.stroke({ color: stroke, width: strokeWidth });
        }
        break;

      case 'square':
      case 'squareFilled':
        graphics.rect(-size, -size / 2, size, size);
        if (config.type === 'squareFilled') {
          graphics.fill({ color: fill });
        } else {
          graphics.stroke({ color: stroke, width: strokeWidth });
        }
        break;

      case 'diamond':
      case 'diamondFilled':
        {
          const halfSize = size / 2;
          const points = [0, 0, -halfSize, -halfSize, -size, 0, -halfSize, halfSize];
          graphics.poly(points);
          if (config.type === 'diamondFilled') {
            graphics.fill({ color: fill });
          } else {
            graphics.stroke({ color: stroke, width: strokeWidth });
          }
        }
        break;

      case 'chevron':
        {
          const halfSize = size / 2;
          graphics.moveTo(-size, -halfSize);
          graphics.lineTo(0, 0);
          graphics.lineTo(-size, halfSize);
          graphics.stroke({ color: stroke, width: strokeWidth });
        }
        break;
    }

    graphics.position.set(position.x, position.y);
    graphics.rotation = angle;
  }

  // ============================================================================
  // Label
  // ============================================================================

  protected _drawLabel(): void {
    const style = this.getComputedStyle();
    const labelStyle = style.label;
    const labelRenderer = getLabelRenderer();

    // Check if labels should be shown (zoom-based visibility)
    const shouldShow = labelRenderer.shouldShowLabels();

    if (!labelStyle?.visible || !labelStyle.text || !shouldShow) {
      if (this._label) {
        this._label.visible = false;
      }
      return;
    }

    // Helper to convert padding
    const getPadding = (p: number | { x: number; y: number } | undefined): { x: number; y: number } => {
      if (!p) return { x: 3, y: 1 };
      if (typeof p === 'number') return { x: p, y: p };
      return p;
    };

    // Create label if needed
    if (!this._label) {
      this._label = labelRenderer.createEdgeLabel({
        text: labelStyle.text,
        position: (labelStyle.position as EdgeLabelPosition) ?? 'middle',
        style: {
          fontSize: labelStyle.fontSize ?? 10,
          fontFamily: labelStyle.fontFamily ?? 'Arial, sans-serif',
          fontWeight: labelStyle.fontWeight ?? 'normal',
          textColor: labelStyle.textColor ?? '#666666',
          visible: true,
          backgroundColor: labelStyle.backgroundColor ?? null,
          padding: getPadding(labelStyle.padding),
          borderRadius: labelStyle.borderRadius ?? 2,
          borderColor: labelStyle.borderColor ?? null,
          borderWidth: labelStyle.borderWidth ?? 0,
          resolution: labelStyle.resolution ?? 1,
        },
      });
      this._container.addChild(this._label.container);

      // Store label config
      this._labelConfig = {
        position: (labelStyle.position as EdgeLabelPosition) ?? 'middle',
        offset: {
          x: labelStyle.offsetX ?? 0,
          y: labelStyle.offsetY ?? 0,
        },
        stateStyles: {},
      };
    } else {
      // Update label text
      this._label.setText(labelStyle.text);
      this._label.visible = true;
    }

    // Get merged style based on current states
    const activeStates = Array.from(this._states);
    const baseLabelStyle: Partial<LabelStyle> = {
      fontSize: labelStyle.fontSize ?? 10,
      textColor: labelStyle.textColor ?? '#666666',
    };

    // Build state styles for label
    const labelStateStyles: Record<string, Partial<LabelStyle> | undefined> = {};
    
    for (const state of activeStates) {
      const stateEdgeStyle = this._stateStyles.get(state);
      if (stateEdgeStyle?.label) {
        labelStateStyles[state] = {
          fontSize: stateEdgeStyle.label.fontSize,
          textColor: stateEdgeStyle.label.textColor,
          fontWeight: stateEdgeStyle.label.fontWeight,
        };
      }
    }

    // Apply merged styles
    const mergedLabelStyle = labelRenderer.getMergedStyle(
      baseLabelStyle,
      labelStateStyles,
      activeStates,
    );
    this._label.setStyle(mergedLabelStyle);

    // Position the label on the edge path
    const position = this._labelConfig?.position ?? 'middle';
    const offset = this._labelConfig?.offset ?? { x: 0, y: 0 };

    labelRenderer.positionEdgeLabel(
      this._label,
      {
        source: this._endpoints.source,
        target: this._endpoints.target,
        controlPoints: this._controlPoints,
      },
      position,
      offset,
    );
  }

  /**
   * Set label configuration
   */
  setLabel(
    text: string,
    position: EdgeLabelPosition = 'middle',
    style?: Partial<LabelStyle>,
  ): void {
    this._style.label = {
      ...this._style.label,
      text,
      position,
      visible: true,
      ...style,
    };
    this.draw();
  }

  /**
   * Hide the label
   */
  hideLabel(): void {
    if (this._label) {
      this._label.visible = false;
    }
    if (this._style.label) {
      this._style.label.visible = false;
    }
  }

  /**
   * Show the label
   */
  showLabel(): void {
    if (this._style.label) {
      this._style.label.visible = true;
      this.draw();
    }
  }

  // ============================================================================
  // Hit Test
  // ============================================================================

  hitTest(x: number, y: number, tolerance = 5): boolean {
    const path = this._calculatePath();
    if (path.length < 2) return false;

    // Check distance to each line segment
    for (let i = 0; i < path.length - 1; i++) {
      const p1 = path[i]!;
      const p2 = path[i + 1]!;
      const dist = this._pointToLineDistance({ x, y }, p1, p2);
      if (dist <= tolerance) return true;
    }

    return false;
  }

  private _pointToLineDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      // Line is a point
      const pdx = point.x - lineStart.x;
      const pdy = point.y - lineStart.y;
      return Math.sqrt(pdx * pdx + pdy * pdy);
    }

    // Project point onto line
    const t = Math.max(
      0,
      Math.min(
        1,
        ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSq,
      ),
    );

    const projX = lineStart.x + t * dx;
    const projY = lineStart.y + t * dy;
    const pdx = point.x - projX;
    const pdy = point.y - projY;

    return Math.sqrt(pdx * pdx + pdy * pdy);
  }

  // ============================================================================
  // Animation
  // ============================================================================

  animate(config: AnimationConfig): void {
    this._animation = config;
    this._animationTime = 0;
  }

  stopAnimation(): void {
    this._animation = null;
    this._animationTime = 0;
    this._container.alpha = this.getComputedStyle().opacity ?? 1;
  }

  updateAnimation(deltaTime: number): void {
    if (!this._animation || this._animation.type === 'none') return;

    this._animationTime += deltaTime;
    const duration = this._animation.duration ?? 1000;
    const intensity = this._animation.intensity ?? 1;

    const progress = (this._animationTime % duration) / duration;
    const easedProgress = Math.sin(progress * Math.PI * 2);
    const baseOpacity = this.getComputedStyle().opacity ?? 1;

    switch (this._animation.type) {
      case 'pulse':
        this._graphics.scale.set(1 + easedProgress * 0.1 * intensity);
        break;

      case 'blink':
        this._container.alpha = Math.sin(progress * Math.PI) > 0 ? baseOpacity : 0.2;
        break;

      case 'glow':
        this._container.alpha = baseOpacity - Math.sin(progress * Math.PI) * 0.3 * intensity;
        break;
    }

    // Check if animation should stop
    if (this._animation.loop === false && this._animationTime >= duration) {
      this.stopAnimation();
    } else if (
      typeof this._animation.loop === 'number' &&
      this._animationTime >= duration * this._animation.loop
    ) {
      this.stopAnimation();
    }
  }

  // ============================================================================
  // Data
  // ============================================================================

  updateData(data: Partial<EdgeData<T>>): void {
    Object.assign(this._data, data);

    if (data.style) {
      this.setStyle(data.style);
    }

    if (data.label !== undefined) {
      this._style.label = {
        ...this._style.label,
        text: data.label,
        visible: true,
      };
      this.draw();
    }
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  destroy(): void {
    this._label?.destroy();
    this._label = null;
    this._labelConfig = null;
    this._sourceArrow?.destroy();
    this._targetArrow?.destroy();
    this._graphics.destroy();
    this._container.destroy({ children: true });
  }
}
