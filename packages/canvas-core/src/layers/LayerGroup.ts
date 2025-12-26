/**
 * LayerGroup - A group of related layers (e.g., node shapes + labels)
 */

import { Layer } from './Layer';

export class LayerGroup {
  private _id: string;
  private _baseZIndex: number;
  private _layers: Map<string, Layer> = new Map();

  constructor(id: string, baseZIndex: number) {
    this._id = id;
    this._baseZIndex = baseZIndex;
  }

  get id(): string {
    return this._id;
  }

  get baseZIndex(): number {
    return this._baseZIndex;
  }

  /**
   * Create a new layer in this group
   */
  createLayer(name: string, zIndex: number): Layer {
    const fullName = `${this._id}:${name}`;
    const layer = new Layer({
      name: fullName,
      type: 'custom',
      zIndex,
      visible: true,
      interactive: true,
    });
    
    // Disable sorting within layer for performance
    layer.container.sortableChildren = false;
    
    this._layers.set(name, layer);
    return layer;
  }

  /**
   * Get a layer by name
   */
  getLayer(name: string): Layer | undefined {
    return this._layers.get(name);
  }

  /**
   * Get all layers in this group
   */
  getAllLayers(): Layer[] {
    return Array.from(this._layers.values());
  }

  /**
   * Show/hide all layers in group
   */
  setVisible(visible: boolean): void {
    this._layers.forEach(layer => {
      layer.visible = visible;
    });
  }

  /**
   * Set interactive state for all layers
   */
  setInteractive(interactive: boolean): void {
    this._layers.forEach(layer => {
      layer.interactive = interactive;
    });
  }

  /**
   * Clear all layers in group
   */
  clear(): void {
    this._layers.forEach(layer => layer.clear());
  }

  /**
   * Destroy this group and all its layers
   */
  destroy(): void {
    this._layers.forEach(layer => layer.clear());
    this._layers.clear();
  }
}
