// ── LODController ─────────────────────────────────────────────────────────────
// Maps the current camera zoom level to a LOD (Level of Detail) level.
// BaseSolid.draw() and BaseConnector.draw() check LOD to skip expensive draw
// calls at low zoom.

/**
 * Level of Detail — controls how much is rendered at a given zoom level.
 *
 * @remarks
 * Four levels, ordered cheapest → most expensive:
 * - `DOT`         — 2 px dot only (for extreme zoom-out or massive graphs)
 * - `FILL_BORDER` — fill + border, no labels or hover halos
 * - `FULL`        — fill + border + hover halos
 * - `DETAIL`      — everything including text labels
 */
export enum LOD {
  /** zoom < dot threshold: 2 px dot only — no border, no label, no halo */
  DOT = 0,
  /** zoom < fillBorder threshold: fill + border only */
  FILL_BORDER = 1,
  /** zoom < full threshold: fill + border + hover halos */
  FULL = 2,
  /** zoom ≥ full threshold: everything including text labels */
  DETAIL = 3,
}

/** Zoom-level thresholds that drive {@link LOD} transitions. */
export interface LODThresholds {
  /** Below this zoom, render `LOD.DOT`.  Set to 0 to disable DOT mode. */
  dot: number;
  /** Below this zoom, render `LOD.FILL_BORDER`. */
  fillBorder: number;
  /** Below this zoom, render `LOD.FULL`. */
  full: number;
}

const DEFAULTS: LODThresholds = {
  /**
   * 0 = DOT mode disabled — pixi-viewport's natural scaling handles extreme
   * zoom-out adequately for most graphs.  Set > 0 for 10k+ node graphs.
   */
  dot: 0,
  fillBorder: 0.15,
  full: 0.4,
};

/**
 * `LODController` maps the current camera zoom to a {@link LOD} level and
 * signals callers when the level changes.
 *
 * @remarks
 * This class is internal to {@link ElementPlugin}.
 */
export class LODController {
  private _thresholds: LODThresholds;
  /** Start at DETAIL so labels show at startup. Synced from camera.scale in ElementPlugin.register. */
  private _current: LOD = LOD.DETAIL;

  constructor(thresholds: Partial<LODThresholds> = {}) {
    this._thresholds = { ...DEFAULTS, ...thresholds };
  }

  /**
   * Re-evaluate the LOD level for a new zoom scale.
   *
   * @param zoom - The current camera scale (1 = 100%).
   * @returns `true` if the LOD level changed, `false` if it stayed the same.
   */
  update(zoom: number): boolean {
    const next = this._compute(zoom);
    if (next === this._current) return false;
    this._current = next;
    return true;
  }

  /** The current {@link LOD} level. */
  get current(): LOD {
    return this._current;
  }

  private _compute(zoom: number): LOD {
    if (zoom < this._thresholds.dot)        return LOD.DOT;
    if (zoom < this._thresholds.fillBorder) return LOD.FILL_BORDER;
    if (zoom < this._thresholds.full)       return LOD.FULL;
    return LOD.DETAIL;
  }
}
