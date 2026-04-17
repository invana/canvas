// Well-typed canvas event map — no PixiJS types in payloads

import type { Point, Bounds } from './canvas.js';

// ---------------------------------------------------------------------------
// Camera events
// ---------------------------------------------------------------------------

/** Emitted when the zoom level changes */
export interface CameraZoomEvent {
  /** New absolute scale (1.0 = 100%) */
  scale: number;
  /** Screen-space point the zoom was centered on */
  center: Point;
}

/** Emitted when the camera pans */
export interface CameraPanEvent {
  /** New camera world-space X position */
  x: number;
  /** New camera world-space Y position */
  y: number;
}

/** Emitted after `fitContent()` completes */
export interface CameraFitEvent {
  /** World-space bounds that were fitted into the viewport */
  bounds: Bounds;
}

/** Emitted at the start of an animated camera transition */
export interface CameraAnimateStartEvent {
  targetScale: number;
  targetX: number;
  targetY: number;
}

// ---------------------------------------------------------------------------
// Canvas background pointer events
// ---------------------------------------------------------------------------

/** Emitted on pointer interactions with the canvas background (not with any element) */
export interface CanvasBgPointerEvent {
  /** X coordinate in world space */
  worldX: number;
  /** Y coordinate in world space */
  worldY: number;
  /** X coordinate relative to the canvas element */
  screenX: number;
  /** Y coordinate relative to the canvas element */
  screenY: number;
  /** The original browser PointerEvent */
  originalEvent: PointerEvent;
}

// ---------------------------------------------------------------------------
// Plugin lifecycle events
// ---------------------------------------------------------------------------

/** Emitted when a plugin is registered or destroyed */
export interface PluginLifecycleEvent {
  /** The `id` of the affected plugin */
  pluginId: string;
}

// ---------------------------------------------------------------------------
// Layer events
// ---------------------------------------------------------------------------

/** Emitted when a layer's visibility changes */
export interface LayerVisibilityEvent {
  /** The id of the affected layer */
  layerId: string;
  /** New visibility state */
  visible: boolean;
}

/** Emitted when a layer is added or removed */
export interface LayerEvent {
  /** The id of the affected layer */
  layerId: string;
}

// ---------------------------------------------------------------------------
// Master event map
// ---------------------------------------------------------------------------

/**
 * Full map of all events emitted by the canvas and its subsystems.
 * Use with `canvas.events.on(eventName, handler)`.
 *
 * @example
 * ```ts
 * canvas.events.on('camera:zoom', ({ scale }) => console.log('zoom:', scale));
 * canvas.events.on('canvas:clicked', ({ worldX, worldY }) => console.log(worldX, worldY));
 * canvas.events.on('plugin:registered', ({ pluginId }) => console.log('plugin added:', pluginId));
 * ```
 */
export interface CanvasEventMap {
  // Camera
  /** Fired when zoom level changes */
  'camera:zoom':           CameraZoomEvent;
  /** Fired when the camera pans */
  'camera:pan':            CameraPanEvent;
  /** Fired after fitContent() completes */
  'camera:fit':            CameraFitEvent;
  /** Fired when camera is reset to origin */
  'camera:reset':          Record<string, never>;
  /** Fired at the start of an animated camera transition */
  'camera:animate-start':  CameraAnimateStartEvent;
  /** Fired when an animated camera transition completes */
  'camera:animate-end':    Record<string, never>;

  // Canvas background
  /** Fired on pointerdown on the canvas background */
  'canvas:pointerdown':    CanvasBgPointerEvent;
  /** Fired on pointermove over the canvas background */
  'canvas:pointermove':    CanvasBgPointerEvent;
  /** Fired on pointerup on the canvas background */
  'canvas:pointerup':      CanvasBgPointerEvent;
  /** Fired on a single click/tap on the canvas background */
  'canvas:clicked':        CanvasBgPointerEvent;
  'canvas:dblclicked':     CanvasBgPointerEvent;
  'canvas:contextmenu':    CanvasBgPointerEvent;

  // Plugin lifecycle
  'plugin:registered':     PluginLifecycleEvent;
  'plugin:destroyed':      PluginLifecycleEvent;

  // Layer
  'layer:visibility-changed': LayerVisibilityEvent;
  'layer:added':           LayerEvent;
  'layer:removed':         LayerEvent;
}
