// ── LODController ─────────────────────────────────────────────────────────────
// Maps the current camera zoom level to a render detail level.
// ShapeObject.draw() checks RenderDetail to skip layers at low zoom.

export enum RenderDetail {
  /** zoom < 0.2: dot only — 2px circle, no border, no label, no halo */
  DOT = 0,
  /** zoom 0.2–0.6: fill + border */
  FILL_BORDER = 1,
  /** zoom 0.6–1.5: fill + border + halo-on-hover */
  FULL = 2,
  /** zoom > 1.5: everything + label */
  DETAIL = 3,
}

export interface LODThresholds {
  dot: number;
  fillBorder: number;
  full: number;
}

const DEFAULTS: LODThresholds = {
  /**
   * 0 = DOT mode is effectively disabled — pixi-viewport's natural
   * scaling is sufficient; 2-world-pixel dots collapse to sub-pixel
   * at low zoom and look broken. Only set > 0 for graphs with 10k+ nodes.
   */
  dot: 0,
  /** Below this zoom: fill+border only (no labels/halos — perf) */
  fillBorder: 0.15,
  /** Below this zoom: full fill+border but no labels */
  full: 0.4,
};

export class LODController {
  private _thresholds: LODThresholds;
  /** Start at DETAIL so labels show at startup (synced from camera.scale in ShapePlugin.register) */
  private _current: RenderDetail = RenderDetail.DETAIL;

  constructor(thresholds: Partial<LODThresholds> = {}) {
    this._thresholds = { ...DEFAULTS, ...thresholds };
  }

  /** Call whenever camera zoom changes. Returns true if detail level changed. */
  update(zoom: number): boolean {
    const next = this._compute(zoom);
    if (next === this._current) return false;
    this._current = next;
    return true;
  }

  get current(): RenderDetail {
    return this._current;
  }

  private _compute(zoom: number): RenderDetail {
    if (zoom < this._thresholds.dot)        return RenderDetail.DOT;
    if (zoom < this._thresholds.fillBorder) return RenderDetail.FILL_BORDER;
    if (zoom < this._thresholds.full)       return RenderDetail.FULL;
    return RenderDetail.DETAIL;
  }
}
