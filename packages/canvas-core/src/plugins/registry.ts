/**
 * Plugin Registry
 * 
 * Central registry for plugin classes, enabling string-based configuration
 * and serializable plugin loading.
 * 
 * @example
 * ```typescript
 * // Register custom plugin
 * PluginRegistry.register('my-plugin', MyPlugin);
 * 
 * // Use in Canvas options
 * const canvas = new Canvas({
 *   container,
 *   plugins: ['my-plugin']
 * });
 * ```
 */

import type { CanvasPlugin, PluginConfig, PluginConfigWithOptions } from './types';

/**
 * Plugin constructor type
 */
export type PluginConstructor = new (options?: any) => CanvasPlugin;

/**
 * Behavior preset definitions
 */
export const BEHAVIOR_PRESETS: Record<string, string[]> = {
  /**
   * Minimal - Only viewport interactions
   * Good for: Read-only visualizations, dashboards
   */
  minimal: ['drag-canvas', 'zoom-control'],
  
  /**
   * Default - Common interactions
   * Good for: Most graph visualizations
   */
  default: ['drag-element', 'drag-canvas', 'hover-activate', 'click-select', 'zoom-control'],
  
  /**
   * Full - All interaction features
   * Good for: Graph editors, interactive applications
   */
  full: [
    'drag-element',
    'drag-canvas',
    'click-select',
    'hover-activate',
    'focus-element',
    'zoom-control',
  ],
};

/**
 * Plugin Registry - Manages plugin registration and instantiation
 */
export class PluginRegistry {
  private static plugins = new Map<string, PluginConstructor>();

  /**
   * Register a plugin class by ID
   */
  static register(id: string, pluginClass: PluginConstructor): void {
    if (this.plugins.has(id)) {
      console.warn(`Plugin '${id}' is already registered. Overwriting.`);
    }
    this.plugins.set(id, pluginClass);
  }

  /**
   * Unregister a plugin
   */
  static unregister(id: string): boolean {
    return this.plugins.delete(id);
  }

  /**
   * Get plugin class by ID
   */
  static get(id: string): PluginConstructor | undefined {
    return this.plugins.get(id);
  }

  /**
   * Check if plugin is registered
   */
  static has(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all registered plugin IDs
   */
  static getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Create plugin instance from configuration
   * 
   * @param config - Plugin configuration (string ID, object with options, or instance)
   * @returns Plugin instance
   */
  static create(config: PluginConfig): CanvasPlugin {
    // Case 1: Simple string ID
    if (typeof config === 'string') {
      const PluginClass = this.get(config);
      if (!PluginClass) {
        throw new Error(
          `Plugin '${config}' not registered. Available plugins: ${this.getRegisteredPlugins().join(', ')}`
        );
      }
      return new PluginClass();
    }

    // Case 2: Configuration object with string plugin ID
    if ('plugin' in config && typeof config.plugin === 'string') {
      const PluginClass = this.get(config.plugin);
      if (!PluginClass) {
        throw new Error(
          `Plugin '${config.plugin}' not registered. Available plugins: ${this.getRegisteredPlugins().join(', ')}`
        );
      }
      return new PluginClass((config as PluginConfigWithOptions).options);
    }

    // Case 3: Direct plugin instance (not serializable, but supported)
    if ('init' in config && typeof config.init === 'function') {
      return config as CanvasPlugin;
    }

    throw new Error('Invalid plugin configuration');
  }

  /**
   * Create multiple plugins from configurations
   */
  static createMany(configs: PluginConfig[]): CanvasPlugin[] {
    return configs.map((config) => this.create(config));
  }

  /**
   * Get plugin IDs from behavior preset
   */
  static getBehaviorPreset(preset: string): string[] {
    return BEHAVIOR_PRESETS[preset] || [];
  }

  /**
   * Clear all registered plugins (mainly for testing)
   */
  static clear(): void {
    this.plugins.clear();
  }
}
