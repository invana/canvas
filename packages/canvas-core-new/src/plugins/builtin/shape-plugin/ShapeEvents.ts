import { CanvasEvent } from '../../../events/base/CanvasEvent.js';

// ── Shared field interfaces ───────────────────────────────────────────────────

export interface ShapeEventFields {
  shapeId: string;
  worldX: number;
  worldY: number;
  /** The raw browser PointerEvent that triggered this shape event */
  nativeEvent: PointerEvent;
}

export interface ShapeDragEventFields extends ShapeEventFields {
  /** World-space X delta from the previous dragmove (or dragstart) */
  dx: number;
  /** World-space Y delta from the previous dragmove (or dragstart) */
  dy: number;
}

// ── Internal base classes (not exported from package index) ──────────────────

/**
 * Base for all non-drag shape pointer events.
 * Extend this when adding custom shape-level events.
 *
 * @example
 * ```ts
 * class GraphNodeClickEvent extends ShapeBaseEvent {
 *   declare readonly type: 'graph:node:click';
 *   readonly nodeId: string;
 *   constructor(fields: ShapeEventFields & { nodeId: string }) {
 *     super('graph:node:click', fields);
 *     this.nodeId = fields.nodeId;
 *   }
 * }
 * ```
 */
export class ShapeBaseEvent extends CanvasEvent {
  /** Id of the shape that was interacted with */
  readonly shapeId: string;
  /** X coordinate in world space */
  readonly worldX: number;
  /** Y coordinate in world space */
  readonly worldY: number;
  /**
   * The raw browser PointerEvent that triggered this event.
   * Exposes pointerId, pressure, pointerType, ctrlKey, button, etc.
   */
  readonly nativeEvent: PointerEvent;

  constructor(type: string, fields: ShapeEventFields) {
    super(type);
    this.shapeId     = fields.shapeId;
    this.worldX      = fields.worldX;
    this.worldY      = fields.worldY;
    this.nativeEvent = fields.nativeEvent;
  }
}

/**
 * Base for all drag shape events.
 * Extend this when adding custom drag-level events.
 */
export class ShapeDragBaseEvent extends ShapeBaseEvent {
  /** World-space X delta from the previous dragmove (or dragstart) */
  readonly dx: number;
  /** World-space Y delta from the previous dragmove (or dragstart) */
  readonly dy: number;

  constructor(type: string, fields: ShapeDragEventFields) {
    super(type, fields);
    this.dx = fields.dx;
    this.dy = fields.dy;
  }
}

// ── Concrete shape event classes (one per event key) ─────────────────────────

export class ShapeClickEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:click';
  constructor(f: ShapeEventFields) { super('shape:click', f); }
}

export class ShapeDblClickEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:dblclick';
  constructor(f: ShapeEventFields) { super('shape:dblclick', f); }
}

export class ShapePointerOverEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:pointerover';
  constructor(f: ShapeEventFields) { super('shape:pointerover', f); }
}

export class ShapePointerOutEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:pointerout';
  constructor(f: ShapeEventFields) { super('shape:pointerout', f); }
}

export class ShapePointerMoveEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:pointermove';
  constructor(f: ShapeEventFields) { super('shape:pointermove', f); }
}

export class ShapePointerDownEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:pointerdown';
  constructor(f: ShapeEventFields) { super('shape:pointerdown', f); }
}

export class ShapePointerUpEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:pointerup';
  constructor(f: ShapeEventFields) { super('shape:pointerup', f); }
}

export class ShapeDragStartEvent extends ShapeDragBaseEvent {
  declare readonly type: 'shape:dragstart';
  constructor(f: ShapeDragEventFields) { super('shape:dragstart', f); }
}

export class ShapeDragMoveEvent extends ShapeDragBaseEvent {
  declare readonly type: 'shape:dragmove';
  constructor(f: ShapeDragEventFields) { super('shape:dragmove', f); }
}

export class ShapeDragEndEvent extends ShapeDragBaseEvent {
  declare readonly type: 'shape:dragend';
  constructor(f: ShapeDragEventFields) { super('shape:dragend', f); }
}
