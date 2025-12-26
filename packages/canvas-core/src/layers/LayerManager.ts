/**
 * LayerManager - Manages multiple layers with z-index ordering
 */

import { Container } from 'pixi.js';
import { Layer } from './Layer';
import type { LayerConfig, LayerType } from '../types';

const DEFAULT_LAYERS: LayerConfig[] = [
  { name: 'background', type: 'background', zIndex: 0, visible: true, interactive: false },
  { name: 'edges', type: 'edges', zIndex: 100, visible: true, interactive: true },
  { name: 'nodes', type: 'nodes', zIndex: 200, visible: true, interactive: true },
  { name: 'labels', type: 'labels', zIndex: 300, visible: true, interactive: false },
  { name: 'overlay', type: 'overlay', zIndex: 400, visible: true, interactive: true },
];

export class LayerManager {
  private readonly layers: Map<string, Layer> = new Map();
  private readonly root: Container;

  constructor(rootContainer: Container, configs?: LayerConfig[]) {
    this.root = rootContainer;
    this.root.sortableChildren = true;

    // Initialize with default or custom layers
    const layerConfigs = configs ?? DEFAULT_LAYERS;
    for (const config of layerConfigs) {
      this.createLayer(config);
    }
  }

  /**
   * Create a new layer
   */
  createLayer(config: LayerConfig): Layer {
    if (this.layers.has(config.name)) {
      throw new Error(`Layer "${config.name}" already exists`);
    }

    const layer = new Layer(config);
    this.layers.set(config.name, layer);
    this.root.addChild(layer.container);
    
    return layer;
  }

  /**
   * Get a layer by name
   */
  getLayer(name: string): Layer | undefined {
    return this.layers.get(name);
  }

  /**
   * Get a layer by type (returns first match)
   */
  getLayerByType(type: LayerType): Layer | undefined {
    for (const layer of this.layers.values()) {
      if (layer.type === type) {
        return layer;
      }
    }
    return undefined;
  }

  /**
   * Get all layers of a specific type
   */
  getLayersByType(type: LayerType): Layer[] {
    const result: Layer[] = [];
    for (const layer of this.layers.values()) {
      if (layer.type === type) {
        result.push(layer);
      }
    }
    return result;
  }

  /**
   * Get the node layer (convenience method)
   */
  getNodeLayer(): Layer {
    const layer = this.getLayerByType('nodes');
    if (!layer) {
      throw new Error('Node layer not found');
    }
    return layer;
  }

  /**
   * Get the edge layer (convenience method)
   */
  getEdgeLayer(): Layer {
    const layer = this.getLayerByType('edges');
    if (!layer) {
      throw new Error('Edge layer not found');
    }
    return layer;
  }

  /**
   * Get the overlay layer (convenience method)
   */
  getOverlayLayer(): Layer {
    const layer = this.getLayerByType('overlay');
    if (!layer) {
      throw new Error('Overlay layer not found');
    }
    return layer;
  }

  /**
   * Remove a layer
   */
  removeLayer(name: string): boolean {
    const layer = this.layers.get(name);
    if (layer) {
      this.root.removeChild(layer.container);
      layer.destroy();
      this.layers.delete(name);
      return true;
    }
    return false;
  }

  /**
   * Show/hide a layer
   */
  setLayerVisibility(name: string, visible: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.visible = visible;
    }
  }

  /**
   * Set layer interactivity
   */
  setLayerInteractive(name: string, interactive: boolean): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.interactive = interactive;
    }
  }

  /**
   * Reorder a layer
   */
  setLayerZIndex(name: string, zIndex: number): void {
    const layer = this.layers.get(name);
    if (layer) {
      layer.zIndex = zIndex;
    }
  }

  /**
   * Get all layer names
   */
  getLayerNames(): string[] {
    return Array.from(this.layers.keys());
  }

  /**
   * Get all layers sorted by z-index
   */
  getAllLayers(): Layer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Clear all layers (remove children but keep layers)
   */
  clearAll(): void {
    for (const layer of this.layers.values()) {
      layer.clear();
    }
  }

  /**
   * Destroy all layers
   */
  destroy(): void {
    for (const layer of this.layers.values()) {
      layer.destroy();
    }
    this.layers.clear();
  }
}
