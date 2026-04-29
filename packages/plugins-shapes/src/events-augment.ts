// ── CanvasEventMap augmentation ───────────────────────────────────────────────
// Extends the canvas event map with shape:* events emitted by ShapesPlugin.
// This is automatically included when consumers import @invana/plugins-shapes.

import type {
  ShapeClickEvent,
  ShapeDblClickEvent,
  ShapeContextMenuEvent,
  ShapePointerOverEvent,
  ShapePointerOutEvent,
  ShapePointerMoveEvent,
  ShapePointerDownEvent,
  ShapePointerUpEvent,
  ShapeDragStartEvent,
  ShapeDragMoveEvent,
  ShapeDragEndEvent,
  ShapeStateChangeEvent,
  ShapeAddedEvent,
  ShapeRemovedEvent,
} from './ShapeEvents.js';

declare module '@invana/canvas' {
  interface CanvasEventMap {
    'shape:click':         ShapeClickEvent;
    'shape:dblclick':      ShapeDblClickEvent;
    'shape:contextmenu':   ShapeContextMenuEvent;
    'shape:pointerover':   ShapePointerOverEvent;
    'shape:pointerout':    ShapePointerOutEvent;
    'shape:pointermove':   ShapePointerMoveEvent;
    'shape:pointerdown':   ShapePointerDownEvent;
    'shape:pointerup':     ShapePointerUpEvent;
    'shape:dragstart':     ShapeDragStartEvent;
    'shape:dragmove':      ShapeDragMoveEvent;
    'shape:dragend':       ShapeDragEndEvent;
    'shape:statechange':   ShapeStateChangeEvent;
    'shape:added':         ShapeAddedEvent;
    'shape:removed':       ShapeRemovedEvent;
  }
}
