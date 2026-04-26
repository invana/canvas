// ── ElementEvents ─────────────────────────────────────────────────────────────
// Concrete event classes for element:* events emitted by ElementPlugin.
// Mirrors the shape:* event pattern from ShapeEvents.ts.

import { CanvasEvent } from '../../../events/base/CanvasEvent.js';

// ── Field interfaces ──────────────────────────────────────────────────────────

/**
 * Shared fields for all non-drag element pointer events.
 */
export interface ElementEventFields {
  /** Id of the element that was interacted with. */
  elementId: string;
  /**
   * Element type: `'solid'` for solid shapes, `'connector'` for path connectors.
   * Allows consumers to filter without maintaining their own id sets.
   */
  elementType: 'solid' | 'connector';
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
  elementType: 'solid' | 'connector';
}

// ── Base classes ──────────────────────────────────────────────────────────────

/**
 * Base class for all non-drag element pointer events.
 * Extend this when creating domain-level events in `plugin-graph`.
 */
export class ElementBaseEvent extends CanvasEvent {
  readonly elementId:   string;
  readonly elementType: 'solid' | 'connector';
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

export class ElementClickEvent extends ElementBaseEvent {
  declare readonly type: 'element:click';
  constructor(f: ElementEventFields) { super('element:click', f); }
}

export class ElementDblClickEvent extends ElementBaseEvent {
  declare readonly type: 'element:dblclick';
  constructor(f: ElementEventFields) { super('element:dblclick', f); }
}

export class ElementContextMenuEvent extends ElementBaseEvent {
  declare readonly type: 'element:contextmenu';
  constructor(f: ElementEventFields) { super('element:contextmenu', f); }
}

export class ElementPointerOverEvent extends ElementBaseEvent {
  declare readonly type: 'element:pointerover';
  constructor(f: ElementEventFields) { super('element:pointerover', f); }
}

export class ElementPointerOutEvent extends ElementBaseEvent {
  declare readonly type: 'element:pointerout';
  constructor(f: ElementEventFields) { super('element:pointerout', f); }
}

export class ElementPointerMoveEvent extends ElementBaseEvent {
  declare readonly type: 'element:pointermove';
  constructor(f: ElementEventFields) { super('element:pointermove', f); }
}

export class ElementPointerDownEvent extends ElementBaseEvent {
  declare readonly type: 'element:pointerdown';
  constructor(f: ElementEventFields) { super('element:pointerdown', f); }
}

export class ElementPointerUpEvent extends ElementBaseEvent {
  declare readonly type: 'element:pointerup';
  constructor(f: ElementEventFields) { super('element:pointerup', f); }
}

export class ElementDragStartEvent extends ElementDragBaseEvent {
  declare readonly type: 'element:dragstart';
  constructor(f: ElementDragEventFields) { super('element:dragstart', f); }
}

export class ElementDragMoveEvent extends ElementDragBaseEvent {
  declare readonly type: 'element:dragmove';
  constructor(f: ElementDragEventFields) { super('element:dragmove', f); }
}

export class ElementDragEndEvent extends ElementDragBaseEvent {
  declare readonly type: 'element:dragend';
  constructor(f: ElementDragEventFields) { super('element:dragend', f); }
}

// ── State / lifecycle events ──────────────────────────────────────────────────

export class ElementStateChangeEvent extends CanvasEvent {
  declare readonly type: 'element:statechange';
  readonly elementId: string;
  readonly state:     string;
  readonly active:    boolean;

  constructor(f: ElementStateChangeFields) {
    super('element:statechange');
    this.elementId = f.elementId;
    this.state     = f.state;
    this.active    = f.active;
  }
}

export class ElementAddedEvent extends CanvasEvent {
  declare readonly type: 'element:added';
  readonly elementId:   string;
  readonly elementType: 'solid' | 'connector';

  constructor(f: ElementLifecycleFields) {
    super('element:added');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}

export class ElementRemovedEvent extends CanvasEvent {
  declare readonly type: 'element:removed';
  readonly elementId:   string;
  readonly elementType: 'solid' | 'connector';

  constructor(f: ElementLifecycleFields) {
    super('element:removed');
    this.elementId   = f.elementId;
    this.elementType = f.elementType;
  }
}
