// ── ShapeEvents ───────────────────────────────────────────────────────────────
// Concrete event classes for shape:* events emitted by ShapesPlugin.

import { CanvasEvent } from '@invana/canvas-deprecated';

// ── Field interfaces ──────────────────────────────────────────────────────────

/**
 * Shared fields for all non-drag shape pointer events.
 */
export interface ShapeEventFields {
  /** Id of the shape element that was interacted with. */
  elementId: string;
  /**
   * Element type: `'shape'` for solid shapes, `'connector'` for path connectors.
   */
  elementType: 'shape' | 'connector';
  /** X coordinate in world space. */
  worldX: number;
  /** Y coordinate in world space. */
  worldY: number;
  /** The raw browser PointerEvent. */
  nativeEvent: PointerEvent;
  /** Arbitrary data from the element spec — forwarded unchanged. */
  data?: Record<string, unknown>;
}

/**
 * Extra fields for drag events.
 */
export interface ShapeDragEventFields extends ShapeEventFields {
  /** World-space X delta from the previous `dragmove` (or `dragstart`). */
  dx: number;
  /** World-space Y delta from the previous `dragmove` (or `dragstart`). */
  dy: number;
}

/**
 * Fields for state change events.
 */
export interface ShapeStateChangeFields {
  /** Id of the element whose state changed. */
  elementId: string;
  /** The state that changed (e.g. `'hovered'`, `'selected'`). */
  state: string;
  /** `true` if the state became active, `false` if it was deactivated. */
  active: boolean;
}

/**
 * Fields for add / remove lifecycle events.
 */
export interface ShapeLifecycleFields {
  /** Id of the element that was added or removed. */
  elementId: string;
  /** Element type. */
  elementType: 'shape' | 'connector';
}

// ── Base classes ──────────────────────────────────────────────────────────────

/**
 * Base class for all non-drag shape pointer events.
 */
export class ShapeBaseEvent extends CanvasEvent {
  readonly elementId:   string;
  readonly elementType: 'shape' | 'connector';
  readonly worldX:      number;
  readonly worldY:      number;
  readonly nativeEvent: PointerEvent;
  readonly data?:       Record<string, unknown>;

  constructor(type: string, f: ShapeEventFields) {
    super(type);
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
    this.worldX      = f.worldX;
    this.worldY      = f.worldY;
    this.nativeEvent = f.nativeEvent;
    this.data        = f.data;
  }
}

/** Base class for all drag shape events. */
export class ShapeDragBaseEvent extends ShapeBaseEvent {
  readonly dx: number;
  readonly dy: number;

  constructor(type: string, f: ShapeDragEventFields) {
    super(type, f);
    this.dx = f.dx;
    this.dy = f.dy;
  }
}

// ── Concrete event classes ────────────────────────────────────────────────────

export class ShapeClickEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:click';
  constructor(f: ShapeEventFields) { super('shape:click', f); }
}

export class ShapeDblClickEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:dblclick';
  constructor(f: ShapeEventFields) { super('shape:dblclick', f); }
}

export class ShapeContextMenuEvent extends ShapeBaseEvent {
  declare readonly type: 'shape:contextmenu';
  constructor(f: ShapeEventFields) { super('shape:contextmenu', f); }
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

// ── State / lifecycle events ──────────────────────────────────────────────────

export class ShapeStateChangeEvent extends CanvasEvent {
  declare readonly type: 'shape:statechange';
  readonly elementId: string;
  readonly state:     string;
  readonly active:    boolean;

  constructor(f: ShapeStateChangeFields) {
    super('shape:statechange');
    this.elementId = f.elementId;
    this.state     = f.state;
    this.active    = f.active;
  }
}

export class ShapeAddedEvent extends CanvasEvent {
  declare readonly type: 'shape:added';
  readonly elementId:   string;
  readonly elementType: 'shape' | 'connector';

  constructor(f: ShapeLifecycleFields) {
    super('shape:added');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}

export class ShapeRemovedEvent extends CanvasEvent {
  declare readonly type: 'shape:removed';
  readonly elementId:   string;
  readonly elementType: 'shape' | 'connector';

  constructor(f: ShapeLifecycleFields) {
    super('shape:removed');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}

// ── Backward-compatibility aliases (graph:* names) ────────────────────────────
export { ShapeBaseEvent       as GraphBaseEvent       };
export { ShapeDragBaseEvent   as GraphDragBaseEvent   };
export { ShapeClickEvent      as GraphClickEvent      };
export { ShapeDblClickEvent   as GraphDblClickEvent   };
export { ShapeContextMenuEvent as GraphContextMenuEvent };
export { ShapePointerOverEvent  as GraphPointerOverEvent  };
export { ShapePointerOutEvent   as GraphPointerOutEvent   };
export { ShapePointerMoveEvent  as GraphPointerMoveEvent  };
export { ShapePointerDownEvent  as GraphPointerDownEvent  };
export { ShapePointerUpEvent    as GraphPointerUpEvent    };
export { ShapeDragStartEvent    as GraphDragStartEvent    };
export { ShapeDragMoveEvent     as GraphDragMoveEvent     };
export { ShapeDragEndEvent      as GraphDragEndEvent      };
export { ShapeStateChangeEvent  as GraphStateChangeEvent  };
export { ShapeAddedEvent        as GraphAddedEvent        };
export { ShapeRemovedEvent      as GraphRemovedEvent      };

export type { ShapeEventFields      as GraphEventFields      };
export type { ShapeDragEventFields  as GraphDragEventFields  };
export type { ShapeStateChangeFields as GraphStateChangeFields };
export type { ShapeLifecycleFields  as GraphLifecycleFields  };
