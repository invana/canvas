import { CanvasEvent } from './base/CanvasEvent.js';
import type { Point, Bounds } from '../types/canvas.js';

// ── camera:zoom ───────────────────────────────────────────────────────────────

export class CameraZoomEvent extends CanvasEvent {
  declare readonly type: 'camera:zoom';
  /** New absolute scale (1.0 = 100%) */
  readonly scale: number;
  /** Screen-space point the zoom was centered on */
  readonly center: Point;
  constructor(fields: { scale: number; center: Point }) {
    super('camera:zoom');
    this.scale  = fields.scale;
    this.center = fields.center;
  }
}

// ── camera:pan ────────────────────────────────────────────────────────────────

export class CameraPanEvent extends CanvasEvent {
  declare readonly type: 'camera:pan';
  /** New camera world-space X position */
  readonly x: number;
  /** New camera world-space Y position */
  readonly y: number;
  constructor(fields: { x: number; y: number }) {
    super('camera:pan');
    this.x = fields.x;
    this.y = fields.y;
  }
}

// ── camera:fit ────────────────────────────────────────────────────────────────

export class CameraFitEvent extends CanvasEvent {
  declare readonly type: 'camera:fit';
  /** World-space bounds that were fitted into the viewport */
  readonly bounds: Bounds;
  constructor(fields: { bounds: Bounds }) {
    super('camera:fit');
    this.bounds = fields.bounds;
  }
}

// ── camera:reset ──────────────────────────────────────────────────────────────

export class CameraResetEvent extends CanvasEvent {
  declare readonly type: 'camera:reset';
  constructor() { super('camera:reset'); }
}

// ── camera:animate-start ─────────────────────────────────────────────────────

export class CameraAnimateStartEvent extends CanvasEvent {
  declare readonly type: 'camera:animate-start';
  readonly targetScale: number;
  readonly targetX: number;
  readonly targetY: number;
  constructor(fields: { targetScale: number; targetX: number; targetY: number }) {
    super('camera:animate-start');
    this.targetScale = fields.targetScale;
    this.targetX     = fields.targetX;
    this.targetY     = fields.targetY;
  }
}

// ── camera:animate-end ───────────────────────────────────────────────────────

export class CameraAnimateEndEvent extends CanvasEvent {
  declare readonly type: 'camera:animate-end';
  constructor() { super('camera:animate-end'); }
}
