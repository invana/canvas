import { CanvasEvent } from './CanvasEvent.js';

export interface CanvasPointerEventFields {
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  /** The raw browser PointerEvent that triggered this canvas event */
  nativeEvent: PointerEvent;
}

/**
 * Base class for all canvas events that originate from a pointer (mouse / touch / pen).
 * Carries world-space coordinates, canvas-relative screen coordinates, and the
 * underlying browser `PointerEvent`.
 */
export class CanvasPointerEvent extends CanvasEvent {
  /** X in world space */
  readonly worldX: number;
  /** Y in world space */
  readonly worldY: number;
  /** X relative to the canvas element in CSS pixels */
  readonly screenX: number;
  /** Y relative to the canvas element in CSS pixels */
  readonly screenY: number;
  /**
   * The raw browser PointerEvent that triggered this event.
   * Exposes pointerId, pressure, pointerType, ctrlKey, button, etc.
   */
  readonly nativeEvent: PointerEvent;

  constructor(type: string, fields: CanvasPointerEventFields) {
    super(type);
    this.worldX      = fields.worldX;
    this.worldY      = fields.worldY;
    this.screenX     = fields.screenX;
    this.screenY     = fields.screenY;
    this.nativeEvent = fields.nativeEvent;
  }
}
