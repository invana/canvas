/**
 * Tracking motion — the pure maths behind `TrackingBehaviour`. No store, no
 * canvas, no clock: every function takes the time it is asked about, so a test
 * (or a replay) drives time by hand.
 *
 * Units: positions are **world units**; `t` is milliseconds on whatever
 * timeline the feed uses (the behaviour compares it with `Date.now()`);
 * `course` is a **compass heading in degrees** (0 = up / north, clockwise);
 * `speed` is **world units per second**.
 */

/** One position report for one object. */
export interface Fix {
  /** Id of the node this fix moves. */
  id: string;
  /** When the object was at this position, ms. Must grow per id; older fixes are dropped. */
  t: number;
  /** World x. */
  x: number;
  /** World y (down is positive, as on the canvas). */
  y: number;
  /** Compass heading, degrees, 0 = up, clockwise. Absent when the feed has none. */
  course?: number;
  /** Ground speed, world units per second. Absent when the feed has none. */
  speed?: number;
}

/** How a sampled position was obtained. */
export type SampleMode = 'interpolated' | 'extrapolated' | 'held';

/** A position the object is drawn at, at one instant. */
export interface Sample {
  x: number;
  y: number;
  /** Heading in degrees when known. */
  course?: number;
  mode: SampleMode;
}

/** Options for {@link sampleTrack}. */
export interface MotionOptions {
  /**
   * Draw the object this far in the past, so there are normally two fixes to
   * interpolate between. Default `1500`.
   */
  renderDelayMs: number;
  /**
   * Past the newest fix, dead-reckon from `speed` + `course` for at most this
   * long, then hold. Default `30000`.
   */
  maxExtrapolateMs: number;
}

/** Defaults for {@link MotionOptions}. */
export const MOTION_DEFAULTS: MotionOptions = {
  renderDelayMs: 1500,
  maxExtrapolateMs: 30_000,
};

/** The signed shortest rotation from `a` to `b`, in degrees, in `(-180, 180]`. */
export function shortestArc(a: number, b: number): number {
  const d = (((b - a) % 360) + 540) % 360 - 180;
  // `% 360` maps exactly-opposite headings to -180; report +180 for stability.
  return d === -180 ? 180 : d;
}

/** Interpolate two headings along the shortest arc, result in `[0, 360)`. */
export function lerpCourse(a: number, b: number, f: number): number {
  return (((a + shortestArc(a, b) * f) % 360) + 360) % 360;
}

/**
 * Where an object is drawn at `now`, given its fixes **oldest first**.
 *
 * - `renderTime = now − renderDelayMs`.
 * - Between two fixes: linear interpolation (heading along the shortest arc).
 * - Before the oldest fix: held at it.
 * - Past the newest fix: dead reckoning from that fix's `speed` and `course`
 *   for at most `maxExtrapolateMs`, then held. A fix with no speed or no course
 *   is held, never guessed.
 */
export function sampleTrack(fixes: readonly Fix[], now: number, opts: MotionOptions = MOTION_DEFAULTS): Sample | null {
  const n = fixes.length;
  if (n === 0) return null;
  const renderTime = now - opts.renderDelayMs;
  const last = fixes[n - 1]!;

  if (renderTime >= last.t) {
    const dt = Math.min(renderTime - last.t, opts.maxExtrapolateMs) / 1000;
    if (dt > 0 && last.speed !== undefined && last.course !== undefined && last.speed > 0) {
      const rad = (last.course * Math.PI) / 180;
      return {
        // Course 0 is up, and up is −y on the canvas.
        x: last.x + last.speed * dt * Math.sin(rad),
        y: last.y - last.speed * dt * Math.cos(rad),
        course: last.course,
        mode: 'extrapolated',
      };
    }
    return { x: last.x, y: last.y, course: last.course, mode: 'held' };
  }

  const first = fixes[0]!;
  if (renderTime <= first.t) return { x: first.x, y: first.y, course: first.course, mode: 'held' };

  // Walk back from the newest: the bracket is almost always the last pair.
  let i = n - 1;
  while (i > 0 && fixes[i - 1]!.t > renderTime) i--;
  const a = fixes[i - 1]!;
  const b = fixes[i]!;
  const f = (renderTime - a.t) / (b.t - a.t);
  return {
    x: a.x + (b.x - a.x) * f,
    y: a.y + (b.y - a.y) * f,
    course:
      a.course !== undefined && b.course !== undefined
        ? lerpCourse(a.course, b.course, f)
        : (b.course ?? a.course),
    mode: 'interpolated',
  };
}

/**
 * Append `fix` to an oldest-first `fixes` list, in place. Returns `false` (and
 * changes nothing) for a non-finite fix or one that is not newer than the
 * newest. Then trims what can no longer be sampled: everything older than the
 * newest fix at or before `now − keepMs`, so the list stays a few entries long.
 */
export function pushFix(fixes: Fix[], fix: Fix, now: number, keepMs: number): boolean {
  if (!Number.isFinite(fix.t) || !Number.isFinite(fix.x) || !Number.isFinite(fix.y)) return false;
  const newest = fixes[fixes.length - 1];
  if (newest && fix.t <= newest.t) return false;
  fixes.push(fix);
  const cutoff = now - keepMs;
  // Keep the newest fix that is at or before the cutoff, drop everything before it.
  let drop = 0;
  for (let i = 0; i < fixes.length - 1; i++) {
    if (fixes[i + 1]!.t <= cutoff) drop = i + 1;
    else break;
  }
  if (drop > 0) fixes.splice(0, drop);
  return true;
}

/** The signal state of a tracked object. */
export type SignalState = 'moving' | 'stopped' | 'stale' | 'lost';

/** Options for {@link signalState}. */
export interface SignalOptions {
  /** No fix for longer than this → `stale`. Default `60000`. */
  staleAfterMs: number;
  /** No fix for longer than this → `lost`. Default `180000`. */
  lostAfterMs: number;
  /**
   * Speed (world units per second) below which an object counts as stopped.
   * `undefined` disables `stopped`: everything with a current fix is `moving`.
   */
  stoppedBelowSpeed?: number;
  /** How long the speed must stay below the threshold before `stopped`. Default `30000`. */
  stoppedAfterMs: number;
}

/** Defaults for {@link SignalOptions}. */
export const SIGNAL_DEFAULTS: SignalOptions = {
  staleAfterMs: 60_000,
  lostAfterMs: 180_000,
  stoppedAfterMs: 30_000,
};

/**
 * The signal state at `now`, from the age of the newest fix and (optionally) how
 * long the object has been slow. `slowSince` is the `t` of the first fix of the
 * current slow run, or `undefined` when the object is not slow.
 */
export function signalState(lastFixT: number, slowSince: number | undefined, now: number, opts: SignalOptions): SignalState {
  const age = now - lastFixT;
  if (age > opts.lostAfterMs) return 'lost';
  if (age > opts.staleAfterMs) return 'stale';
  if (opts.stoppedBelowSpeed !== undefined && slowSince !== undefined && lastFixT - slowSince >= opts.stoppedAfterMs) {
    return 'stopped';
  }
  return 'moving';
}
