// Canvas event map — each event key maps to a concrete event class instance.
// No plain object interfaces: use the class types directly.

// Re-export base classes for plugin authors
export { CanvasEvent } from '../events/base/CanvasEvent.js';
export { CanvasPointerEvent } from '../events/base/CanvasPointerEvent.js';
export type { CanvasPointerEventFields } from '../events/base/CanvasPointerEvent.js';

// Re-export concrete canvas / camera / plugin / layer event classes
export {
  CanvasPointerDownEvent,
  CanvasPointerMoveEvent,
  CanvasPointerUpEvent,
  CanvasClickedEvent,
  CanvasDblClickedEvent,
  CanvasContextMenuEvent,
  CanvasResizeEvent,
} from '../events/canvas-events.js';

export {
  CameraZoomEvent,
  CameraPanEvent,
  CameraFitEvent,
  CameraResetEvent,
  CameraAnimateStartEvent,
  CameraAnimateEndEvent,
} from '../events/camera-events.js';

export {
  PluginRegisteredEvent,
  PluginDestroyedEvent,
  PluginEnabledEvent,
  PluginDisabledEvent,
} from '../events/plugin-events.js';

export {
  LayerAddedEvent,
  LayerRemovedEvent,
  LayerVisibilityChangedEvent,
} from '../events/layer-events.js';

// Re-export shape event classes (base + concrete)
export {
  ShapeBaseEvent,
  ShapeDragBaseEvent,
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
} from '../plugins/builtin/shape-plugin/ShapeEvents.js';
export type { ShapeEventFields, ShapeDragEventFields } from '../plugins/builtin/shape-plugin/ShapeEvents.js';

// Import concrete classes for the map
import type {
  CanvasPointerDownEvent,
  CanvasPointerMoveEvent,
  CanvasPointerUpEvent,
  CanvasClickedEvent,
  CanvasDblClickedEvent,
  CanvasContextMenuEvent,
  CanvasResizeEvent,
} from '../events/canvas-events.js';
import type {
  CameraZoomEvent,
  CameraPanEvent,
  CameraFitEvent,
  CameraResetEvent,
  CameraAnimateStartEvent,
  CameraAnimateEndEvent,
} from '../events/camera-events.js';
import type {
  PluginRegisteredEvent,
  PluginDestroyedEvent,
  PluginEnabledEvent,
  PluginDisabledEvent,
} from '../events/plugin-events.js';
import type {
  LayerAddedEvent,
  LayerRemovedEvent,
  LayerVisibilityChangedEvent,
} from '../events/layer-events.js';
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
} from '../plugins/builtin/shape-plugin/ShapeEvents.js';
import type {
  ElementClickEvent,
  ElementDblClickEvent,
  ElementContextMenuEvent,
  ElementPointerOverEvent,
  ElementPointerOutEvent,
  ElementPointerMoveEvent,
  ElementPointerDownEvent,
  ElementPointerUpEvent,
  ElementDragStartEvent,
  ElementDragMoveEvent,
  ElementDragEndEvent,
  ElementStateChangeEvent,
  ElementAddedEvent,
  ElementRemovedEvent,
} from '../plugins/builtin/element-plugin/ElementEvents.js';

// ---------------------------------------------------------------------------
// Master event map
// ---------------------------------------------------------------------------

/**
 * Full map of all events emitted by the canvas and its subsystems.
 * Each key maps to a **concrete event class** — no plain object payloads.
 *
 * Downstream packages can extend this map via module augmentation:
 * ```ts
 * declare module '@invana/canvas' {
 *   interface CanvasEventMap {
 *     'graph:node:click': GraphNodeClickEvent;
 *   }
 * }
 * ```
 *
 * @example
 * ```ts
 * canvas.events.on('camera:zoom', (e) => console.log(e.scale));
 * canvas.events.on('canvas:clicked', (e) => console.log(e.worldX, e.worldY));
 * canvas.events.on('shape:click', (e) => console.log(e.shapeId, e.nativeEvent.ctrlKey));
 * canvas.events.on('shape:dragmove', (e) => console.log(e.dx, e.dy));
 * ```
 */
export interface CanvasEventMap {
  // ── Camera ────────────────────────────────────────────────────────────────
  /** Fired when zoom level changes */
  'camera:zoom':           CameraZoomEvent;
  /** Fired when the camera pans */
  'camera:pan':            CameraPanEvent;
  /** Fired after fitContent() completes */
  'camera:fit':            CameraFitEvent;
  /** Fired when camera is reset to origin */
  'camera:reset':          CameraResetEvent;
  /** Fired at the start of an animated camera transition */
  'camera:animate-start':  CameraAnimateStartEvent;
  /** Fired when an animated camera transition completes */
  'camera:animate-end':    CameraAnimateEndEvent;

  // ── Canvas background pointer events ─────────────────────────────────────
  /** Fired on pointerdown on the canvas background (not a shape) */
  'canvas:pointerdown':    CanvasPointerDownEvent;
  /** Fired on pointermove over the canvas background */
  'canvas:pointermove':    CanvasPointerMoveEvent;
  /** Fired on pointerup on the canvas background */
  'canvas:pointerup':      CanvasPointerUpEvent;
  /** Fired on a single click/tap on the canvas background */
  'canvas:clicked':        CanvasClickedEvent;
  /** Fired on a double-click on the canvas background */
  'canvas:dblclicked':     CanvasDblClickedEvent;
  /** Fired on right-click / context-menu on the canvas background */
  'canvas:contextmenu':    CanvasContextMenuEvent;
  /** Fired when the canvas is resized (manually or via autoResize) */
  'canvas:resize':         CanvasResizeEvent;

  // ── Shape events ──────────────────────────────────────────────────────────
  'shape:click':           ShapeClickEvent;
  'shape:dblclick':        ShapeDblClickEvent;
  'shape:contextmenu':     ShapeContextMenuEvent;
  'shape:pointerover':     ShapePointerOverEvent;
  'shape:pointerout':      ShapePointerOutEvent;
  'shape:pointermove':     ShapePointerMoveEvent;
  'shape:pointerdown':     ShapePointerDownEvent;
  'shape:pointerup':       ShapePointerUpEvent;
  'shape:dragstart':       ShapeDragStartEvent;
  'shape:dragmove':        ShapeDragMoveEvent;
  'shape:dragend':         ShapeDragEndEvent;

  // ── Element events (ElementPlugin) ─────────────────────────────────────────
  'element:click':         ElementClickEvent;
  'element:dblclick':      ElementDblClickEvent;
  'element:contextmenu':   ElementContextMenuEvent;
  'element:pointerover':   ElementPointerOverEvent;
  'element:pointerout':    ElementPointerOutEvent;
  'element:pointermove':   ElementPointerMoveEvent;
  'element:pointerdown':   ElementPointerDownEvent;
  'element:pointerup':     ElementPointerUpEvent;
  'element:dragstart':     ElementDragStartEvent;
  'element:dragmove':      ElementDragMoveEvent;
  'element:dragend':       ElementDragEndEvent;
  'element:statechange':   ElementStateChangeEvent;
  'element:added':         ElementAddedEvent;
  'element:removed':       ElementRemovedEvent;

  // ── Plugin lifecycle ──────────────────────────────────────────────────────
  'plugin:registered':     PluginRegisteredEvent;
  'plugin:destroyed':      PluginDestroyedEvent;
  'plugin:enabled':        PluginEnabledEvent;
  'plugin:disabled':       PluginDisabledEvent;

  // ── Layer ─────────────────────────────────────────────────────────────────
  'layer:added':              LayerAddedEvent;
  'layer:removed':            LayerRemovedEvent;
  'layer:visibility-changed': LayerVisibilityChangedEvent;
}
