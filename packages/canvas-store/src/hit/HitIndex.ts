/**
 * `HitIndex` — thin wrapper around `rbush` for spatial hit-testing.
 *
 * Stays generic over kind ('shape' | 'connector') so a single index serves
 * both. Hit-testing returns candidates in indeterminate order; the renderer
 * resolves topmost-by-zIndex.
 *
 * **One id → one *or many* boxes.** Shapes index as a single bbox; a connector
 * may index as several tight **segment boxes** (edge-pick correctness H) so a
 * long diagonal edge isn't a candidate for every point inside its huge loose
 * AABB — only points genuinely near the line. The per-id `entries` map holds
 * the full box list for that id so `update` / `remove` stay O(boxes). Query
 * results are **deduped by id**, so a caller still sees each element once
 * regardless of how many boxes back it — the renderer's candidate loop is
 * unchanged.
 */

import RBush from 'rbush';
import type { Rect } from '../specs/geometry';

export interface HitEntry {
  readonly id: string;
  readonly kind: 'shape' | 'connector';
  /** zIndex from the spec; used by `PrimitivesRenderer` to pick topmost. */
  readonly zIndex: number;
  // rbush indexes by these four fields:
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Build a single rbush entry from a world rect. */
function toEntry(id: string, kind: HitEntry['kind'], zIndex: number, rect: Rect): HitEntry {
  return {
    id,
    kind,
    zIndex,
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height,
  };
}

/** Collapse rbush hits to one entry per id (first wins — all share id/kind/zIndex). */
function dedupeById(raw: HitEntry[]): HitEntry[] {
  if (raw.length <= 1) return raw;
  const seen = new Set<string>();
  const out: HitEntry[] = [];
  for (const e of raw) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}

export class HitIndex {
  private readonly tree = new RBush<HitEntry>();
  /** id → its indexed box(es). Shapes hold one; connectors may hold several. */
  private readonly entries = new Map<string, HitEntry[]>();

  /**
   * Index `id` under one bbox (shapes) or several (connector segment boxes).
   * Replaces any existing boxes for the id.
   */
  insert(id: string, kind: HitEntry['kind'], rect: Rect | readonly Rect[], zIndex: number): void {
    this.remove(id);
    const rects = Array.isArray(rect) ? rect : [rect as Rect];
    if (rects.length === 0) return;
    const list: HitEntry[] = [];
    for (const r of rects) {
      const entry = toEntry(id, kind, zIndex, r);
      this.tree.insert(entry);
      list.push(entry);
    }
    this.entries.set(id, list);
  }

  /** Update the bbox(es) + zIndex for an existing entry. No-op if unknown. */
  update(id: string, rect: Rect | readonly Rect[], zIndex: number): void {
    const prev = this.entries.get(id);
    if (!prev || prev.length === 0) return;
    this.insert(id, prev[0]!.kind, rect, zIndex);
  }

  remove(id: string): void {
    const prev = this.entries.get(id);
    if (!prev) return;
    for (const e of prev) this.tree.remove(e);
    this.entries.delete(id);
  }

  /** True if an entry with this id is currently indexed. Lets callers choose
   * between an immediate insert (new id) and a deferred bulk bbox refresh
   * (existing id) — see `PrimitivesRenderer`'s moved-hit deferral. */
  has(id: string): boolean {
    return this.entries.has(id);
  }

  /**
   * Query candidates whose bbox intersects a `padWorld`-padded box around
   * `(x, y)`. With `padWorld = 0` (default), this matches the classic
   * "point in bbox" search.
   *
   * The pad exists for the renderer's **screen-pixel hit floor**:
   * `PrimitivesRenderer.hitTest` passes `MIN_HIT_PX / camera.scale` so a
   * shape whose bbox is smaller than the floor (e.g. a node collapsed to
   * sub-pixel size at low zoom) is still in the candidate set. The
   * subsequent `containsWithFloor` / precise check applies the same floor
   * in local coords. Without this pad, rbush would prune the tiny shape
   * before the floor could rescue it.
   *
   * Caller is responsible for the precise per-shape hit-test if the bbox
   * isn't the final answer (e.g. a circle inside its bbox).
   */
  query(x: number, y: number, padWorld: number = 0): HitEntry[] {
    return dedupeById(
      this.tree.search({
        minX: x - padWorld,
        minY: y - padWorld,
        maxX: x + padWorld,
        maxY: y + padWorld,
      }),
    );
  }

  /**
   * All entries whose bbox intersects `rect` (world coords). Powers viewport
   * culling — query the camera's visible bounds to get the on-screen working
   * set. Conservative for loose bboxes (e.g. connectors): may over-return, never
   * under-returns, so nothing on-screen is missed.
   */
  searchRect(rect: Rect): HitEntry[] {
    return dedupeById(
      this.tree.search({
        minX: rect.x,
        minY: rect.y,
        maxX: rect.x + rect.width,
        maxY: rect.y + rect.height,
      }),
    );
  }

  clear(): void {
    this.tree.clear();
    this.entries.clear();
  }

  /**
   * Bulk replace bboxes for many existing entries in one O(N log N) pass.
   *
   * Per-id `update(...)` does `remove + insert`, and rbush's `remove(item)`
   * is a linear tree walk — so updating thousands of entries one at a time
   * is O(N²). When a behaviour like `NodeScaleLODBehaviour` rescales every
   * node on each camera-zoom frame, the per-id path floors fps even at
   * modest graph sizes.
   *
   * This path replaces the cached box list for each touched id in the map,
   * then rebuilds the tree once via `clear + load` over the flattened entries.
   * Bulk-loading is `O(N log N)` total — for 3k entries, ~10× faster than the
   * per-id variant. Each id's kind + zIndex are carried over from its prior
   * boxes (an id that changed box *count* — e.g. a re-routed connector whose
   * segment split changed — is handled since we rebuild its list wholesale).
   *
   * Use when many entries change in the same logical tick (zoom settle,
   * bulk position update). For single-shape edits, prefer {@link update}.
   */
  bulkUpdateBoxes(updates: Iterable<{ id: string; rects: readonly Rect[] }>): void {
    let touched = false;
    for (const u of updates) {
      const prev = this.entries.get(u.id);
      if (!prev || prev.length === 0) continue;
      const { kind, zIndex } = prev[0]!;
      this.entries.set(
        u.id,
        u.rects.map((r) => toEntry(u.id, kind, zIndex, r)),
      );
      touched = true;
    }
    if (!touched) return;
    this.tree.clear();
    const all: HitEntry[] = [];
    for (const list of this.entries.values()) all.push(...list);
    this.tree.load(all);
  }

  /** Number of indexed ids (not boxes — a multi-box connector counts once). */
  get size(): number {
    return this.entries.size;
  }
}
