import { CanvasEvent } from './base/CanvasEvent.js';

// ── plugin:registered ─────────────────────────────────────────────────────────

export class PluginRegisteredEvent extends CanvasEvent {
  declare readonly type: 'plugin:registered';
  readonly pluginId: string;
  constructor(fields: { pluginId: string }) {
    super('plugin:registered');
    this.pluginId = fields.pluginId;
  }
}

// ── plugin:destroyed ──────────────────────────────────────────────────────────

export class PluginDestroyedEvent extends CanvasEvent {
  declare readonly type: 'plugin:destroyed';
  readonly pluginId: string;
  constructor(fields: { pluginId: string }) {
    super('plugin:destroyed');
    this.pluginId = fields.pluginId;
  }
}

// ── plugin:enabled ────────────────────────────────────────────────────────────

export class PluginEnabledEvent extends CanvasEvent {
  declare readonly type: 'plugin:enabled';
  readonly pluginId: string;
  constructor(fields: { pluginId: string }) {
    super('plugin:enabled');
    this.pluginId = fields.pluginId;
  }
}

// ── plugin:disabled ───────────────────────────────────────────────────────────

export class PluginDisabledEvent extends CanvasEvent {
  declare readonly type: 'plugin:disabled';
  readonly pluginId: string;
  constructor(fields: { pluginId: string }) {
    super('plugin:disabled');
    this.pluginId = fields.pluginId;
  }
}
