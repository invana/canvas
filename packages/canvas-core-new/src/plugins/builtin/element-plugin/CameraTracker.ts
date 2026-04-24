// ── CameraTracker ─────────────────────────────────────────────────────────────
// Computes the world-space AABB of the current viewport and notifies
// ElementScene whenever the camera moves or zooms.

import type { CameraAPI } from '../../../camera/CameraAPI.js';
import type { EventBus } from '../../../events/EventBus.js';

/** World-space axis-aligned bounding box of the current viewport. */
export interface CameraBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * `CameraTracker` computes the world-space AABB of the viewport and notifies
 * {@link ElementScene} whenever the camera moves or zooms so the visible element
 * set can be updated.
 *
 * @remarks
 * The computed bounds include a 10% padding on each side for smooth edge entry —
 * elements slightly outside the visible area are pre-attached before the user
 * pans to them.
 *
 * This class is internal to {@link ElementPlugin}.
 */
export class CameraTracker {
  private _camera: CameraAPI;
  private _onChange: (bounds: CameraBounds) => void;
  /** Pending RAF id — ensures at most one `onCameraChanged` call per frame. */
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
   * Call once after adding elements and after camera.fit() to trigger an initial
   * visibility pass.
   */
  flush(): void {
    // Cancel any pending RAF so we emit synchronously right now.
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._onChange(this._compute());
  }

  /**
   * Schedule a single `onCameraChanged` call for the next animation frame.
   * If one is already pending, the duplicate is dropped — at most one
   * RBush search + addChild/removeChild pass per rendered frame.
   */
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
