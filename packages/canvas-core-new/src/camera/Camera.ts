import { Viewport } from 'pixi-viewport';
import type { EventSystem } from 'pixi.js';
import type { CameraAPI, CameraAnimationOptions } from './CameraAPI.js';
import type { Point, Bounds } from '../types/canvas.js';
import type { EventBus } from '../events/EventBus.js';

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
      this._events.emit('camera:pan', { x: this._viewport.x, y: this._viewport.y });
    });
    this._viewport.on('zoomed', () => {
      this._events.emit('camera:zoom', {
        scale: this._viewport.scale.x,
        center: { x: this._viewport.x, y: this._viewport.y },
      });
    });
  }

  get x(): number { return this._viewport.x; }
  get y(): number { return this._viewport.y; }
  get scale(): number { return this._viewport.scale.x; }

  pan(deltaX: number, deltaY: number): void {
    this._viewport.x += deltaX;
    this._viewport.y += deltaY;
  }

  panTo(worldX: number, worldY: number): void {
    this._viewport.moveCenter(worldX, worldY);
  }

  zoom(scale: number): void {
    this._viewport.scale.set(scale);
  }

  zoomTo(scale: number, center?: Point): void {
    if (center) {
      this._viewport.setZoom(scale, true);
    } else {
      this._viewport.setZoom(scale, true);
    }
  }

  fitContent(_padding = 50): void {
    this._viewport.fit(true, this._viewport.worldWidth, this._viewport.worldHeight);
    this._events.emit('camera:fit', { bounds: this.getBounds() });
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
    this._events.emit('camera:reset', {});
  }

  animate(options: CameraAnimationOptions): void {
    const { x = this._viewport.x, y = this._viewport.y, scale = this._viewport.scale.x, duration = 500 } = options;
    this._events.emit('camera:animate-start', { targetScale: scale, targetX: x, targetY: y });
    this._viewport.animate({ position: { x, y }, scale, time: duration, removeOnInterrupt: true });
    // animate-end fired after duration — use a simple timeout
    setTimeout(() => {
      this._events.emit('camera:animate-end', {});
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
