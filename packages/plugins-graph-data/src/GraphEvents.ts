// ── GraphEvents ───────────────────────────────────────────────────────────────
// Concrete event classes for graph:* events emitted by GraphPlugin.

import { CanvasEvent } from '@invana/canvas';

// ── Field interfaces ──────────────────────────────────────────────────────────

/**
 * Shared fields for all non-drag graph pointer events.
 */
export interface GraphEventFields {
  /** Id of the graph element that was interacted with. */
  elementId: string;
  /**
   * Element type: `'node'` for node shapes, `'edge'` for path connectors.
   */
  elementType: 'node' | 'edge';
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
export interface GraphDragEventFields extends GraphEventFields {
  /** World-space X delta from the previous `dragmove` (or `dragstart`). */
  dx: number;
  /** World-space Y delta from the previous `dragmove` (or `dragstart`). */
  dy: number;
}

/**
 * Fields for state change events.
 */
export interface GraphStateChangeFields {
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
export interface GraphLifecycleFields {
  /** Id of the element that was added or removed. */
  elementId: string;
  /** Element type. */
  elementType: 'node' | 'edge';
}

// ── Base classes ──────────────────────────────────────────────────────────────

/**
 * Base class for all non-drag graph pointer events.
 */
export class GraphBaseEvent extends CanvasEvent {
  readonly elementId:   string;
  readonly elementType: 'node' | 'edge';
  readonly worldX:      number;
  readonly worldY:      number;
  readonly nativeEvent: PointerEvent;
  readonly data?:       Record<string, unknown>;

  constructor(type: string, f: GraphEventFields) {
    super(type);
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
    this.worldX      = f.worldX;
    this.worldY      = f.worldY;
    this.nativeEvent = f.nativeEvent;
    this.data        = f.data;
  }
}

/** Base class for all drag graph events. */
export class GraphDragBaseEvent extends GraphBaseEvent {
  readonly dx: number;
  readonly dy: number;

  constructor(type: string, f: GraphDragEventFields) {
    super(type, f);
    this.dx = f.dx;
    this.dy = f.dy;
  }
}

// ── Concrete event classes ────────────────────────────────────────────────────

export class GraphClickEvent extends GraphBaseEvent {
  declare readonly type: 'graph:click';
  constructor(f: GraphEventFields) { super('graph:click', f); }
}

export class GraphDblClickEvent extends GraphBaseEvent {
  declare readonly type: 'graph:dblclick';
  constructor(f: GraphEventFields) { super('graph:dblclick', f); }
}

export class GraphContextMenuEvent extends GraphBaseEvent {
  declare readonly type: 'graph:contextmenu';
  constructor(f: GraphEventFields) { super('graph:contextmenu', f); }
}

export class GraphPointerOverEvent extends GraphBaseEvent {
  declare readonly type: 'graph:pointerover';
  constructor(f: GraphEventFields) { super('graph:pointerover', f); }
}

export class GraphPointerOutEvent extends GraphBaseEvent {
  declare readonly type: 'graph:pointerout';
  constructor(f: GraphEventFields) { super('graph:pointerout', f); }
}

export class GraphPointerMoveEvent extends GraphBaseEvent {
  declare readonly type: 'graph:pointermove';
  constructor(f: GraphEventFields) { super('graph:pointermove', f); }
}

export class GraphPointerDownEvent extends GraphBaseEvent {
  declare readonly type: 'graph:pointerdown';
  constructor(f: GraphEventFields) { super('graph:pointerdown', f); }
}

export class GraphPointerUpEvent extends GraphBaseEvent {
  declare readonly type: 'graph:pointerup';
  constructor(f: GraphEventFields) { super('graph:pointerup', f); }
}

export class GraphDragStartEvent extends GraphDragBaseEvent {
  declare readonly type: 'graph:dragstart';
  constructor(f: GraphDragEventFields) { super('graph:dragstart', f); }
}

export class GraphDragMoveEvent extends GraphDragBaseEvent {
  declare readonly type: 'graph:dragmove';
  constructor(f: GraphDragEventFields) { super('graph:dragmove', f); }
}

export class GraphDragEndEvent extends GraphDragBaseEvent {
  declare readonly type: 'graph:dragend';
  constructor(f: GraphDragEventFields) { super('graph:dragend', f); }
}

// ── State / lifecycle events ──────────────────────────────────────────────────

export class GraphStateChangeEvent extends CanvasEvent {
  declare readonly type: 'graph:statechange';
  readonly elementId: string;
  readonly state:     string;
  readonly active:    boolean;

  constructor(f: GraphStateChangeFields) {
    super('graph:statechange');
    this.elementId = f.elementId;
    this.state     = f.state;
    this.active    = f.active;
  }
}

export class GraphAddedEvent extends CanvasEvent {
  declare readonly type: 'graph:added';
  readonly elementId:   string;
  readonly elementType: 'node' | 'edge';

  constructor(f: GraphLifecycleFields) {
    super('graph:added');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}

export class GraphRemovedEvent extends CanvasEvent {
  declare readonly type: 'graph:removed';
  readonly elementId:   string;
  readonly elementType: 'node' | 'edge';

  constructor(f: GraphLifecycleFields) {
    super('graph:removed');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}
