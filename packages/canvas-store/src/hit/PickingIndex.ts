/**
 * `PickingIndex` — the engine's picking engine: spatial index, world-space hit
 * boxes, narrow-phase geometry and the hover heuristics, all computed from
 * **specs** rather than display objects.
 *
 * This is design decision **D5** made real (`docs/renderer-split-design.md`):
 * picking is *interaction*, not drawing, so it stays in `@invana/canvas` when
 * the pixi backend is extracted. Everything here is renderer-free — no
 * `pixi.js` import, no `gfx`, no scene traversal — which is also what lets
 * picking be tested with no GPU mounted.
 *
 * **Why a pull-based {@link HitGeometrySource} rather than pushed records.**
 * Three facts about an element are the renderer's to know, not the store's: the
 * visual `scale` multiplier a LOD behaviour writes without touching the spec,
 * the routed polyline of a connector (the router runs at draw time), and the
 * silhouette of a `registerShape` custom kind the spec vocabulary has never
 * heard of. Pulling them at query time keeps picking answering against what is
 * on screen *right now*; pushing them would add a second staleness surface next
 * to the deferred-bbox one, and a stale pick is a bug the user feels
 * immediately.
 *
 * Bounds are deliberately *deferred*: `markShapeMoved` / `markConnectorMoved`
 * record that an element's box is stale, and {@link flushMoved} rebuilds them
 * all in one `bulkUpdateBoxes` the first time a query needs accurate geometry.
 * A layout settle nobody hovers over pays nothing.
 */

import { HitIndex } from './HitIndex';
import { boundsOfSpec, containsSpec } from '../specs/shapeGeometry';
import type { BaseShapeSpec } from '../specs/shape';
import type { BaseConnectorSpec } from '../specs/connector';
import type { HitResult } from '../specs/hit';
import type { Point, Rect } from '../specs/geometry';

/** A sampled polyline — the densified form of a connector's routed path. */
export type HitPolyline = readonly Point[];

/**
 * What picking needs to know about a shape. `spec` carries the geometry;
 * `scale` and `containsLocal` are the two things only the renderer knows.
 */
export interface ShapeHitRecord {
  readonly spec: BaseShapeSpec;
  /**
   * Visual scale multiplier applied on top of the spec (LOD inflation, hover
   * zoom). The spec's geometry is in the *unscaled* local frame, so world-space
   * deltas are divided by this before the narrow phase.
   */
  readonly scale: number;
  /**
   * Narrow-phase containment for a `registerShape` kind the spec geometry
   * doesn't know, in the shape's **local** frame. Omitted — or ignored — for
   * built-in kinds, which {@link containsSpec} answers.
   */
  readonly containsLocal?: (localX: number, localY: number) => boolean;
  /**
   * Local-frame bounds for a custom kind, same fallback rule as
   * {@link containsLocal}.
   */
  readonly localBounds?: () => Rect;
}

/** What picking needs to know about a connector: its spec and its routed shape. */
export interface ConnectorHitRecord {
  readonly spec: BaseConnectorSpec;
  /** The sampled, world-space polyline the connector actually draws along. */
  readonly polyline: HitPolyline;
}

/**
 * The renderer's side of the picking contract — the three facts specs can't
 * carry. Returning `null` means "gone"; the index treats it as a miss rather
 * than an error, because an element can be removed between an index write and
 * a query.
 */
export interface HitGeometrySource {
  shapeRecord(id: string): ShapeHitRecord | null;
  connectorRecord(id: string): ConnectorHitRecord | null;
  /** Every currently-indexable shape id — for a full reindex. */
  shapeIds(): Iterable<string>;
}

/** The camera facts picking needs: screen-pixel margins scale with zoom. */
export interface PickingCamera {
  readonly scale: number;
}

export interface PickingIndexOptions {
  source: HitGeometrySource;
  camera: PickingCamera;
  /** @see PickingIndexOptions.hitFloorPx on the renderer */
  hitFloorPx?: number;
  hoverHysteresisPx?: number;
  hoverNodeIncidencePx?: number;
}

/**
 * Max number of segment boxes a single connector is split into for the hit
 * index (edge-pick correctness H). Caps the rbush entry-count multiplier: an
 * edge indexes as at most this many boxes, so a 5k-edge graph stays bounded.
 */
const CONNECTOR_HIT_MAX_BOXES = 8;

/**
 * Target arc length (world units) per connector hit box. An edge shorter than
 * this indexes as a single loose AABB (no change); longer edges split into
 * `ceil(len / this)` boxes, capped at {@link CONNECTOR_HIT_MAX_BOXES}. Tuned
 * for the pixel-ish coordinate ranges these datasets use; graphs in tiny
 * normalized ranges simply fall back to one box per edge.
 */
const CONNECTOR_HIT_SPLIT_LEN = 80;

/** Forgiveness (world units) added to a connector's stroke half-width. */
const CONNECTOR_HIT_SLOP = 4;

/** Squared distance from `(px, py)` to the nearest point on a polyline. */
function distanceToPolylineSq(poly: HitPolyline, px: number, py: number): number {
  if (poly.length === 0) return Infinity;
  if (poly.length === 1) {
    const p = poly[0]!;
    return (px - p.x) * (px - p.x) + (py - p.y) * (py - p.y);
  }
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const lenSq = vx * vx + vy * vy;
    let t = lenSq === 0 ? 0 : ((px - a.x) * vx + (py - a.y) * vy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const dx = px - (a.x + t * vx);
    const dy = py - (a.y + t * vy);
    const d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return best;
}

/** Loose AABB of a polyline, padded by half the stroke plus slop. */
function polylineHitRect(poly: HitPolyline, strokeWidth: number): Rect {
  const pad = strokeWidth / 2 + CONNECTOR_HIT_SLOP;
  if (poly.length === 0) return { x: -pad, y: -pad, width: pad * 2, height: pad * 2 };
  let minX = poly[0]!.x;
  let minY = poly[0]!.y;
  let maxX = minX;
  let maxY = minY;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}

/**
 * World-space hit **boxes** for a connector — the segment-level hit index
 * (edge-pick correctness H). A single loose AABB over a long diagonal edge
 * makes that edge a candidate for every point in a huge empty box; splitting
 * the sampled polyline into up to {@link CONNECTOR_HIT_MAX_BOXES} tight boxes
 * (cut at equal arc-length, so straight diagonals subdivide and curves — which
 * sampling already densifies — get one box per run) keeps the candidate set to
 * edges *physically near* the cursor, making "nearest" cheaper and more
 * meaningful in a bundle. Short edges collapse to one loose box, so nothing
 * regresses.
 */
export function connectorHitBoxes(poly: HitPolyline, strokeWidth: number): Rect[] {
  const pad = strokeWidth / 2 + CONNECTOR_HIT_SLOP;
  if (poly.length < 2) return [polylineHitRect(poly, strokeWidth)];

  // Total arc length + per-segment lengths.
  let total = 0;
  const segLen: number[] = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    segLen.push(l);
    total += l;
  }
  // One box below the split threshold — same loose AABB as before.
  const n = Math.min(CONNECTOR_HIT_MAX_BOXES, Math.max(1, Math.ceil(total / CONNECTOR_HIT_SPLIT_LEN)));
  if (n <= 1 || total === 0) return [polylineHitRect(poly, strokeWidth)];

  const step = total / n;
  const rects: Rect[] = [];
  let boundary = step; // next arc-length cut
  let acc = 0; // arc length at the current segment's start point
  let minX = poly[0]!.x;
  let minY = poly[0]!.y;
  let maxX = minX;
  let maxY = minY;
  const expand = (x: number, y: number): void => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  const flush = (): void => {
    rects.push({ x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 });
  };
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const l = segLen[i]!;
    // Cut this segment wherever an arc-length boundary falls inside it, so a
    // long straight run still yields several boxes hugging the line.
    while (l > 0 && rects.length < n - 1 && boundary <= acc + l + 1e-9) {
      const t = (boundary - acc) / l;
      const cx = a.x + (b.x - a.x) * t;
      const cy = a.y + (b.y - a.y) * t;
      expand(cx, cy);
      flush();
      minX = maxX = cx;
      minY = maxY = cy;
      boundary += step;
    }
    expand(b.x, b.y);
    acc += l;
  }
  flush();
  return rects;
}

/** A ranked candidate during a pick. */
interface Ranked {
  kind: 'shape' | 'connector';
  id: string;
  distSq: number;
  zIndex: number;
}

export class PickingIndex {
  private readonly index = new HitIndex();
  private readonly source: HitGeometrySource;
  private readonly camera: PickingCamera;

  private readonly hitFloorPx: number;
  private readonly hoverHysteresisPx: number;
  private readonly hoverNodeIncidencePx: number;

  /**
   * Shapes whose indexed bbox is stale after a position-only move, awaiting a
   * bulk reflush. Per-move `remove + insert` is O(N) in rbush, so a full
   * layout sweep would be O(N²); deferring makes it one rebuild, and only when
   * a query actually needs accurate bounds.
   */
  private readonly movedShapes = new Set<string>();
  /** The connector analog of {@link movedShapes} — stale after a re-route. */
  private readonly movedConnectors = new Set<string>();

  private _enabled = true;

  constructor(opts: PickingIndexOptions) {
    this.source = opts.source;
    this.camera = opts.camera;
    this.hitFloorPx = opts.hitFloorPx ?? 0;
    this.hoverHysteresisPx = opts.hoverHysteresisPx ?? 0;
    this.hoverNodeIncidencePx = opts.hoverNodeIncidencePx ?? 0;
  }

  /**
   * Enable / disable all picking. When disabled, {@link hitTest} and
   * {@link pickHover} return `null` regardless of what's under the cursor — the
   * owning layer flips this so a hidden layer's elements aren't clickable.
   */
  setEnabled(enabled: boolean): void {
    this._enabled = enabled;
  }

  get enabled(): boolean {
    return this._enabled;
  }

  // ─── Indexing ────────────────────────────────────────────────────────────

  /** Index (or re-index) a shape from its current record. */
  insertShape(id: string, zIndex: number): void {
    const rect = this.shapeWorldBounds(id);
    if (!rect) return;
    this.index.insert(id, 'shape', rect, zIndex);
    this.movedShapes.delete(id);
  }

  /** Index (or re-index) a connector as its segment boxes. */
  insertConnector(id: string, zIndex: number): void {
    const rec = this.source.connectorRecord(id);
    if (!rec) return;
    this.index.insert(id, 'connector', connectorHitBoxes(rec.polyline, strokeWidthOf(rec.spec)), zIndex);
    this.movedConnectors.delete(id);
  }

  remove(id: string): void {
    this.index.remove(id);
    this.movedShapes.delete(id);
    this.movedConnectors.delete(id);
  }

  has(id: string): boolean {
    return this.index.has(id);
  }

  clear(): void {
    this.index.clear();
    this.movedShapes.clear();
    this.movedConnectors.clear();
  }

  /** Record that a shape moved; its bbox is refreshed on the next flush. */
  markShapeMoved(id: string): void {
    this.movedShapes.add(id);
  }

  /** Record that a connector re-routed; its boxes are refreshed on the next flush. */
  markConnectorMoved(id: string): void {
    this.movedConnectors.add(id);
  }

  /**
   * Bulk re-index shape bboxes eagerly — pairs with a scale gesture that
   * intentionally skipped per-call hit updates. Omitting `ids` touches every
   * shape. Either way the tree is rebuilt once rather than N × remove+insert.
   */
  reindexShapes(ids?: Iterable<string>): void {
    const updates: Array<{ id: string; rects: Rect[] }> = [];
    for (const id of ids ?? this.source.shapeIds()) {
      const rect = this.shapeWorldBounds(id);
      if (rect) updates.push({ id, rects: [rect] });
    }
    this.index.bulkUpdateBoxes(updates);
  }

  /**
   * Flush deferred bbox updates from moved shapes and re-routed connectors in a
   * SINGLE rbush rebuild. Called lazily from the query methods the first time
   * accurate bounds matter, so a layout settle with no pointer interaction pays
   * nothing — and when it does pay, it's one O(N log N) rebuild.
   */
  flushMoved(): void {
    if (this.movedShapes.size === 0 && this.movedConnectors.size === 0) return;
    const updates: Array<{ id: string; rects: Rect[] }> = [];
    for (const id of this.movedShapes) {
      const rect = this.shapeWorldBounds(id);
      if (rect) updates.push({ id, rects: [rect] });
    }
    for (const id of this.movedConnectors) {
      const rec = this.source.connectorRecord(id);
      if (rec && rec.polyline.length >= 2) {
        updates.push({ id, rects: connectorHitBoxes(rec.polyline, strokeWidthOf(rec.spec)) });
      }
    }
    this.movedShapes.clear();
    this.movedConnectors.clear();
    this.index.bulkUpdateBoxes(updates);
  }

  // ─── Geometry ────────────────────────────────────────────────────────────

  /**
   * World-space AABB of a shape — spec geometry, scaled by the renderer's
   * visual multiplier and offset to the spec's origin. `null` when the id is
   * unknown or its kind has no geometry the engine can compute and no fallback.
   */
  shapeWorldBounds(id: string): Rect | null {
    const rec = this.source.shapeRecord(id);
    if (!rec) return null;
    const local = boundsOfSpec(rec.spec) ?? rec.localBounds?.();
    if (!local) return null;
    const s = rec.scale;
    return {
      x: rec.spec.x + local.x * s,
      y: rec.spec.y + local.y * s,
      width: local.width * s,
      height: local.height * s,
    };
  }

  /** Ids whose indexed boxes intersect `rect`. Elements not indexed are absent. */
  visibleIds(rect: Rect): Set<string> {
    const visible = new Set<string>();
    for (const e of this.index.searchRect(rect)) visible.add(e.id);
    return visible;
  }

  // ─── Queries ─────────────────────────────────────────────────────────────

  /**
   * Topmost element at a world point, or `null`.
   *
   * Two bands, in priority order:
   *
   *   1. **Exact hit** — the cursor is genuinely inside the silhouette (or
   *      within the connector's stroke tolerance). Ranked by `zIndex`, then
   *      shape-over-connector, then closest origin.
   *   2. **Floor fallback** — if NO exact hit, the closest candidate whose
   *      origin sits within `hitFloorPx` screen pixels of the cursor. Lets tiny
   *      pinpoints stay hoverable in sparse regions without widening hit areas
   *      in dense ones.
   *
   * @param exclude ids to skip — e.g. a transient drag preview sitting under
   *   the cursor that would otherwise mask the real target.
   */
  hitTest(worldX: number, worldY: number, exclude?: ReadonlySet<string>): HitResult | null {
    if (!this._enabled) return null;
    this.flushMoved();
    const floorWorld = this.hitFloorWorld();
    const candidates = this.index.query(worldX, worldY, floorWorld);
    if (candidates.length === 0) return null;

    let bestExact: Ranked | null = null;
    let bestFloor: { kind: 'shape' | 'connector'; id: string; distSq: number } | null = null;
    const floorSq = floorWorld * floorWorld;

    for (const c of candidates) {
      if (exclude?.has(c.id)) continue;
      const res = this.geometricHit(c.kind, c.id, worldX, worldY);
      if (!res) continue;
      if (res.exact) {
        if (beats(c.kind, c.zIndex, res.distSq, bestExact)) {
          bestExact = { kind: c.kind, id: c.id, distSq: res.distSq, zIndex: c.zIndex };
        }
      } else if (res.distSq <= floorSq) {
        if (bestFloor === null || res.distSq < bestFloor.distSq) {
          bestFloor = { kind: c.kind, id: c.id, distSq: res.distSq };
        }
      }
    }

    const winner = bestExact ?? bestFloor;
    return winner ? { kind: winner.kind, id: winner.id } : null;
  }

  /**
   * Hover-specific pick: {@link hitTest}'s winner, refined by two hover-only
   * heuristics that make tracing an edge out of a dense bundle reliable.
   * **Click / drag picking deliberately stays on the raw {@link hitTest}** — a
   * press must resolve exactly what is under the cursor, with no memory of the
   * last hover.
   *
   * - **Node-incidence bias (J).** When the raw winner is a connector but the
   *   cursor also sits within `hoverNodeIncidencePx` of a shape's centre, an
   *   edge *incident to that shape* (an endpoint at the node) is preferred over
   *   an unrelated edge merely passing through. Incident edges fan out and
   *   separate near their shared endpoint — where you aim. The test is purely
   *   geometric (endpoint ≈ node centre), so this stays domain-free; it never
   *   inspects graph adjacency.
   * - **Hysteresis (I).** `currentHover` of the *same kind* is kept unless the
   *   new winner is closer by more than `hoverHysteresisPx` — and only while the
   *   old target is still genuinely under the cursor — so sub-pixel jitter
   *   between two near-equidistant edges doesn't flicker the highlight.
   *
   * Falls back to identical behaviour to {@link hitTest} when both margins are
   * `0` or nothing nearby qualifies.
   *
   * @param currentHover what the caller currently shows as hovered — the
   *   hysteresis anchor. Kept as a parameter rather than state so the index
   *   owns no interaction bookkeeping.
   */
  pickHover(
    worldX: number,
    worldY: number,
    currentHover: HitResult | null,
  ): HitResult | null {
    if (!this._enabled) return null;
    this.flushMoved();
    const floorWorld = this.hitFloorWorld();
    const incidenceWorld = this.hoverIncidenceWorld();
    // Widen the bbox query enough to also see the nearby shape centres the
    // incidence bias needs — otherwise a node whose centre is just outside the
    // hit-floor pad is invisible to the pick and the bias can't fire.
    const candidates = this.index.query(worldX, worldY, Math.max(floorWorld, incidenceWorld));
    if (candidates.length === 0) return null;

    const floorSq = floorWorld * floorWorld;
    const incidenceSq = incidenceWorld * incidenceWorld;

    let bestExact: Ranked | null = null;
    let bestFloor: { kind: 'shape' | 'connector'; id: string; distSq: number } | null = null;
    // Shape centres within the incidence radius of the cursor — the candidate
    // "nearby nodes" the incidence bias measures edge endpoints against.
    const nearbyCentres: Array<{ x: number; y: number }> = [];
    // Exact connector hits + their two endpoints, for the incidence test.
    const exactConnectors: Array<{ id: string; distSq: number; ax: number; ay: number; bx: number; by: number }> = [];

    for (const c of candidates) {
      if (c.kind === 'shape') {
        const rec = this.source.shapeRecord(c.id);
        if (!rec) continue;
        const dx = worldX - rec.spec.x;
        const dy = worldY - rec.spec.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= incidenceSq) nearbyCentres.push({ x: rec.spec.x, y: rec.spec.y });
        const s = rec.scale || 1;
        if (this.shapeContainsLocal(rec, dx / s, dy / s)) {
          if (beats('shape', c.zIndex, distSq, bestExact)) {
            bestExact = { kind: 'shape', id: c.id, distSq, zIndex: c.zIndex };
          }
        } else if (distSq <= floorSq && (bestFloor === null || distSq < bestFloor.distSq)) {
          bestFloor = { kind: 'shape', id: c.id, distSq };
        }
      } else {
        const rec = this.source.connectorRecord(c.id);
        if (!rec) continue;
        const poly = rec.polyline;
        const distSq = distanceToPolylineSq(poly, worldX, worldY);
        if (distSq <= connectorToleranceSq(rec.spec) && poly.length >= 2) {
          const a = poly[0]!;
          const b = poly[poly.length - 1]!;
          exactConnectors.push({ id: c.id, distSq, ax: a.x, ay: a.y, bx: b.x, by: b.y });
          if (beats('connector', c.zIndex, distSq, bestExact)) {
            bestExact = { kind: 'connector', id: c.id, distSq, zIndex: c.zIndex };
          }
        } else if (distSq <= floorSq && (bestFloor === null || distSq < bestFloor.distSq)) {
          bestFloor = { kind: 'connector', id: c.id, distSq };
        }
      }
    }

    const base = bestExact ?? bestFloor;
    if (!base) return null;
    let win: { kind: 'shape' | 'connector'; id: string; distSq: number } = {
      kind: base.kind,
      id: base.id,
      distSq: base.distSq,
    };

    // (J) Node-incidence bias — only when the winner is an edge, we have a
    // nearby node, and the winning edge is *not* incident to it.
    if (win.kind === 'connector' && nearbyCentres.length > 0 && exactConnectors.length > 0) {
      const isIncident = (e: { ax: number; ay: number; bx: number; by: number }): boolean =>
        nearbyCentres.some(
          (n) =>
            (e.ax - n.x) * (e.ax - n.x) + (e.ay - n.y) * (e.ay - n.y) <= incidenceSq ||
            (e.bx - n.x) * (e.bx - n.x) + (e.by - n.y) * (e.by - n.y) <= incidenceSq,
        );
      const winnerIncident = exactConnectors.some((e) => e.id === win.id && isIncident(e));
      if (!winnerIncident) {
        let bestInc: { id: string; distSq: number } | null = null;
        for (const e of exactConnectors) {
          if (isIncident(e) && (bestInc === null || e.distSq < bestInc.distSq)) {
            bestInc = { id: e.id, distSq: e.distSq };
          }
        }
        if (bestInc) win = { kind: 'connector', id: bestInc.id, distSq: bestInc.distSq };
      }
    }

    // (I) Hysteresis — keep the current same-kind hover unless the new winner is
    // closer by more than the margin, and only while the old target is still a
    // genuine hit under the cursor (re-probed here). Cross-kind moves (edge→node)
    // switch immediately so landing on a node always wins.
    const cur = currentHover;
    if (cur && cur.kind === win.kind && cur.id !== win.id) {
      const curHit = this.geometricHit(cur.kind, cur.id, worldX, worldY);
      if (curHit && (curHit.exact || curHit.distSq <= floorSq)) {
        const margin = this.hoverHysteresisWorld();
        if (Math.sqrt(win.distSq) + margin >= Math.sqrt(curHit.distSq)) {
          return { kind: cur.kind, id: cur.id };
        }
      }
    }

    return { kind: win.kind, id: win.id };
  }

  // ─── Narrow phase ────────────────────────────────────────────────────────

  /**
   * Geometric test returning *both* whether the cursor exactly contains the
   * element AND the squared distance to the shape's origin (or the connector's
   * nearest polyline point) — used together by the two-band ranking.
   */
  private geometricHit(
    kind: 'shape' | 'connector',
    id: string,
    worldX: number,
    worldY: number,
  ): { exact: boolean; distSq: number } | null {
    if (kind === 'shape') {
      const rec = this.source.shapeRecord(id);
      if (!rec) return null;
      const dx = worldX - rec.spec.x;
      const dy = worldY - rec.spec.y;
      // World-space distance to the shape's origin — used for closest-wins
      // ranking + the floor-radius fallback. Independent of any scale
      // multiplier (the visual centre doesn't move under scale-about-origin).
      const distSq = dx * dx + dy * dy;
      // Spec geometry is in the shape's *local* frame — before the renderer's
      // visual scale. A LOD behaviour inflating a node without rebuilding
      // geometry means world deltas must be divided by that scale first, or a
      // 5×-scaled shape covering the cursor reports `false`.
      const s = rec.scale || 1;
      return { exact: this.shapeContainsLocal(rec, dx / s, dy / s), distSq };
    }
    const rec = this.source.connectorRecord(id);
    if (!rec) return null;
    const distSq = distanceToPolylineSq(rec.polyline, worldX, worldY);
    return { exact: distSq <= connectorToleranceSq(rec.spec), distSq };
  }

  /**
   * Narrow-phase containment for one shape, in its **local** frame.
   *
   * Answered from the **spec** — pure geometry, no display object consulted —
   * so picking is identical across backends and works with no GPU. A spec kind
   * the engine has no geometry for is necessarily a `registerShape` custom
   * kind; those fall back to the record's own silhouette test, the only thing
   * that knows their shape.
   */
  private shapeContainsLocal(rec: ShapeHitRecord, localX: number, localY: number): boolean {
    const exact = containsSpec(rec.spec, localX, localY);
    if (exact !== undefined) return exact;
    return rec.containsLocal?.(localX, localY) ?? false;
  }

  /** `hitFloorPx` translated into world units at the current camera scale. */
  private hitFloorWorld(): number {
    return this.hitFloorPx / Math.max(this.camera.scale, 1e-6);
  }

  /** `hoverHysteresisPx` in world units at the current camera scale. */
  private hoverHysteresisWorld(): number {
    return this.hoverHysteresisPx / Math.max(this.camera.scale, 1e-6);
  }

  /** `hoverNodeIncidencePx` in world units at the current camera scale. */
  private hoverIncidenceWorld(): number {
    return this.hoverNodeIncidencePx / Math.max(this.camera.scale, 1e-6);
  }
}

/** Stroke width a connector picks with; the spec's, or 1 when unset. */
function strokeWidthOf(spec: BaseConnectorSpec): number {
  return spec.stroke?.width ?? 1;
}

/**
 * Squared tolerance (world units) for an *exact* connector hit:
 * `(strokeWidth / 2 + slop)²`. The slop adds forgiveness on top of the stroke
 * half-width since 1-px-stroke lines are genuinely hard to click pixel-perfect.
 */
function connectorToleranceSq(spec: BaseConnectorSpec): number {
  const r = strokeWidthOf(spec) / 2 + CONNECTOR_HIT_SLOP;
  return r * r;
}

/**
 * Ranking for exact hits, matching render order: zIndex first (higher = on
 * top), then shape-over-connector on a tie (nodes draw above edges), then the
 * closest origin within the same kind.
 */
function beats(
  kind: 'shape' | 'connector',
  zIndex: number,
  distSq: number,
  best: Ranked | null,
): boolean {
  if (best === null) return true;
  if (zIndex !== best.zIndex) return zIndex > best.zIndex;
  const kindRank = kind === 'shape' ? 1 : 0;
  const bestKindRank = best.kind === 'shape' ? 1 : 0;
  if (kindRank !== bestKindRank) return kindRank > bestKindRank;
  return distSq < best.distSq;
}
