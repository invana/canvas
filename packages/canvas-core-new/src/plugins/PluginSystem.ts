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

  get<T extends CanvasPlugin = CanvasPlugin>(id: string): T | undefined {
    return this._plugins.get(id) as T | undefined;
  }

  has(id: string): boolean {
    return this._plugins.has(id);
  }

  list(): CanvasPlugin[] {
    return [...this._plugins.values()];
  }

  async unregister(id: string): Promise<void> {
    const plugin = this._plugins.get(id);
    if (!plugin) return;
    plugin.destroy();
    this._plugins.delete(id);
    this._ctx?.events.emit('plugin:destroyed', { pluginId: id });
  }

  destroyAll(): void {
    for (const plugin of this._plugins.values()) {
      plugin.destroy();
    }
    this._plugins.clear();
  }
}
