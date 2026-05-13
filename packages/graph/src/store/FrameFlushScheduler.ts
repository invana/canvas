/**
 * `FrameFlushScheduler` — RAF-aligned flush coordination for streaming feeds.
 *
 * In `GraphStore` `flushMode: 'frame'`, every mutation calls `request()`. The
 * first call within a frame schedules a `requestAnimationFrame(flush)`;
 * subsequent calls are no-ops until the flush fires. The flush callback runs
 * the supplied flush function once and resets state.
 *
 * Falls back to `queueMicrotask` (or `setTimeout(0)`) outside the browser so
 * tests can drive the scheduler without a real RAF loop. Tests can also call
 * `flushNow()` to bypass scheduling and run the pending flush synchronously.
 *
 * @internal — not exported from `@invana/graph`. Used only inside `GraphStore`.
 */

type FlushFn = () => void;

/** Detection of `requestAnimationFrame` in non-browser environments. */
const hasRAF =
  typeof globalThis !== 'undefined' &&
  typeof (globalThis as { requestAnimationFrame?: unknown }).requestAnimationFrame === 'function';

export class FrameFlushScheduler {
  private readonly flushFn: FlushFn;
  private scheduled = false;
  /** Monotonic frame counter, incremented on each flush. */
  private _frame = 0;

  constructor(flushFn: FlushFn) {
    this.flushFn = flushFn;
  }

  /**
   * Current frame counter. Bumps after each flush. Used by `PendingEdges` for
   * TTL accounting.
   */
  get frame(): number {
    return this._frame;
  }

  /**
   * Ask for a flush on the next animation frame. Idempotent within a frame.
   */
  request(): void {
    if (this.scheduled) return;
    this.scheduled = true;
    const fire = this.fire.bind(this);
    if (hasRAF) {
      (globalThis as { requestAnimationFrame: (cb: () => void) => number }).requestAnimationFrame(
        fire,
      );
    } else {
      // Fallback for node / vitest — microtask is good enough to coalesce
      // synchronous bursts, and tests can call `flushNow()` to be explicit.
      queueMicrotask(fire);
    }
  }

  /**
   * Run any pending flush synchronously. No-op if nothing was scheduled.
   * Used by `GraphStore.flush()` and by tests that need deterministic timing.
   */
  flushNow(): void {
    if (!this.scheduled) return;
    this.fire();
  }

  /** Drop any pending flush without firing it (used on `clear()`). */
  cancel(): void {
    this.scheduled = false;
  }

  private fire(): void {
    if (!this.scheduled) return;
    this.scheduled = false;
    this._frame++;
    this.flushFn();
  }
}
