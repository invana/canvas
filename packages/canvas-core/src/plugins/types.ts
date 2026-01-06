/**
 * Plugin system types for extending canvas functionality
 */

import type { Canvas } from '../core/Canvas';

/**
 * Layer type for different purposes
 */
export type LayerType = 'shapes' | 'labels' | 'badges' | 'annotations' | 'background' | 'custom';

/**
 * Individual layer configuration
 */
export interface LayerConfig {
  /** Layer ID within the group */
  id: string;
  /** Layer type */
  type: LayerType;
  /** Optional visibility control */
  visible?: boolean;
}

/**
 * Layer group configuration with z-index
 */
export interface LayerGroupConfig {
  /** Group ID (e.g., 'graph-edges', 'graph-nodes') */
  id: string;
  
  /** z-index for this layer group */
  zIndex: number;
  
  /** Layers in this group */
  layers: LayerConfig[];
}

/**
 * Plugin interface for extending canvas
 */
export interface CanvasPlugin {
  /** Unique plugin ID */
  readonly id: string;
  
  /**
   * Define layer groups this plugin needs
   * Called once during initialization
   */
  getLayers(): LayerGroupConfig[];
  
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
