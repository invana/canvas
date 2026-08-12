/**
 * `PixiViewportBinding` — the `pixi-viewport` realisation of {@link ICameraBinding}.
 *
 * Every `Viewport` call the engine ever needed now lives in this one file:
 * transform reads/writes, projection, the plugin registry (`drag` / `decelerate`
 * / `wheel` / `pinch`), plugin pause/resume, and the `moved` / `zoomed` /
 * `drag-start` events. `Camera` above it holds no pixi type at all.
 *
 * This is the file P6 moves into `@invana/renderer-pixijs`; a three.js binding
 * would implement the same interface over an orthographic camera
 * (`docs/renderer-split-design.md` §5).
 */

import type { Viewport } from 'pixi-viewport';
import type { CameraChangeKind, CameraInputConfig, CameraInputModifier, CameraTransformValue, ICameraBinding, Point, Rect } from '@invana/canvas';

/** Semantic modifier → the `pixi-viewport` key codes for that physical key. */
const MODIFIER_KEYS: Record<CameraInputModifier, string[]> = {
  control: ['ControlLeft', 'ControlRight'],
  shift: ['ShiftLeft', 'ShiftRight'],
  alt: ['AltLeft', 'AltRight'],
  meta: ['MetaLeft', 'MetaRight'],
  space: ['Space'],
};

export class PixiViewportBinding implements ICameraBinding {
  /**
   * Suppresses the `moved` / `zoomed` echo while this binding is the one
   * writing. Direct `position.set` / `scale.set` don't fire those events, but
   * {@link zoomToCentre} goes through `viewport.setZoom`, which does — and
   * `Camera` has already emitted for that change.
   */
  private _writing = false;

  constructor(private readonly viewport: Viewport) {}

  getTransform(): CameraTransformValue {
    return {
      x: this.viewport.position.x,
      y: this.viewport.position.y,
      zoom: this.viewport.scale.x,
    };
  }

  setTransform(t: CameraTransformValue): void {
    this._writing = true;
    try {
      if (this.viewport.scale.x !== t.zoom) this.viewport.scale.set(t.zoom);
      this.viewport.position.set(t.x, t.y);
    } finally {
      this._writing = false;
    }
  }

  zoomToCentre(zoom: number): void {
    this._writing = true;
    try {
      // `setZoom(scale, true)` keeps the world centre under the screen centre.
      this.viewport.setZoom(zoom, true);
    } finally {
      this._writing = false;
    }
  }

  resize(screenWidth: number, screenHeight: number): void {
    // Forwarded so the viewport's hit-area + plugin math stays correct.
    this.viewport.resize(screenWidth, screenHeight);
  }

  toWorld(screenX: number, screenY: number): Point {
    const p = this.viewport.toWorld<Point>(screenX, screenY);
    return { x: p.x, y: p.y };
  }

  toScreen(worldX: number, worldY: number): Point {
    const p = this.viewport.toScreen<Point>(worldX, worldY);
    return { x: p.x, y: p.y };
  }

  getVisibleBounds(): Rect {
    const r = this.viewport.getVisibleBounds();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }

  configureInput(config: CameraInputConfig): void {
    if (config.drag !== undefined) {
      this.viewport.plugins.remove('drag');
      // Dropped unconditionally, not gated on the incoming `decelerate`, so
      // re-arming with momentum turned off actually removes the running plugin.
      this.viewport.plugins.remove('decelerate');
      const d = config.drag;
      if (d) {
        const modifier = d.modifier ?? null;
        this.viewport.drag({
          mouseButtons: d.mouseButtons ?? 'left',
          keyToPress: modifier ? MODIFIER_KEYS[modifier] : undefined,
        });
        if (d.decelerate ?? true) this.viewport.decelerate();
      }
    }
    if (config.wheel !== undefined) {
      this.viewport.plugins.remove('wheel');
      const w = config.wheel;
      if (w) {
        const modifier = w.modifier ?? null;
        this.viewport.wheel({
          percent: w.percent ?? 0.1,
          smooth: w.smooth ?? false,
          keyToPress: modifier ? MODIFIER_KEYS[modifier] : undefined,
          trackpadPinch: w.trackpadPinch ?? true,
        });
      }
    }
    if (config.pinch !== undefined) {
      this.viewport.plugins.remove('pinch');
      const p = config.pinch;
      if (p) {
        this.viewport.pinch({ noDrag: p.noDrag ?? false, percent: p.percent ?? 0.1 });
      }
    }
  }

  setDragSuspended(suspended: boolean): void {
    if (suspended) this.viewport.plugins.pause('drag');
    else this.viewport.plugins.resume('drag');
  }

  onTransformChange(fn: (kind: CameraChangeKind) => void): () => void {
    const onMoved = (): void => {
      if (!this._writing) fn('pan');
    };
    const onZoomed = (): void => {
      if (!this._writing) fn('zoom');
    };
    this.viewport.on('moved', onMoved);
    this.viewport.on('zoomed', onZoomed);
    return () => {
      this.viewport.off('moved', onMoved);
      this.viewport.off('zoomed', onZoomed);
    };
  }

  onDragStart(fn: () => void): () => void {
    this.viewport.on('drag-start', fn);
    return () => this.viewport.off('drag-start', fn);
  }

  tick(dtMs: number): void {
    this.viewport.update(dtMs);
  }
}
