/**
 * RendererBase
 * 
 * Abstract base class for all visual shapes on the canvas.
 * Provides common functionality for rendering, interaction, and updates.
 * 
 * ## Architecture
 * 
 * All shapes extend RendererBase and implement:
 * - `render()`: Draw the shape using primitives
 * - `update()`: Handle state changes
 * 
 * Shapes use the Registry to access drawing primitives, ensuring
 * all PixiJS Graphics calls are isolated to the primitives module.
 */

import { Container, Graphics, Text } from 'pixi.js';
import type { Registry } from '../rendering/Registry';
import type { ShapeStyle } from '../primitives/shapes';

/**
 * Base data for any shape
 */
export interface RendererBaseData {
  id: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

/**
 * Base style for any shape
 */
export interface RendererBaseStyle extends ShapeStyle {
  visible?: boolean;
  alpha?: number;
  cursor?: string;
}

/**
 * Options for creating a shape
 */
export interface RendererBaseOptions<TData extends RendererBaseData = RendererBaseData> {
  data: TData;
  style?: RendererBaseStyle;
  registry: Registry;
  interactive?: boolean;
}

/**
 * Abstract base class for visual shapes
 */
export abstract class RendererBase<TData extends RendererBaseData = RendererBaseData> extends Container {
  protected _data: TData;
  protected _style: RendererBaseStyle;
  protected _registry: Registry;
  protected _graphics: Graphics;
  protected _labels: Map<string, Text> = new Map();
  protected _dirty: boolean = true;

  constructor(options: RendererBaseOptions<TData>) {
    super();

    this._data = options.data;
    this._style = options.style ?? {};
    this._registry = options.registry;

    // Create main graphics container
    this._graphics = new Graphics();
    this.addChild(this._graphics);

    // Set position from data
    this.x = this._data.x;
    this.y = this._data.y;

    // Interactive settings
    if (options.interactive ?? true) {
      this.eventMode = 'static';
      this.cursor = this._style.cursor ?? 'pointer';
    }

    // Apply visibility and alpha
    this.visible = this._style.visible ?? true;
    this.alpha = this._style.alpha ?? 1;
  }

  // =========================================================================
  // ABSTRACT METHODS
  // =========================================================================

  /**
   * Render the shape - implement in subclass
   */
  protected abstract render(): void;

  // =========================================================================
  // PROPERTIES
  // =========================================================================

  get id(): string {
    return this._data.id;
  }

  get data(): TData {
    return this._data;
  }

  set data(value: TData) {
    this._data = value;
    this.markDirty();
  }

  get style(): RendererBaseStyle {
    return this._style;
  }

  set style(value: RendererBaseStyle) {
    this._style = value;
    this.markDirty();
  }

  get graphics(): Graphics {
    return this._graphics;
  }

  get registry(): Registry {
    return this._registry;
  }

  // =========================================================================
  // PUBLIC METHODS
  // =========================================================================

  /**
   * Update the shape data
   */
  updateData(data: Partial<TData>): void {
    this._data = { ...this._data, ...data };
    
    // Update position if changed
    if (data.x !== undefined) this.x = data.x;
    if (data.y !== undefined) this.y = data.y;
    
    this.markDirty();
  }

  /**
   * Update the shape style
   */
  updateStyle(style: Partial<RendererBaseStyle>): void {
    this._style = { ...this._style, ...style };
    
    if (style.visible !== undefined) this.visible = style.visible;
    if (style.alpha !== undefined) this.alpha = style.alpha;
    if (style.cursor !== undefined) this.cursor = style.cursor;
    
    this.markDirty();
  }

  /**
   * Mark the shape as needing re-render
   */
  markDirty(): void {
    this._dirty = true;
  }

  /**
   * Update the shape if dirty
   */
  update(): void {
    if (this._dirty) {
      this._graphics.clear();
      this.render();
      this._dirty = false;
    }
  }

  /**
   * Force immediate re-render
   */
  forceRender(): void {
    this._graphics.clear();
    this.render();
    this._dirty = false;
  }

  /**
   * Get bounding box
   */
  getBoundingBox(): { x: number; y: number; width: number; height: number } {
    const bounds = this.getBounds();
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    };
  }

  /**
   * Check if point is inside shape
   */
  containsPoint(x: number, y: number): boolean {
    const local = this.toLocal({ x, y });
    const bounds = this._graphics.getLocalBounds();
    return (
      local.x >= bounds.x &&
      local.x <= bounds.x + bounds.width &&
      local.y >= bounds.y &&
      local.y <= bounds.y + bounds.height
    );
  }

  // =========================================================================
  // LABEL MANAGEMENT
  // =========================================================================

  /**
   * Add a label to the shape
   */
  addLabel(key: string, text: Text): void {
    if (this._labels.has(key)) {
      this.removeLabel(key);
    }
    this._labels.set(key, text);
    this.addChild(text);
  }

  /**
   * Get a label by key
   */
  getLabel(key: string): Text | undefined {
    return this._labels.get(key);
  }

  /**
   * Remove a label by key
   */
  removeLabel(key: string): void {
    const label = this._labels.get(key);
    if (label) {
      this.removeChild(label);
      label.destroy();
      this._labels.delete(key);
    }
  }

  /**
   * Clear all labels
   */
  clearLabels(): void {
    this._labels.forEach((label) => {
      this.removeChild(label);
      label.destroy();
    });
    this._labels.clear();
  }

  // =========================================================================
  // CLEANUP
  // =========================================================================

  /**
   * Destroy the shape
   */
  destroy(): void {
    this.clearLabels();
    this._graphics.destroy();
    super.destroy({ children: true });
  }
}
