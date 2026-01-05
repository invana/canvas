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

import type { CanvasPlugin, PluginConfig } from './types';

/**
 * Plugin constructor type
 */
export type PluginConstructor = new (options?: any) => CanvasPlugin;

/**
 * Behavior preset definitions
 * 
 * Note: drag-canvas and zoom-control are now handled natively by pixi-viewport,
 * so they are not included in presets. Use them only if you need custom behavior.
 */
export const BEHAVIOR_PRESETS: Record<string, string[]> = {
  /**
   * Minimal - Only hover effects
   * Good for: Read-only visualizations, dashboards
   * Note: Pan/zoom are handled by pixi-viewport natively
   */
  minimal: ['hover-activate'],
  
  /**
   * Default - Common interactions
   * Good for: Most graph visualizations
   * Note: Pan/zoom are handled by pixi-viewport natively
   */
  default: ['drag-element', 'hover-activate', 'click-select'],
  
  /**
   * Full - All interaction features
   * Good for: Graph editors, interactive applications
   * Note: Pan/zoom are handled by pixi-viewport natively
   */
  full: [
    'drag-element',
    'click-select',
    'hover-activate',
    'focus-element',
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
   * @param config - Plugin configuration (string ID, G6-style object, or instance)
   * @returns Plugin instance with metadata
   */
  static create(config: PluginConfig): { plugin: CanvasPlugin; key?: string; options?: any } {
    // Case 1: Simple string ID
    if (typeof config === 'string') {
      const PluginClass = this.get(config);
      if (!PluginClass) {
        throw new Error(
          `Plugin '${config}' not registered. Available plugins: ${this.getRegisteredPlugins().join(', ')}`
        );
      }
      return { plugin: new PluginClass() };
    }

    // Case 2: Wrapper pattern with plugin/key/options
    if ('plugin' in config && typeof config.plugin === 'string') {
      const pluginType = config.plugin;
      const PluginClass = this.get(pluginType);
      if (!PluginClass) {
        throw new Error(
          `Plugin '${pluginType}' not registered. Available plugins: ${this.getRegisteredPlugins().join(', ')}`
        );
      }
      
      const { plugin: _, key, options = {} } = config;
      
      return { 
        plugin: new PluginClass(options), 
        key,
        options 
      };
    }

    // Case 3: Direct plugin instance (not serializable, but supported)
    if ('init' in config && typeof config.init === 'function') {
      return { plugin: config as CanvasPlugin };
    }

    throw new Error('Invalid plugin configuration');
  }

  /**
   * Create multiple plugins from configurations
   */
  static createMany(configs: PluginConfig[]): Array<{ plugin: CanvasPlugin; key?: string; options?: any }> {
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
