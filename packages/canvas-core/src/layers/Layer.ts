/**
 * Layer - A container for organizing graphics at a specific z-index
 */

import { Container, Graphics } from 'pixi.js';
import type { LayerConfig, LayerType } from '../types';

export class Layer {
  public readonly name: string;
  public readonly type: LayerType;
  public readonly container: Container;
  
  private _visible: boolean;
  private _interactive: boolean;
  private _zIndex: number;

  constructor(config: LayerConfig) {
    this.name = config.name;
    this.type = config.type;
    this._zIndex = config.zIndex;
    this._visible = config.visible ?? true;
    this._interactive = config.interactive ?? true;

    this.container = new Container();
    this.container.label = `layer:${this.name}`;
    this.container.sortableChildren = true;
    this.container.zIndex = this._zIndex;
    this.container.visible = this._visible;
    this.container.interactive = this._interactive;
    this.container.interactiveChildren = this._interactive;
  }

  get zIndex(): number {
    return this._zIndex;
  }

  set zIndex(value: number) {
    this._zIndex = value;
    this.container.zIndex = value;
  }

  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
    this.container.visible = value;
  }

  get interactive(): boolean {
    return this._interactive;
  }

  set interactive(value: boolean) {
    this._interactive = value;
    this.container.interactive = value;
    this.container.interactiveChildren = value;
  }

  /**
   * Add a child container/graphics to this layer
   */
  add(child: Container): void {
    this.container.addChild(child);
  }

  /**
   * Remove a child from this layer
   */
  remove(child: Container): void {
    this.container.removeChild(child);
  }

  /**
   * Remove all children from this layer
   */
  clear(): void {
    this.container.removeChildren();
  }

  /**
   * Get all children in this layer
   */
  getChildren(): Container[] {
    return this.container.children as Container[];
  }

  /**
   * Create a Graphics drawing surface, add it to this layer, and return it.
   * Use this instead of importing Graphics directly from pixi.js in plugin code.
   */
  createGraphicsSurface(label?: string): Graphics {
    const g = new Graphics();
    g.label = label ?? `${this.name}-graphics`;
    g.eventMode = 'none';
    this.container.addChild(g);
    return g;
  }

  /**
   * Destroy the layer and all its contents
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
