import { CanvasEvent } from '../../events/base/CanvasEvent.js';
import type { BackgroundOptions } from './BackgroundPlugin.js';

/**
 * Fired by `BackgroundPlugin` whenever `setOptions()` is called.
 *
 * `changes` is the partial passed by the caller (cheap "did key X change?"
 * checks); `options` is the full resolved configuration after the update.
 */
export class BackgroundUpdatedEvent extends CanvasEvent {
  declare readonly type: 'background:updated';
  /** The plugin id that owns this background (defaults to `'background'`). */
  readonly pluginId: string;
  /** Full options after the update. */
  readonly options: Required<BackgroundOptions>;
  /** The partial passed to `setOptions()` — only the keys the caller touched. */
  readonly changes: Partial<BackgroundOptions>;

  constructor(fields: {
    pluginId: string;
    options: Required<BackgroundOptions>;
    changes: Partial<BackgroundOptions>;
  }) {
    super('background:updated');
    this.pluginId = fields.pluginId;
    this.options = fields.options;
    this.changes = fields.changes;
  }
}

// ── CanvasEventMap augmentation ──────────────────────────────────────────────
declare module '../../types/events.js' {
  interface CanvasEventMap {
    /** Fired when BackgroundPlugin's options are updated via setOptions() */
    'background:updated': BackgroundUpdatedEvent;
  }
}
