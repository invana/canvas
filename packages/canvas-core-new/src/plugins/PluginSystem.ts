import type { CanvasPlugin, PluginContext } from './types.js';

/**
 * PluginSystem — manages plugin registration and lifecycle.
 * Exposed as canvas.plugins.
 */
export class PluginSystem {
  private _plugins = new Map<string, CanvasPlugin>();
  private _ctx: PluginContext | null = null;

  /** @internal called by Canvas after init to provide context */
  _setContext(ctx: PluginContext): void {
    this._ctx = ctx;
  }

  /**
   * Register a plugin with the canvas.
   * Calls `plugin.register(ctx)` and emits `plugin:registered`.
   * @throws If the plugin id is already registered or the canvas hasn't been initialised.
   * @example
   * ```ts
   * await canvas.plugins.register(new BackgroundPlugin({ type: 'pattern' }));
   * ```
   */
  async register(plugin: CanvasPlugin): Promise<void> {
    if (this._plugins.has(plugin.id)) {
      throw new Error(`Plugin "${plugin.id}" is already registered.`);
    }
    if (!this._ctx) {
      throw new Error('Canvas not yet initialised. Call canvas.init() before registering plugins.');
    }
    await plugin.register(this._ctx);
    this._plugins.set(plugin.id, plugin);
    this._ctx.events.emit('plugin:registered', { pluginId: plugin.id });
  }

  /**
   * Retrieve a registered plugin by id.
   * @param id - The plugin's `id` property
   * @returns The plugin instance cast to `T`, or `undefined` if not found
   */
  get<T extends CanvasPlugin = CanvasPlugin>(id: string): T | undefined {
    return this._plugins.get(id) as T | undefined;
  }

  /** Returns `true` if a plugin with the given id is registered */
  has(id: string): boolean {
    return this._plugins.has(id);
  }

  /** Returns all registered plugin instances */
  list(): CanvasPlugin[] {
    return [...this._plugins.values()];
  }

  /**
   * Enable or disable a plugin by id.
   * Calls `plugin.enable()` / `plugin.disable()` if implemented,
   * then emits `plugin:enabled` or `plugin:disabled`.
   * Does nothing if the plugin is not registered.
   */
  setEnabled(id: string, enabled: boolean): void {
    const plugin = this._plugins.get(id);
    if (!plugin) return;
    if (enabled) {
      plugin.enable?.();
      this._ctx?.events.emit('plugin:enabled', { pluginId: id });
    } else {
      plugin.disable?.();
      this._ctx?.events.emit('plugin:disabled', { pluginId: id });
    }
  }

  /**
   * Unregister and destroy a plugin by id.
   * Calls `plugin.destroy()` and emits `plugin:destroyed`.
   * Does nothing if the plugin is not registered.
   */
  async unregister(id: string): Promise<void> {
    const plugin = this._plugins.get(id);
    if (!plugin) return;
    plugin.destroy();
    this._plugins.delete(id);
    this._ctx?.events.emit('plugin:destroyed', { pluginId: id });
  }

  /** Destroy and unregister all plugins. Called automatically by `Canvas.destroy()`. */
  destroyAll(): void {
    for (const plugin of this._plugins.values()) {
      plugin.destroy();
    }
    this._plugins.clear();
  }
}
