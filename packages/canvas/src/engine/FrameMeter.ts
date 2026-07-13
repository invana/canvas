import type {
  FramePhaseTimings,
  FrameStats,
  FrameTick,
  InteractionKind,
} from '@invana/canvas-store';

/**
 * Fixed-capacity ring buffer of {@link FrameTick} samples plus the per-frame FPS
 * math — the engine's frame-performance recorder. `Canvas.tickOnce` hands it raw
 * per-phase timings via {@link sample}; the meter derives `fps` / `cpuMs` /
 * `longFrame`, stores the result, and returns it so the caller can emit it on the
 * `render:loop:tick` bus event.
 *
 * Two read models sit on top of the same data:
 * - **push** — the `render:loop:tick` event (the OTel adapter taps this).
 * - **pull** — {@link stats} / {@link recent} / {@link last} for a HUD or status
 *   bar (e.g. `DevInfoLayer`) that wants "the last second" on demand.
 *
 * The buffer is a pre-sized array written round-robin, so steady-state recording
 * allocates only the small {@link FrameTick} it returns (no growth, no GC churn).
 */
export class FrameMeter {
  /** Ring storage; `undefined` slots are unwritten (only before first wrap). */
  private readonly buf: Array<FrameTick | undefined>;
  /** Next write index (round-robin). */
  private head = 0;
  /** Whether the ring has wrapped at least once (i.e. is full). */
  private wrapped = false;
  /** Capacity of the ring. */
  private readonly capacity: number;
  /** `dt` (ms) at or above which a frame counts as long / janky. */
  private readonly longFrameMs: number;
  /** FPS ceiling — guards against a ~0ms `dt` producing an absurd value. */
  private static readonly FPS_CEILING = 240;

  /**
   * @param opts.capacity   Ring size in frames. Default `240` (~4s at 60fps).
   * @param opts.longFrameMs `dt` threshold for {@link FrameTick.longFrame}.
   *   Default `25` (below ~40fps).
   */
  constructor(opts: { capacity?: number; longFrameMs?: number } = {}) {
    this.capacity = Math.max(1, opts.capacity ?? 240);
    this.longFrameMs = opts.longFrameMs ?? 1000 / 40;
    this.buf = new Array<FrameTick | undefined>(this.capacity);
  }

  /**
   * Derive a {@link FrameTick} from one frame's raw measurements, store it, and
   * return it (for emission). `dt` is the inter-frame period; `phases` are the
   * measured CPU sub-costs — their sum becomes {@link FrameTick.cpuMs}.
   */
  sample(input: {
    ts: number;
    dt: number;
    phases: FramePhaseTimings;
    interaction: InteractionKind;
  }): FrameTick {
    const { ts, dt, phases, interaction } = input;
    const cpuMs = phases.camera + phases.dataFlush + phases.layers;
    const fps = dt > 0 ? Math.min(FrameMeter.FPS_CEILING, Math.round(1000 / dt)) : FrameMeter.FPS_CEILING;
    const tick: FrameTick = {
      ts,
      dt,
      fps,
      cpuMs,
      phases,
      interaction,
      longFrame: dt >= this.longFrameMs,
    };
    this.buf[this.head] = tick;
    this.head = (this.head + 1) % this.capacity;
    if (this.head === 0) this.wrapped = true;
    return tick;
  }

  /** The most recently recorded frame, or `undefined` before the first sample. */
  get last(): FrameTick | undefined {
    const i = (this.head - 1 + this.capacity) % this.capacity;
    return this.buf[i];
  }

  /** Number of samples currently held (≤ capacity). */
  get size(): number {
    return this.wrapped ? this.capacity : this.head;
  }

  /**
   * The last `n` samples in chronological (oldest → newest) order. Defaults to
   * every held sample. Returns a fresh array; the {@link FrameTick}s themselves
   * are shared (treat as read-only).
   */
  recent(n?: number): FrameTick[] {
    const size = this.size;
    const count = n === undefined ? size : Math.min(Math.max(0, n), size);
    const out: FrameTick[] = [];
    for (let k = size - count; k < size; k++) {
      const i = (this.head - size + k + this.capacity) % this.capacity;
      const t = this.buf[i];
      if (t) out.push(t);
    }
    return out;
  }

  /**
   * Summarise the most recent `windowMs` of frames (default 1000ms) into
   * percentile frame-times + median FPS + a dropped-frame count. Cheap enough to
   * call every HUD repaint. Returns a zeroed summary when no samples fall in the
   * window.
   */
  stats(windowMs = 1000): FrameStats {
    const all = this.recent();
    const newest = all[all.length - 1];
    if (!newest) return { count: 0, fps: 0, p50Ms: 0, p95Ms: 0, maxMs: 0, dropped: 0 };
    const cutoff = newest.ts - windowMs;
    const window = all.filter((t) => t.ts >= cutoff);
    const times = window.map((t) => t.dt).sort((a, b) => a - b);
    const count = times.length;
    const pct = (p: number): number => (count === 0 ? 0 : times[Math.min(count - 1, Math.floor(p * count))]!);
    const p50Ms = pct(0.5);
    return {
      count,
      fps: p50Ms > 0 ? Math.round(1000 / p50Ms) : 0,
      p50Ms,
      p95Ms: pct(0.95),
      maxMs: count > 0 ? times[count - 1]! : 0,
      dropped: window.reduce((n, t) => n + (t.longFrame ? 1 : 0), 0),
    };
  }

  /** Drop every recorded sample. */
  clear(): void {
    this.buf.fill(undefined);
    this.head = 0;
    this.wrapped = false;
  }
}
