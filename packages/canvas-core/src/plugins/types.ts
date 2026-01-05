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
  /** User-defined key for G6-style updates */
  userKey?: string;
}

/**
 * Plugin configuration with options (Wrapper pattern)
 */
export interface PluginConfigWithOptions {
  /** Plugin identifier (registered name like 'background', 'minimap', etc.) */
  plugin: string;
  /** Optional user-defined key for this plugin instance (for lookups/updates) */
  key?: string;
  /** Plugin-specific options (fully serializable, no field collisions) */
  options?: Record<string, any>;
}

/**
 * Plugin configuration - fully serializable
 * 
 * @example
 * ```typescript
 * // Simple string
 * 'drag-element'
 * 
 * // Wrapper pattern with plugin/key/options
 * {
 *   plugin: 'background',
 *   key: 'my-background',
 *   options: {
 *     type: 'pattern',
 *     patternType: 'grid',
 *     backgroundColor: '#f0f2f5'
 *   }
 * }
 * 
 * // Direct instance (not serializable)
 * new DragElementPlugin()
 * ```
 */
export type PluginConfig =
  | string  // Simple: 'drag-element'
  | PluginConfigWithOptions  // Wrapper pattern with plugin/key/options
  | CanvasPlugin;  // Direct instance (not serializable)

/**
 * Behavior presets for common plugin combinations
 */
export type BehaviorPreset = 'default' | 'minimal' | 'full' | false;
