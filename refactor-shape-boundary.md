# Refactor Spec — Shape Boundary, Connector Anchoring & Node Ports

**Status:** Draft / Proposal
**Owner:** @rrmerugu
**Affects:** `packages/canvas` (graphics-utils), `packages/plugins-shapes`
**Touch‑volume:** medium (one new util module, one new method on `BaseShape`, rewritten endpoint resolution, breaking spec rename, two new shape types, additive port API)

---

## 1. Motivation

Connectors today attach to nodes using two related but flawed mechanisms:

1. `BaseShape.getConnectionPoint(toX, toY)` is asked for a perimeter point in the direction of the *other node's center*. This is the **chord** direction.
2. `BaseConnector.draw` then trims the path by `spec.targetRadius + spec.targetOffset` along the curve's end‑tangent.

Both assume the connector is a straight line and the target is a circle. Real diagrams break both assumptions:

- Curved edges (Bezier, quadratic, smooth) enter the target along their **end‑tangent**, not along the chord. The boundary point computed for the chord direction is on the wrong place along the perimeter, so the arrow visibly enters the node at an angle whose extension does not pass through the node center.
- Non‑circular shapes (triangle, diamond, hexagon, star, free‑form leaf/guitar/toy) cannot be characterized by a single radius. `targetRadius` causes the arrow tip to float inside or outside the perimeter depending on the angle of approach.
- We want to support **node ports** (named anchor points with an outward normal) for ER diagrams, BPMN, and process‑mining flows. Today there is no API surface for this — it would have to be bolted on top of the existing chord‑based logic.

This refactor fixes the visible bug, generalises the shape contract to support arbitrary perimeters, and lays a clean foundation for ports.

---

## 2. Goals

- Connectors of any type (`straight`, `bezier`, `quadratic`, `smooth`, `orthogonal`, `rounded`) attach to perimeter points such that the curve's tangent at that point projects through the node center (or the port normal, when ports are used).
- Any shape — including arbitrary closed polylines — can serve as a node without per‑shape connector code.
- `targetRadius` / `sourceRadius` (a circle assumption baked into the public spec) is removed.
- A `getPorts()` hook is added so that future shapes can expose named anchors with outward normals.
- Geometry primitives are pure, dependency‑free, reusable.

## 3. Non‑Goals

- Connector‑to‑connector intersection or self‑avoidance routing (out of scope; orthogonal routing layer remains as today).
- Port **layout** (where ports sit on a shape) — that is per‑shape policy, defined by the shape author.
- SDF or signed‑distance shape representation — polyline approximation is sufficient for all targeted use cases and is faster.
- Dynamic boundary (animated shape morphs that change perimeter shape) — only static perimeters per‑frame; cache invalidation on `onUpdate` is enough.

---

## 4. Architecture

### 4.1 Where each piece lives

| Concern | Package | Path | Rationale |
|---|---|---|---|
| Pure ray vs. primitive geometry | `@invana/canvas` | `packages/canvas/src/graphics-utils/geometry/` (new) | Stateless math, zero deps, reusable by layout plugins, hit testing, future tools |
| Bezier / quadratic flattening | `@invana/canvas` | `packages/canvas/src/graphics-utils/geometry/flatten.ts` | Same reason; needed for `PathShape` and curve‑refinement |
| Shape boundary contract (`rayBoundaryHit`, `getPorts`) | `@invana/plugins-graph-data` *consumers* via `@invana/plugins-shapes` | `packages/plugins-shapes/src/BaseShape.ts` | Lives with `BaseShape`; uses geometry utils internally |
| Per‑edge‑type endpoint resolution | `@invana/plugins-shapes` | `packages/plugins-shapes/src/ShapesPlugin.ts` (`_resolveConnectorEndpoints`) | Knows about connector type strings and shape registry |
| Free‑form shapes (`PolylineShape`, optional `PathShape`) | `@invana/plugins-shapes` | `packages/plugins-shapes/src/shapes/` | Just shapes that own a cached perimeter polyline |
| Marker inset (replaces `targetRadius`/`sourceRadius`) | `@invana/plugins-shapes` | `packages/plugins-shapes/src/spec/index.ts` and `BaseConnector.ts` | The only remaining trim is purely cosmetic (arrow tip clearance) |

The dividing line: **`graphics-utils/geometry/` knows nothing about specs, plugins, or PixiJS.** It exports plain functions over `Point`/numbers. Everything that knows about shapes and connectors lives in `plugins-shapes`.

### 4.2 New geometry module

```
packages/canvas/src/graphics-utils/geometry/
  ray.ts         // ray-vs-X intersection primitives
  flatten.ts     // bezier/quadratic/path flattening
  index.ts
```

#### `ray.ts` API

Conventions:
- `o` (origin) and `d` (direction, MUST be unit length) are the ray.
- Returned `t` is the forward distance along the ray; `null` when no forward hit.
- All functions are pure. No allocations in the hot path beyond the result tuple.

```ts
export function rayVsSegment(
  ox: number, oy: number, dx: number, dy: number,
  ax: number, ay: number, bx: number, by: number,
): number | null

export function rayVsCircle(
  ox: number, oy: number, dx: number, dy: number,
  cx: number, cy: number, r: number,
): number | null

export function rayVsEllipse(
  ox: number, oy: number, dx: number, dy: number,
  cx: number, cy: number, rx: number, ry: number,
): number | null

export function rayVsRect(
  ox: number, oy: number, dx: number, dy: number,
  minX: number, minY: number, maxX: number, maxY: number,
): number | null  // slab test

// Closed polyline as flat Float32Array [x0,y0, x1,y1, ...]; returns nearest forward hit.
export function rayVsPolyline(
  ox: number, oy: number, dx: number, dy: number,
  pts: Float32Array, closed: boolean,
): { t: number; segIndex: number } | null
```

#### `flatten.ts` API

```ts
export function flattenQuadratic(
  p0x: number, p0y: number, cpx: number, cpy: number, p1x: number, p1y: number,
  tolerance?: number,  // default 0.5 px
): Float32Array  // [x0,y0, x1,y1, ...]

export function flattenCubic(
  p0x: number, p0y: number, cp1x: number, cp1y: number,
  cp2x: number, cp2y: number, p1x: number, p1y: number,
  tolerance?: number,
): Float32Array

export function flattenPath(
  cmds: PathCommand[],  // shared with plugins-shapes (move PathCommand into graphics-utils?)
  tolerance?: number,
): Float32Array
```

> **Decision needed:** `PathCommand` currently lives in `plugins-shapes/spec`. Either move it to `graphics-utils` (cleaner; layout plugins may want it too) or keep `flattenPath` in `plugins-shapes`. Recommendation: move it to `graphics-utils/geometry/types.ts` since it is pure data with no plugin coupling.

### 4.3 Shape contract

```ts
// packages/plugins-shapes/src/BaseShape.ts

export interface NodePort {
  /** Stable id; referenced by connector specs as sourcePortId/targetPortId. */
  id: string;
  /** World-space position of the port anchor. */
  position: Point;
  /** Outward unit normal. Used by curved connectors to orient cp1/cp2. */
  normal: Point;
  /** Optional side hint for axis-aligned routers. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Optional human label (e.g. attribute name in ER). */
  label?: string;
}

export abstract class BaseShape<S extends BaseShapeSpec = BaseShapeSpec> {
  // ... existing fields

  abstract getCenter(): Point;
  abstract getBBox(): BBox;
  abstract draw(ctx: DrawContext, detail: LOD): void;

  /**
   * Boundary intersection along a ray cast from `origin` in unit `dir`.
   * Returns world-space hit point, or `null` if the ray does not hit the perimeter.
   * Implementations should be O(1) where possible (analytic), O(N) for polylines.
   */
  abstract rayBoundaryHit(origin: Point, dir: Point): Point | null;

  /**
   * Optional declared ports. Default: undefined (use ray boundary hit).
   * Shapes that override should return a stable list (the same id always
   * resolves to the same logical anchor; positions can move with the shape).
   */
  getPorts?(): NodePort[];

  /**
   * Default helper used by connectors. No longer abstract.
   * Resolution order:
   *   1. If opts.portId and getPorts(): port lookup.
   *   2. Else: rayBoundaryHit along opts.dir (or chord direction if dir not given).
   */
  getConnectionPoint(
    toX: number,
    toY: number,
    opts?: { dir?: Point; portId?: string },
  ): Point {
    if (opts?.portId && this.getPorts) {
      const p = this.getPorts().find(p => p.id === opts.portId);
      if (p) return p.position;
    }
    const c = this.getCenter();
    const dir = opts?.dir ?? unit({ x: toX - c.x, y: toY - c.y });
    return this.rayBoundaryHit(c, dir) ?? c;
  }
}
```

### 4.4 Per-shape `rayBoundaryHit` implementations

| Shape | Implementation | Cost |
|---|---|---|
| `CircleShape` | `rayVsCircle` | O(1) |
| `EllipseShape` | `rayVsEllipse` | O(1) |
| `RectShape` | `rayVsRect` | O(1) |
| `PolygonShape` | `rayVsPolyline(buildPolygonPoints(...), closed=true)` (cached) | O(sides) |
| `StarShape` | `rayVsPolyline(starVerts, closed=true)` (cached) | O(2 × sides) |
| `DiamondShape` | reduces to a 4‑sided polygon → `rayVsPolyline` | O(4) |
| `HexagonShape` | reduces to a 6‑sided polygon → `rayVsPolyline` | O(6) |
| `PolylineShape` (new) | `rayVsPolyline(spec.points, spec.closed)` (cached) | O(N) |
| `PathShape` (optional, new) | flatten once, then `rayVsPolyline` | O(N) |

Polylines are cached on the instance as a `Float32Array` (`_boundaryCache`). Invalidated in `onUpdate` and when state changes the geometry (rotation, resize, polyline edit).

### 4.5 Endpoint resolution per connector type

`ShapesPlugin._resolveConnectorEndpoints` is rewritten so the **direction** passed to the shape is correct for the connector's actual entry/exit tangent.

```ts
function resolveEndpoints(spec): {
  from: Point; to: Point;
  fromAngle?: number; toAngle?: number;
} {
  const src = shapesById.get(spec.sourceId);
  const tgt = shapesById.get(spec.targetId);
  const sC = src?.getCenter();
  const tC = tgt?.getCenter();

  let srcDir: Point | undefined;
  let tgtDir: Point | undefined;
  let from = spec.from;
  let to = spec.to;

  // 1. Ports win (when present).
  if (src && spec.sourcePortId) {
    const p = src.getPorts?.()?.find(p => p.id === spec.sourcePortId);
    if (p) { from = p.position; srcDir = p.normal; }
  }
  if (tgt && spec.targetPortId) {
    const p = tgt.getPorts?.()?.find(p => p.id === spec.targetPortId);
    if (p) { to = p.position; tgtDir = p.normal; }
  }

  // 2. Fall back to per-edge-type tangent direction.
  if (!srcDir || !tgtDir) {
    const type = spec.type;  // 'straight' | 'bezier' | ...
    const chord = sC && tC ? unit({ x: tC.x - sC.x, y: tC.y - sC.y }) : null;

    switch (type) {
      case 'straight':
        srcDir ??= chord ?? FALLBACK;
        tgtDir ??= chord ? neg(chord) : FALLBACK;
        break;

      case 'orthogonal':
      case 'rounded':
        // Choose axis-aligned exit/entry by dominant offset.
        if (chord) {
          const ax = Math.abs(chord.x), ay = Math.abs(chord.y);
          srcDir ??= ax > ay
            ? { x: Math.sign(chord.x), y: 0 }
            : { x: 0, y: Math.sign(chord.y) };
          tgtDir ??= neg(srcDir);
        }
        break;

      case 'bezier':
      case 'quadratic':
      case 'smooth':
        // Honour explicit angles, else seed with chord, optionally refine.
        srcDir ??= spec.fromAngle !== undefined
          ? unitFromAngle(spec.fromAngle)
          : (chord ?? FALLBACK);
        tgtDir ??= spec.toAngle !== undefined
          ? unitFromAngle(spec.toAngle)
          : (chord ? neg(chord) : FALLBACK);
        break;
    }
  }

  // 3. Boundary hit along chosen directions.
  if (src && sC && srcDir) from = src.rayBoundaryHit(sC, srcDir) ?? sC;
  if (tgt && tC && tgtDir) to   = tgt.rayBoundaryHit(tC, tgtDir) ?? tC;

  // 4. Optional refinement pass for curved edges with no explicit angles.
  //    Build a draft route, read back the actual end-tangents, redo step 3.
  //    Skip when fromAngle/toAngle were supplied, or when chord-direction
  //    is good enough (small curvature relative to distance).
  if (refinementNeeded(spec, type)) {
    const draftRoute = previewRoute(spec, from, to);
    srcDir = endTangentAt(draftRoute, 'start');
    tgtDir = endTangentAt(draftRoute, 'end');
    from = src.rayBoundaryHit(sC, srcDir) ?? from;
    to   = tgt.rayBoundaryHit(tC, tgtDir) ?? to;
  }

  return {
    from, to,
    fromAngle: srcDir ? Math.atan2(srcDir.y, srcDir.x) : undefined,
    toAngle:   tgtDir ? Math.atan2(tgtDir.y, tgtDir.x) : undefined,
  };
}
```

### 4.6 Marker inset replaces radius trim

In `BaseConnector.draw`:

```ts
// before
const effectiveTargetTrim = (this.spec.targetRadius ?? 0) + (this.spec.targetOffset ?? 0);

// after
const markerSize = endMarkerSpec?.size ?? 10;
const effectiveTargetTrim =
  (this.spec.targetMarkerInset ?? markerSize * 0.5) + (this.spec.targetOffset ?? 0);
```

The boundary intersection already places the line endpoint exactly on the perimeter; this remaining trim only nudges the arrow tip back so its center sits on the perimeter. Default scales with marker size, so most users never set it.

### 4.7 Connector spec changes

```ts
// packages/plugins-shapes/src/spec/index.ts
interface BaseConnectorSpec {
  // REMOVED:
  // targetRadius?: number;
  // sourceRadius?: number;

  // NEW (cosmetic only):
  targetMarkerInset?: number;  // default = endMarker.size * 0.5
  sourceMarkerInset?: number;  // default = startMarker.size * 0.5

  // NEW (additive, optional — port wiring):
  sourcePortId?: string;
  targetPortId?: string;

  // existing: from, to, fromAngle, toAngle, sourceId, targetId, type, etc.
}
```

---

## 5. Performance

### 5.1 Cost model

| Operation | Cost |
|---|---|
| `rayVsCircle` / `rayVsEllipse` / `rayVsRect` | O(1) — small constant |
| `rayVsPolyline(N segments)` | O(N), ~10 multiplies per segment |
| Polygon (N=3..8) boundary hit | O(N) ≈ today's `_rayEdgeIntersect` cost |
| Free‑form polyline (N≈30..150) | O(N) ≈ 10 µs on modern CPU |
| `flattenCubic` / `flattenQuadratic` | O(K) where K = output points; one-time per `PathShape` |
| Per‑connector endpoint resolve | 2 × boundary hits (+ 2 more if refinement runs) |

### 5.2 Call frequency

Same as today. `_resolveConnectorEndpoints` runs only when:
- A connector is created.
- A connected shape moves (existing `_updateAttachedConnectors` path).
- A connector spec is updated.

Static graphs pay zero cost per frame.

### 5.3 Worst case

1000 edges × 2 endpoints × 100‑segment polyline × 1 refinement pass ≈ **400 k segment tests per layout settle** (not per frame). On a 2024 desktop this is ~4 ms — within budget for layout updates.

### 5.4 Caching

- `BaseShape._boundaryCache: Float32Array | null` — built lazily in `rayBoundaryHit`, invalidated in `onUpdate` and on rotation/resize/spec-points change.
- Refinement pass runs **only** for `bezier|quadratic|smooth` connectors with neither `fromAngle` nor `toAngle` explicitly set, *and* when chord direction differs from end‑tangent by more than a small threshold (e.g. 5°). Most edges skip it.
- Port lookup is O(N ports), unscientific but tiny — no caching needed unless port counts grow into the hundreds, which is unlikely per shape.

### 5.5 Hot allocations

- `rayVsPolyline` returns a small object — acceptable; called O(edges × 2) at layout time, not per frame.
- Per‑shape `_boundaryCache` is a single `Float32Array` reused across queries.
- No closures or array literals in segment loops.

---

## 6. Free‑form shapes

### 6.1 `PolylineShape` (new — primary)

```ts
interface PolylineShapeSpec extends BaseShapeSpec {
  /** Closed polyline in world coordinates. First point != last point. */
  points: Point[];
  /** Default true. */
  closed?: boolean;
  style?: DrawStyle;
}

class PolylineShape extends BaseShape<PolylineShapeSpec> {
  private _flatPoints: Float32Array;  // [x0,y0,x1,y1,...]

  constructor(spec) { super(spec); this._rebuildCache(); }
  onUpdate(prev, next) { if (next.points !== prev.points) this._rebuildCache(); }

  rayBoundaryHit(origin, dir) {
    const hit = rayVsPolyline(origin.x, origin.y, dir.x, dir.y, this._flatPoints, this.spec.closed ?? true);
    return hit ? { x: origin.x + dir.x * hit.t, y: origin.y + dir.y * hit.t } : null;
  }

  getCenter() { return centroidOf(this._flatPoints); }
  getBBox()   { return bboxOf(this._flatPoints); }

  draw(ctx, detail) { ctx.fillPolyline(this.spec.points, this.resolveStyle()); }
}
```

This is the canonical answer for "leaf, guitar, toy" — supply a closed polyline. The same primitive serves any free‑form shape.

### 6.2 `PathShape` (optional, follow‑up)

Wraps an SVG path string (or a `PathCommand[]`), flattens once at construction, then behaves identically to `PolylineShape` from the boundary‑hit perspective. Convenient for designers who export from Figma/Illustrator.

```ts
interface PathShapeSpec extends BaseShapeSpec {
  d: string;           // SVG path data, OR
  commands: PathCommand[];
  flattenTolerance?: number;  // default 0.75 px
}
```

---

## 7. Forward path to node ports

After this refactor the port API is **additive**. No further changes to connector code are needed beyond what is already in §4.5.

### 7.1 ER‑style entity (illustrative)

```ts
class EntityShape extends RectShape {
  spec: { x, y, width, height, fields: { id: string; label: string }[] };

  getPorts(): NodePort[] {
    const rowH = 22;
    return this.spec.fields.flatMap((f, i) => {
      const y = this.spec.y + 30 + i * rowH;  // header offset
      return [
        { id: `${f.id}.l`, position: { x: this.spec.x,                    y }, normal: { x: -1, y: 0 }, side: 'left' },
        { id: `${f.id}.r`, position: { x: this.spec.x + this.spec.width,  y }, normal: { x:  1, y: 0 }, side: 'right' },
      ];
    });
  }
}
```

A connector then targets a specific port:

```ts
{ type: 'orthogonal', sourceId: 'orders', sourcePortId: 'customer_id.r',
  targetId: 'customers', targetPortId: 'id.l' }
```

### 7.2 Process / BPMN flows

Each task box advertises `{ id: 'in', side: 'left', normal: (-1, 0) }` and `{ id: 'out', side: 'right', normal: (1, 0) }`. The orthogonal router then reads `port.side` to choose its initial direction and avoid bending back into the box.

### 7.3 Router consumption

Today's `OrthRouter` and friends derive the entry/exit axis from the chord direction. After this refactor they should accept (and prefer) `port.side` when present. That is the minimal extra work needed for clean ER/BPMN routing.

---

## 8. Phasing

Each phase is a self‑contained PR.

### Phase 1 — Geometry primitives (no behaviour change)
- Add `packages/canvas/src/graphics-utils/geometry/{ray,flatten,index}.ts`.
- Move `PathCommand` type into `graphics-utils/geometry/types.ts` (or re‑export from `plugins-shapes/spec`).
- Unit tests for each `rayVs*` function (axis cases, glancing hits, miss, multi‑segment polyline ordering).
- Unit tests for `flattenCubic` / `flattenQuadratic` against known curves with tolerance check.

### Phase 2 — `rayBoundaryHit` on `BaseShape`
- Add abstract `rayBoundaryHit` to `BaseShape`.
- Implement in every built‑in shape (`CircleShape`, `EllipseShape`, `RectShape`, `PolygonShape`, `StarShape`, plus `DiamondShape`/`HexagonShape` if they exist as siblings).
- Refactor existing `getConnectionPoint` to a default implementation that calls `rayBoundaryHit`.
- Cache: add `_boundaryCache` to shapes that need it; invalidate in `onUpdate`.
- **Visible win:** straight and orthogonal connectors are correct on every shape automatically.

### Phase 3 — Per‑edge‑type endpoint resolution
- Rewrite `ShapesPlugin._resolveConnectorEndpoints` per §4.5.
- Implement optional refinement pass for curved edges (gated behind a "needs refinement" predicate).
- Update Storybook: `Connector Offset` and `AllShapes` stories should now visually pass — extending any curve through its endpoint passes through the node center.
- **Visible win:** the bug from the screenshots is fixed.

### Phase 4 — Marker inset rename (breaking spec change)
- Remove `targetRadius` / `sourceRadius` from `BaseConnectorSpec`.
- Add `targetMarkerInset` / `sourceMarkerInset`.
- Update `BaseConnector.draw` trim.
- Mechanical sweep through all stories and example datasets to drop `targetRadius`/`sourceRadius` keys.
- Release note: this is the one breaking change in the refactor.

### Phase 5 — Free‑form `PolylineShape`
- New shape file + tests.
- Storybook story: a leaf shape with several connectors entering at varied angles to demonstrate correct boundary anchoring.

### Phase 6 — Ports (additive)
- Add `NodePort` type and `getPorts?()` hook (already specced in §4.3).
- Add `sourcePortId`/`targetPortId` to connector spec.
- Wire port lookup into `_resolveConnectorEndpoints` (already specced in §4.5; just enable the branch).
- `OrthRouter` (and `OneSideRouter`) accept `port.side` when provided.
- Storybook: an ER story with two `EntityShape` boxes connected by orthogonal edges through specific row ports.

Phases 1–3 fix the visible bug. Phase 4 cleans up the spec. Phases 5–6 unlock the diagram types you mentioned.

---

## 9. Risks & open questions

| # | Risk | Mitigation |
|---|---|---|
| R1 | Breaking change to `BaseConnectorSpec` (radius removal) breaks downstream consumers | Phase the rename in step 4 with a release note; keep the rename mechanical; provide a one‑release deprecation alias if the package is already published externally |
| R2 | Refinement pass adds latency for curved edges with many endpoints | Gate behind a difference threshold (only run when chord vs. tangent diverge > 5°); skip when `fromAngle`/`toAngle` are explicit |
| R3 | `PathCommand` move from `plugins-shapes/spec` to `graphics-utils` ripples through imports | If risky, leave it where it is and have `flattenPath` re‑declare a structurally identical type |
| R4 | Free‑form polylines with many segments stress the GC if not cached | `_boundaryCache: Float32Array` (typed array), reused across queries, only rebuilt on geometry change |
| R5 | Concave polylines: `rayVsPolyline` may return the closer entry hit when we want the far‑side exit | Spec the ray as starting at the **center** (interior point); for concave shapes whose center lies outside the polygon, fall back to bbox‑clip and document the constraint |
| R6 | Port `id` collisions between sibling shapes | Port ids are local to each shape; resolution is `(shapeId, portId)`; document this clearly |

### Open questions for the owner

1. **`PathCommand` location** — move to `graphics-utils` or keep in `plugins-shapes` and duplicate the structural type? *Recommendation: move.*
2. **Deprecation policy** — is `@invana/plugins-shapes` published externally yet? If yes, do `targetRadius` / `sourceRadius` need a one‑release deprecation alias before removal? *If unpublished, just rename.*
3. **Refinement pass** — is one pass enough, or should we iterate to a fixed point? *One pass is visually indistinguishable from converged for typical curvatures; recommend one.*
4. **Concave shape handling** — do we want first‑class support, or document the convex assumption? *Recommend documenting the convex assumption for now; concave can come later via a "second hit" flag on `rayVsPolyline`.*

---

## 10. Acceptance criteria

- [ ] All existing Storybook stories render unchanged (or visibly more correct).
- [ ] In `Canvas / Edges / AllShapes`, every curve's tangent at its connection point projects through the node center (verifiable by extending the curve).
- [ ] In `ShapesPlugin / Connectors / Connector Offset`, all five connector types show clean perimeter attachment on circles.
- [ ] A new `Polyline / Leaf` story demonstrates connectors attaching correctly to a free‑form shape from multiple angles.
- [ ] A new `ER / Two Entities` story (Phase 6) demonstrates orthogonal connectors anchored to specific row ports on each entity.
- [ ] No `targetRadius` or `sourceRadius` references remain anywhere in the codebase or stories.
- [ ] `pnpm check-types`, `pnpm lint`, `pnpm build` all pass.
- [ ] Geometry primitives in `graphics-utils/geometry/` have ≥ 90 % branch coverage in unit tests.
