/**
 * Plugin type definitions
 */

import type { Canvas } from '../core/Canvas.js';

export interface PluginContext {
  canvas: Canvas;
}

export interface Plugin<TConfig = Record<string, unknown>> {
  /** Unique identifier for the plugin */
  id: string;

  /** Human-readable name */
  name: string;

  /** Plugin version */
  version: string;

  /** Plugin description */
  description?: string;

  /** Default configuration */
  defaultConfig: TConfig;

  /** Current configuration */
  config: TConfig;

  /** Whether the plugin is currently enabled */
  enabled: boolean;

  /**
   * Called when the plugin is installed
   */
  install(context: PluginContext): void;

  /**
   * Called when the plugin is uninstalled
   */
  uninstall(context: PluginContext): void;

  /**
   * Enable the plugin
   */
  enable(): void;

  /**
   * Disable the plugin without uninstalling
   */
  disable(): void;

  /**
   * Update plugin configuration
   */
  configure(config: Partial<TConfig>): void;

  /**
   * Get current configuration
   */
  getConfig(): TConfig;

  /**
   * Serialize plugin state for save/load
   */
  serialize?(): unknown;

  /**
   * Restore plugin state from serialized data
   */
  deserialize?(state: unknown): void;

  /**
   * Called on each render frame (optional)
   */
  onRender?(deltaTime: number): void;

  /**
   * Called when canvas is resized (optional)
   */
  onResize?(width: number, height: number): void;

  /**
   * Called when canvas is destroyed (optional)
   */
  onDestroy?(): void;
}

export interface PluginConstructor<TConfig = Record<string, unknown>> {
  new (config?: Partial<TConfig>): Plugin<TConfig>;
}

export interface PluginInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  config: unknown;
}
