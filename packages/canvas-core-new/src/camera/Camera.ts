import { Viewport } from 'pixi-viewport';
import type { EventSystem } from 'pixi.js';
import type { CameraAPI, CameraAnimationOptions } from './CameraAPI.js';
import type { Point, Bounds } from '../types/canvas.js';
import type { EventBus } from '../events/EventBus.js';
import {
  CameraZoomEvent,
  CameraPanEvent,
  CameraResetEvent,
  CameraAnimateStartEvent,
  CameraAnimateEndEvent,
} from '../events/camera-events.js';

/**
 * Camera — internal implementation of CameraAPI.
 * Wraps pixi-viewport. Never exposed as a concrete type outside this file.
 */
export class Camera implements CameraAPI {
  /** @internal */
  readonly _viewport: InstanceType<typeof Viewport>;

  private _events: EventBus;

  constructor(options: {
    screenWidth: number;
    screenHeight: number;
    worldWidth: number;
    worldHeight: number;
    events: EventBus;
    /** The PixiJS EventSystem from app.renderer.events */
    rendererEvents: EventSystem;
  }) {
    this._events = options.events;
    this._viewport = new Viewport({
      screenWidth: options.screenWidth,
      screenHeight: options.screenHeight,
      worldWidth: options.worldWidth,
      worldHeight: options.worldHeight,
      events: options.rendererEvents,
    });

    this._viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate();

    this._wireEvents();
  }

  private _wireEvents(): void {
    this._viewport.on('moved', () => {
      this._events.emit('camera:pan', new CameraPanEvent({ x: this._viewport.x, y: this._viewport.y }));
    });
    this._viewport.on('zoomed', () => {
      this._events.emit('camera:zoom', new CameraZoomEvent({
        scale: this._viewport.scale.x,
        center: { x: this._viewport.x, y: this._viewport.y },
      }));
    });
  }

  get x(): number { return this._viewport.x; }
  get y(): number { return this._viewport.y; }
  get scale(): number { return this._viewport.scale.x; }

  pan(deltaX: number, deltaY: number): void {
    this._viewport.x += deltaX;
    this._viewport.y += deltaY;
    this._emitPan();
  }

  panTo(worldX: number, worldY: number): void {
    this._viewport.moveCenter(worldX, worldY);
    this._emitPan();
  }

  zoom(scale: number): void {
    this._viewport.scale.set(scale);
    this._emitZoom();
  }

  zoomTo(scale: number, _center?: Point): void {
    this._viewport.setZoom(scale, true);
    this._emitZoom();
  }

  fitTo(bounds: Bounds, padding = 60): void {
    const sw = this._viewport.screenWidth;
    const sh = this._viewport.screenHeight;
    const cx = bounds.x + bounds.width  / 2;
    const cy = bounds.y + bounds.height / 2;
    const scale = Math.min(
      sw / (bounds.width  + padding * 2),
      sh / (bounds.height + padding * 2),
    );
    // pixi-viewport's moveCenter/setZoom do NOT fire 'moved'/'zoomed' when called
    // programmatically — only user-interaction plugins do. Emit manually.
    this._viewport.moveCenter(cx, cy);
    this._viewport.setZoom(Math.max(scale, 0.001), true);
    this._emitZoom();
  }

  toWorld(screenX: number, screenY: number): Point {
    const pt = this._viewport.toWorld(screenX, screenY);
    return { x: pt.x, y: pt.y };
  }

  toScreen(worldX: number, worldY: number): Point {
    const pt = this._viewport.toScreen(worldX, worldY);
    return { x: pt.x, y: pt.y };
  }

  reset(): void {
    this._viewport.setZoom(1, true);
    this._viewport.moveCenter(0, 0);
    this._events.emit('camera:reset', new CameraResetEvent());
  }

  private _emitPan(): void {
    this._events.emit('camera:pan', new CameraPanEvent({ x: this._viewport.x, y: this._viewport.y }));
  }

  private _emitZoom(): void {
    this._events.emit('camera:zoom', new CameraZoomEvent({
      scale: this._viewport.scale.x,
      center: { x: this._viewport.x, y: this._viewport.y },
    }));
  }

  animate(options: CameraAnimationOptions): void {
    const { x = this._viewport.x, y = this._viewport.y, scale = this._viewport.scale.x, duration = 500 } = options;
    this._events.emit('camera:animate-start', new CameraAnimateStartEvent({ targetScale: scale, targetX: x, targetY: y }));
    this._viewport.animate({ position: { x, y }, scale, time: duration, removeOnInterrupt: true });
    // animate-end fired after duration — use a simple timeout
    setTimeout(() => {
      this._events.emit('camera:animate-end', new CameraAnimateEndEvent());
    }, duration);
  }

  getBounds(): Bounds {
    const rect = this._viewport.getVisibleBounds();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  }

  destroy(): void {
    this._viewport.destroy();
  }
}
