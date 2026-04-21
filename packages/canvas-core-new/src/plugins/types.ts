import type { CameraAPI } from '../camera/CameraAPI.js';
import type { LayerManager } from '../layers/types.js';
import type { EventBus } from '../events/EventBus.js';
import type { Container } from 'pixi.js';

/**
 * Context object passed to every plugin at registration time.
 * Contains only safe, typed handles — no raw PixiJS objects except
 * `createLayer`, which is intentionally opaque to plugin consumers.
 */
export interface PluginContext {
  camera: CameraAPI;
  layers: LayerManager;
  events: EventBus;
  canvasElement: HTMLCanvasElement;
  /** Create a world-space layer (inside the camera viewport). */
  createLayer(options: { id: string; zIndex: number; label?: string }): Container;
  /** Create a screen-space layer (fixed, unaffected by camera pan/zoom). */
  createScreenLayer(options: { id: string; zIndex: number }): Container;
}

/**
 * Base interface every plugin must implement.
 */
export interface CanvasPlugin {
  /** Unique identifier for this plugin instance. */
  readonly id: string;

  /**
   * Called once when the plugin is registered with the canvas.
   * Use this to set up layers, subscribe to events, etc.
   */
  register(ctx: PluginContext): void | Promise<void>;

  /**
   * Called when the plugin is removed or the canvas is destroyed.
   */
  destroy(): void;

  /**
   * Optional. Called by `canvas.plugins.setEnabled(id, true)`.
   * Implement to show/resume plugin behaviour without full re-registration.
   */
  enable?(): void;

  /**
   * Optional. Called by `canvas.plugins.setEnabled(id, false)`.
   * Implement to hide/pause plugin behaviour without destroying it.
   */
  disable?(): void;
}
