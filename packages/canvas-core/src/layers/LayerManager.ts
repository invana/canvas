/**
 * LayerManager - Manages all layers in the canvas with plugin support
 * Plugins can register layer groups dynamically
 */

import { Container } from 'pixi.js';
import { LayerGroup } from './LayerGroup';
import type { LayerGroupConfig } from '../plugins/types';
import type { Layer } from './Layer';

export class LayerManager {
  private _scene: Container;
  private _groups: Map<string, LayerGroup> = new Map();
  private _nextZIndex: number = 300; // Start for plugins

  constructor(scene: Container) {
    this._scene = scene;
    this._scene.sortableChildren = true;
    
    // Register core layers
    this.registerGroup({
      id: 'core-edges',
      baseZIndex: 100,
      layers: ['shapes', 'labels']
    });
    
    this.registerGroup({
      id: 'core-nodes',
      baseZIndex: 200,
      layers: ['shapes', 'labels']
    });
  }

  /**
   * Register a new layer group (used by core and plugins)
   * @returns LayerGroup instance for use
   */
  registerGroup(config: LayerGroupConfig): LayerGroup {
    if (this._groups.has(config.id)) {
      throw new Error(`Layer group '${config.id}' already registered`);
    }

    const baseZIndex = config.baseZIndex ?? this.allocateZIndex();
    const group = new LayerGroup(config.id, baseZIndex);
    
    // Create layers
    config.layers.forEach((layerName, index) => {
      const layer = group.createLayer(layerName, baseZIndex + index);
      this._scene.addChild(layer.container);
    });
    
    this._groups.set(config.id, group);
    return group;
  }

  /**
   * Get a layer group by ID
   */
  getGroup(groupId: string): LayerGroup | undefined {
    return this._groups.get(groupId);
  }

  /**
   * Get a specific layer by group and layer name
   */
  getLayer(groupId: string, layerName: string): Layer | undefined {
    return this._groups.get(groupId)?.getLayer(layerName);
  }

  /**
   * Allocate z-index block for plugin
   */
  private allocateZIndex(): number {
    const zIndex = this._nextZIndex;
    this._nextZIndex += 100; // Allocate in blocks of 100
    return zIndex;
  }

  /**
   * Show/hide entire layer group
   */
  setGroupVisibility(groupId: string, visible: boolean): void {
    const group = this._groups.get(groupId);
    if (group) {
      group.setVisible(visible);
    }
  }

  /**
   * Set interactive state for entire layer group
   */
  setGroupInteractive(groupId: string, interactive: boolean): void {
    const group = this._groups.get(groupId);
    if (group) {
      group.setInteractive(interactive);
    }
  }

  /**
   * Get all groups (for debugging/inspection)
   */
  getAllGroups(): Map<string, LayerGroup> {
    return new Map(this._groups);
  }

  /**
   * Clear all content from a layer group
   */
  clearGroup(groupId: string): void {
    const group = this._groups.get(groupId);
    if (group) {
      group.clear();
    }
  }

  /**
   * Unregister and destroy a layer group
   */
  unregisterGroup(groupId: string): void {
    const group = this._groups.get(groupId);
    if (group) {
      // Remove all layer containers from scene
      group.getAllLayers().forEach(layer => {
        this._scene.removeChild(layer.container);
      });
      
      group.destroy();
      this._groups.delete(groupId);
    }
  }

  /**
   * Destroy all groups and cleanup
   */
  destroy(): void {
    this._groups.forEach(group => {
      group.getAllLayers().forEach(layer => {
        this._scene.removeChild(layer.container);
      });
      group.destroy();
    });
    this._groups.clear();
  }
}
