// ── ElementEvents ─────────────────────────────────────────────────────────────
// Concrete event classes for graph:* events emitted by ElementPlugin.

import { CanvasEvent } from '@invana/canvas';

// ── Field interfaces ──────────────────────────────────────────────────────────

/**
 * Shared fields for all non-drag element pointer events.
 */
export interface ElementEventFields {
  /** Id of the element that was interacted with. */
  elementId: string;
  /**
   * Element type: `'node'` for node shapes, `'edge'` for path connectors.
   * Allows consumers to filter without maintaining their own id sets.
   */
  elementType: 'node' | 'edge';
  /** X coordinate in world space. */
  worldX: number;
  /** Y coordinate in world space. */
  worldY: number;
  /** The raw browser PointerEvent. Exposes pointerId, ctrlKey, button, etc. */
  nativeEvent: PointerEvent;
  /** Arbitrary data from the element spec — forwarded unchanged. */
  data?: Record<string, unknown>;
}

/**
 * Extra fields for drag events.
 */
export interface ElementDragEventFields extends ElementEventFields {
  /** World-space X delta from the previous `dragmove` (or `dragstart`). */
  dx: number;
  /** World-space Y delta from the previous `dragmove` (or `dragstart`). */
  dy: number;
}

/**
 * Fields for state change events.
 */
export interface ElementStateChangeFields {
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
export interface ElementLifecycleFields {
  /** Id of the element that was added or removed. */
  elementId: string;
  /** Element type. */
  elementType: 'node' | 'edge';
}

// ── Base classes ──────────────────────────────────────────────────────────────

/**
 * Base class for all non-drag element pointer events.
 * Extend this when creating domain-level events in `plugin-graph-data`.
 */
export class ElementBaseEvent extends CanvasEvent {
  readonly elementId:   string;
  readonly elementType: 'node' | 'edge';
  readonly worldX:      number;
  readonly worldY:      number;
  readonly nativeEvent: PointerEvent;
  readonly data?:       Record<string, unknown>;

  constructor(type: string, f: ElementEventFields) {
    super(type);
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
    this.worldX      = f.worldX;
    this.worldY      = f.worldY;
    this.nativeEvent = f.nativeEvent;
    this.data        = f.data;
  }
}

/** Base class for all drag element events. */
export class ElementDragBaseEvent extends ElementBaseEvent {
  readonly dx: number;
  readonly dy: number;

  constructor(type: string, f: ElementDragEventFields) {
    super(type, f);
    this.dx = f.dx;
    this.dy = f.dy;
  }
}

// ── Concrete event classes ────────────────────────────────────────────────────

export class GraphClickEvent extends ElementBaseEvent {
  declare readonly type: 'graph:click';
  constructor(f: ElementEventFields) { super('graph:click', f); }
}

export class GraphDblClickEvent extends ElementBaseEvent {
  declare readonly type: 'graph:dblclick';
  constructor(f: ElementEventFields) { super('graph:dblclick', f); }
}

export class GraphContextMenuEvent extends ElementBaseEvent {
  declare readonly type: 'graph:contextmenu';
  constructor(f: ElementEventFields) { super('graph:contextmenu', f); }
}

export class GraphPointerOverEvent extends ElementBaseEvent {
  declare readonly type: 'graph:pointerover';
  constructor(f: ElementEventFields) { super('graph:pointerover', f); }
}

export class GraphPointerOutEvent extends ElementBaseEvent {
  declare readonly type: 'graph:pointerout';
  constructor(f: ElementEventFields) { super('graph:pointerout', f); }
}

export class GraphPointerMoveEvent extends ElementBaseEvent {
  declare readonly type: 'graph:pointermove';
  constructor(f: ElementEventFields) { super('graph:pointermove', f); }
}

export class GraphPointerDownEvent extends ElementBaseEvent {
  declare readonly type: 'graph:pointerdown';
  constructor(f: ElementEventFields) { super('graph:pointerdown', f); }
}

export class GraphPointerUpEvent extends ElementBaseEvent {
  declare readonly type: 'graph:pointerup';
  constructor(f: ElementEventFields) { super('graph:pointerup', f); }
}

export class GraphDragStartEvent extends ElementDragBaseEvent {
  declare readonly type: 'graph:dragstart';
  constructor(f: ElementDragEventFields) { super('graph:dragstart', f); }
}

export class GraphDragMoveEvent extends ElementDragBaseEvent {
  declare readonly type: 'graph:dragmove';
  constructor(f: ElementDragEventFields) { super('graph:dragmove', f); }
}

export class GraphDragEndEvent extends ElementDragBaseEvent {
  declare readonly type: 'graph:dragend';
  constructor(f: ElementDragEventFields) { super('graph:dragend', f); }
}

// ── State / lifecycle events ──────────────────────────────────────────────────

export class GraphStateChangeEvent extends CanvasEvent {
  declare readonly type: 'graph:statechange';
  readonly elementId: string;
  readonly state:     string;
  readonly active:    boolean;

  constructor(f: ElementStateChangeFields) {
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

  constructor(f: ElementLifecycleFields) {
    super('graph:added');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}

export class GraphRemovedEvent extends CanvasEvent {
  declare readonly type: 'graph:removed';
  readonly elementId:   string;
  readonly elementType: 'node' | 'edge';

  constructor(f: ElementLifecycleFields) {
    super('graph:removed');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}

