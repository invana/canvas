import { CanvasEvent } from './base/CanvasEvent.js';
import { CanvasPointerEvent, type CanvasPointerEventFields } from './base/CanvasPointerEvent.js';

// ── canvas:pointerdown ────────────────────────────────────────────────────────

export class CanvasPointerDownEvent extends CanvasPointerEvent {
  declare readonly type: 'canvas:pointerdown';
  constructor(fields: CanvasPointerEventFields) { super('canvas:pointerdown', fields); }
}

// ── canvas:pointermove ────────────────────────────────────────────────────────

export class CanvasPointerMoveEvent extends CanvasPointerEvent {
  declare readonly type: 'canvas:pointermove';
  constructor(fields: CanvasPointerEventFields) { super('canvas:pointermove', fields); }
}

// ── canvas:pointerup ─────────────────────────────────────────────────────────

export class CanvasPointerUpEvent extends CanvasPointerEvent {
  declare readonly type: 'canvas:pointerup';
  constructor(fields: CanvasPointerEventFields) { super('canvas:pointerup', fields); }
}

// ── canvas:clicked ───────────────────────────────────────────────────────────

/** Fired when a click/tap lands on the canvas background (not a shape) */
export class CanvasClickedEvent extends CanvasPointerEvent {
  declare readonly type: 'canvas:clicked';
  constructor(fields: CanvasPointerEventFields) { super('canvas:clicked', fields); }
}

// ── canvas:dblclicked ────────────────────────────────────────────────────────

/** Fired when a double-click lands on the canvas background */
export class CanvasDblClickedEvent extends CanvasPointerEvent {
  declare readonly type: 'canvas:dblclicked';
  constructor(fields: CanvasPointerEventFields) { super('canvas:dblclicked', fields); }
}

// ── canvas:contextmenu ───────────────────────────────────────────────────────

/** Fired on right-click / context-menu on the canvas background */
export class CanvasContextMenuEvent extends CanvasPointerEvent {
  declare readonly type: 'canvas:contextmenu';
  constructor(fields: CanvasPointerEventFields) { super('canvas:contextmenu', fields); }
}

// ── canvas:resize ─────────────────────────────────────────────────────────────

/** Fired when the canvas is resized (manually or via autoResize) */
export class CanvasResizeEvent extends CanvasEvent {
  declare readonly type: 'canvas:resize';
  /** New canvas width in CSS pixels */
  readonly width: number;
  /** New canvas height in CSS pixels */
  readonly height: number;
  constructor(fields: { width: number; height: number }) {
    super('canvas:resize');
    this.width = fields.width;
    this.height = fields.height;
  }
}
