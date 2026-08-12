import { linear, type Easing } from './easings';

/**
 * Options for constructing a `Tween`. `from` / `to` / `duration` are required;
 * everything else is optional and falls back to a sensible default.
 *
 * - `easing` defaults to `linear`.
 * - `repeat` is either an integer count (number of additional cycles after the
 *   first) or `'forever'`. Defaults to `0` (play once).
 * - `yoyo` reverses direction on each repeat. Only meaningful when `repeat`
 *   is non-zero. Defaults to `false`.
 * - `onUpdate(value)` fires every `tick` with the current eased value.
 * - `onComplete()` fires once when the tween retires (final cycle ends).
 *   Never fires for `repeat: 'forever'`.
 */
export interface TweenOptions {
  readonly from: number;
  readonly to: number;
  readonly duration: number;
  readonly easing?: Easing;
  readonly repeat?: number | 'forever';
  readonly yoyo?: boolean;
  readonly onUpdate?: (value: number) => void;
  readonly onComplete?: () => void;
}

/**
 * Time-based interpolation primitive. Authors call `tick(deltaMs)` once per
 * frame; the tween advances internal time, applies easing, fires `onUpdate`,
 * and returns `false` when finished so the caller can retire it.
 *
 * The tween itself does no scheduling — it's a pure state machine. Effects
 * and decorations hold a `Tween` and drive it from their own `tick(dt)`.
 *
 * Reusable: call `reset()` to play again from `from`.
 */
export class Tween {
  private readonly opts: TweenOptions;
  private readonly easing: Easing;
  private readonly maxRepeat: number;
  private elapsed = 0;
  private cycle = 0;
  private _value: number;
  private _done = false;

  constructor(opts: TweenOptions) {
    this.opts = opts;
    this.easing = opts.easing ?? linear;
    this.maxRepeat =
      opts.repeat === 'forever'
        ? Number.POSITIVE_INFINITY
        : (opts.repeat ?? 0);
    this._value = opts.from;
  }

  get value(): number {
    return this._value;
  }

  get done(): boolean {
    return this._done;
  }

  /**
   * Advance by `dt` milliseconds. Returns `false` when the tween has finished
   * its final cycle; callers should remove finished tweens from their tick
   * set. Returns `true` while still running (including indefinitely for
   * `repeat: 'forever'`).
   */
  tick(dt: number): boolean {
    if (this._done) return false;

    this.elapsed += dt;
    const { duration, from, to, onUpdate, onComplete } = this.opts;
    const yoyo = this.opts.yoyo ?? false;

    // Walk cycles in case `dt` is larger than one cycle (e.g. tab regained focus).
    while (this.elapsed >= duration && this.cycle < this.maxRepeat) {
      this.elapsed -= duration;
      this.cycle += 1;
    }

    if (this.cycle >= this.maxRepeat && this.elapsed >= duration) {
      // Final cycle complete — snap to end value and retire.
      const reversed = yoyo && this.maxRepeat % 2 === 1;
      this._value = reversed ? from : to;
      this._done = true;
      onUpdate?.(this._value);
      onComplete?.();
      return false;
    }

    const t = this.elapsed / duration;
    const eased = this.easing(t);
    const reversed = yoyo && this.cycle % 2 === 1;
    this._value = reversed ? to + (from - to) * eased : from + (to - from) * eased;
    onUpdate?.(this._value);
    return true;
  }

  /** Restart from `from`. Clears `done`. */
  reset(): void {
    this.elapsed = 0;
    this.cycle = 0;
    this._done = false;
    this._value = this.opts.from;
  }
}
