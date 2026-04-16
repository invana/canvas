import type { Point, Bounds } from '../types/canvas.js';

export interface CameraAnimationOptions {
  x?: number;
  y?: number;
  scale?: number;
  duration?: number;
  ease?: string;
}

/**
 * CameraAPI — the only camera interface exposed publicly.
 * Concrete implementation wraps pixi-viewport internally.
 */
export interface CameraAPI {
  readonly x: number;
  readonly y: number;
  readonly scale: number;

  pan(deltaX: number, deltaY: number): void;
  panTo(worldX: number, worldY: number): void;
  zoom(scale: number): void;
  zoomTo(scale: number, center?: Point): void;
  fitContent(padding?: number): void;
  toWorld(screenX: number, screenY: number): Point;
  toScreen(worldX: number, worldY: number): Point;
  reset(): void;
  animate(options: CameraAnimationOptions): void;
  getBounds(): Bounds;
}
