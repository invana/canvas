/**
 * Base Plugin - Abstract class for creating plugins
 */

import type { Canvas } from '../core/Canvas.js';
import type { Plugin, PluginContext } from '../types/plugin.js';

export abstract class BasePlugin<TConfig = Record<string, unknown>>
  implements Plugin<TConfig>
{
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  description?: string;

  abstract readonly defaultConfig: TConfig;

  protected _config: TConfig;
  protected _enabled = true;
  protected _canvas: Canvas | null = null;

  constructor(config?: Partial<TConfig>) {
    // @ts-expect-error - defaultConfig will be set by subclass
    this._config = { ...this.defaultConfig, ...config };
  }

  get config(): TConfig {
    return this._config;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  install(context: PluginContext): void {
    this._canvas = context.canvas;
    this.onInstall();
  }

  uninstall(_context: PluginContext): void {
    this.onUninstall();
    this._canvas = null;
  }

  enable(): void {
    this._enabled = true;
    this.onEnable();
  }

  disable(): void {
    this._enabled = false;
    this.onDisable();
  }

  configure(config: Partial<TConfig>): void {
    this._config = { ...this._config, ...config };
    this.onConfigChange();
  }

  getConfig(): TConfig {
    return { ...this._config };
  }

  // Override these in subclasses
  protected onInstall(): void {}
  protected onUninstall(): void {}
  protected onEnable(): void {}
  protected onDisable(): void {}
  protected onConfigChange(): void {}

  // Optional lifecycle hooks
  onRender?(_deltaTime: number): void;
  onResize?(_width: number, _height: number): void;
  onDestroy?(): void;
  serialize?(): unknown;
  deserialize?(_state: unknown): void;
}
