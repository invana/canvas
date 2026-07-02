/**
 * Flush scheduling for the **non-reactive** data stores ({@link DataStore} /
 * {@link LayerData}). A write marks a dirty delta and *arms* a deferred flush; the
 * mode decides **when** that flush fires. The store never notifies per write — it
 * coalesces a whole batch into **one** flush (see `docs/canvas-store-data-event-flow.md` §2).
 */

/** When a coalesced data flush fires. */
export type FlushMode =
  /** Next animation frame (browser). Falls back to `microtask` where no rAF exists (node/tests). */
  | 'frame'
  /** End of the current JS task — the kernel default (no DOM assumption, deterministic). */
  | 'microtask'
  /** Never auto-fires; the owner (e.g. the engine's single rAF loop) calls `flush()`. */
  | 'manual';

// Feature-detect rAF so the renderer-free kernel makes no hard DOM assumption.
const raf: typeof requestAnimationFrame | undefined =
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame : undefined;
const caf: typeof cancelAnimationFrame | undefined =
  typeof cancelAnimationFrame === 'function' ? cancelAnimationFrame : undefined;

/**
 * Arm a deferred flush per `mode`, returning a **cancel** function (a no-op once the
 * callback has run or for modes that can't be cancelled). `'manual'` arms nothing.
 */
export function scheduleFlush(mode: FlushMode, cb: () => void): () => void {
  if (mode === 'manual') return () => {};
  if (mode === 'frame' && raf && caf) {
    const handle = raf(() => cb());
    return () => caf(handle);
  }
  // microtask — and the `frame` fallback when no rAF is present (node / tests)
  let cancelled = false;
  queueMicrotask(() => {
    if (!cancelled) cb();
  });
  return () => {
    cancelled = true;
  };
}
