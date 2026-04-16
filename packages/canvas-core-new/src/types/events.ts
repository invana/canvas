// Well-typed canvas event map — no PixiJS types in payloads

import type { Point, Bounds } from './canvas.js';

// ---------------------------------------------------------------------------
// Camera events
// ---------------------------------------------------------------------------
export interface CameraZoomEvent {
  scale: number;
  center: Point;
}
export interface CameraPanEvent {
  x: number;
  y: number;
}
export interface CameraFitEvent {
  bounds: Bounds;
}
export interface CameraAnimateStartEvent {
  targetScale: number;
  targetX: number;
  targetY: number;
}

// ---------------------------------------------------------------------------
// Canvas background pointer events
// ---------------------------------------------------------------------------
export interface CanvasBgPointerEvent {
  worldX: number;
  worldY: number;
  screenX: number;
  screenY: number;
  originalEvent: PointerEvent;
}

// ---------------------------------------------------------------------------
// Plugin lifecycle events
// ---------------------------------------------------------------------------
export interface PluginLifecycleEvent {
  pluginId: string;
}

// ---------------------------------------------------------------------------
// Layer events
// ---------------------------------------------------------------------------
export interface LayerVisibilityEvent {
  layerId: string;
  visible: boolean;
}
export interface LayerEvent {
  layerId: string;
}

// ---------------------------------------------------------------------------
// Master event map
// ---------------------------------------------------------------------------
export interface CanvasEventMap {
  // Camera
  'camera:zoom':           CameraZoomEvent;
  'camera:pan':            CameraPanEvent;
  'camera:fit':            CameraFitEvent;
  'camera:reset':          Record<string, never>;
  'camera:animate-start':  CameraAnimateStartEvent;
  'camera:animate-end':    Record<string, never>;

  // Canvas background
  'canvas:pointerdown':    CanvasBgPointerEvent;
  'canvas:pointermove':    CanvasBgPointerEvent;
  'canvas:pointerup':      CanvasBgPointerEvent;
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
