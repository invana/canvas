/**
 * Plugin system types for extending canvas functionality
 */

import type { Canvas } from '../core/Canvas';

/**
 * Layer group configuration
 */
export interface LayerGroupConfig {
  /** Group ID (e.g., 'plugin-groups', 'core-nodes') */
  id: string;
  
  /** Optional base z-index (auto-allocated if not provided) */
  baseZIndex?: number;
  
  /** Layer names (e.g., ['shapes', 'labels']) */
  layers: string[];
}

/**
 * Plugin interface for extending canvas
 */
export interface CanvasPlugin {
  /** Unique plugin ID */
  readonly id: string;
  
  /** Plugin name */
  readonly name: string;
  
  /** Layer groups this plugin needs */
  readonly layerGroups: LayerGroupConfig[];
  
  /**
   * Initialize plugin with canvas instance
   */
  init(canvas: Canvas): void | Promise<void>;
  
  /**
   * Cleanup when plugin is removed
   */
  destroy?(): void;
}

/**
 * Plugin registration options
 */
export interface PluginRegistrationOptions {
  /** Whether to initialize plugin immediately */
  autoInit?: boolean;
}

/**
 * Plugin configuration with options (serializable)
 */
export interface PluginConfigWithOptions<T = any> {
  /** Plugin ID (registered name) */
  plugin: string;
  /** Plugin options */
  options?: T;
}

/**
 * Plugin configuration - fully serializable
 * 
 * @example
 * ```typescript
 * // Simple string
 * 'drag-element'
 * 
 * // With options
 * {
 *   plugin: 'drag-element',
 *   options: { threshold: 5 }
 * }
 * 
 * // Direct instance (not serializable)
 * new DragElementPlugin()
 * ```
 */
export type PluginConfig =
  | string  // Simple: 'drag-element'
  | PluginConfigWithOptions  // With options
  | CanvasPlugin;  // Direct instance (not serializable)

/**
 * Behavior presets for common plugin combinations
 */
export type BehaviorPreset = 'default' | 'minimal' | 'full' | false;
