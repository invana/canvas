// ── Shape event types ─────────────────────────────────────────────────────────
// Pure type definitions — no runtime code.
// Hit-testing is handled via RBush spatial search, NOT PixiJS eventMode.

import type { ShapeObject } from '../ShapeObject.js';

export type ShapeEventType =
  | 'click'
  | 'dblclick'
  | 'pointerover'
  | 'pointerout'
  | 'pointermove'
  | 'pointerdown'
  | 'pointerup'
  | 'dragstart'
  | 'dragmove'
  | 'dragend';

export interface ShapeEventPayload {
  /** The event type that was triggered */
  type: ShapeEventType;
  /** The ShapeObject that was interacted with */
  shape: ShapeObject;
  /** X in world space */
  worldX: number;
  /** Y in world space */
  worldY: number;
  originalEvent: PointerEvent;
}

/** Extended payload for drag events — includes per-frame delta */
export interface DragPayload extends ShapeEventPayload {
  /** World-space X delta from the previous dragmove (or dragstart) */
  dx: number;
  /** World-space Y delta from the previous dragmove (or dragstart) */
  dy: number;
}

export type ShapeHandler = (e: ShapeEventPayload) => void;
export type DragHandler  = (e: DragPayload) => void;
