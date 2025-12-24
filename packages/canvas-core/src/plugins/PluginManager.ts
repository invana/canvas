/**
 * Plugin Manager - Manages canvas plugins
 */

import type { Canvas } from '../core/Canvas.js';
import type { Plugin, PluginInfo } from '../types/plugin.js';
import { EventEmitter } from '../events/EventEmitter.js';
import { CanvasEvents } from '../events/CanvasEvents.js';

export class PluginManager {
  private _plugins: Map<string, Plugin> = new Map();
  private _canvas: Canvas | null = null;
  private _events: EventEmitter;

  constructor(events: EventEmitter) {
    this._events = events;
  }

  /**
   * Set the canvas instance (called by Canvas during initialization)
   */
  setCanvas(canvas: Canvas): void {
    this._canvas = canvas;
  }

  // ============================================================================
  // Plugin Management
  // ============================================================================

  /**
   * Install a plugin
   */
  install<T extends Record<string, unknown>>(plugin: Plugin<T>): void {
    if (this._plugins.has(plugin.id)) {
      console.warn(`Plugin "${plugin.id}" is already installed`);
      return;
    }

    this._plugins.set(plugin.id, plugin as Plugin<Record<string, unknown>>);

    if (this._canvas) {
      plugin.install({ canvas: this._canvas });
    }

    this._events.emit(CanvasEvents.PLUGIN_INSTALLED, {
      plugin: this._getPluginInfo(plugin as Plugin<Record<string, unknown>>),
    });
  }

  /**
   * Uninstall a plugin
   */
  uninstall(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin "${pluginId}" is not installed`);
      return;
    }

    if (this._canvas) {
      plugin.uninstall({ canvas: this._canvas });
    }

    this._plugins.delete(pluginId);

    this._events.emit(CanvasEvents.PLUGIN_UNINSTALLED, {
      pluginId,
    });
  }

  /**
   * Get a plugin by ID
   */
  get<T = Record<string, unknown>>(pluginId: string): Plugin<T> | undefined {
    return this._plugins.get(pluginId) as Plugin<T> | undefined;
  }

  /**
   * Check if a plugin is installed
   */
  has(pluginId: string): boolean {
    return this._plugins.has(pluginId);
  }

  /**
   * Enable a plugin
   */
  enable(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin "${pluginId}" is not installed`);
      return;
    }

    plugin.enable();
    this._events.emit(CanvasEvents.PLUGIN_ENABLED, {
      plugin: this._getPluginInfo(plugin),
    });
  }

  /**
   * Disable a plugin
   */
  disable(pluginId: string): void {
    const plugin = this._plugins.get(pluginId);
    if (!plugin) {
      console.warn(`Plugin "${pluginId}" is not installed`);
      return;
    }

    plugin.disable();
    this._events.emit(CanvasEvents.PLUGIN_DISABLED, {
      plugin: this._getPluginInfo(plugin),
    });
  }

  /**
   * Configure a plugin
   */
  configure<T>(pluginId: string, config: Partial<T>): void {
    const plugin = this._plugins.get(pluginId) as Plugin<T> | undefined;
    if (!plugin) {
      console.warn(`Plugin "${pluginId}" is not installed`);
      return;
    }

    plugin.configure(config);
  }

  /**
   * List all plugins
   */
  list(): PluginInfo[] {
    return Array.from(this._plugins.values()).map(this._getPluginInfo);
  }

  /**
   * Get enabled plugins
   */
  getEnabled(): Plugin[] {
    return Array.from(this._plugins.values()).filter((p) => p.enabled);
  }

  // ============================================================================
  // Lifecycle Hooks
  // ============================================================================

  /**
   * Called on each render frame
   */
  onRender(deltaTime: number): void {
    for (const plugin of this._plugins.values()) {
      if (plugin.enabled && plugin.onRender) {
        plugin.onRender(deltaTime);
      }
    }
  }

  /**
   * Called when canvas is resized
   */
  onResize(width: number, height: number): void {
    for (const plugin of this._plugins.values()) {
      if (plugin.enabled && plugin.onResize) {
        plugin.onResize(width, height);
      }
    }
  }

  /**
   * Called when canvas is destroyed
   */
  onDestroy(): void {
    for (const plugin of this._plugins.values()) {
      if (plugin.onDestroy) {
        plugin.onDestroy();
      }
    }
  }

  // ============================================================================
  // Serialization
  // ============================================================================

  /**
   * Serialize all plugin states
   */
  serialize(): Record<string, unknown> {
    const states: Record<string, unknown> = {};

    for (const [id, plugin] of this._plugins) {
      if (plugin.serialize) {
        states[id] = plugin.serialize();
      }
    }

    return states;
  }

  /**
   * Deserialize plugin states
   */
  deserialize(states: Record<string, unknown>): void {
    for (const [id, state] of Object.entries(states)) {
      const plugin = this._plugins.get(id);
      if (plugin?.deserialize) {
        plugin.deserialize(state);
      }
    }
  }

  // ============================================================================
  // Helpers
  // ============================================================================

  private _getPluginInfo(plugin: Plugin): PluginInfo {
    return {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      enabled: plugin.enabled,
      config: plugin.getConfig(),
    };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this.onDestroy();
    this._plugins.clear();
    this._canvas = null;
  }
}
