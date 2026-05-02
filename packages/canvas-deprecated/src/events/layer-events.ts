import { CanvasEvent } from './base/CanvasEvent.js';

// ── layer:added ───────────────────────────────────────────────────────────────

export class LayerAddedEvent extends CanvasEvent {
  declare readonly type: 'layer:added';
  readonly layerId: string;
  constructor(fields: { layerId: string }) {
    super('layer:added');
    this.layerId = fields.layerId;
  }
}

// ── layer:removed ─────────────────────────────────────────────────────────────

export class LayerRemovedEvent extends CanvasEvent {
  declare readonly type: 'layer:removed';
  readonly layerId: string;
  constructor(fields: { layerId: string }) {
    super('layer:removed');
    this.layerId = fields.layerId;
  }
}

// ── layer:visibility-changed ─────────────────────────────────────────────────

export class LayerVisibilityChangedEvent extends CanvasEvent {
  declare readonly type: 'layer:visibility-changed';
  readonly layerId: string;
  readonly visible: boolean;
  constructor(fields: { layerId: string; visible: boolean }) {
    super('layer:visibility-changed');
    this.layerId = fields.layerId;
    this.visible = fields.visible;
  }
}
