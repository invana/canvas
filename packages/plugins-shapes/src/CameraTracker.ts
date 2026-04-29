// ── CameraTracker ─────────────────────────────────────────────────────────────
// Computes the world-space AABB of the current viewport and notifies
// ShapeScene whenever the camera moves or zooms.

import type { CameraAPI } from '@invana/canvas';
import type { EventBus } from '@invana/canvas';

/** World-space axis-aligned bounding box of the current viewport. */
export interface CameraBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * `CameraTracker` computes the world-space AABB of the viewport and notifies
 * {@link ShapeScene} whenever the camera moves or zooms so the visible element
 * set can be updated.
 *
 * @remarks
 * The computed bounds include a 10% padding on each side for smooth edge entry —
 * elements slightly outside the visible area are pre-attached before the user
 * pans to them.
 *
 * This class is internal to {@link ShapesPlugin}.
 */
export class CameraTracker {
  private _camera: CameraAPI;
  private _onChange: (bounds: CameraBounds) => void;
  private _rafId: number | null = null;

  constructor(
    camera: CameraAPI,
    events: EventBus,
    onChange: (bounds: CameraBounds) => void,
  ) {
    this._camera = camera;
    this._onChange = onChange;

    events.on('camera:pan',   () => this._scheduleEmit());
    events.on('camera:zoom',  () => this._scheduleEmit());
    events.on('camera:reset', () => this._scheduleEmit());
  }

  /** Current world-space viewport AABB with 10% padding for smooth edge entry. */
  get bounds(): CameraBounds {
    return this._compute();
  }

  /**
   * Immediately compute the current viewport bounds and notify the scene.
   */
  flush(): void {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._onChange(this._compute());
  }

  private _scheduleEmit(): void {
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this._onChange(this._compute());
    });
  }

  private _compute(): CameraBounds {
    const b = this._camera.getBounds();
    const pad = Math.max(b.width, b.height) * 0.1;
    return {
      minX: b.x - pad,
      minY: b.y - pad,
      maxX: b.x + b.width + pad,
      maxY: b.y + b.height + pad,
    };
  }
}
