/**
 * `ICameraBinding` — the renderer's half of the camera.
 *
 * {@link Camera} is the engine's pan/zoom facade: it owns the semantics
 * (clamping, anchored zoom, fit-to-rect, bus events, store sync) and holds no
 * backend type. The *concrete* viewport — a `pixi-viewport` `Viewport` today, an
 * orthographic three.js camera later — sits behind this interface.
 *
 * Everything here is expressed in engine vocabulary: an abstract
 * `{ x, y, zoom }` transform, screen↔world projection, and **semantic** input
 * config (`percent`, `modifier`) rather than a plugin registry. The mapping from
 * `modifier` to physical key codes, and from an input to whatever the backend
 * calls its pan/zoom machinery, belongs to the implementation
 * (`docs/renderer-split-design.md` §5, P6).
 *
 * The split is what lets `Camera` be tested with no GPU, and what lets P6 move
 * the pixi realisation into `@invana/renderer-pixijs` without touching a single
 * camera-input behaviour.
 */

import type { Point, Rect } from '@invana/canvas-store';

/** An absolute transform: world (0,0) sits at `(x, y)` screen px, uniform `zoom`. */
export interface CameraTransformValue {
  x: number;
  y: number;
  zoom: number;
}

/**
 * A modifier key an input gesture can be gated on. Semantic on purpose — the
 * binding maps these to whatever key codes its backend wants.
 *
 * `space` is a held key rather than a true modifier, but it gates drag-pan the
 * same way (Figma / Sketch style), so it rides the same vocabulary.
 */
export type CameraInputModifier = 'control' | 'shift' | 'alt' | 'meta' | 'space';

/** Drag-pan input configuration. */
export interface DragInputOptions {
  /** Which mouse buttons drag the canvas. Default `'left'`. */
  mouseButtons?: 'all' | 'left' | 'right' | 'middle';
  /**
   * Require this key to be held for a drag to pan, leaving plain drag to other
   * gestures (lasso, brush, …). `null` / omitted = no modifier.
   */
  modifier?: CameraInputModifier | null;
  /** Momentum glide after the pointer lifts. Default `true`. */
  decelerate?: boolean;
}

/** Wheel-zoom input configuration. */
export interface WheelInputOptions {
  /** Zoom fraction per wheel tick. Default `0.1` (10%). */
  percent?: number;
  /** Smooth-scroll frame count; `false` = instant snap. Default `false`. */
  smooth?: false | number;
  /**
   * Require this modifier to be held for the wheel to zoom, leaving plain
   * scroll to the page. `null` / omitted = no modifier.
   */
  modifier?: CameraInputModifier | null;
  /** Treat a two-finger trackpad pinch as zoom rather than scroll. Default `true`. */
  trackpadPinch?: boolean;
}

/** Pinch-zoom input configuration. */
export interface PinchInputOptions {
  /** Suppress the implicit pan that accompanies a pinch. Default `false`. */
  noDrag?: boolean;
  /** Zoom speed multiplier. Default `0.1`. */
  percent?: number;
}

/**
 * Patch for camera input. An omitted key leaves that input untouched; `null`
 * removes it.
 */
export interface CameraInputConfig {
  wheel?: WheelInputOptions | null;
  pinch?: PinchInputOptions | null;
  drag?: DragInputOptions | null;
}

/** What moved, when a binding reports a backend-driven transform change. */
export type CameraChangeKind = 'pan' | 'zoom';

export interface ICameraBinding {
  /** The current transform, read straight from the backend viewport. */
  getTransform(): CameraTransformValue;

  /**
   * Write the transform verbatim — no clamping, no re-anchoring. `Camera` has
   * already applied its own semantics; this is the raw write.
   *
   * Must **not** re-report through {@link onTransformChange}: `Camera` knows it
   * made this change and emits its own events, so an echo would double-fire.
   */
  setTransform(t: CameraTransformValue): void;

  /**
   * Zoom about the viewport centre, keeping the centre world point fixed. Split
   * out from {@link setTransform} because backends implement centre-anchored
   * zoom themselves and their arithmetic is what users' muscle memory expects.
   */
  zoomToCentre(zoom: number): void;

  /** Viewport size changed (CSS px). */
  resize(screenWidth: number, screenHeight: number): void;

  toWorld(screenX: number, screenY: number): Point;
  toScreen(worldX: number, worldY: number): Point;

  /** The world-space rectangle currently visible. */
  getVisibleBounds(): Rect;

  /**
   * Install / replace / remove the backend's own pan and zoom inputs. Patch
   * semantics: an omitted key is untouched, `null` removes that input.
   */
  configureInput(config: CameraInputConfig): void;

  /**
   * Suspend or restore drag-panning without tearing it down — how gesture
   * arbitration yields the camera. Momentum is deliberately left running so an
   * in-flight glide finishes.
   */
  setDragSuspended(suspended: boolean): void;

  /**
   * Subscribe to transform changes the **backend** made on its own — a wheel
   * tick, a drag, a momentum glide. Changes `Camera` initiates never arrive
   * here. Returns an unsubscribe function.
   */
  onTransformChange(fn: (kind: CameraChangeKind) => void): () => void;

  /**
   * Subscribe to the start of a drag-pan, fired once the pointer has moved
   * enough to pan. Returns an unsubscribe function.
   */
  onDragStart(fn: () => void): () => void;

  /** Advance time-based input animation (momentum, snap). Driven by the engine's clock. */
  tick(dtMs: number): void;
}
