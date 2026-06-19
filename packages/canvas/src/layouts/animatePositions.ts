import { Tween } from '../primitives/animation/Tween';
import { easeOutCubic, type Easing } from '../primitives/animation/easings';

/**
 * Options for {@link animatePositions}.
 *
 * Positions are passed as flat `Float32Array`s of length `n * 2` — `x, y`
 * interleaved per node — the same shape `GraphStore.setPositionsBulk` consumes,
 * so a layout can hand its result buffer straight through.
 */
export interface PositionTransitionOptions {
  /** Start positions (`n * 2`, x/y interleaved). Usually the nodes' current spots. */
  from: Float32Array;
  /** Target positions (`n * 2`, x/y interleaved). The computed layout result. */
  to: Float32Array;
  /** Transition duration in milliseconds. `<= 0` snaps to `to` immediately. */
  duration: number;
  /** Eased progress curve. Default {@link easeOutCubic}. */
  easing?: Easing;
  /**
   * Called once per frame with the interpolated buffer — write it straight to
   * the store (e.g. `store.setPositionsBulk(ids, xy)`). The SAME buffer is
   * reused every frame; copy it if you need to retain it.
   */
  onFrame: (xy: Float32Array) => void;
  /** Fires once when the transition finishes naturally. NOT called on `cancel()`. */
  onComplete?: () => void;
}

/** Handle to an in-flight {@link animatePositions} transition. */
export interface PositionTransition {
  /** Abort the transition. `onComplete` will not fire; positions stop where they are. */
  cancel(): void;
  /** `true` once the transition has finished or been cancelled. */
  readonly done: boolean;
}

/** Default transition length when a caller opts in without specifying one. */
export const DEFAULT_POSITION_TRANSITION_MS = 500;

/**
 * Tween a set of node positions from `from` to `to` over `duration` ms,
 * self-driven on `requestAnimationFrame`.
 *
 * One-shot layouts (ELK, d3-hierarchy, d3-sankey, …) compute a final position
 * set in a single pass and would otherwise `setPositionsBulk` it in one write,
 * teleporting every node. Routing that final buffer through `animatePositions`
 * instead glides each node from where it currently sits to its computed slot —
 * a far more legible layout switch / re-layout.
 *
 * The `Layout` base class is deliberately canvas-agnostic (it owns no RAF), so
 * this helper drives its own frame loop — mirroring how `D3ForceLayout` rides
 * d3's internal timer. It is store-agnostic: it only interpolates buffers and
 * hands each frame back via `onFrame`; the caller owns the write.
 *
 * Cancellation: call `cancel()` (typically from the layout's `stop()` or its
 * next `apply()`) to abort cleanly — the next run can start a fresh transition
 * from wherever the nodes currently are. SSR-safe and degenerate-input-safe:
 * with no `requestAnimationFrame`, a non-positive `duration`, or an empty set,
 * it writes the final positions once and completes synchronously.
 *
 * @throws if `from.length !== to.length`.
 */
export function animatePositions(opts: PositionTransitionOptions): PositionTransition {
  const { from, to, duration, easing = easeOutCubic, onFrame, onComplete } = opts;
  if (from.length !== to.length) {
    throw new Error(
      `animatePositions: from.length=${from.length} must equal to.length=${to.length}`,
    );
  }

  const n = from.length;
  let done = false;
  let cancelled = false;
  let rafId: number | null = null;
  let last = 0;

  const finish = (): void => {
    done = true;
    onFrame(to); // land on the exact target, free of float drift
    onComplete?.();
  };

  const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
  if (!raf || duration <= 0 || n === 0) {
    finish();
    return { cancel() {}, get done() { return done; } };
  }

  const buffer = new Float32Array(n);
  const tween = new Tween({ from: 0, to: 1, duration, easing });

  const step = (now: number): void => {
    if (cancelled) return;
    const dt = last === 0 ? 0 : now - last;
    last = now;
    const alive = tween.tick(dt);
    if (!alive) {
      finish();
      return;
    }
    const t = tween.value;
    for (let i = 0; i < n; i++) buffer[i] = from[i]! + (to[i]! - from[i]!) * t;
    onFrame(buffer);
    rafId = raf(step);
  };
  rafId = raf(step);

  return {
    cancel(): void {
      if (done) return;
      cancelled = true;
      done = true;
      if (rafId !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(rafId);
    },
    get done(): boolean {
      return done;
    },
  };
}
