// ── ViewportTracker ───────────────────────────────────────────────────────────
// Computes the world-space AABB of the current viewport.
// Emits 'viewport:changed' whenever the camera moves or zooms.

import type { CameraAPI } from '../../../camera/CameraAPI.js';
import type { EventBus } from '../../../events/EventBus.js';

export interface CameraBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * `CameraTracker` computes the world-space AABB of the current viewport and
 * notifies {@link SceneContainer} whenever the camera moves or zooms so that
 * the visible shape set can be updated.
 *
 * @remarks
 * The computed bounds include a 10% padding on each side for smooth edge entry
 * (shapes slightly outside the visible area are pre-attached before the user
 * actually pans to them).
 *
 * This class is internal to {@link ShapePlugin}.
 */
export class CameraTracker {
  private _camera: CameraAPI;
  private _onChange: (bounds: CameraBounds) => void;

  constructor(
    camera: CameraAPI,
    events: EventBus,
    onChange: (bounds: CameraBounds) => void,
  ) {
    this._camera = camera;
    this._onChange = onChange;

    // Re-cull whenever camera moves, zooms, or resets
    events.on('camera:pan',   () => this._emit());
    events.on('camera:zoom',  () => this._emit());
    events.on('camera:reset', () => this._emit());
  }

  /** Current world-space viewport AABB with a 10% padding for smooth edge entry. */
  get bounds(): CameraBounds {
    return this._compute();
  }

  /**
   * Immediately compute the current viewport bounds and notify the scene
   * container. Call once after `setData()` and `fit()` to apply an initial
   * visibility pass.
   */
  flush(): void {
    this._emit();
  }

  private _emit(): void {
    this._onChange(this._compute());
  }

  private _compute(): CameraBounds {
    // Use pixi-viewport's getVisibleBounds() via CameraAPI.getBounds() —
    // camera.x/y are viewport container screen-positions, not world coords.
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
