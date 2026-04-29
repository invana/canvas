// ── LODController ─────────────────────────────────────────────────────────────
// Maps the current camera zoom level to a LOD (Level of Detail) level.
// BaseShape.draw() and BaseConnector.draw() check LOD to skip expensive draw
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
  dot: 0,
  fillBorder: 0.15,
  full: 0.65,
};

/**
 * `LODController` maps the current camera zoom to a {@link LOD} level and
 * signals callers when the level changes.
 *
 * @remarks
 * This class is internal to {@link ShapesPlugin}.
 */
export class LODController {
  private _thresholds: LODThresholds;
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
    const { dot, fillBorder, full } = this._thresholds;
    const h = 0.02;
    const dotT  = dot > 0
      ? (this._current <= LOD.DOT        ? dot        + h : dot        - h)
      : 0;
    const fbT   = this._current <= LOD.FILL_BORDER ? fillBorder + h : fillBorder - h;
    const fullT = this._current <= LOD.FULL        ? full        + h : full        - h;

    if (dot > 0 && zoom < dotT) return LOD.DOT;
    if (zoom < fbT)              return LOD.FILL_BORDER;
    if (zoom < fullT)            return LOD.FULL;
    return LOD.DETAIL;
  }
}
