/**
 * `SpecStore` — the durable **visual description** of one layer's elements.
 *
 * A spec says *what to draw* (`{ kind: 'circle', radius, fill, plane }`) and
 * contains no drawing code. Layers resolve style + templates into specs and
 * publish them here; renderers subscribe and project. That inversion is the
 * point: two backends reading one description cannot disagree about intent, and
 * the description is serialisable, diffable and testable without a GPU.
 *
 * **Deliberately untyped at the kernel boundary.** The spec vocabulary lives in
 * `@invana/canvas` (it carries drawing concepts — shapes, connectors, planes),
 * and the kernel has zero `@invana` dependencies. So this store is generic over
 * `T`; the engine instantiates it as `SpecStore<BaseShapeSpec | BaseConnectorSpec>`.
 *
 * **What does *not* live here:** positions. Those stay in {@link LayerData}'s
 * typed arrays on the machine-rate path — a drag frame moves nodes without
 * touching a single spec. And transient visuals (lasso, brush, drag ghosts) never
 * enter the store at all; they are drawn through the renderer's overlay device,
 * so gesture noise stays out of history, undo and saved files.
 *
 * Writes mark a dirty delta and arm a coalesced flush — the same contract as
 * {@link LayerData}, so both channels settle in the same frame.
 *
 * See `docs/renderer-split-design.md` §2 (specs as state) and §4.2b (the channel).
 */

import { scheduleFlush, type FlushMode } from '../data/flush';

/**
 * One coalesced batch of spec changes. Ids only — the receiver reads the specs
 * it cares about, so a flush stays O(dirty) regardless of collection size.
 */
export interface SpecFlush {
  readonly added: readonly string[];
  readonly changed: readonly string[];
  readonly removed: readonly string[];
  /** Monotonic, per store. Lets a consumer detect a missed batch. */
  readonly version: number;
}

export class SpecStore<T extends object = object> {
  private readonly specs = new Map<string, T>();
  private readonly added = new Set<string>();
  private readonly changed = new Set<string>();
  private readonly removed = new Set<string>();
  private readonly listeners = new Set<(e: SpecFlush) => void>();
  private version = 0;
  private scheduled = false;
  private flushMode: FlushMode = 'microtask';
  private cancel: (() => void) | undefined;

  // ── Reads ──────────────────────────────────────────────────────────────────

  get(id: string): T | undefined {
    return this.specs.get(id);
  }

  has(id: string): boolean {
    return this.specs.has(id);
  }

  get size(): number {
    return this.specs.size;
  }

  ids(): IterableIterator<string> {
    return this.specs.keys();
  }

  entries(): IterableIterator<[string, T]> {
    return this.specs.entries();
  }

  // ── Writes ─────────────────────────────────────────────────────────────────

  /** Publish (or replace) the spec for `id`. */
  set(id: string, spec: T): void {
    const existed = this.specs.has(id);
    this.specs.set(id, spec);
    if (existed) {
      this.removed.delete(id);
      // An id added and then re-set before the flush is still just "added".
      if (!this.added.has(id)) this.changed.add(id);
    } else {
      this.added.add(id);
      this.removed.delete(id);
    }
    this.schedule();
  }

  /**
   * Shallow-merge `partial` over the stored spec. Returns `false` when `id` is
   * unknown, so a caller can fall back to {@link set} with a full spec.
   */
  patch(id: string, partial: Partial<T>): boolean {
    const current = this.specs.get(id);
    if (!current) return false;
    this.specs.set(id, { ...current, ...partial });
    if (!this.added.has(id)) this.changed.add(id);
    this.schedule();
    return true;
  }

  delete(id: string): void {
    if (!this.specs.delete(id)) return;
    this.changed.delete(id);
    // Added-then-removed before a flush is a net no-op: the receiver never saw it.
    if (!this.added.delete(id)) this.removed.add(id);
    this.schedule();
  }

  /** Drop every spec. Emits one flush listing all ids as removed. */
  clear(): void {
    for (const id of this.specs.keys()) {
      if (!this.added.delete(id)) this.removed.add(id);
    }
    this.specs.clear();
    this.changed.clear();
    this.schedule();
  }

  // ── Flush ──────────────────────────────────────────────────────────────────

  onFlush(listener: (e: SpecFlush) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Choose **when** a coalesced flush fires. `'manual'` disarms auto-flush so the
   * engine's single rAF drives it — which is how the renderer stays on one clock.
   */
  setFlushMode(mode: FlushMode): void {
    this.flushMode = mode;
    if (mode === 'manual' && this.scheduled) {
      this.cancel?.();
      this.scheduled = false;
    }
  }

  /** Emit the pending delta, if any. Safe to call when nothing is dirty. */
  flush(): void {
    this.scheduled = false;
    if (this.added.size === 0 && this.changed.size === 0 && this.removed.size === 0) return;
    const event: SpecFlush = {
      added: [...this.added],
      changed: [...this.changed],
      removed: [...this.removed],
      version: ++this.version,
    };
    this.added.clear();
    this.changed.clear();
    this.removed.clear();
    for (const listener of this.listeners) listener(event);
  }

  private schedule(): void {
    if (this.scheduled || this.flushMode === 'manual') return;
    this.scheduled = true;
    this.cancel = scheduleFlush(this.flushMode, () => this.flush());
  }
}
