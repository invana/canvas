/**
 * Base Node Shape - Abstract class for all node shapes
 */

import { Container, Graphics } from 'pixi.js';
import type {
  AnimationConfig,
  Bounds,
  NodeData,
  NodeShapeType,
  NodeState,
  NodeStyle,
} from '../../types/index.js';
import { Label, getLabelRenderer } from '../../labels/index.js';
import type { NodeLabelPosition, LabelStyle } from '../../labels/index.js';

export interface NodeShapeConfig {
  data: NodeData;
  style?: Partial<NodeStyle>;
}

export abstract class BaseNodeShape<T = Record<string, unknown>> {
  readonly id: string;
  readonly type: NodeShapeType;

  protected _data: NodeData<T>;
  protected _style: NodeStyle;
  protected _states: Set<NodeState> = new Set(['default']);
  protected _stateStyles: Map<NodeState, Partial<NodeStyle>> = new Map();

  // PixiJS display objects
  protected _container: Container;
  protected _graphics: Graphics;
  protected _label: Label | null = null;
  protected _labelConfig: {
    position: NodeLabelPosition;
    offset: { x: number; y: number };
    stateStyles: Record<string, Partial<LabelStyle> | undefined>;
  } | null = null;

  // Animation
  protected _animation: AnimationConfig | null = null;
  protected _animationTime = 0;

  constructor(config: NodeShapeConfig) {
    this._data = config.data as NodeData<T>;
    this.id = config.data.id;
    this.type = config.data.style?.shape ?? 'circle';

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
    this._container.label = `node-${this.id}`;
    this._container.eventMode = 'static';
    this._container.cursor = 'pointer';

    // Create graphics
    this._graphics = new Graphics();
    this._container.addChild(this._graphics);

    // Set position
    this._container.position.set(config.data.x ?? 0, config.data.y ?? 0);

    // Initialize state styles from data
    if (config.data.states) {
      for (const [state, style] of Object.entries(config.data.states)) {
        if (style) {
          this._stateStyles.set(state as NodeState, style);
        }
      }
    }
  }

  // ============================================================================
  // Abstract Methods
  // ============================================================================

  /**
   * Draw the node shape
   */
  abstract draw(): void;

  /**
   * Get default style for this shape type
   */
  protected abstract _getDefaultStyle(): NodeStyle;

  /**
   * Hit test for this shape
   */
  abstract hitTest(x: number, y: number): boolean;

  /**
   * Get the intersection point on the node boundary for a given angle
   * Used for calculating where edges connect to nodes
   * @param angle - Angle in radians from node center
   * @param offset - Optional offset from the boundary (positive = outward)
   * @returns Point on the boundary
   */
  abstract getIntersectionPoint(angle: number, offset?: number): { x: number; y: number };

  // ============================================================================
  // Public API
  // ============================================================================

  get container(): Container {
    return this._container;
  }

  get data(): NodeData<T> {
    return this._data;
  }

  get position(): { x: number; y: number } {
    return { x: this._container.x, y: this._container.y };
  }

  get style(): NodeStyle {
    return { ...this._style };
  }

  get states(): NodeState[] {
    return Array.from(this._states);
  }

  // ============================================================================
  // Position
  // ============================================================================

  setPosition(x: number, y: number): void {
    this._data.x = x;
    this._data.y = y;
    this._container.position.set(x, y);
  }

  moveBy(dx: number, dy: number): void {
    this.setPosition(this._container.x + dx, this._container.y + dy);
  }

  // ============================================================================
  // Style
  // ============================================================================

  setStyle(style: Partial<NodeStyle>): void {
    Object.assign(this._style, style);
    this.draw();
  }

  setStateStyle(state: NodeState, style: Partial<NodeStyle>): void {
    this._stateStyles.set(state, style);
    if (this._states.has(state)) {
      this.draw();
    }
  }

  /**
   * Get computed style based on current states
   */
  getComputedStyle(): NodeStyle {
    const computed = { ...this._style };

    // Apply state styles in order of priority
    const statePriority: NodeState[] = [
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

  addState(state: NodeState): void {
    if (this._states.has(state)) return;
    this._states.delete('default');
    this._states.add(state);
    this.draw();
  }

  removeState(state: NodeState): void {
    if (!this._states.has(state)) return;
    this._states.delete(state);
    if (this._states.size === 0) {
      this._states.add('default');
    }
    this.draw();
  }

  hasState(state: NodeState): boolean {
    return this._states.has(state);
  }

  setStates(states: NodeState[]): void {
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
  // Animation
  // ============================================================================

  animate(config: AnimationConfig): void {
    this._animation = config;
    this._animationTime = 0;
  }

  stopAnimation(): void {
    this._animation = null;
    this._animationTime = 0;
    // Reset to normal state
    this._container.scale.set(this.getComputedStyle().scale ?? 1);
    this._container.alpha = this.getComputedStyle().opacity ?? 1;
    this._container.rotation = this.getComputedStyle().rotation ?? 0;
  }

  updateAnimation(deltaTime: number): void {
    if (!this._animation || this._animation.type === 'none') return;

    this._animationTime += deltaTime;
    const duration = this._animation.duration ?? 1000;
    const intensity = this._animation.intensity ?? 1;

    // Calculate progress (0-1)
    let progress = (this._animationTime % duration) / duration;

    // Apply easing (simple sine for now)
    const easedProgress = Math.sin(progress * Math.PI * 2);

    const baseScale = this.getComputedStyle().scale ?? 1;
    const baseOpacity = this.getComputedStyle().opacity ?? 1;

    switch (this._animation.type) {
      case 'pulse':
        this._container.scale.set(baseScale + easedProgress * 0.1 * intensity);
        break;

      case 'breathe':
        this._container.scale.set(baseScale + easedProgress * 0.05 * intensity);
        this._container.alpha = baseOpacity - Math.abs(easedProgress) * 0.2 * intensity;
        break;

      case 'shake':
        this._container.position.x =
          (this._data.x ?? 0) + Math.sin(progress * Math.PI * 8) * 3 * intensity;
        break;

      case 'bounce':
        this._container.position.y =
          (this._data.y ?? 0) - Math.abs(Math.sin(progress * Math.PI)) * 10 * intensity;
        break;

      case 'rotate':
        this._container.rotation = progress * Math.PI * 2;
        break;

      case 'blink':
        this._container.alpha = Math.sin(progress * Math.PI) > 0 ? baseOpacity : 0.2;
        break;

      case 'ripple':
        // Ripple would need additional graphics - simplified version
        this._container.scale.set(baseScale + Math.sin(progress * Math.PI) * 0.15 * intensity);
        break;

      case 'glow':
        // Glow would need filter support - simplified version
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
      if (!p) return { x: 4, y: 2 };
      if (typeof p === 'number') return { x: p, y: p };
      return p;
    };

    // Create label if needed
    if (!this._label) {
      this._label = labelRenderer.createNodeLabel({
        text: labelStyle.text,
        position: (labelStyle.position as NodeLabelPosition) ?? 'bottom',
        style: {
          fontSize: labelStyle.fontSize ?? 11,
          fontFamily: labelStyle.fontFamily ?? 'Arial, sans-serif',
          fontWeight: labelStyle.fontWeight ?? 'normal',
          textColor: labelStyle.textColor ?? '#333333',
          visible: true,
          // Background styling
          backgroundColor: labelStyle.backgroundColor ?? null,
          padding: getPadding(labelStyle.padding),
          borderRadius: labelStyle.borderRadius ?? 3,
          borderColor: labelStyle.borderColor ?? null,
          borderWidth: labelStyle.borderWidth ?? 0,
          resolution: labelStyle.resolution ?? 1,
          truncate: labelStyle.truncate ?? false,
          truncateLength: labelStyle.truncateLength ?? 20,
        },
      });
      this._container.addChild(this._label.container);

      // Store label config
      this._labelConfig = {
        position: (labelStyle.position as NodeLabelPosition) ?? 'bottom',
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
      fontSize: labelStyle.fontSize ?? 11,
      textColor: labelStyle.textColor ?? '#333333',
    };

    // Build state styles for label
    const labelStateStyles: Record<string, Partial<LabelStyle> | undefined> = {};
    
    // Check for state-specific label styling
    for (const state of activeStates) {
      const stateNodeStyle = this._stateStyles.get(state);
      if (stateNodeStyle?.label) {
        labelStateStyles[state] = {
          fontSize: stateNodeStyle.label.fontSize,
          textColor: stateNodeStyle.label.textColor,
          fontWeight: stateNodeStyle.label.fontWeight,
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

    // Position the label
    const bounds = this.getBounds();
    const position = this._labelConfig?.position ?? 'bottom';
    const offset = this._labelConfig?.offset ?? { x: 0, y: 0 };

    labelRenderer.positionNodeLabel(
      this._label,
      {
        x: 0, // Label is relative to container (which is at node position)
        y: 0,
        width: bounds.width,
        height: bounds.height,
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
    position: NodeLabelPosition = 'bottom',
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
  // Bounds
  // ============================================================================

  getBounds(): Bounds {
    const style = this.getComputedStyle();
    const size = style.size ?? 20;
    const width = style.width ?? size;
    const height = style.height ?? size;

    return {
      x: this._container.x - width / 2,
      y: this._container.y - height / 2,
      width,
      height,
    };
  }

  // ============================================================================
  // Data
  // ============================================================================

  updateData(data: Partial<NodeData<T>>): void {
    Object.assign(this._data, data);

    if (data.x !== undefined || data.y !== undefined) {
      this.setPosition(this._data.x ?? 0, this._data.y ?? 0);
    }

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
    this._graphics.destroy();
    this._container.destroy({ children: true });
  }
}
