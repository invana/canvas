// ── CanvasEventMap augmentation ───────────────────────────────────────────────
// Extends the canvas event map with graph:* events emitted by ElementPlugin.
// This is automatically included when consumers import @invana/plugins-graph-data.

import type {
  GraphClickEvent,
  GraphDblClickEvent,
  GraphContextMenuEvent,
  GraphPointerOverEvent,
  GraphPointerOutEvent,
  GraphPointerMoveEvent,
  GraphPointerDownEvent,
  GraphPointerUpEvent,
  GraphDragStartEvent,
  GraphDragMoveEvent,
  GraphDragEndEvent,
  GraphStateChangeEvent,
  GraphAddedEvent,
  GraphRemovedEvent,
} from './ElementEvents.js';

declare module '@invana/canvas' {
  interface CanvasEventMap {
    'graph:click':         GraphClickEvent;
    'graph:dblclick':      GraphDblClickEvent;
    'graph:contextmenu':   GraphContextMenuEvent;
    'graph:pointerover':   GraphPointerOverEvent;
    'graph:pointerout':    GraphPointerOutEvent;
    'graph:pointermove':   GraphPointerMoveEvent;
    'graph:pointerdown':   GraphPointerDownEvent;
    'graph:pointerup':     GraphPointerUpEvent;
    'graph:dragstart':     GraphDragStartEvent;
    'graph:dragmove':      GraphDragMoveEvent;
    'graph:dragend':       GraphDragEndEvent;
    'graph:statechange':   GraphStateChangeEvent;
    'graph:added':         GraphAddedEvent;
    'graph:removed':       GraphRemovedEvent;
  }
}
