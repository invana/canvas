/**
 * Frame-performance types — the vendor-neutral contract for the engine's
 * per-frame observability signal. The engine (`@invana/canvas`) *measures*
 * frames and emits a {@link FrameTick} on the `render:loop:tick` bus event;
 * an app-side adapter maps those onto OpenTelemetry metrics + spans (see
 * `telemetry/tracing.ts` for the sibling span port). These types live in the
 * kernel because the kernel owns the {@link CanvasGlobalEvents} contract — the
 * measurement lives in the engine, the shape lives here.
 *
 * Design intent (the "F1 telemetry" model): a continuous FPS/frame-time trace
 * (`dt` / {@link FrameTick.fps}), a per-phase breakdown of where the CPU frame
 * went ({@link FramePhaseTimings}), and an {@link InteractionKind} tag so every
 * frame is attributable to the gesture that caused it — the metric dimension
 * that lets a dashboard show *which* action dipped FPS and by how much.
 */

/**
 * The user-interaction category a frame is attributed to. A deliberately small,
 * closed set so it is safe to use as a metric/span **dimension** (bounded
 * cardinality). `'idle'` is the default when no gesture is active.
 */
export type InteractionKind = 'idle' | 'pan' | 'zoom' | 'drag' | 'hover' | 'layout';

/**
 * The CPU sub-phases measured inside one engine tick (`Canvas.tickOnce`):
 * - `camera` — advancing viewport plugins (`camera.tick`).
 * - `dataFlush` — draining every registered data source's coalesced flush.
 * - `layers` — per-layer `flush()` + `tickAnimations()`.
 *
 * These sum to {@link FrameTick.cpuMs}. GPU render + browser compositing happen
 * *outside* the tick and are therefore not in this breakdown — the remainder
 * `dt - cpuMs` approximates render + idle.
 */
export type FramePhase = 'camera' | 'dataFlush' | 'layers';

/** Per-phase wall-clock cost (ms) within a single frame's CPU tick. */
export type FramePhaseTimings = Record<FramePhase, number>;

/**
 * One measured engine frame — the payload of the `render:loop:tick` bus event.
 * Emitted once per `Canvas.tickOnce`.
 */
export interface FrameTick {
  /** `performance.now()` at the start of this frame's tick. */
  ts: number;
  /**
   * Inter-frame period in ms (the renderer ticker's delta) — the FPS
   * denominator and the primary "speed trace" value.
   */
  dt: number;
  /** `1000 / dt`, clamped to a sane ceiling — instantaneous frames-per-second. */
  fps: number;
  /** Total CPU cost measured inside the tick (sum of {@link phases}). */
  cpuMs: number;
  /** Per-phase CPU breakdown; the values sum to {@link cpuMs}. */
  phases: FramePhaseTimings;
  /** The interaction this frame is attributed to (`'idle'` when no gesture is active). */
  interaction: InteractionKind;
  /** True when `dt` exceeded the long-frame (jank) threshold. */
  longFrame: boolean;
}

/**
 * Windowed frame statistics — a cheap pull-model summary for a HUD / status
 * bar, computed on demand from a {@link FrameTick} ring buffer. (The push model
 * is the `render:loop:tick` event; this is the complementary "read the last N"
 * view.)
 */
export interface FrameStats {
  /** Number of samples the stats were computed over. */
  count: number;
  /** Median FPS across the window (`1000 / p50Ms`). */
  fps: number;
  /** Median frame time (ms). */
  p50Ms: number;
  /** 95th-percentile frame time (ms) — the "typical worst" frame. */
  p95Ms: number;
  /** Worst single frame time (ms) in the window — the dip. */
  maxMs: number;
  /** Count of long (jank) frames in the window. */
  dropped: number;
}
