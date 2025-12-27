/**
 * Example Groups Plugin
 * Demonstrates how to create a plugin for the canvas system
 */

import type { Canvas } from '../core/Canvas';
import type { CanvasPlugin } from './types';
import { Container, Graphics } from 'pixi.js';
import { PluginRegistry } from './registry';

export interface GroupConfig {
  id: string;
  nodeIds: string[];
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  label?: string;
  style?: {
    fill?: string;
    fillAlpha?: number;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
  };
}

/**
 * Example plugin that adds group/cluster functionality
 */
export class GroupsPlugin implements CanvasPlugin {
  readonly id = 'groups';
  readonly name = 'Node Groups';
  readonly layerGroups = [
    {
      id: 'plugin-groups',
      layers: ['shapes', 'labels']
    }
  ];

  private _shapeLayer: Container | null = null;
  private _labelLayer: Container | null = null;
  private _groups: Map<string, Graphics> = new Map();

  async init(canvas: Canvas): Promise<void> {
    // Get layers
    const group = canvas.layerManager.getGroup('plugin-groups');
    if (!group) {
      throw new Error('Failed to get plugin-groups layer group');
    }

    this._shapeLayer = group.getLayer('shapes')?.container ?? null;
    this._labelLayer = group.getLayer('labels')?.container ?? null;

    if (!this._shapeLayer || !this._labelLayer) {
      throw new Error('Failed to get group layers');
    }
  }

  /**
   * Add a group
   */
  addGroup(config: GroupConfig): Graphics {
    if (!this._shapeLayer) {
      throw new Error('Plugin not initialized');
    }

    const graphics = new Graphics();
    
    const style = config.style ?? {};
    const fill = style.fill ?? '#e3f2fd';
    const fillAlpha = style.fillAlpha ?? 0.3;
    const stroke = style.stroke ?? '#2196f3';
    const strokeWidth = style.strokeWidth ?? 2;

    const width = config.width ?? 200;
    const height = config.height ?? 150;

    // Draw rounded rectangle
    graphics.rect(0, 0, width, height);
    graphics.fill({ color: fill, alpha: fillAlpha });
    graphics.stroke({ color: stroke, width: strokeWidth });

    // Position
    graphics.x = config.x ?? 0;
    graphics.y = config.y ?? 0;

    this._shapeLayer.addChild(graphics);
    this._groups.set(config.id, graphics);

    return graphics;
  }

  /**
   * Remove a group
   */
  removeGroup(id: string): void {
    const graphics = this._groups.get(id);
    if (graphics) {
      this._shapeLayer?.removeChild(graphics);
      graphics.destroy();
      this._groups.delete(id);
    }
  }

  /**
   * Get all groups
   */
  getGroups(): Map<string, Graphics> {
    return new Map(this._groups);
  }

  /**
   * Clear all groups
   */
  clearAll(): void {
    this._groups.forEach(graphics => {
      this._shapeLayer?.removeChild(graphics);
      graphics.destroy();
    });
    this._groups.clear();
  }

  destroy(): void {
    this.clearAll();
    this._shapeLayer = null;
    this._labelLayer = null;
  }
}

// Auto-register plugin
PluginRegistry.register('groups', GroupsPlugin);

